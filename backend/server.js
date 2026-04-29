require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const setupWebSocket = require('./sockets/wsHandler');
const telemetryRoutes = require('./routes/telemetryRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/get', (req, res) => {
    res.send("Server is running.");
});
app.use('/api', telemetryRoutes);

const server = http.createServer(app);
setupWebSocket(server);

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8000;

const start = async () => {
    await connectDB();
    server.listen(PORT, HOST, () => {
        console.log(`Server running at http://${HOST}:${PORT}`);
        console.log(`WebSocket at ws://${HOST}:${PORT}/ws`);
    });
};

start();