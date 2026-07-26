const { MongoClient } = require('mongodb');
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

let client = null;
let db = null;

const connectDB = async () => {
  if (db && client) {
    return { db, client };
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('StudyNook');
  console.log('Native MongoDB Connected successfully to StudyNook DB');
  return { db, client };
};

const getDB = () => db;
const getClient = () => client;

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.getDB = getDB;
module.exports.getClient = getClient;
