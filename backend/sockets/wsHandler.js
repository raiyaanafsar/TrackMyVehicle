const WebSocket = require('ws');
const Telemetry = require('../models/Telemetry');

let lastNormalSaveTime = 0;
const NORMAL_SAVE_INTERVAL = 10000;

let simActive = false;
let simType = 'stationary';

// IIT Roorkee Starting Coordinates
let currentLat = 29.8649;
let currentLon = 77.8966;

let currentHeading = 45; 
let targetSpeed = 30;    
let currentSpeed = 0;    

const broadcastAnalytics = async (wss) => {
    try {
        const eventCounts = await Telemetry.aggregate([{ $group: { _id: "$event", count: { $sum: 1 } } }]);
        const speedAgg = await Telemetry.aggregate([{ $group: { _id: null, avgSpeed: { $avg: "$speed" } } }]);
        
        const formattedCounts = eventCounts.reduce((acc, curr) => {
            acc[curr._id || 'unknown'] = curr.count;
            return acc;
        }, {});

        const analyticsPayload = {
            messageType: 'analytics',
            events: formattedCounts,
            avgSpeed: speedAgg[0]?.avgSpeed ? Math.round(speedAgg[0].avgSpeed) : 0
        };

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(analyticsPayload));
            }
        });
    } catch (err) {
        console.error("Error broadcasting analytics:", err);
    }
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server, path: "/ws" });

    wss.on('connection', (ws) => {
        console.log("WebSocket client connected");
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message.toString());

                if (data.type === 'simulation_control') {
                    simActive = data.active;
                    simType = data.simMode;
                    return; 
                }

                if (simActive) {
                    if (simType === 'moving') {
                        targetSpeed = Math.max(20, Math.min(50, targetSpeed + (Math.random() - 0.5) * 5));
                        currentSpeed += (targetSpeed - currentSpeed) * 0.1;
                        data.speed = Math.round(currentSpeed);

                        const turnAngle = (Math.random() - 0.5) * 12; 
                        currentHeading = (currentHeading + turnAngle) % 360;

                        const distanceMeters = currentSpeed / 3.6;
                        const headingRad = currentHeading * (Math.PI / 180);
                        const latChange = (distanceMeters * Math.cos(headingRad)) / 111320;
                        const lonChange = (distanceMeters * Math.sin(headingRad)) / (111320 * Math.cos(currentLat * Math.PI / 180));

                        currentLat += latChange;
                        currentLon += lonChange;

                    } else {
                        currentSpeed += (0 - currentSpeed) * 0.2;
                        data.speed = Math.round(currentSpeed);
                    }
                    
                    data.lat = currentLat;
                    data.lon = currentLon;
                }

                const logEntry = { time: new Date(), ...data };
                
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(logEntry));
                    }
                });

                const isCriticalEvent = data.event && data.event !== 'normal';
                const now = Date.now();

                if (isCriticalEvent || (now - lastNormalSaveTime > NORMAL_SAVE_INTERVAL)) {
                    const newRecord = new Telemetry(logEntry);
                    await newRecord.save();
                    
                    if (!isCriticalEvent) {
                        lastNormalSaveTime = now;
                    }
                    await broadcastAnalytics(wss);
                }

            } catch (e) {
                console.log("Invalid JSON or DB Error:", e.message);
            }
        });

        ws.on('close', () => console.log("WebSocket client disconnected"));
        ws.send(JSON.stringify({ status: "connected" }));
    });

    return wss;
};

module.exports = setupWebSocket;