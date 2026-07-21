const verifyEnv = () => {
  const requiredEnvVars = ['MONGODB_URI'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
    console.warn('Falling back to default database configurations where applicable.');
  } else {
    console.log('[CONFIG] All required environment variables are set.');
  }
};

module.exports = verifyEnv;
