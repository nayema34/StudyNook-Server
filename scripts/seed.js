require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');
const connectDB = require('../config/db');

const sampleRooms = [
  {
    name: 'Quiet Focus Pod A',
    description: 'Soundproof single-person study pod equipped with ultra-fast Wi-Fi, ergonomic seating, multi-angle LED lighting, and noise isolation for deep concentration.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    floor: '2nd Floor',
    capacity: 1,
    hourlyRate: 12,
    amenities: ['High-Speed Wi-Fi', 'Power Outlets', 'Ergonomic Chair', 'Air Conditioning', 'Soundproofing'],
    rating: 4.9,
    isAvailable: true,
  },
  {
    name: 'Collaborative Lab 2',
    description: 'Spacious study nook for team discussions and group projects, complete with digital whiteboard, presentation display, and coffee station.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    floor: '3rd Floor',
    capacity: 6,
    hourlyRate: 35,
    amenities: ['High-Speed Wi-Fi', 'Interactive Whiteboard', '4K Presentation Display', 'Air Conditioning', 'Coffee Machine'],
    rating: 4.8,
    isAvailable: true,
  },
  {
    name: 'Executive Study Suite',
    description: 'Premium private study space featuring dual monitor setups, plush ergonomic chairs, soft ambient lighting, and complimentary refreshments.',
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    floor: '4th Floor',
    capacity: 4,
    hourlyRate: 28,
    amenities: ['High-Speed Wi-Fi', 'Dual Monitors', 'Ergonomic Lounge', 'Private AC', 'Snack Bar'],
    rating: 4.95,
    isAvailable: true,
  },
  {
    name: 'Innovators Workshop Lounge',
    description: 'Modern collaborative suite designed for larger study groups, workshops, and hackathons with movable desks and dual glass whiteboards.',
    image: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    floor: '1st Floor',
    capacity: 8,
    hourlyRate: 45,
    amenities: ['High-Speed Wi-Fi', 'Smart Projector', 'Glass Whiteboards', 'Standing Desks', 'Espresso Bar'],
    rating: 4.85,
    isAvailable: true,
  },
  {
    name: 'Zen Quiet Nook B',
    description: 'Serene pair study space filled with natural sunlight, minimalist timber furniture, and acoustic dampening for peaceful learning.',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    floor: '2nd Floor',
    capacity: 2,
    hourlyRate: 18,
    amenities: ['High-Speed Wi-Fi', 'Natural Sunlight', 'Ergonomic Seating', 'Acoustic Panels', 'Tea Bar'],
    rating: 4.9,
    isAvailable: true,
  },
  {
    name: 'Tech & Code Studio',
    description: 'High-tech study room equipped with ultrawide coding monitors, high-capacity USB-C power hubs, and high-speed fiber internet.',
    image: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=800&q=80',
    floor: '3rd Floor',
    capacity: 5,
    hourlyRate: 32,
    amenities: ['Fiber Wi-Fi', 'Ultrawide Monitors', 'High-Power USB-C', 'Ergonomic Chairs', 'Air Conditioning'],
    rating: 4.88,
    isAvailable: true,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Database connected for seeding...');

    let owner = await User.findOne();
    if (!owner) {
      owner = new User({
        name: 'StudyNook Admin',
        email: 'admin@studynook.com',
        password: '$2a$10$e7W5iXvK9Jk0N1WvGZ1e0e8QnZ8W8W8W8W8W8W8W8W8W8W8W8W8W8',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      });
      await owner.save();
      console.log('Created default admin owner user.');
    }

    const roomsToInsert = sampleRooms.map(room => ({
      ...room,
      ownerId: owner._id,
    }));

    await Room.deleteMany({});
    const createdRooms = await Room.insertMany(roomsToInsert);

    console.log(`Successfully seeded ${createdRooms.length} study rooms to MongoDB database!`);
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
