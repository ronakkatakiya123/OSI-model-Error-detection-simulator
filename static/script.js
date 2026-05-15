


const S = {
  osiSteps: [], oIdx: 0, oTimer: null, oPlay: false,
  tSteps: [], tIdx: 0, tTimer: null, tPlay: false,
  method: null, codeword: [], vDone: false,
  ppos: [], hamN: 0, crcDiv: [], csSegs: [], csCS: []
};




const LY = [
  { n: 7, name: 'Application', color: '#e74c3c', hex: 'e74c3c' },
  { n: 6, name: 'Presentation', color: '#e67e22', hex: 'e67e22' },
  { n: 5, name: 'Session', color: '#d4ac0d', hex: 'd4ac0d' },
  { n: 4, name: 'Transport', color: '#27ae60', hex: '27ae60' },
  { n: 3, name: 'Network', color: '#2980b9', hex: '2980b9' },
  { n: 2, name: 'Data Link', color: '#8e44ad', hex: '8e44ad' },
  { n: 1, name: 'Physical', color: '#16a085', hex: '16a085' },
];

const SEND_ACTS = [
  'User generates data — HTTP, FTP, SMTP request',
  'Encode, compress & encrypt the data',
  'Establish & manage the communication session',
  'Segment data, add source/dest port numbers',
  'Add source & destination IP addresses',
  '⚡ PAUSED — Apply Error Detection / Correction',
  'Convert frames to bits & electrical signals',
];
const RECV_ACTS = [
  'Receive electrical signals, convert to bits',
  'Verify frame integrity, strip frame header',
  'Route packet to destination, strip IP header',
  'Reassemble segments, strip transport header',
  'Manage session teardown, strip session header',
  'Decrypt, decompress, decode data',
  'Deliver data to the user application',
];


const LY_META = [
  { pdu: 'Data', protocols: 'HTTP, FTP, SMTP, DNS', header: '', color: '#e74c3c' },
  { pdu: 'Data', protocols: 'SSL/TLS, JPEG, ASCII', header: 'PH', color: '#e67e22' },
  { pdu: 'Data', protocols: 'NetBIOS, RPC, PPTP', header: 'SH', color: '#d4ac0d' },
  { pdu: 'Segment', protocols: 'TCP, UDP, SCTP', header: 'TH', color: '#27ae60' },
  { pdu: 'Packet', protocols: 'IP, ICMP, OSPF', header: 'NH', color: '#2980b9' },
  { pdu: 'Frame', protocols: 'Ethernet, WiFi, PPP', header: 'DH', color: '#8e44ad' },
  { pdu: 'Bits', protocols: 'Coax, Fibre, Radio', header: '', color: '#16a085' },
];

function buildSenderSteps() {
  return LY.map((L, i) => {
    const m = LY_META[i];
    
    const headers = LY_META.slice(0, i + 1).reverse().filter(x => x.header).map(x => x.header);
    return {
      phase: 'send', al: L.n, side: 'sender', pause: L.n === 2,
      pdu: m.pdu, protocols: m.protocols, header: m.header,
      headers_so_far: headers,
      expl: `SENDER — Layer ${L.n} (${L.name}): ${SEND_ACTS[i]}`
    };
  });
}
function buildRecvSteps() {
  return [...LY].reverse().map((L, i) => {
    const meta_i = 6 - i; 
    const m = LY_META[meta_i];
    const headers = LY_META.slice(0, meta_i + 1).reverse().filter(x => x.header).map(x => x.header);
    return {
      phase: 'recv', al: L.n, side: 'receiver', pause: false,
      pdu: m.pdu, protocols: m.protocols, header: m.header,
      headers_so_far: headers,
      expl: `RECEIVER — Layer ${L.n} (${L.name}): ${RECV_ACTS[i]}`
    };
  });
}
const buildTransStep = () => ({
  phase: 'trans', al: 0, side: 'wire', pause: false,
  pdu: 'Bits', protocols: 'Physical Medium', header: '', headers_so_far: [],
  expl: 'Protected frame travelling through physical medium (copper wire / fibre / wireless)...'
});




