/**
 * ============================================================================
 * VIRTUAL LAB: NETWORK TRAFFIC LIGHT (PRODUCT NO. 33)
 * Modern JavaScript Frontend connected to Flask Backend API (/api/traffic)
 * Designed for 2nd Year BTech CSE Project Demonstration
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. Application State & Configuration Variables
// ----------------------------------------------------------------------------
const CONFIG = {
    MAX_CAPACITY_MBPS: 1000,   // Maximum network bandwidth limit (1000 Mbps = 1 Gbps)
    GREEN_THRESHOLD: 350,      // Upper limit for LOW traffic (0 - 350 Mbps = 0-35%)
    YELLOW_THRESHOLD: 700,     // Upper limit for MEDIUM traffic (351 - 700 Mbps = 36-70%)
    MAX_CHART_POINTS: 15,      // Maximum data points shown on real-time graph
    AUTO_SIM_INTERVAL_MS: 2000, // Auto-simulation timer interval (2 seconds)
    
    // API Server Configuration
    // Automatically selects backend origin or defaults to http://127.0.0.1:5000
    API_BASE_URL: window.location.protocol.startsWith('http') && window.location.port === '5000'
        ? '/api/traffic'
        : 'http://127.0.0.1:5000/api/traffic'
};

// Application State Object
const state = {
    currentTraffic: 180,       // Current traffic value in Mbps
    currentStatus: 'LOW',       // Current status: 'LOW', 'MEDIUM', or 'HIGH'
    history: [],               // History log entries array
    autoSimInterval: null,     // Interval ID for auto-simulation loop
    isAutoSimActive: false,    // Boolean flag for auto-simulation mode
    soundEnabled: false,       // Audio alert toggle flag
    chartInstance: null        // Reference to Chart.js instance
};

// ----------------------------------------------------------------------------
// 2. DOM Elements Cache
// ----------------------------------------------------------------------------
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM references for optimal performance
    elements = {
        // Traffic Light Lamps
        lampGreen: document.getElementById('lamp-green'),
        lampYellow: document.getElementById('lamp-yellow'),
        lampRed: document.getElementById('lamp-red'),

        // Numerical Metrics Display
        currentTrafficVal: document.getElementById('current-traffic-val'),
        capacityBar: document.getElementById('capacity-bar'),
        trafficPercentText: document.getElementById('traffic-percent-text'),
        lastUpdatedTime: document.getElementById('last-updated-time'),
        trafficStatusBadge: document.getElementById('traffic-status-badge'),
        liveStatusText: document.getElementById('live-status-text'),

        // Control Buttons & Inputs
        simulateBtn: document.getElementById('simulate-btn'),
        autoSimToggle: document.getElementById('auto-sim-toggle'),
        soundToggleBtn: document.getElementById('sound-toggle-btn'),
        soundIcon: document.getElementById('sound-icon'),
        presetButtons: document.querySelectorAll('[data-preset]'),

        // Summary Metric Cards
        metricLoadPercent: document.getElementById('metric-load-percent'),
        metricLoadStatus: document.getElementById('metric-load-status'),
        metricAvgVal: document.getElementById('metric-avg-val'),
        metricLatency: document.getElementById('metric-latency'),
        metricLatencyStatus: document.getElementById('metric-latency-status'),
        metricPacketLoss: document.getElementById('metric-packet-loss'),
        metricLossStatus: document.getElementById('metric-loss-status'),

        // History Table Elements
        historyTableBody: document.getElementById('history-table-body'),
        historyCountText: document.getElementById('history-count'),
        historyFilter: document.getElementById('history-filter'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),

        // Modal Elements
        openInfoModalBtn: document.getElementById('open-info-modal-btn'),
        closeInfoModalBtn: document.getElementById('close-info-modal-btn'),
        closeInfoModalFooterBtn: document.getElementById('close-info-modal-footer-btn'),
        infoModal: document.getElementById('info-modal')
    };

    // Initialize Chart & App Logic
    initChart();
    attachEventListeners();
    
    // Initial Traffic Load via Backend API
    fetchTrafficFromAPI('', 'Initial System Check');
});

// ----------------------------------------------------------------------------
// 3. API Communication & Data Pipeline (Flask Backend Fetch)
// ----------------------------------------------------------------------------

/**
 * Fetches simulated traffic data from Flask backend API endpoint (/api/traffic).
 * @param {string} presetParam - Optional preset parameter ('low', 'medium', 'high', 'random').
 * @param {string} triggerSource - Source description for history log.
 */
