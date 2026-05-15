from flask import Flask, jsonify, request, Response, render_template
import json

app = Flask(__name__)



def parity_encode(data_bits, parity_type="even"):
    bits = [int(b) for b in data_bits]
    count_ones = sum(bits)
    if parity_type == "even":
        parity_bit = 0 if count_ones % 2 == 0 else 1
    else:
        parity_bit = 0 if count_ones % 2 == 1 else 1
    codeword = bits + [parity_bit]
    steps = []
    steps.append({"title":"Step 1: Original Data Bits","bits":bits[:],"highlight":list(range(len(bits))),"highlight_color":"data","parity_positions":[],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"Original data: {''.join(str(b) for b in bits)} | {len(bits)} bits"})
    steps.append({"title":"Step 2: Count the 1s","bits":bits[:],"highlight":[i for i,b in enumerate(bits) if b==1],"highlight_color":"count","parity_positions":[],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"Counting 1-bits: found {count_ones} ones. Parity type = {parity_type.upper()}"})
    steps.append({"title":"Step 3: Calculate Parity Bit","bits":bits[:],"highlight":[],"highlight_color":"parity","parity_positions":[],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"{'Even' if parity_type=='even' else 'Odd'} parity: parity bit = {parity_bit}"})
    steps.append({"title":"Step 4: Final Codeword","bits":codeword[:],"highlight":[len(codeword)-1],"highlight_color":"parity","parity_positions":[len(codeword)-1],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"Codeword = {''.join(str(b) for b in codeword)} (cyan = parity bit)"})
    return steps, codeword

def parity_verify(received, parity_type="even"):
    bits = [int(b) for b in received]
    count_ones = sum(bits)
    steps = []
    steps.append({"title":"Verify Step 1: Received Bits","bits":bits[:],"highlight":list(range(len(bits))),"highlight_color":"data","parity_positions":[len(bits)-1],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"Received: {''.join(str(b) for b in bits)}"})
    steps.append({"title":"Verify Step 2: Count All 1s","bits":bits[:],"highlight":[i for i,b in enumerate(bits) if b==1],"highlight_color":"count","parity_positions":[len(bits)-1],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"Total 1s = {count_ones}"})
    error = (count_ones%2!=0) if parity_type=="even" else (count_ones%2!=1)
    if error:
        steps.append({"title":"ERROR DETECTED!","bits":bits[:],"highlight":list(range(len(bits))),"highlight_color":"error","parity_positions":[len(bits)-1],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"status":"error","explanation":f"Count={count_ones} violates {parity_type} parity. ERROR! (cannot locate exact bit)"})
    else:
        steps.append({"title":"No Error Detected","bits":bits[:],"highlight":list(range(len(bits))),"highlight_color":"success","parity_positions":[len(bits)-1],"data_positions":[],"error_pos":-1,"corrected_pos":-1,"status":"success","explanation":f"Count={count_ones} satisfies {parity_type} parity. Data accepted!"})
    return steps, not error

def checksum_encode(segments):
    seg_list = [[int(b) for b in s] for s in segments]
    n = len(seg_list[0])
    steps = []
    steps.append({"title":"Step 1: Input Segments","segments":[list(s) for s in seg_list],"current_sum":None,"checksum":None,"highlight_seg":list(range(len(seg_list))),"explanation":f"{len(seg_list)} segments of {n} bits each"})
    running = seg_list[0][:]
    steps.append({"title":"Step 2: Start with Segment 1","segments":[list(s) for s in seg_list],"current_sum":running[:],"checksum":None,"highlight_seg":[0],"explanation":f"Sum = {''.join(str(b) for b in running)}"})
    for i in range(1, len(seg_list)):
        carry=0; result=[0]*n
        for j in range(n-1,-1,-1):
            total=running[j]+seg_list[i][j]+carry; result[j]=total%2; carry=total//2
        if carry:
            for j in range(n-1,-1,-1):
                total=result[j]+carry; result[j]=total%2; carry=total//2
        running=result
        steps.append({"title":f"Step {i+2}: Add Segment {i+1}","segments":[list(s) for s in seg_list],"current_sum":running[:],"checksum":None,"highlight_seg":[i],"explanation":f"1's complement add Seg{i+1}. Sum = {''.join(str(b) for b in running)}"})
    checksum=[1-b for b in running]
    steps.append({"title":f"Step {len(seg_list)+2}: Checksum","segments":[list(s) for s in seg_list],"current_sum":running[:],"checksum":checksum[:],"highlight_seg":[],"explanation":f"Invert sum → Checksum = {''.join(str(b) for b in checksum)}"})
    return steps, checksum

