// ===== CONFIGURATION =====
// IMPORTANT: Palitan mo ito ng actual server URL mo
// 
// Option 1: Railway (Recommended - 24/7 running)
//   const SERVER_URL = 'https://your-app-randomname.railway.app';
//
// Option 2: Cloudflare Tunnel (Laptop tunnel - need laptop running)
//   const SERVER_URL = 'https://brave-horse-123.trycloudflare.com';
//
// Option 3: Local development (empty string - uses same host as page)
//   const SERVER_URL = '';
//
// WALANG TRAILING SLASH!
const SERVER_URL = 'https://wifif.up.railway.app'; // <-- ILAGAY DITO ANG SERVER URL MO

// ===== DOM Elements =====
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.page-section');
const connectionText = document.getElementById('connection-text');
const statusDot = document.getElementById('status-dot');

// ===== Real-time Data Storage =====
let currentWifiData = null;
let currentClients = [];
let signalHistory = [];

// ===== WebSocket Connection =====
function initWebSocket() {
    let wsUrl;

    if (SERVER_URL) {
        // Gamitin ang custom server URL (Cloudflare Tunnel, Railway, etc.)
        // Convert https:// -> wss:// and http:// -> ws://
        wsUrl = SERVER_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    } else {
        // Default: gamitin ang parehong host/port kung saan naka-open ang page
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}`;
    }

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        updateConnectionStatus(true);
    });

    ws.addEventListener('message', (event) => {
        try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'wifi') {
                currentWifiData = message.data;
                updateWifiDisplay(message.data);
                recordSignal(message.data.signal);
            } else if (message.type === 'clients') {
                currentClients = message.data.clients || [];
                updateClientsDisplay(message.data.clients);
            }
            
            // Update analytics with latest data
            updateAnalytics(currentWifiData, currentClients);
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    });

    ws.addEventListener('close', () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(initWebSocket, 3000);
    });

    ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    });

    return ws;
}

// ===== Connection Status =====
function updateConnectionStatus(connected) {
    if (connected) {
        statusDot.style.backgroundColor = '#10b981';
        connectionText.textContent = 'Connected';
    } else {
        statusDot.style.backgroundColor = '#ef4444';
        connectionText.textContent = 'Disconnected';
    }
}

// ===== Data Recording =====
function recordSignal(signal) {
    if (!signal) return;
    
    const value = parseInt(signal, 10);
    if (!isNaN(value)) {
        signalHistory.push({
            value,
            timestamp: new Date()
        });
        
        // Keep only last 60 readings
        if (signalHistory.length > 60) {
            signalHistory.shift();
        }
    }
}

// ===== Display Updates =====
function updateText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function parseSignalQuality(signal) {
    if (!signal) return 'Unknown';
    const value = parseInt(signal, 10);
    if (Number.isNaN(value)) return signal;
    if (value >= 85) return 'Excellent';
    if (value >= 65) return 'Good';
    if (value >= 45) return 'Fair';
    return 'Weak';
}

function updateWifiDisplay(data) {
    if (!data.connected) {
        updateText('wifi-status', 'Disconnected');
        updateText('signal-value', 'N/A');
        updateText('status-value', 'Disconnected');
        updateText('channel-value', 'N/A');
        updateText('receive-rate-value', 'N/A');
        updateText('transmit-rate-value', 'N/A');
        updateText('radio-type-value', 'N/A');
        updateText('health-summary', 'Not connected to Wi-Fi.');
        updateText('summary-network', 'Disconnected');
        updateText('summary-signal', 'N/A');
        return;
    }

    updateText('wifi-status', `${data.ssid} • ${data.state}`);
    updateText('signal-value', data.signal ? `${data.signal}%` : 'N/A');
    updateText('status-value', data.state || 'Connected');
    updateText('channel-value', data.channel || 'N/A');
    updateText('receive-rate-value', data.receiveRate || 'N/A');
    updateText('transmit-rate-value', data.transmitRate || 'N/A');
    updateText('radio-type-value', data.radioType || 'N/A');

    const quality = parseSignalQuality(data.signal);
    updateText('health-summary', `Signal quality is ${quality}. Last update: ${new Date().toLocaleTimeString()}`);
    updateText('summary-network', data.ssid || 'Unknown');
    updateText('summary-signal', data.signal ? `${data.signal}%` : 'N/A');
}

function updateClientsDisplay(clients) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (!clients || clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No devices discovered yet.</td></tr>';
        updateText('client-count-value', '0');
        updateText('device-count-value', '0');
        updateText('summary-clients', '0');
        return;
    }

    tbody.innerHTML = clients.map(client => {
        return `<tr><td>${client.ip}</td><td>${client.mac}</td><td>${client.source}</td></tr>`;
    }).join('');

    updateText('client-count-value', String(clients.length));
    updateText('device-count-value', String(clients.length));
    updateText('summary-clients', String(clients.length));
}

function updateAnalytics(wifi, clients) {
    const time = new Date().toLocaleTimeString();
    updateText('last-refresh-value', time);

    const quality = wifi && wifi.signal ? parseSignalQuality(wifi.signal) : 'Unknown';
    updateText('signal-quality-value', quality);

    const details = [];
    if (wifi) {
        details.push(`SSID: ${wifi.ssid || 'Unknown'}`);
        details.push(`Channel: ${wifi.channel || 'N/A'}`);
        details.push(`Rate: ${wifi.receiveRate || 'N/A'} / ${wifi.transmitRate || 'N/A'}`);
        details.push(`State: ${wifi.state || 'Disconnected'}`);
    }
    if (clients && clients.length > 0) {
        details.push(`Detected ${clients.length} device(s) on the local network.`);
    }
    updateText('analytics-detail', details.join(' • '));
    
    // Calculate signal trend
    if (signalHistory.length > 0) {
        const avgSignal = Math.round(
            signalHistory.reduce((sum, s) => sum + s.value, 0) / signalHistory.length
        );
        updateText('analytics-trend', `Average signal: ${avgSignal}% • Current: ${quality}`);
    } else {
        updateText('analytics-trend', `Latest signal quality: ${quality}.`);
    }
}

// ===== Navigation =====
function setActiveSection(sectionId) {
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        setActiveSection(item.dataset.section);
    });
});

// ===== Initialize =====
setActiveSection('dashboard');
initWebSocket();
