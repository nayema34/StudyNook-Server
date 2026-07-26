const { connectDB } = require('../config/db');

let authInstance = null;
let nodeHandler = null;

const getAuth = async () => {
  const { db } = await connectDB();

  if (authInstance) return authInstance;

  const { betterAuth } = await import('better-auth');
  const { mongodbAdapter } = await import('better-auth/adapters/mongodb');

  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const serverBaseUrl = process.env.BETTER_AUTH_URL || (isProd ? 'https://study-nook-server-silk.vercel.app' : 'http://localhost:5000');

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'supersecretbetterauthkey1234567890123456',
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
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
      },
    },
    account: {
      storeStateStrategy: 'database',
    },
  });

  return authInstance;
};

const handleAuthRequest = async (req, res) => {
  try {
    const auth = await getAuth();
    const { toNodeHandler } = await import('better-auth/node');
    return await toNodeHandler(auth)(req, res);
  } catch (err) {
    console.error('Better-Auth handling error:', err);
    return res.status(500).json({
      message: err.message || 'Internal Auth Error',
      error: String(err),
      stack: err.stack,
    });
  }
};

module.exports = { getAuth, handleAuthRequest };
