"""
==============================================================================
VIRTUAL LAB: NETWORK TRAFFIC LIGHT (PRODUCT NO. 33)
Backend Flask API Server
Designed for 2nd Year BTech CSE Project Demonstration
==============================================================================
"""

import os
import random
import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Initialize Flask application
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS) for all routes

# System Configuration Constants
MAX_CAPACITY_MBPS = 1000
GREEN_THRESHOLD = 350
YELLOW_THRESHOLD = 700


def classify_traffic_status(traffic_mbps):
    """
    Classifies network traffic speed into operational statuses.
    - Low traffic (0 - 350 Mbps)    -> LOW (GREEN)
    - Medium traffic (351 - 700 Mbps) -> MEDIUM (YELLOW)
    - High traffic (701 - 1000 Mbps)  -> HIGH (RED)
    """
    if traffic_mbps <= GREEN_THRESHOLD:
        return "LOW"
    elif traffic_mbps <= YELLOW_THRESHOLD:
        return "MEDIUM"
    else:
        return "HIGH"


def calculate_network_metrics(traffic_mbps, status):
    """
    Calculates estimated latency (ms) and packet loss (%) based on bandwidth load.
    """
    load_ratio = traffic_mbps / MAX_CAPACITY_MBPS

    if status == "LOW":
        latency = round(8 + load_ratio * 15 + random.uniform(0, 4))
        packet_loss = 0.0
    elif status == "MEDIUM":
        latency = round(25 + load_ratio * 45 + random.uniform(0, 10))
        packet_loss = round(0.1 + (load_ratio - 0.35) * 1.2 + random.uniform(0, 0.2), 2)
    else:  # HIGH
        latency = round(85 + (load_ratio - 0.7) * 250 + random.uniform(0, 30))
        packet_loss = round(1.5 + (load_ratio - 0.7) * 8.0 + random.uniform(0, 1.0), 2)

    return latency, packet_loss


@app.route('/')
def index():
    """Serves the main frontend dashboard index.html"""
    return send_from_directory('.', 'index.html')


@app.route('/api/traffic', methods=['GET'])
def get_traffic():
    """
    GET /api/traffic
    Generates simulated network traffic data and returns JSON response.
    Optional query parameters:
      - preset: 'low' | 'medium' | 'high' | 'random'
      - value: explicit numerical value in Mbps
    """
    preset = request.args.get('preset', '').lower()
    custom_val = request.args.get('value', type=int)

    # 1. Traffic Value Generation Logic
    if custom_val is not None:
        traffic = max(0, min(MAX_CAPACITY_MBPS, custom_val))
    elif preset == 'low':
        traffic = random.randint(80, 280)
    elif preset == 'medium':
        traffic = random.randint(400, 650)
    elif preset == 'high':
        traffic = random.randint(780, 980)
    else:
        traffic = random.randint(50, 950)

    # 2. Threshold Classification & Capacity Calculation
    status = classify_traffic_status(traffic)
    capacity = round((traffic / MAX_CAPACITY_MBPS) * 100)
    latency, packet_loss = calculate_network_metrics(traffic, status)
    timestamp = datetime.datetime.now().strftime("%I:%M:%S %p")

    # 3. Construct JSON Payload
    response_data = {
        "traffic": traffic,
        "status": status,
        "capacity": capacity,
        "latency": latency,
        "packet_loss": packet_loss,
        "max_capacity": MAX_CAPACITY_MBPS,
        "timestamp": timestamp
    }

    return jsonify(response_data)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=========================================================")
    print(" Virtual Lab Network Traffic Light Backend Starting...")
    print(f" Access Dashboard at: http://127.0.0.1:{port}")
    print(f" API Endpoint: http://127.0.0.1:{port}/api/traffic")
    print("=========================================================")
    app.run(host='0.0.0.0', port=port, debug=True)