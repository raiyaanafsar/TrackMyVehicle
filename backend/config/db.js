const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB Database');

        if (process.env.CLEAR_DB_ON_START === 'true') {
            await mongoose.connection.collection('telemetries').deleteMany({});
            console.log('CLEAR_DB_ON_START is true: Old database records have been deleted.');
        } else {
            console.log('CLEAR_DB_ON_START is false: Old data retained.');
        }

    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;