def checksum_verify(segments, checksum):
    all_segs=[list(s) for s in segments]+[list(checksum)]
    n=len(checksum)
    steps=[]
    steps.append({"title":"Verify Step 1: All Segs + Checksum","segments":all_segs,"current_sum":None,"checksum":list(checksum),"highlight_seg":list(range(len(all_segs))),"explanation":"Adding all received segments + checksum"})
    running=all_segs[0][:]
    for i in range(1,len(all_segs)):
        carry=0; result=[0]*n
        for j in range(n-1,-1,-1):
            total=running[j]+all_segs[i][j]+carry; result[j]=total%2; carry=total//2
        if carry:
            for j in range(n-1,-1,-1):
                total=result[j]+carry; result[j]=total%2; carry=total//2
        running=result
    all_ones=all(b==1 for b in running)
    steps.append({"title":"Verify Step 2: Final Sum","segments":all_segs,"current_sum":running[:],"checksum":list(checksum),"highlight_seg":list(range(len(all_segs))),"explanation":f"Sum = {''.join(str(b) for b in running)}"})
    steps.append({"title":"Verify Step 3: Check","segments":all_segs,"current_sum":running[:],"checksum":list(checksum),"highlight_seg":list(range(len(all_segs))),"status":"success" if all_ones else "error","explanation":f"{'All 1s → No error!' if all_ones else 'Not all 1s → ERROR!'}"})
    return steps, all_ones

def crc_encode(data_bits, divisor_bits):
    data=[int(b) for b in data_bits]; divisor=[int(b) for b in divisor_bits]
    degree=len(divisor)-1; augmented=data+[0]*degree
    steps=[]
    steps.append({"title":"Step 1: Append Zeros","dividend":augmented[:],"divisor":divisor[:],"division_rows":[],"highlight":list(range(len(data),len(augmented))),"remainder":None,"explanation":f"Append {degree} zeros. Augmented = {''.join(str(b) for b in augmented)}"})
    dividend=augmented[:]; division_rows=[]; pos=0; sn=2
    while pos<=len(dividend)-len(divisor):
        if dividend[pos]==0: pos+=1; continue
        rb=dividend[:]
        xb=[dividend[pos+i]^divisor[i] for i in range(len(divisor))]
        for i in range(len(divisor)): dividend[pos+i]=xb[i]
        division_rows.append({"pos":pos,"before":rb[:],"divisor":divisor[:],"after":dividend[:],"xor":xb[:]})
        steps.append({"title":f"Step {sn}: XOR at pos {pos}","dividend":dividend[:],"divisor":divisor[:],"division_rows":[r for r in division_rows],"highlight":list(range(pos,pos+len(divisor))),"remainder":None,"explanation":f"XOR {''.join(str(b) for b in rb[pos:pos+len(divisor)])} ⊕ {''.join(str(b) for b in divisor)} = {''.join(str(b) for b in xb)}"})
        sn+=1; pos+=1
    remainder=dividend[len(data):]; codeword=data+remainder
    steps.append({"title":f"Step {sn}: Remainder = CRC","dividend":codeword[:],"divisor":divisor[:],"division_rows":division_rows,"highlight":list(range(len(data),len(codeword))),"remainder":remainder[:],"explanation":f"CRC = {''.join(str(b) for b in remainder)} | Codeword = {''.join(str(b) for b in codeword)}"})
    return steps, codeword, remainder

