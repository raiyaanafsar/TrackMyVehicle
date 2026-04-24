const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
    time: { type: Date, default: Date.now },
    lat: Number,
    lon: Number,
    x: Number,
    y: Number,
    z: Number,
    speed: Number,
    event: String
});

module.exports = mongoose.model('Telemetry', telemetrySchema);