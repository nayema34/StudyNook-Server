const mongoose = require('mongoose');
const dns = require('dns');

// Ensure DNS SRV lookup uses public DNS servers if system DNS refuses SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (err) {
  console.warn('DNS server configuration warning:', err.message);
}

const DEFAULT_URI = 'mongodb+srv://jannatnayema2_db_user:nayema123@nayema.wjzjamd.mongodb.net/?appName=Nayema';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'StudyNook',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
  }
};

module.exports = connectDB;