def crc_verify(received, divisor):
    recv=[int(b) for b in received]; div=[int(b) for b in divisor]
    steps=[]; steps.append({"title":"Verify Step 1: Received","dividend":recv[:],"divisor":div[:],"division_rows":[],"highlight":list(range(len(recv))),"remainder":None,"explanation":f"Received = {''.join(str(b) for b in recv)}"})
    dividend=recv[:]; division_rows=[]; pos=0; sn=2
    while pos<=len(dividend)-len(div):
        if dividend[pos]==0: pos+=1; continue
        rb=dividend[:]
        xb=[dividend[pos+i]^div[i] for i in range(len(div))]
        for i in range(len(div)): dividend[pos+i]=xb[i]
        division_rows.append({"pos":pos,"before":rb[:],"divisor":div[:],"after":dividend[:],"xor":xb[:]})
        steps.append({"title":f"Verify Step {sn}: XOR at pos {pos}","dividend":dividend[:],"divisor":div[:],"division_rows":[r for r in division_rows],"highlight":list(range(pos,pos+len(div))),"remainder":None,"explanation":f"XOR {''.join(str(b) for b in rb[pos:pos+len(div)])} ⊕ {''.join(str(b) for b in div)} = {''.join(str(b) for b in xb)}"})
        sn+=1; pos+=1
    remainder=dividend[len(recv)-len(div)+1:]
    all_zero=all(b==0 for b in remainder)
    steps.append({"title":"Verify: Check Remainder","dividend":dividend[:],"divisor":div[:],"division_rows":division_rows,"highlight":list(range(len(recv)-len(div)+1,len(recv))),"remainder":remainder[:],"status":"success" if all_zero else "error","explanation":f"Remainder = {''.join(str(b) for b in remainder)}. {'Zero → No error!' if all_zero else 'Non-zero → ERROR!'}"})
    return steps, all_zero

