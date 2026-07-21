require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('../models/Room');
const connectDB = require('../config/db');

const sampleRooms = [
  {
    name: 'Quiet Focus Pod A',
    description: 'Soundproof single-person study pod equipped with high-speed Wi-Fi, ergonomic seating, and multi-angle LED lighting.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    floor: '2nd Floor',
    capacity: 1,
    hourlyRate: 15,
    amenities: ['Wi-Fi', 'Power Outlets', 'Ergonomic Chair', 'AC'],
    rating: 4.9,
  },
  {
    name: 'Collaborative Lab 2',
    description: 'Spacious study nook for team discussions, complete with digital whiteboard, presentation display, and coffee station.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    floor: '3rd Floor',
    capacity: 6,
    hourlyRate: 40,
    amenities: ['Wi-Fi', 'Whiteboard', 'Monitor', 'AC', 'Coffee Machine'],
    rating: 4.8,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Database connected for seeding...');
    console.log(`Sample rooms defined: ${sampleRooms.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = sampleRooms;
