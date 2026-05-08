require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./shared/logger');

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
    'https://aleinia.com', 'https://www.aleinia.com',
    'http://localhost:3000', 'http://localhost:3001',
    'http://127.0.0.1:3000', 'http://127.0.0.1:3001'
];

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.use('/api/uploads', express.static(path.resolve(__dirname, 'uploads')));

const checkMaintenance = require('./middleware/checkMaintenance');
app.use('/api', checkMaintenance);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/tabs', require('./routes/tabs'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api', require('./routes/api'));

const { errorHandler } = require('./middleware/error');
app.use(errorHandler);

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API Endpoint not found' });
    }
    if (path.extname(req.path)) {
        return res.status(404).send('File not found');
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- DATABASE & START ---
const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        httpServer.listen(PORT, () => {
            console.log(`🚀 Aleinia Professional Server running on Port ${PORT}`);
        });

        const ChatMessage = require('./models/ChatMessage');
        io.on('connection', (socket) => {
            console.log('🔌 Client connected:', socket.id);
            socket.on('notify_update', (data) => socket.broadcast.emit('data_update', data));
            socket.on('join_chat', (adId) => socket.join(`chat_${adId}`));
            socket.on('leave_chat', (adId) => socket.leave(`chat_${adId}`));
            socket.on('send_message', async (data) => {
                try {
                    const msg = await ChatMessage.create({
                        adId: data.adId,
                        senderId: data.senderId,
                        senderName: data.senderName,
                        message: data.message
                    });
                    io.to(`chat_${data.adId}`).emit('receive_message', msg);
                } catch (e) {
                    console.error('Chat save error:', e);
                }
            });
        });
    } catch (err) {
        console.error('❌ Server Start Error:', err);
    }
};

startServer();
module.exports = app;
