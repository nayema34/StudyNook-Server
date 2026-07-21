const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb+srv://jannatnayema2_db_user:nayema123@nayema.wjzjamd.mongodb.net/?appName=Nayema';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'StudyNook',
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
