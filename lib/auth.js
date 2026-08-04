const { connectDB } = require('../config/db');

let authInstance = null;

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
        redirectURI: `${serverBaseUrl}/api/auth/callback/google`,
        disableStateCheck: true,
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
  });

  return authInstance;
};

const handleAuthRequest = async (req, res) => {
  try {
    const auth = await getAuth();
    const { toNodeHandler } = await import('better-auth/node');

    const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    const serverBaseUrl = process.env.BETTER_AUTH_URL || (isProd ? 'https://study-nook-server-silk.vercel.app' : 'http://localhost:5000');
    const clientUrl = process.env.CLIENT_URL || (isProd ? 'https://study-nook-client-flame.vercel.app' : 'http://localhost:3000');

    // Intercept redirect headers so post-login redirects go to client frontend URL
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name, value) {
      if (typeof name === 'string' && name.toLowerCase() === 'location' && typeof value === 'string') {
        const cleanValue = value.trim();
        if (
          cleanValue === '/' ||
          cleanValue === serverBaseUrl ||
          cleanValue === `${serverBaseUrl}/` ||
          cleanValue.startsWith(`${serverBaseUrl}/?`)
        ) {
          const queryString = cleanValue.includes('?') ? cleanValue.substring(cleanValue.indexOf('?')) : '';
          const targetUrl = `${clientUrl.replace(/\/$/, '')}/${queryString}`;
          return originalSetHeader('location', targetUrl);
        }
      }
      return originalSetHeader(name, value);
    };

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