function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function hex2rgba(hex, a) {
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function drawArrow(ctx, x1, y1, x2, y2, col, dashed) {
  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
  if (dashed) ctx.setLineDash([6, 4]); else ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - 12, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 13, y2 - 5); ctx.lineTo(x2 - 13, y2 + 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawDataPacket(ctx, x, y, w, txt, col) {
  ctx.save();
  
  
  ctx.fillStyle = hex2rgba(col.replace('#', ''), 0.12);
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  rr(ctx, x, y, w, 20, 4); ctx.fill(); ctx.stroke();
  
  ctx.fillStyle = col;
  ctx.font = `bold 10px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt.length > 28 ? txt.slice(0, 28) + '…' : txt, x + w / 2, y + 10);
  ctx.restore();
}

function drawOSI(step) {
  const cv = document.getElementById('osi');
  const wrap = cv.parentElement;
  const dpr = window.devicePixelRatio || 1;
  const logicalW = wrap.clientWidth;
  const logicalH = wrap.clientHeight;
  cv.width = logicalW * dpr;
  cv.height = logicalH * dpr;
  cv.style.width = logicalW + 'px';
  cv.style.height = logicalH + 'px';
  const ctx = cv.getContext('2d'), W = logicalW, H = logicalH;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

  const lhRaw = (H - 80) / 7, lh = Math.min(52, lhRaw), gap = Math.max(3, (H - 80 - 7 * lh) / 6);
  const topY = 28, cW = Math.floor((W - 100) / 2), lx = 18, rx = W - cW - 18;
  const mid = W / 2;

  
  ctx.fillStyle = '#64748b'; ctx.font = `bold 11px Arial, sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('S E N D E R', lx + cW / 2, topY - 10);
  ctx.fillText('R E C E I V E R', rx + cW / 2, topY - 10);

  const al = step ? step.al : 0, side = step ? step.side : '';

  LY.forEach((L, i) => {
    const y = topY + i * (lh + gap);
    const sAct = al === L.n && side === 'sender';
    const rAct = al === L.n && side === 'receiver';
    const hex = L.hex;

    
    ctx.save();
    if (sAct) { }
    ctx.fillStyle = sAct ? hex2rgba(hex, .18) : hex2rgba(hex, .06);
    ctx.strokeStyle = sAct ? L.color : hex2rgba(hex, .3);
    ctx.lineWidth = sAct ? 1.5 : 1;
    rr(ctx, lx, y, cW, lh, 6); ctx.fill(); ctx.stroke();
    ctx.restore();

    
    if (sAct) {
      ctx.fillStyle = L.color;
      rr(ctx, lx, y, 3, lh, 6); ctx.fill();
    }

    
    ctx.fillStyle = sAct ? L.color : hex2rgba(hex, .5);
    ctx.font = `bold 10px Arial, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`L${L.n}`, lx + 10, y + lh / 2);

    
    ctx.font = `${sAct ? '500' : '400'} 11px Arial, sans-serif`;
    ctx.fillStyle = sAct ? '#fff' : hex2rgba(hex, .75);
    ctx.fillText(L.name, lx + 30, y + lh / 2);

    
    if (L.n === 2) {
      ctx.save();
      ctx.strokeStyle = hex2rgba('8e44ad', .25); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      rr(ctx, lx - 3, y - 3, cW + 6, lh + 6, 8); ctx.stroke();
      ctx.restore();
    }

    
    ctx.save();
    if (rAct) { }
    ctx.fillStyle = rAct ? hex2rgba(hex, .18) : hex2rgba(hex, .06);
    ctx.strokeStyle = rAct ? L.color : hex2rgba(hex, .3);
    ctx.lineWidth = rAct ? 1.5 : 1;
    rr(ctx, rx, y, cW, lh, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (rAct) { ctx.fillStyle = L.color; rr(ctx, rx + cW - 3, y, 3, lh, 6); ctx.fill(); }
    ctx.fillStyle = rAct ? L.color : hex2rgba(hex, .5);
    ctx.font = `bold 10px Arial, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`L${L.n}`, rx + 10, y + lh / 2);
    ctx.font = `${rAct ? '500' : '400'} 11px Arial, sans-serif`;
    ctx.fillStyle = rAct ? '#fff' : hex2rgba(hex, .75);
    ctx.fillText(L.name, rx + 30, y + lh / 2);
    if (L.n === 2) {
      ctx.save(); ctx.strokeStyle = hex2rgba('8e44ad', .25); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      rr(ctx, rx - 3, y - 3, cW + 6, lh + 6, 8); ctx.stroke(); ctx.restore();
    }
  });

  
  const wireY = topY + 5 * (lh + gap) + lh / 2;
  const wActive = step && step.phase === 'trans';
  if (wActive) {
    
    ctx.save(); ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(lx + cW + 8, wireY); ctx.lineTo(rx - 8, wireY); ctx.stroke();
    ctx.restore();
    
    ctx.fillStyle = '#ffcc00'; ctx.font = `bold 10px Arial, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('— PHYSICAL CHANNEL — BITS ON WIRE →', mid, wireY - 12);
    
    const pw = 160;
    drawDataPacket(ctx, mid - pw / 2, wireY + 6, pw, '[ PROTECTED FRAME ]', '#ffcc00');
  } else {
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(lx + cW + 8, wireY); ctx.lineTo(rx - 8, wireY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b'; ctx.font = `9px Arial, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('physical channel', mid, wireY - 8);
  }

  
  if (step && al > 0) {
    const li = 7 - al, y = topY + li * (lh + gap) + lh / 2;
    const L = LY.find(l => l.n === al);
    const col = L ? L.color : '#3b9eff';
    const headers = step.headers_so_far || [];

    if (side === 'sender') {
      
      drawArrow(ctx, lx + cW + 8, y, rx - 8, y, al === 2 ? '#9b59b6' : col, al > 2);

      

    } else if (side === 'receiver') {
      
      drawArrow(ctx, rx - 8, y, lx + cW + 8, y, '#00ff88', false);

      
    }
  }

  
  if (step && step.pause) {
    const i = 7 - 2, y = topY + i * (lh + gap) + lh / 2;
    ctx.save();
    
    ctx.fillStyle = 'rgba(142,68,173,.95)';
    ctx.font = `bold 11px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⚡  CHOOSE ERROR TECHNIQUE  →', mid, y + 4);
    ctx.restore();
  }
}




function spdMs(id) { return 1600 - parseInt(document.getElementById(id).value) * 250; }
function stopO() {
  clearInterval(S.oTimer); S.oPlay = false;
}

const LOG_COLORS = { 7: '#e74c3c', 6: '#fb923c', 5: '#fbbf24', 4: '#34d399', 3: '#3b9eff', 2: '#a855f7', 1: '#2dd4bf' };
const PDU_LABELS = { 7: 'DATA', 6: 'DATA', 5: 'DATA', 4: 'SEGMENT', 3: 'PACKET', 2: 'FRAME', 1: 'BITS', 0: 'BITS' };
const DIR_LABELS = { sender: '↓ SEND', receiver: '↑ RECV', wire: '→ WIRE' };

function oRender() {
  if (!S.osiSteps.length) { drawOSI(null); return; }
  const st = S.osiSteps[S.oIdx];
  drawOSI(st);
  document.getElementById('osi-lbl').textContent = `${S.oIdx + 1} / ${S.osiSteps.length}`;
  const bar=document.getElementById('oexp'),txt=document.getElementById('oexp-txt');
  txt.textContent=st.expl;
  bar.className='explain-bar';

  
  const pduDisp = document.getElementById('pdu-display');
  if(pduDisp){
    if(st && st.al > 0 && st.phase !== 'trans') {
      pduDisp.innerHTML = '';
      const headers = st.headers_so_far || [];
      const segs = [...headers, 'DATA'];
      const L = LY.find(l=>l.n===st.al);
      const isSender = st.side === 'sender';
      const mainCol = isSender ? (L ? L.color : '#3b9eff') : '#00b35e';
      
      const pduLabel = document.createElement('span');
      pduLabel.style.cssText = `font-size:11px; font-weight:bold; color:${mainCol}; margin-right:8px; line-height:24px;`;
      pduLabel.textContent = `[PDU: ${st.pdu || 'DATA'}]`;
      pduDisp.appendChild(pduLabel);

      segs.forEach(seg => {
        const isData = (seg === 'DATA');
        const box = document.createElement('div');
        let bg, border, color;
        if (isSender) {
          bg = isData ? 'rgba(0,0,0,0.05)' : hex2rgba(mainCol.replace('#',''), 0.15);
          border = isData ? 'rgba(0,0,0,0.3)' : mainCol + '88';
          color = isData ? '#555' : mainCol;
        } else {
          bg = isData ? 'rgba(0,255,136,0.15)' : 'rgba(0,255,136,0.1)';
          border = isData ? 'rgba(0,255,136,0.8)' : 'rgba(0,255,136,0.4)';
          color = '#008c4a'; 
        }
        
        box.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          height: 20px;
          background: ${bg};
          border: 1px solid ${border};
          color: ${color};
          font-size: 11px;
          font-weight: bold;
          border-radius: 4px;
        `;
        box.textContent = seg;
        pduDisp.appendChild(box);
      });
    } else if (st && st.phase === 'trans') {
       pduDisp.innerHTML = `<span style="font-size:11px; font-weight:bold; color:#c79a00; line-height:24px;">[ PROTECTED FRAME on wire ]</span>`;
    } else {
      pduDisp.innerHTML = '';
    }
  }

  
  const log = document.getElementById('osiLog');
  log.innerHTML = '';
  for (let i = 0; i <= S.oIdx; i++) {
    const s = S.osiSteps[i];
    const isCur = (i === S.oIdx);
    const col = s.al ? LOG_COLORS[s.al] : '#ffcc00';
    const pduName = PDU_LABELS[s.al] || 'BITS';
    const dirLabel = DIR_LABELS[s.side] || '→';

    
    let rowCls = 'osi-log-row';
    if (isCur) {
      rowCls += s.pause ? ' pause-row' : s.side === 'receiver' ? ' recv-row active-row' : s.side === 'wire' ? ' trans-row active-row' : ' active-row';
    } else {
      if (s.side === 'receiver') rowCls += ' recv-row';
      else if (s.side === 'wire') rowCls += ' trans-row';
    }

    
    const layerName = s.al ? LY.find(l => l.n === s.al).name : 'Physical Channel';
    const actionText = s.pause ? '⚡ PAUSED — Choose error technique'
      : (s.expl || '').replace(/^(SENDER|RECEIVER)\s*—\s*Layer\s*\d+\s*\([^)]*\):\s*/i, '');
    const protocols = s.protocols || '';

    
    const numStyle = isCur ? '' : `border-color:${col}33;color:${col}66;background:transparent`;

    
    const headers = (s.headers_so_far || []).slice(0, 4);
    let frameInner = '';
    if (s.phase === 'send' || s.phase === 'recv') {
      headers.forEach(h => {
        frameInner += `<div class="fseg" style="background:${col}15;border-color:${col}44;color:${isCur ? col : col + '88'}">${h}</div>`;
      });
      const dcol = isCur ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.3)';
      frameInner += `<div class="fseg" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2);color:${dcol}">DATA</div>`;
    } else if (s.phase === 'trans') {
      frameInner = `<div class="fseg" style="background:#ffcc0015;border-color:#ffcc0044;color:${isCur ? '#ffcc00' : '#ffcc0066'}">…bits…</div>`;
    }

    const row = document.createElement('div');
    row.className = rowCls;
    row.innerHTML = `<div class='olr-content'><strong>[` + layerName + `]</strong> ` + actionText + `</div>`; log.appendChild(row);
  }
  log.scrollTop = log.scrollHeight;

  if (st.pause) { stopO(); showChoose(); }
}
function oC(a) {
  stopO();
  if (a === 'first') S.oIdx = 0;
  else if (a === 'last') S.oIdx = S.osiSteps.length - 1;
  else if (a === 'next') S.oIdx = Math.min(S.oIdx + 1, S.osiSteps.length - 1);
  else if (a === 'prev') S.oIdx = Math.max(S.oIdx - 1, 0);
  oRender();
}
function playO() {
  S.oPlay = true;
  const b = document.getElementById('opb'); b.textContent = 'Pause'; b.classList.add('playing');
  S.oTimer = setInterval(() => {
    if (S.oIdx < S.osiSteps.length - 1) { S.oIdx++; oRender(); } else { stopO(); }
  }, spdMs('ospd'));
}




