require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const verifyEnv = require('./lib/env-check');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Verify required env vars
verifyEnv();

// Connect to Database
connectDB();

// Middleware
app.use(requestLogger);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Define Routes
const { handleAuthRequest } = require('./lib/auth');
app.use('/api/auth', handleAuthRequest);
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));

// Base & Health Routes
app.get('/', (req, res) => {
  res.send('StudyNook API is running...');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
