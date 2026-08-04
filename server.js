require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

connectDB();
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://study-nook-client-flame.vercel.app',
  'https://study-nook-server-silk.vercel.app',
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

app.get('/api/auth-debug', async (req, res) => {
  try {
    const { getAuth } = require('./lib/auth');
    const auth = await getAuth();
    res.json({
      status: 'OK',
      authInitialized: !!auth,
      hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
      hasBetterAuthUrl: !!process.env.BETTER_AUTH_URL,
      vercelUrl: process.env.VERCEL_URL || null,
    });
  } catch (err) {
    res.status(200).json({
      status: 'ERROR',
      message: err.message,
      stack: err.stack,
    });
  }
});

const { handleAuthRequest } = require('./lib/auth');
app.use('/api/auth', handleAuthRequest);

app.use(express.json());
app.use(cookieParser());

app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));

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

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

module.exports = app;