def hamming_encode(data_bits):
    data=[int(b) for b in data_bits]; m=len(data); r=0
    while (2**r)<(m+r+1): r+=1
    n=m+r; codeword=[0]*(n+1)
    parity_positions=[2**i for i in range(r)]
    data_positions=[]; di=0
    for i in range(1,n+1):
        if i not in parity_positions: codeword[i]=data[di]; data_positions.append(i); di+=1
    steps=[]
    steps.append({"title":"Step 1: Parameters","bits":[],"parity_positions":[],"data_positions":[],"highlight":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"m={m} data bits, r={r} parity bits, n={n} total"})
    display=codeword[1:]
    steps.append({"title":"Step 2: Reserve Parity Positions","bits":display[:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[p-1 for p in data_positions],"highlight":[p-1 for p in parity_positions],"error_pos":-1,"corrected_pos":-1,"explanation":f"Parity at positions {parity_positions} (powers of 2)"})
    steps.append({"title":"Step 3: Insert Data Bits","bits":display[:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[p-1 for p in data_positions],"highlight":[p-1 for p in data_positions],"error_pos":-1,"corrected_pos":-1,"explanation":f"Data {data} at positions {data_positions}"})
    for p in parity_positions:
        covered=[i for i in range(1,n+1) if i&p]
        xv=0
        for i in covered: xv^=codeword[i]
        codeword[p]=xv; display=codeword[1:]
        steps.append({"title":f"Step: P{p} covers {covered}","bits":display[:],"parity_positions":[pp-1 for pp in parity_positions],"data_positions":[pp-1 for pp in data_positions],"highlight":[i-1 for i in covered],"highlight_parity":p-1,"error_pos":-1,"corrected_pos":-1,"explanation":f"P{p}: XOR positions {covered} = {xv}. Set P{p}={xv}"})
    final=codeword[1:]
    steps.append({"title":"Final Hamming Codeword","bits":final[:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[p-1 for p in data_positions],"highlight":list(range(n)),"error_pos":-1,"corrected_pos":-1,"explanation":f"Codeword = {''.join(str(b) for b in final)}"})
    return steps, final, parity_positions, n

def hamming_verify(received, parity_positions, n):
    recv=[0]+[int(b) for b in received]
    steps=[{"title":"Verify Step 1: Received","bits":recv[1:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[],"highlight":list(range(n)),"error_pos":-1,"corrected_pos":-1,"explanation":f"Received = {''.join(str(b) for b in recv[1:])}"}]
    syndrome=0
    for p in parity_positions:
        covered=[i for i in range(1,n+1) if i&p]
        xv=0
        for i in covered: xv^=recv[i]
        if xv!=0: syndrome+=p
        steps.append({"title":f"Verify: Check P{p}","bits":recv[1:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[],"highlight":[i-1 for i in covered],"syndrome_bit":xv,"error_pos":-1,"corrected_pos":-1,"explanation":f"P{p} XOR over {covered} = {xv}. {'✓ OK' if xv==0 else '✗ FAIL'}"})
    steps.append({"title":f"Syndrome = {syndrome}","bits":recv[1:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[],"highlight":[],"error_pos":-1,"corrected_pos":-1,"explanation":f"Syndrome={syndrome}. {'No error!' if syndrome==0 else f'Error at bit position {syndrome}!'}"})
    if syndrome==0:
        steps.append({"title":"No Error — Data Correct!","bits":recv[1:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[],"highlight":list(range(n)),"error_pos":-1,"corrected_pos":-1,"status":"success","explanation":"Syndrome=0. Error-free!"})
        return steps, True, recv[1:]
    else:
        corrected=recv[:]; corrected[syndrome]^=1; cd=corrected[1:]
        steps.append({"title":f"Error at Bit {syndrome} → Correcting!","bits":recv[1:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[],"highlight":[syndrome-1],"error_pos":syndrome-1,"corrected_pos":-1,"status":"error","explanation":f"Syndrome={syndrome}. Bit {syndrome} is wrong! Flipping it..."})
        steps.append({"title":"Corrected Successfully!","bits":cd[:],"parity_positions":[p-1 for p in parity_positions],"data_positions":[],"highlight":[syndrome-1],"error_pos":-1,"corrected_pos":syndrome-1,"status":"corrected","explanation":f"Corrected = {''.join(str(b) for b in cd)}. Single-bit error fixed!"})
        return steps, False, cd



@app.route("/")
def index():
    return render_template('index.html')

@app.route("/api/encode", methods=["POST"])
def api_encode():
    d=request.json; method=d.get("method"); data=d.get("data","")
    if method=="parity":
        steps,cw=parity_encode(data,d.get("parity_type","even"))
        return jsonify({"steps":steps,"codeword":cw})
    elif method=="checksum":
        segs=d.get("segments",[data])
        steps,cs=checksum_encode(segs)
        all_bits=[b for seg in segs for b in [int(x) for x in seg]]+cs
        return jsonify({"steps":steps,"codeword":all_bits,"checksum":cs,"segments":segs})
    elif method=="crc":
        divisor=d.get("divisor","1011")
        steps,cw,rem=crc_encode(data,divisor)
        return jsonify({"steps":steps,"codeword":cw,"remainder":rem})
    elif method=="hamming":
        steps,cw,pp,n=hamming_encode(data)
        return jsonify({"steps":steps,"codeword":cw,"parity_positions":pp,"n":n})
    return jsonify({"error":"unknown method"})

@app.route("/api/verify", methods=["POST"])
def api_verify():
    d=request.json; method=d.get("method"); received=d.get("received",[])
    if method=="parity":
        steps,ok=parity_verify(received,d.get("parity_type","even"))
        return jsonify({"steps":steps,"ok":ok})
    elif method=="checksum":
        steps,ok=checksum_verify(d.get("segments",[]),d.get("checksum",[]))
        return jsonify({"steps":steps,"ok":ok})
    elif method=="crc":
        steps,ok=crc_verify(received,d.get("divisor",[]))
        return jsonify({"steps":steps,"ok":ok})
    elif method=="hamming":
        steps,ok,corrected=hamming_verify(received,d.get("parity_positions",[]),d.get("n",0))
        return jsonify({"steps":steps,"ok":ok,"corrected":corrected})
    return jsonify({"error":"unknown method"})


if __name__=="__main__":
    print("\n" + "="*55)
    print("  DC Simulator — OSI + Error Detection & Correction")
    print("="*55)
    print("  Run:  python app.py")
    print("  Open: http://localhost:5000")
    print("="*55 + "\n")
    app.run(debug=True, port=5000)