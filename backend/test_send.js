const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('open', () => {
    console.log('Connected to backend WebSocket');

    const payload = {
        x: 0.12,
        y: -0.05,
        z: 1.01,
        lat: 29.8649,
        lon: 77.8966,
        speed: 35.5,
        event: 'normal'
    };

    ws.send(JSON.stringify(payload));
    console.log('Sent:', payload);

    // Send a critical event too so it saves immediately
    setTimeout(() => {
        const critical = { ...payload, speed: 60.0, event: 'rash_driving' };
        ws.send(JSON.stringify(critical));
        console.log('Sent:', critical);
    }, 1000);

    setTimeout(() => ws.close(), 2000);
});

ws.on('message', (data) => {
    console.log('Response from server:', JSON.parse(data.toString()));
});

ws.on('error', (err) => {
    console.error('Connection error:', err.message);
});

ws.on('close', () => {
    console.log('Done. Check your MongoDB Atlas → vehicle_tracker → telemetries collection.');
});
