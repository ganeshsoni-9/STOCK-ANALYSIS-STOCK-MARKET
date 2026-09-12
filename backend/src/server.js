require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const marketRoutes = require('./routes/marketRoutes');
const stockRoutes = require('./routes/stockRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const alertRoutes = require('./routes/alertRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { initMarketSocket } = require('./sockets/marketSocket');

const app = express();
const server = http.createServer(app);

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

// Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});
initMarketSocket(io);

// REST API Routes
app.use('/api/market', marketRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/system', systemRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'TradeSense AI — Indian Intraday Market Scanner Backend',
    version: '1.0.0',
    mode: process.env.MARKET_DATA_MODE || 'mock',
    status: 'ACTIVE'
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[ServerError]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database Connection with Fallback
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tradesense_ai';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[MongoDB] Connected successfully to database'))
  .catch((err) => {
    console.warn('[MongoDB Warning] Could not connect to local MongoDB. Operating in memory/mock fallback mode.', err.message);
  });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TradeSense AI Server running on http://localhost:${PORT}`);
  console.log(`📊 Market Data Mode: ${process.env.MARKET_DATA_MODE || 'mock'}`);
  console.log(`=======================================================`);
});