async function fetchTrafficFromAPI(presetParam = '', triggerSource = 'Backend API') {
    try {
        let url = CONFIG.API_BASE_URL;
        if (presetParam) {
            url += `?preset=${encodeURIComponent(presetParam)}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const apiData = await response.json();
        
        // Extract parameters returned by Flask API
        // JSON format: { traffic, status, capacity, latency, packet_loss, timestamp }
        const mbps = apiData.traffic;
        const status = apiData.status;
        const capacity = apiData.capacity;
        const latency = apiData.latency || 15;
        const packetLoss = apiData.packet_loss !== undefined ? apiData.packet_loss : 0.0;
        const timestamp = apiData.timestamp || new Date().toLocaleTimeString();

        // Update Dashboard with API Response Data
        updateDashboardUI(mbps, status, capacity, latency, packetLoss, timestamp, triggerSource);

    } catch (error) {
        console.warn('Backend API fetch failed, falling back to client-side simulation:', error.message);
        
        // Fallback Client Simulation if Flask backend is offline
        let fallbackVal = Math.floor(Math.random() * 900) + 50;
        if (presetParam === 'low') fallbackVal = Math.floor(Math.random() * 200) + 80;
        if (presetParam === 'medium') fallbackVal = Math.floor(Math.random() * 250) + 400;
        if (presetParam === 'high') fallbackVal = Math.floor(Math.random() * 200) + 780;

        const fallbackStatus = fallbackVal <= 350 ? 'LOW' : fallbackVal <= 700 ? 'MEDIUM' : 'HIGH';
        const fallbackCapacity = Math.round((fallbackVal / 1000) * 100);
        const timestamp = new Date().toLocaleTimeString();

        updateDashboardUI(fallbackVal, fallbackStatus, fallbackCapacity, 20, 0.0, timestamp, `${triggerSource} (Offline Fallback)`);
    }
}

// ----------------------------------------------------------------------------
// 4. UI Update & Render Pipeline
// ----------------------------------------------------------------------------

/**
 * Updates all visual components on the dashboard using verified traffic metrics.
 */
function updateDashboardUI(mbps, status, percentLoad, latency, packetLoss, timestamp, triggerSource) {
    // 1. Update State
    state.currentTraffic = mbps;
    state.currentStatus = status;

    // 2. Update Virtual Traffic Light Glowing Lamps
    updateVirtualTrafficLight(status);

    // 3. Update Numerical Display & Badges
    elements.currentTrafficVal.textContent = mbps;
    elements.capacityBar.style.width = `${percentLoad}%`;
    elements.trafficPercentText.textContent = `${percentLoad}% Capacity`;
    elements.lastUpdatedTime.textContent = timestamp;

    // Update Status Badge
    elements.trafficStatusBadge.textContent = status;
    elements.trafficStatusBadge.className = `badge status-${status.toLowerCase()}`;
    elements.liveStatusText.textContent = `API Live (${status})`;

    // 4. Update Summary Metrics Cards
    elements.metricLoadPercent.textContent = `${percentLoad}%`;
    elements.metricLoadStatus.textContent = 
        status === 'LOW' ? 'Normal bandwidth' :
        status === 'MEDIUM' ? 'Moderate queuing' : 'Critical congestion';

    elements.metricLatency.textContent = `${latency} ms`;
    elements.metricLatencyStatus.textContent = 
        latency < 30 ? 'Low delay' :
        latency < 70 ? 'Moderate delay' : 'High queue delay';

    elements.metricPacketLoss.textContent = `${packetLoss}%`;
    elements.metricLossStatus.textContent = 
        packetLoss === 0 ? 'Optimal delivery' :
        packetLoss < 1.0 ? 'Minor buffer drops' : 'Heavy packet drop';

    // Calculate & Display Session Average
    const historyData = state.history;
    const totalMbps = historyData.reduce((sum, item) => sum + item.mbps, 0) + mbps;
    const avgMbps = Math.round(totalMbps / (historyData.length + 1));
    elements.metricAvgVal.textContent = `${avgMbps} Mbps`;

    // 5. Sound Alert on High Traffic (If Audio Enabled)
    if (status === 'HIGH' && state.soundEnabled) {
        playBeepSound();
    }

    // 6. Record to History State
    const historyItem = {
        id: state.history.length + 1,
        timestamp: timestamp,
        mbps: mbps,
        percentLoad: percentLoad,
        status: status,
        latency: latency,
        packetLoss: packetLoss,
        triggerSource: triggerSource
    };
    state.history.unshift(historyItem); // Insert at beginning of list

    // 7. Re-render Table & Update Real-Time Chart
    renderHistoryTable();
    updateChart(timestamp, mbps, status);
}

/**
 * Updates the glowing state of the virtual traffic light lamps.
 * @param {string} activeStatus - 'LOW' (Green), 'MEDIUM' (Yellow), or 'HIGH' (Red).
 */
function updateVirtualTrafficLight(activeStatus) {
    // Remove active glowing class from all lamps
    elements.lampRed.classList.remove('active');
    elements.lampYellow.classList.remove('active');
    elements.lampGreen.classList.remove('active');

    // Illuminate corresponding lamp based on status
    if (activeStatus === 'HIGH') {
        elements.lampRed.classList.add('active');
    } else if (activeStatus === 'MEDIUM') {
        elements.lampYellow.classList.add('active');
    } else { // LOW
        elements.lampGreen.classList.add('active');
    }
}

// ----------------------------------------------------------------------------
// 5. Real-Time Chart.js Initialization & Rendering
// ----------------------------------------------------------------------------

function initChart() {
    const ctx = document.getElementById('trafficChart').getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Network Traffic (Mbps)',
                data: [],
                borderColor: '#6366F1',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#6366F1',
                pointRadius: 4,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F9FAFB',
                    bodyColor: '#9CA3AF',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const status = val <= 350 ? 'LOW' : val <= 700 ? 'MEDIUM' : 'HIGH';
                            return ` Traffic: ${val} Mbps (${status})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9CA3AF', font: { family: 'JetBrains Mono', size: 10 } }
                },
                y: {
                    min: 0,
                    max: 1000,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#9CA3AF',
                        font: { family: 'JetBrains Mono', size: 10 },
                        stepSize: 200,
                        callback: function(value) { return value + ' Mbps'; }
                    }
                }
            }
        }
    });
}

