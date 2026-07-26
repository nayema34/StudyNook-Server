const mongoose = require('mongoose');
const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { toNodeHandler } = require('better-auth/node');
const connectDB = require('../config/db');

let authInstance = null;

const getAuth = async () => {
  await connectDB();

  if (authInstance) return authInstance;

  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const serverBaseUrl = process.env.BETTER_AUTH_URL || (isProd ? 'https://study-nook-server-silk.vercel.app' : 'http://localhost:5000');

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
    ],
    advanced: {
      defaultCookieAttributes: {
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
      },
    },
    account: {
      storeStateStrategy: "database",
    },
  });

  return authInstance;
};

const handleAuthRequest = async (req, res) => {
  try {
    const auth = await getAuth();
    return toNodeHandler(auth)(req, res);
  } catch (err) {
    console.error('Better-Auth request handling error:', err);
    return res.status(500).json({ message: err.message || 'Internal Auth Error', error: String(err), stack: err.stack });
  }
};

module.exports = { getAuth, handleAuthRequest };

