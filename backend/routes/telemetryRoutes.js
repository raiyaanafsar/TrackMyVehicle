const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');

router.get('/history', async (req, res) => {
    try {
        const history = await Telemetry.find().sort({ time: -1 }).limit(50);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch telemetry history' });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;
        const filter = req.query.filter;

        let query = {};
        
        if (filter === 'anomalies') {
            query = { event: { $ne: 'normal' } };
        }

        const logs = await Telemetry.find(query)
            .sort({ time: -1 })
            .skip(skip)
            .limit(limit);

        const totalLogs = await Telemetry.countDocuments(query);

        res.json({
            logs,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs
        });
    } catch (err) {
        console.error('Error fetching paginated logs:', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const eventCounts = await Telemetry.aggregate([
            { $group: { _id: "$event", count: { $sum: 1 } } }
        ]);

        const speedAgg = await Telemetry.aggregate([
            { $group: { _id: null, avgSpeed: { $avg: "$speed" } } }
        ]);

        const formattedCounts = eventCounts.reduce((acc, curr) => {
            acc[curr._id || 'unknown'] = curr.count;
            return acc;
        }, {});

        res.json({
            events: formattedCounts,
            avgSpeed: speedAgg[0]?.avgSpeed ? Math.round(speedAgg[0].avgSpeed) : 0
        });
    } catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router;