function updateChart(label, value, status) {
    if (!state.chartInstance) return;

    const chart = state.chartInstance;
    
    if (chart.data.labels.length >= CONFIG.MAX_CHART_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    const pointColors = chart.data.datasets[0].data.map(val => {
        if (val <= CONFIG.GREEN_THRESHOLD) return '#10B981';
        if (val <= CONFIG.YELLOW_THRESHOLD) return '#F59E0B';
        return '#EF4444';
    });

    chart.data.datasets[0].pointBorderColor = pointColors;
    chart.update();
}

// ----------------------------------------------------------------------------
// 6. Traffic History Table Rendering & Filtering Logic
// ----------------------------------------------------------------------------

function renderHistoryTable() {
    const tbody = elements.historyTableBody;
    const filterValue = elements.historyFilter.value;
    tbody.innerHTML = '';

    const filteredHistory = state.history.filter(item => {
        if (filterValue === 'all') return true;
        return item.status === filterValue;
    });

    elements.historyCountText.textContent = filteredHistory.length;

    if (filteredHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
                    No traffic log records found.
                </td>
            </tr>
        `;
        return;
    }

    filteredHistory.forEach((item, index) => {
        const row = document.createElement('tr');
        const badgeClass = item.status === 'LOW' ? 'badge-low' :
                           item.status === 'MEDIUM' ? 'badge-medium' : 'badge-high';

        row.innerHTML = `
            <td style="font-family: var(--font-mono); color: var(--text-muted);">${state.history.length - index}</td>
            <td style="font-family: var(--font-mono);">${item.timestamp}</td>
            <td style="font-family: var(--font-mono); font-weight: 700;">${item.mbps} Mbps</td>
            <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-family: var(--font-mono); font-size: 0.8rem;">${item.percentLoad}%</span>
                </div>
            </td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td style="font-family: var(--font-mono);">${item.latency} ms</td>
            <td style="font-family: var(--font-mono);">${item.packetLoss}%</td>
            <td style="color: var(--text-secondary); font-size: 0.8rem;">${item.triggerSource}</td>
        `;
        tbody.appendChild(row);
    });
}

// ----------------------------------------------------------------------------
// 7. Event Listeners & Interactive Controls Setup
// ----------------------------------------------------------------------------

function attachEventListeners() {
    // 1. "Simulate Traffic" Button Click -> Fetches data from Flask API
    elements.simulateBtn.addEventListener('click', () => {
        fetchTrafficFromAPI('random', 'API Simulation Button');
    });

    // 2. Auto Simulation Toggle Switch -> Periodic fetch from Flask API
    elements.autoSimToggle.addEventListener('change', (e) => {
        state.isAutoSimActive = e.target.checked;

        if (state.isAutoSimActive) {
            state.autoSimInterval = setInterval(() => {
                fetchTrafficFromAPI('random', 'Auto Stream (API)');
            }, CONFIG.AUTO_SIM_INTERVAL_MS);
        } else {
            clearInterval(state.autoSimInterval);
            state.autoSimInterval = null;
        }
    });

    // 3. Preset Buttons Click Handlers -> Fetches specific scenario from Flask API
    elements.presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const presetType = button.getAttribute('data-preset');
            fetchTrafficFromAPI(presetType, `API Preset: ${presetType.toUpperCase()}`);
        });
    });

    // 4. Sound Alert Toggle Button
    elements.soundToggleBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        if (state.soundEnabled) {
            elements.soundIcon.className = 'fa-solid fa-volume-high';
            elements.soundToggleBtn.style.color = 'var(--primary-indigo)';
            elements.soundToggleBtn.title = 'Audio Alert Enabled';
            playBeepSound();
        } else {
            elements.soundIcon.className = 'fa-solid fa-volume-xmark';
            elements.soundToggleBtn.style.color = 'var(--text-secondary)';
            elements.soundToggleBtn.title = 'Audio Alert Disabled';
        }
    });

    // 5. History Filtering & Clearing
    elements.historyFilter.addEventListener('change', renderHistoryTable);

    elements.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the traffic history log?')) {
            state.history = [];
            renderHistoryTable();
        }
    });

    // 6. CSV Export Functionality
    elements.exportCsvBtn.addEventListener('click', exportHistoryToCSV);

    // 7. Academic Overview Modal Handlers
    elements.openInfoModalBtn.addEventListener('click', () => {
        elements.infoModal.classList.add('active');
    });

    const closeModal = () => { elements.infoModal.classList.remove('active'); };
    elements.closeInfoModalBtn.addEventListener('click', closeModal);
    elements.closeInfoModalFooterBtn.addEventListener('click', closeModal);
    elements.infoModal.addEventListener('click', (e) => {
        if (e.target === elements.infoModal) closeModal();
    });

    // 8. Keyboard Shortcuts (Space bar to simulate via API)
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            fetchTrafficFromAPI('random', 'Keyboard Shortcut (API)');
        }
    });
}

// ----------------------------------------------------------------------------
// 8. Utilities & Export Functions
// ----------------------------------------------------------------------------

function playBeepSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.log('Audio playback prevented or unsupported');
    }
}

function exportHistoryToCSV() {
    if (state.history.length === 0) {
        alert('No history records available to export.');
        return;
    }

    const headers = ['ID', 'Timestamp', 'Traffic_Mbps', 'Capacity_Percent', 'Status', 'Latency_ms', 'PacketLoss_Percent', 'TriggerSource'];
    const csvRows = [headers.join(',')];

    state.history.forEach(item => {
        const row = [
            item.id,
            `"${item.timestamp}"`,
            item.mbps,
            item.percentLoad,
            item.status,
            item.latency,
            item.packetLoss,
            `"${item.triggerSource}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Network_Traffic_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}