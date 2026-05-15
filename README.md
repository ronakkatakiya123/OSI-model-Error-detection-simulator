# OSI Model & Error Detection Protocols Visualizer

## 📖 About the Project
This project is a **web-based Data Communication (DC) Simulator** that visually demonstrates the working of the OSI model and various error detection and correction techniques. It bridges the gap between theoretical data communication concepts and practical understanding through interactive visualization.

### Key Features:
- **OSI Model Simulation**: Visualizes data encapsulation (sender side) and decapsulation (receiver side) across all 7 layers (Application to Physical).
- **Error Detection Techniques**: Step-by-step calculation and visualization for:
  - **Parity Check** (Even and Odd)
  - **Checksum**
  - **Cyclic Redundancy Check (CRC)**
- **Error Correction**: 
  - **Hamming Code** implementation to detect and automatically correct single-bit errors.
- **Noise Injection Simulation**: Allows users to manually flip bits in the transmitted data to simulate network noise and observe how the receiver detects or corrects the errors.

### Authors
- Katakiya Ronak

---

## 🚀 How to Run the Project

### Prerequisites
Make sure you have **Python** installed on your system. 

### Installation & Execution Steps

1. **Clone or Download the Repository**
   Navigate to the project folder in your terminal:
   ```bash
   cd dc_final
   ```

2. **Install Required Dependencies**
   The project requires `Flask` to run the web server. Install it using pip:
   ```bash
   pip install Flask
   ```

3. **Run the Application**
   Start the Flask server by running the main Python script:
   ```bash
   python app.py
   ```

4. **Open in Browser**
   Once the server is running, open your web browser and go to:
   ```
   http://localhost:5000
   ```

---

## 🛠️ Built With
- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript (via templates and static files)
- **Concepts Covered**: Data Communication, OSI Layering, Networking, Error Handling Algorithms.
