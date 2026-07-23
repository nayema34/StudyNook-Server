const mongoose = require('mongoose');
const connectDB = require('../config/db');

let authInstance = null;

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
      return res.status(400).json({
        error: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in Vercel Environment Variables.'
      });
    }

    const auth = await getAuth();

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const fullUrl = `${protocol}://${host}${req.originalUrl || req.url}`;

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else if (value !== undefined) {
        headers.set(key, value);
      }
    });

    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (typeof req.body === 'object' && req.body !== null) {
        body = JSON.stringify(req.body);
      } else if (typeof req.body === 'string') {
        body = req.body;
      } else {
        body = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', (chunk) => { data += chunk; });
          req.on('end', () => resolve(data));
          req.on('error', reject);
        });
      }
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    const webResponse = await auth.handler(webRequest);

    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseText = await webResponse.text();
    return res.send(responseText);
  } catch (err) {
    console.error('Better-Auth request handling error:', err);
    return res.status(500).json({ message: err.message || 'Internal Auth Error', error: String(err), stack: err.stack });
  }
};

module.exports = { getAuth, handleAuthRequest };
