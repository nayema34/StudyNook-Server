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
const allowedOrigins = [
  'http://localhost:3000',
  'https://study-nook-client-flame.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
// Define Auth Route before body parser using Express 5 route pattern
const { handleAuthRequest } = require('./lib/auth');
app.all('/api/auth/*splat', handleAuthRequest);

app.use(express.json());
app.use(cookieParser());

// Define Core API Routes
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));

// Debug Auth Route
app.get('/api/auth-debug', async (req, res) => {
  try {
    const { getAuth } = require('./lib/auth');
    const auth = await getAuth();
    res.json({
      status: 'OK',
      authInitialized: !!auth,
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      hasBetterAuthUrl: !!process.env.BETTER_AUTH_URL,
      vercelUrl: process.env.VERCEL_URL || null,
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      message: err.message,
      stack: err.stack,
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    });
  }
});

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

module.exports = app;
