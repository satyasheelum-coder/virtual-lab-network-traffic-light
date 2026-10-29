# Virtual Lab: Network Traffic Light (Product No. 33)

> **A 100% Software-Based Network Traffic Simulation & Visual Monitoring Dashboard with Python Flask Backend**  
> Designed for **2nd Year BTech Computer Science & Engineering (CSE)** Project Presentation and Evaluation.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Key Features](#-key-features)
4. [Traffic Classification Logic](#-traffic-classification-logic)
5. [Backend API Architecture](#-backend-api-architecture)
6. [Project File Structure](#-project-file-structure)
7. [How to Install & Run the Project](#-how-to-install--run-the-project)
8. [Detailed Code & File Explanation](#-detailed-code--file-explanation)
9. [Student Presentation & Viva Voce Guide](#-student-presentation--viva-voce-guide)
10. [Future Scope](#-future-scope)

---

## 🌟 Project Overview

**Product No. 33: Virtual Lab Network Traffic Light** is a software-based virtual laboratory environment that simulates computer network bandwidth traffic variations and represents network health using a virtual three-lamp traffic light visualizer (**Green**, **Yellow**, and **Red**).

This project requires **NO physical hardware** (no Arduino, ESP32, Raspberry Pi, microcontrollers, or physical LEDs). It uses a lightweight **Python Flask API backend** (`app.py`) connected to a responsive **HTML/CSS/JS frontend dashboard**.

---

## 🎯 Problem Statement

In academic computer networking laboratories, understanding bandwidth usage, router congestion, and queuing delays traditionally required either:
1. Expensive physical network hardware testbeds.
2. Hardware microcontrollers (like Arduino/Raspberry Pi) wired with physical LEDs, which are prone to pin damage, hardware availability limits, and complex setup procedures.

**The Solution:** This project provides a software-based virtual laboratory environment where students can simulate network traffic spikes (0 to 1000 Mbps) via a Python REST API, observe how discrete status thresholds trigger visual traffic signal illumination, inspect estimated packet loss & latency metrics, and chart traffic trends in real time.

---

## 🔥 Key Features

1. **Virtual Traffic Light Visualizer:**
   - Matte-black casing with 3 distinct circular lamps (**RED**, **YELLOW**, **GREEN**).
   - Active neon illumination glow and dark dim inactive states.
2. **Python Flask Backend Integration:**
   - RESTful GET API endpoint at `/api/traffic` returning JSON payloads (`traffic`, `status`, `capacity`, `latency`, `packet_loss`, `timestamp`).
3. **Real-Time Traffic Numerical Gauge:**
   - Displays current bandwidth in **Mbps** and percentage capacity load (`0%` to `100%`).
   - Dynamic progress bar that transitions smoothly.
4. **Automatic Traffic Classification:**
   - **LOW Traffic (0 - 350 Mbps)** &rarr; **GREEN** Light (Normal Operations).
   - **MEDIUM Traffic (351 - 700 Mbps)** &rarr; **YELLOW** Light (Moderate Congestion).
   - **HIGH Traffic (701 - 1000 Mbps)** &rarr; **RED** Light (Critical Load / DDoS Risk).
5. **Interactive Traffic Simulation:**
   - Manual **"Simulate Traffic"** button triggering backend API requests via `fetch()`.
   - **Auto-Simulation Toggle** (polls backend API every 2 seconds).
   - **Quick Scenario Presets**: Low Flow (150 Mbps), Medium Flow (520 Mbps), High DDoS Spike (890 Mbps), and Random.
6. **Real-Time Interactive Graph (Chart.js):**
   - Live line chart plotting bandwidth changes over time with custom color-coded threshold zones.
7. **Traffic History Log Table:**
   - Logs every simulation step with timestamp, value, status, latency, packet loss, and trigger source.
   - Includes **Status Filter**, **Clear History**, and **Export CSV** capabilities.
8. **Academic Overview Modal:**
   - Built-in documentation dialog for presentation directly from the web interface.

---

## 🚦 Traffic Classification Logic

| Traffic Range (Mbps) | Bandwidth Load (%) | Status Code | Traffic Light Lamp | Network Condition | Estimated Latency | Packet Loss | System Action Needed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0 - 350 Mbps** | 0% - 35% | **LOW** | 🟢 **GREEN** | Normal Bandwidth | < 20 ms | 0.0% | No action required. Optimal state. |
| **351 - 700 Mbps** | 36% - 70% | **MEDIUM** | 🟡 **YELLOW** | Moderate Congestion | 20 - 60 ms | < 0.5% | Monitor bandwidth; queue buffer building up. |
| **701 - 1000 Mbps** | 71% - 100% | **HIGH** | 🔴 **RED** | Critical Overload / DDoS | > 85 ms | > 1.5% | Immediate traffic shaping or rate-limiting required. |

---

## ⚙️ Backend API Architecture

The Python Flask backend (`app.py`) exposes the REST endpoint `/api/traffic`.

### **Endpoint:** `GET /api/traffic`

#### Query Parameters (Optional):
- `preset`: `low` | `medium` | `high` | `random`
- `value`: Numerical Mbps value (e.g. `?value=450`)

#### Sample JSON Response:
```json
{
  "traffic": 450,
  "status": "MEDIUM",
  "capacity": 45,
  "latency": 38,
  "packet_loss": 0.22,
  "max_capacity": 1000,
  "timestamp": "10:45:12 PM"
}
```

---

## 📁 Project File Structure

```text
cloud project/
├── app.py           # Python Flask REST API server & static file host
├── requirements.txt # Python dependency file (Flask, Flask-CORS)
├── index.html       # HTML5 Semantic structure & layout of the dashboard
├── style.css        # CSS3 modern glassmorphism design system & glowing animations
├── script.js        # ES6+ JavaScript handling fetch() API calls & UI rendering
└── README.md        # Academic project documentation & student presentation guide
```

---

## 🚀 How to Install & Run the Project

### Step 1: Install Python Dependencies
Open your terminal inside the project directory (`cloud project/`) and install the required dependencies:

```bash
python -m pip install -r requirements.txt
```
*(Or if `pip` is in your PATH: `pip install -r requirements.txt`)*

### Step 2: Run the Flask Backend Server
Launch the Flask backend application:

```bash
python app.py
```

You will see output similar to:
```text
=========================================================
 🚀 Virtual Lab Network Traffic Light Backend Starting...
 🌐 Access Dashboard at: http://127.0.0.1:5000
 🔗 API Endpoint: http://127.0.0.1:5000/api/traffic
=========================================================
```

### Step 3: Open the Dashboard in Browser
- Open your browser and navigate to: **`http://127.0.0.1:5000`**
- Alternatively, you can open [`index.html`](file:///c:/code/cloud%20project/index.html) directly in any browser—it will automatically connect to `http://127.0.0.1:5000/api/traffic`!

---

## 🔍 Detailed Code & File Explanation

### 1. `app.py` (Backend)
- Uses Flask to define HTTP routes (`/` and `/api/traffic`).
- Applies `flask_cors.CORS` so frontend clients running on any port or protocol can query the API without cross-origin issues.
- Calculates network status (`LOW`, `MEDIUM`, `HIGH`) and bandwidth utilization capacity percentage (`(traffic / 1000) * 100`).

### 2. `script.js` (Frontend Logic)
- Replaces static random generation with `fetch(API_BASE_URL)`.
- Updates the virtual traffic light glowing lamps (`.lamp-red`, `.lamp-yellow`, `.lamp-green`), status badge, progress bar, real-time Chart.js graph, and history table upon receiving the API JSON payload.
- Includes a graceful client fallback mechanism if the Flask server is temporarily unreachable.

---

## 🎓 Student Presentation & Viva Voce Guide

### Opening Introduction Pitch:
> *"Good morning respected faculty. My project is 'Virtual Lab Network Traffic Light' (Product No. 33). It is a software-based network traffic visualizer with a Python Flask REST API backend. The backend exposes an API endpoint `/api/traffic` that generates network bandwidth metrics (0 to 1000 Mbps) and calculates operational capacity. The JavaScript frontend fetches this JSON data via `fetch()`, dynamically maps it into LOW, MEDIUM, and HIGH operational states, illuminates a virtual traffic light with neon glow effects, and plots real-time bandwidth trends."*

### Key Viva Voce Questions & Answers:

**Q1: How do the frontend and backend communicate?**  
*Answer:* The frontend JavaScript uses the native `fetch()` Web API to send HTTP GET requests to the Python Flask backend endpoint `/api/traffic`. Flask responds with a JSON object containing `traffic`, `status`, `capacity`, `latency`, and `packet_loss`, which the frontend parses to update the DOM elements and Chart.js graph.

**Q2: What is CORS and why is Flask-CORS used in `app.py`?**  
*Answer:* CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts web pages from making API requests to a domain/port different from the one that served the page. We use `flask_cors.CORS(app)` in `app.py` to allow the frontend dashboard to fetch API data seamlessly regardless of whether it is opened directly as a file or served via a web server.

**Q3: What are the threshold rules for the traffic light?**  
*Answer:* 
- Traffic $\le 350\text{ Mbps}$ (35% capacity) $\rightarrow$ **LOW / GREEN**
- $351\text{ Mbps} - 700\text{ Mbps}$ (36%-70% capacity) $\rightarrow$ **MEDIUM / YELLOW**
- $> 700\text{ Mbps}$ (71%-100% capacity) $\rightarrow$ **HIGH / RED**

---

## 🔮 Future Scope

1. **Real SNMP / Wireshark Packet Capture:** Connect `app.py` to live network interfaces using Python libraries like `scapy` or `psutil`.
2. **Machine Learning Anomaly Detection:** Add a scikit-learn model to `app.py` to predict network attacks based on packet rates.
3. **Database Logging:** Store traffic history logs in a SQLite/PostgreSQL database via Flask SQLAlchemy.

---

### 👨‍💻 Project Details
- **Project Name:** Virtual Lab Network Traffic Light
- **Product No.:** 33
- **Backend:** Python 3, Flask, Flask-CORS
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js
- **Target Audience:** 2nd Year BTech CSE Students