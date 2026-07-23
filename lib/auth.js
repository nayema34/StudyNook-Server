const mongoose = require('mongoose');
const connectDB = require('../config/db');

let authInstance = null;
let nodeHandler = null;

const getAuth = async () => {
  await connectDB();

  if (authInstance) return authInstance;

  const { betterAuth } = await import('better-auth');
  const { mongodbAdapter } = await import('better-auth/adapters/mongodb');

  const serverBaseUrl = process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000');

  authInstance = betterAuth({
    database: mongodbAdapter(mongoose.connection.db),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'supersecretbetterauthkey12345',
    baseURL: serverBaseUrl,
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://study-nook-client-flame.vercel.app',
      'https://study-nook-server-silk.vercel.app',
      ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
    ]
  });

  return authInstance;
};

const handleAuthRequest = async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        message: 'Google Client ID or Client Secret is missing in Vercel Environment Variables.'
      });
    }

    const auth = await getAuth();
    if (!nodeHandler) {
      const { toNodeHandler } = await import('better-auth/node');
      nodeHandler = toNodeHandler(auth);
    }
    return await nodeHandler(req, res);
  } catch (err) {
    console.error('Better-Auth request handling error:', err);
    return res.status(500).json({ message: err.message || 'Internal Auth Error', error: String(err) });
  }
};

module.exports = { getAuth, handleAuthRequest };