const TC = {
  accent: '#2563eb', orange: '#f97316', green: '#10b981',
  red: '#ef4444', yellow: '#eab308', text: '#0f172a', muted: '#64748b',
  border: '#e2e8f0', bg: '#f8fafc', card: '#ffffff'
};

function tcResize(h){
  const c=document.getElementById('tc');
  const dpr=window.devicePixelRatio||1;
  
  const logicalW=c.parentElement.clientWidth-20; 
  const logicalH=h||150;
  c.width=logicalW*dpr;
  c.height=logicalH*dpr;
  c.style.width=logicalW+'px';
  c.style.height=logicalH+'px';
  const ctx=c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return {W:logicalW,H:logicalH};
}

function hex2r(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function bCell(ctx, x, y, v, sz, col, lbl, sub) {
  
  ctx.fillStyle = hex2r(col, .1);
  ctx.strokeStyle = col; ctx.lineWidth = 1.5;
  rr(ctx, x - sz / 2, y - sz / 2, sz, sz, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col;
  ctx.font = `bold ${Math.floor(sz * .48)}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v, x, y);
  if (lbl) { ctx.fillStyle = TC.muted; ctx.font = `8px Arial, sans-serif`; ctx.fillText(lbl, x, y - sz / 2 - 8); }
  if (sub) { ctx.fillStyle = col; ctx.font = `7px Arial, sans-serif`; ctx.fillText(sub, x, y + sz / 2 + 10); }
}

function drawBits(ctx, W, H, st) {
  if (!st.bits || !st.bits.length) {
    ctx.fillStyle = TC.muted; ctx.font = `11px Arial, sans-serif`; ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; ctx.fillText(st.title || '', W / 2, H / 2); return;
  }
  
  ctx.fillStyle = '#7a9ab5'; ctx.font = `bold 11px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(st.title || '', W / 2, 10);
  const n = st.bits.length;
  const sz = Math.min(38, Math.floor((W - 24) / n) - 5);
  const tw = n * (sz + 5) - 5, sx = Math.floor((W - tw) / 2), y = H / 2 + 14;
  for (let i = 0; i < n; i++) {
    const hl = st.highlight && st.highlight.includes(i);
    const ip = st.parity_positions && st.parity_positions.includes(i);
    const ie = st.error_pos === i, ic = st.corrected_pos === i, ihp = st.highlight_parity === i;
    let col = TC.text;
    if (ic) col = TC.green;
    else if (ie) col = TC.red;
    else if (ihp || ip) col = TC.accent;
    else if (hl) {
      const hc = st.highlight_color;
      if (hc === 'error') col = TC.red;
      else if (hc === 'success') col = TC.green;
      else if (hc === 'count') col = '#bb86fc';
      else if (hc === 'parity') col = TC.accent;
      else col = TC.orange;
    } else if (st.data_positions && st.data_positions.includes(i) && !ip) col = TC.orange;
    bCell(ctx, sx + i * (sz + 5) + sz / 2, y, st.bits[i], sz, col, `${i + 1}`, ip ? 'P' : ic ? '✓' : ie ? '✗' : '');
  }
  if (st.highlight_color === 'count') {
    const ones = st.bits.filter(b => b === 1).length;
    ctx.fillStyle = TC.muted; ctx.font = `10px Arial, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(`Count of 1s = ${ones}`, W / 2, H - 10);
  }
}

function drawCS(ctx, W, H, st) {
  if (!st.segments) { ctx.fillStyle = TC.muted; ctx.font = `11px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.title || '', W / 2, H / 2); return; }
  ctx.fillStyle = '#7a9ab5'; ctx.font = `bold 11px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(st.title || '', W / 2, 8);
  const segs = st.segments, n = segs[0].length;
  const sz = Math.min(20, Math.floor((W - 60) / n));
  const sw = n * (sz + 3), sx = Math.floor((W - sw) / 2); let y = 40;
  for (let si = 0; si < segs.length; si++) {
    const hl = st.highlight_seg && st.highlight_seg.includes(si);
    ctx.fillStyle = hl ? TC.orange : '#3d5870'; ctx.font = `9px Arial, sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(`S${si + 1}`, sx - 5, y + sz / 2);
    for (let bi = 0; bi < n; bi++)bCell(ctx, sx + bi * (sz + 3) + sz / 2, y + sz / 2, segs[si][bi], sz, hl ? TC.orange : TC.muted, '', '');
    y += sz + 5;
    if (si < segs.length - 1) { ctx.fillStyle = '#64748b'; ctx.font = `13px Arial, sans-serif`; ctx.textAlign = 'left'; ctx.fillText('+', sx - 16, y - 4); }
  }
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(sx - 18, y); ctx.lineTo(sx + sw + 10, y); ctx.stroke(); y += 4;
  if (st.current_sum) {
    ctx.fillStyle = TC.accent; ctx.font = `9px Arial, sans-serif`; ctx.textAlign = 'right'; ctx.fillText('Sum', sx - 5, y + sz / 2);
    for (let bi = 0; bi < n; bi++)bCell(ctx, sx + bi * (sz + 3) + sz / 2, y + sz / 2, st.current_sum[bi], sz, TC.accent, '', ''); y += sz + 5;
  }
  if (st.checksum) {
    ctx.fillStyle = TC.green; ctx.font = `9px Arial, sans-serif`; ctx.textAlign = 'right'; ctx.fillText('CS', sx - 5, y + sz / 2);
    for (let bi = 0; bi < n; bi++)bCell(ctx, sx + bi * (sz + 3) + sz / 2, y + sz / 2, st.checksum[bi], sz, TC.green, '', '');
  }
}

