import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// CORS - allows Cloudflare Pages (or any origin) to call this server
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files
app.use(express.static(__dirname));

// Simulated WiFi data (replace with real system calls)
function getWifiStatus() {
    const signals = [45, 52, 58, 65, 72, 78, 82, 88, 85, 79];
    const signal = signals[Math.floor(Math.random() * signals.length)];
    
    return {
        connected: true,
        ssid: 'MyNetwork',
        state: 'Connected',
        signal: String(signal),
        channel: '6',
        receiveRate: (Math.random() * 100 + 50).toFixed(1) + ' Mbps',
        transmitRate: (Math.random() * 100 + 50).toFixed(1) + ' Mbps',
        radioType: '802.11ac'
    };
}

function getClients() {
    const baseIps = ['192.168.1'];
    const deviceNames = ['Laptop', 'Phone', 'Tablet', 'Desktop', 'SmartTV', 'Camera', 'Printer'];
    const sources = ['WiFi', 'Ethernet', 'WiFi'];
    
    // Simulate 3-7 connected devices
    const count = Math.floor(Math.random() * 5) + 3;
    const clients = [];
    
    for (let i = 0; i < count; i++) {
        clients.push({
            ip: `192.168.1.${100 + i}`,
            mac: `AA:BB:CC:DD:EE:${String(i).padStart(2, '0')}`,
            source: sources[Math.floor(Math.random() * sources.length)]
        });
    }
    
    return { clients };
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send initial data
    ws.send(JSON.stringify({
        type: 'wifi',
        data: getWifiStatus()
    }));

    ws.send(JSON.stringify({
        type: 'clients',
        data: getClients()
    }));

    // Send updates every second
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
                type: 'wifi',
                data: getWifiStatus()
            }));

            ws.send(JSON.stringify({
                type: 'clients',
                data: getClients()
            }));
        }
    }, 1000);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Fallback API endpoints for non-WebSocket clients
app.get('/api/wifi', (req, res) => {
    res.json(getWifiStatus());
});

app.get('/api/clients', (req, res) => {
    res.json(getClients());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
