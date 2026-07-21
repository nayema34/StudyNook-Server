const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  floor: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  amenities: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 4.8,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Room', RoomSchema);