function drawCRC(ctx, W, H, st) {
  if (!st.dividend) { ctx.fillStyle = TC.muted; ctx.font = `11px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.title || '', W / 2, H / 2); return; }
  ctx.fillStyle = '#7a9ab5'; ctx.font = `bold 11px Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(st.title || '', W / 2, 8);
  const n = st.dividend.length, sz = Math.min(22, Math.floor((W - 20) / n) - 2);
  const tw = n * (sz + 2), sx = Math.floor((W - tw) / 2); let y = 40;
  for (let i = 0; i < n; i++) {
    const hl = st.highlight && st.highlight.includes(i);
    bCell(ctx, sx + i * (sz + 2) + sz / 2, y, st.dividend[i], sz, hl ? TC.accent : TC.text, `${i}`, '');
  }
  y += sz + 10;
  if (st.division_rows) {
    for (const row of st.division_rows) {
      ctx.fillStyle = TC.orange + '99'; ctx.font = `10px Arial, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('⊕', sx - 14, y + sz / 2);
      for (let i = 0; i < row.divisor.length; i++)bCell(ctx, sx + (row.pos + i) * (sz + 2) + sz / 2, y, row.divisor[i], sz, TC.orange, '', '');
      y += sz + 3;
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx + row.pos * (sz + 2) - 2, y); ctx.lineTo(sx + (row.pos + row.divisor.length) * (sz + 2), y); ctx.stroke();
      y += 3;
      for (let i = 0; i < row.xor.length; i++)bCell(ctx, sx + (row.pos + i) * (sz + 2) + sz / 2, y, row.xor[i], sz, TC.accent, '', '');
      y+=sz+6;
    }
  }
  if(st.remainder){
    ctx.fillStyle=TC.green;ctx.font=`bold 12px Arial, sans-serif`;ctx.textAlign='center';
    ctx.fillText('CRC = '+st.remainder.join(''),W/2,y+10);
  }
}

function drawT(st){
  if(!st)return;
  const m=S.method;
  let neededH = 150;
  
  const c = document.getElementById('tc');
  const logicalW = c.parentElement.clientWidth - 20;

  if(m==='crc' && st.division_rows) {
    const n = st.dividend.length;
    const sz = Math.min(22, Math.floor((logicalW-20)/n)-2);
    neededH = 50 + st.division_rows.length * (sz * 2 + 10) + 40;
    neededH = Math.max(150, neededH);
  } else if (m==='checksum' && st.segments) {
    const n = st.segments[0].length;
    const sz = Math.min(20, Math.floor((logicalW-60)/n));
    neededH = 60 + st.segments.length * (sz + 5) + (sz * 2) + 40;
    neededH = Math.max(150, neededH);
  }
  
  const dims=tcResize(neededH);
  const cv=document.getElementById('tc'),ctx=cv.getContext('2d');
  const W=dims.W,H=dims.H;
  ctx.fillStyle=TC.bg;ctx.fillRect(0,0,W,H);
  
  if(m==='parity'||m==='hamming')drawBits(ctx,W,H,st);
  else if (m === 'checksum') drawCS(ctx, W, H, st);
  else if (m === 'crc') drawCRC(ctx, W, H, st);
}




function stopT() {
  clearInterval(S.tTimer); S.tPlay = false;
}
function tRender() {
  if (!S.tSteps.length) return;
  const st = S.tSteps[S.tIdx]; drawT(st);
  document.getElementById('tlbl').textContent = `${S.tIdx + 1} / ${S.tSteps.length}`;

  
  const statusCls = st.status === 'error' ? ' is-err' : st.status === 'success' || st.status === 'corrected' ? ' is-ok' : '';
  const texBar = document.getElementById('tex');
  texBar.className = 'tech-explain' + statusCls;
  document.getElementById('tex-txt').textContent = st.title ? (st.title + ' — ' + (st.explanation || st.expl || '')) : (st.explanation || st.expl || '');

  
  const log = document.getElementById('stepLog');
  log.innerHTML = '';
  for (let i = 0; i <= S.tIdx; i++) {
    const s = S.tSteps[i];
    const isCur = (i === S.tIdx);
    const sc = s.status === 'error' ? 'serr' : s.status === 'success' || s.status === 'corrected' ? 'sok' : '';
    const cls = 'sle' + (isCur ? ' cur' : '') + (sc ? ' ' + sc : '');
    const expl = s.explanation || s.expl || '';
    const title = s.title || '';
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = `<div class="sle-num">${i + 1}</div><div class="sle-content"><div class="sle-title">${title}</div><div class="sle-body">${expl}</div></div>`;
    log.appendChild(div);
  }
  
  log.scrollTop = log.scrollHeight;

  if (S.tIdx === S.tSteps.length - 1 && !S.vDone) showInject();
}
function tC(a) {
  stopT();
  if (a === 'first') S.tIdx = 0;
  else if (a === 'last') S.tIdx = S.tSteps.length - 1;
  else if (a === 'next') S.tIdx = Math.min(S.tIdx + 1, S.tSteps.length - 1);
  else if (a === 'prev') S.tIdx = Math.max(S.tIdx - 1, 0);
  tRender();
}
function playT() {
  S.tPlay = true;
  const b = document.getElementById('tpb'); b.textContent = 'Pause'; b.classList.add('playing');
  S.tTimer = setInterval(() => {
    if (S.tIdx < S.tSteps.length - 1) { S.tIdx++; tRender(); } else { stopT(); }
  }, spdMs('tspd'));
}




function showInject() {
  document.getElementById('injWrap').style.display = 'block';
  buildInj();
  document.getElementById('contBtn').style.display = 'inline-flex';
}
function buildInj() {
  const cont = document.getElementById('ibits'); cont.innerHTML = '';
  const pp = S.ppos.map(p => p - 1);
  
  if (S.method === 'checksum' && S.csSegs && S.csSegs.length > 0) {
    const segLen = S.csSegs[0].length;
    for (let start = 0; start < S.codeword.length; start += segLen) {
      const rowDiv = document.createElement('div');
      rowDiv.style.display = 'flex';
      rowDiv.style.gap = '6px';
      rowDiv.style.marginBottom = '6px';
      rowDiv.style.flexWrap = 'nowrap';
      
      const chunk = S.codeword.slice(start, start + segLen);
      chunk.forEach((b, idx) => {
        const i = start + idx;
        const el = document.createElement('div');
        el.className = 'bbit';
        el.dataset.v = b; el.dataset.o = b;
        el.innerHTML = `<span class="bbit-val">${b}</span><span class="bbit-pos">${i + 1}</span>`;
        el.onclick = function () {
          const nv = parseInt(this.dataset.v) ^ 1;
          this.dataset.v = nv;
          this.querySelector('.bbit-val').textContent = nv;
          this.classList.toggle('is-flipped', parseInt(this.dataset.o) !== nv);
        };
        rowDiv.appendChild(el);
      });
      cont.appendChild(rowDiv);
    }
  } else {
    S.codeword.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'bbit' + (pp.includes(i) ? ' is-parity' : '');
      el.dataset.v = b; el.dataset.o = b;
      el.innerHTML = `${pp.includes(i) ? '<div class="bbit-tag">P</div>' : ''}<span class="bbit-val">${b}</span><span class="bbit-pos">${i + 1}</span>`;
      el.onclick = function () {
        const nv = parseInt(this.dataset.v) ^ 1;
        this.dataset.v = nv;
        this.querySelector('.bbit-val').textContent = nv;
        this.classList.toggle('is-flipped', parseInt(this.dataset.o) !== nv);
      };
      cont.appendChild(el);
    });
  }
}
function resetInj() { buildInj(); S.vDone = false; }
function getInj() { return Array.from(document.getElementById('ibits').querySelectorAll('.bbit')).map(c => parseInt(c.dataset.v)); }




async function runVerify() {
  console.log("Run verify clicked");
  const received = getInj();
  let body = { method: S.method, received };
  if (S.method === 'parity') body.parity_type = document.getElementById('par-type').value;
  else if (S.method === 'checksum') {
    const sl = S.csSegs[0].length, bits = received, segs = [];
    for (let i = 0; i < S.csSegs.length; i++)segs.push(bits.slice(i * sl, (i + 1) * sl));
    body.segments = segs; body.checksum = bits.slice(S.csSegs.length * sl);
  }
  else if (S.method === 'crc') body.divisor = S.crcDiv;
  else if (S.method === 'hamming') { body.parity_positions = S.ppos; body.n = S.hamN; }

  const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  S.tSteps = [...S.tSteps, ...json.steps];
  S.tIdx = S.tSteps.length - json.steps.length;
  S.vDone = true;
  document.getElementById('tech-badge').className = 'tech-badge tbadge-ver';
  document.getElementById('tech-badge').textContent = 'Verifying';
  stopT(); tRender(); setPhase(3);

  
  if (S.method === 'hamming' && json.corrected) {
    const cells = document.getElementById('ibits').querySelectorAll('.bbit');
    json.corrected.forEach((b, i) => {
      if (b !== S.codeword[i]) {
        cells[i].classList.remove('is-flipped'); cells[i].classList.add('is-corrected');
        cells[i].querySelector('.bbit-val').textContent = b;
      }
    });
  }

  const bn = document.getElementById('resBanner');
  bn.className = 'result-banner' + (json.ok ? ' show-ok' : ' show-err'); bn.style.display = 'block';
  bn.textContent = json.ok
    ? '✓  No Error Detected — Data Intact!'
    : (S.method === 'hamming' ? '⚡  Error Detected & Corrected by Hamming!' : '⚠  Error Detected in Transmission!');
}




function continueOSI() {
  S.osiSteps = [...S.osiSteps, buildTransStep(), ...buildRecvSteps()];
  S.oIdx = S.osiSteps.length - buildRecvSteps().length - 1;
  setPhase(4);
  document.getElementById('resBanner').className = 'result-banner'; document.getElementById('resBanner').style.display = 'none';
  oRender();
}




function setPhase(n) {
  const phaseNames = ["OSI Sender Encoding", "Layer 2 Pause - Configure Protection", "Encoding Frame", "Verifying Data", "OSI Receiver Decoding"];
  const el = document.getElementById('current-phase-text');
  if (el) el.textContent = phaseNames[n] || "Done";
}
function showChoose() {
  setPhase(1);
  document.getElementById('vLocked').style.display = 'none';
  document.getElementById('vChoose').style.display = 'block';
  document.getElementById('vTech').style.display = 'none';
  document.getElementById('resBanner').className = 'result-banner'; document.getElementById('resBanner').style.display = 'none';
}
function pickM(m, el) {
  S.method = m;
  const cards = document.querySelectorAll('.mcard');
  if (cards) cards.forEach(c => c.classList.remove('sel'));
  if (el && el.classList) el.classList.add('sel');
  ['parity', 'checksum', 'crc', 'hamming'].forEach(id => {
    const elem = document.getElementById(`ex-${id}`);
    if (elem) elem.style.display = (id === m ? 'block' : 'none');
  });
  const btn = document.getElementById('applyBtn');
  if (btn) btn.style.display = 'inline-block';
}
async function applyM() {
  const msg = document.getElementById('msg').value || 'Hello';
  const bin = msg.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  
  const fullBin = bin;
  
  
  let dataBits;
  if (S.method === 'parity') dataBits = fullBin.slice(0, 8);
  else if (S.method === 'hamming') dataBits = fullBin.slice(0, 8);
  else if (S.method === 'crc') dataBits = fullBin.slice(0, 16);
  else dataBits = fullBin.slice(0, 32); 
  let body = { method: S.method, data: dataBits };
  if (S.method === 'parity') body.parity_type = document.getElementById('par-type').value;
  else if (S.method === 'checksum') {
    const ss = parseInt(document.getElementById('cs-sz').value), segs = [];
    for (let i = 0; i < dataBits.length; i += ss) segs.push(dataBits.slice(i, i + ss).padEnd(ss, '0'));
    
    if (segs.length < 2) segs.push('0'.repeat(ss));
    body.segments = segs;
  }
  else if (S.method === 'crc') body.divisor = document.getElementById('crc-g').value.replace(/[^01]/g, '') || '1011';

  const res = await fetch('/api/encode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  S.tSteps = json.steps; S.tIdx = 0; S.vDone = false; S.codeword = json.codeword;
  if (S.method === 'checksum') { S.csSegs = json.segments; S.csCS = json.checksum; S.ppos = []; }
  else if (S.method === 'crc') { S.crcDiv = body.divisor.split('').map(Number); S.ppos = []; }
  else if (S.method === 'hamming') { S.ppos = json.parity_positions; S.hamN = json.n; }
  else S.ppos = [];

  document.getElementById('vChoose').style.display = 'none';
  document.getElementById('vTech').style.display = 'block';
  const names = { parity: 'Parity Check', checksum: 'Checksum (1\'s Complement)', crc: 'CRC — XOR Division', hamming: 'Hamming Code' };
  document.getElementById('ttl').textContent = names[S.method];
  document.getElementById('tech-badge').className = 'tech-badge tbadge-enc';
  document.getElementById('tech-badge').textContent = 'Encoding';
  document.getElementById('injWrap').style.display = 'none';
  document.getElementById('contBtn').style.display = 'none';
  document.getElementById('resBanner').className = 'result-banner'; document.getElementById('resBanner').style.display = 'none';
  document.getElementById('stepLog').innerHTML = '';
  tcResize(); stopT(); tRender(); setPhase(2);
}



function startSim() {
  resetAll();
  S.osiSteps = buildSenderSteps(); S.oIdx = 0; setPhase(0);
  document.getElementById('vLocked').style.display = 'block';
  document.getElementById('vChoose').style.display = 'none';
  document.getElementById('vTech').style.display = 'none';
  oRender();
}
function resetAll() {
  stopO(); stopT();
  Object.assign(S, { osiSteps: [], oIdx: 0, tSteps: [], tIdx: 0, method: null, codeword: [], vDone: false, ppos: [], hamN: 0, crcDiv: [], csSegs: [], csCS: [] });
  setPhase(0);
  document.getElementById('vLocked').style.display = 'block';
  document.getElementById('vChoose').style.display = 'none';
  document.getElementById('vTech').style.display = 'none';
  document.getElementById('resBanner').className = 'result-banner'; document.getElementById('resBanner').style.display = 'none';
  const t = document.getElementById('oexp-txt');
  t.textContent = 'Enter a message and click ▶ Start to begin the OSI simulation.';
  document.getElementById('oexp').className = 'explain-bar';
  document.getElementById('osi-lbl').textContent = '— / —';
  document.querySelectorAll('.mcard').forEach(c => c.classList.remove('sel'));
  document.getElementById('applyBtn').style.display = 'none';
  document.getElementById('stepLog').innerHTML = '';
  document.getElementById('osiLog').innerHTML = '';
  ['parity', 'checksum', 'crc', 'hamming'].forEach(id => document.getElementById(`ex-${id}`).classList.remove('show'));
  drawOSI(null);
}
window.addEventListener('resize', () => {
  if (S.osiSteps.length) oRender(); else drawOSI(null);
  if (S.tSteps.length) tRender();
});
window.onload = () => { drawOSI(null); };