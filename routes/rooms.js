const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { connectDB } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/rooms
// @desc    Get all rooms with search, filter, and sorting
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { db } = await connectDB();
    const { search, amenities, floor, minRate, maxRate, limit } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (amenities) {
      const amenitiesList = Array.isArray(amenities) ? amenities : amenities.split(',');
      if (amenitiesList.length > 0) {
        query.amenities = { $in: amenitiesList };
      }
    }

    if (floor) {
      query.floor = floor;
    }

    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }

    let cursor = db.collection('rooms').find(query).sort({ createdAt: -1 });

    if (limit) {
      cursor = cursor.limit(Number(limit));
    }

    const rooms = await cursor.toArray();
    res.json(rooms);
  } catch (error) {
    console.error('Fetch rooms error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get specific room by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { db } = await connectDB();
    const roomIdStr = req.id || req.params.id;
    if (!ObjectId.isValid(roomIdStr)) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomIdStr) });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Fetch room by ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rooms
// @desc    Add a new room
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;

    if (!name || !description || !image || !floor || !capacity || !hourlyRate) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const newRoom = {
      name,
      description,
      image,
      floor,
      capacity: Number(capacity),
      hourlyRate: Number(hourlyRate),
      amenities: Array.isArray(amenities) ? amenities : [],
      ownerId: req.user.id,
      bookingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('rooms').insertOne(newRoom);
    const room = { _id: result.insertedId, ...newRoom };

    res.status(201).json({ message: 'Room added successfully', room });
  } catch (error) {
    console.error('Add room error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update an existing room (owner only)
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = await db.collection('rooms').findOne({ _id: new ObjectId(req.params.id) });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId !== req.user.id && room.ownerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this room.' });
    }

    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;
    const updatedData = {
      name: name || room.name,
      description: description || room.description,
      image: image || room.image,
      floor: floor || room.floor,
      capacity: capacity ? Number(capacity) : room.capacity,
      hourlyRate: hourlyRate ? Number(hourlyRate) : room.hourlyRate,
      amenities: Array.isArray(amenities) ? amenities : room.amenities,
      updatedAt: new Date(),
    };

    await db.collection('rooms').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );

    const updatedRoom = await db.collection('rooms').findOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (error) {
    console.error('Update room error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room (owner only)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = await db.collection('rooms').findOne({ _id: new ObjectId(req.params.id) });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId !== req.user.id && room.ownerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this room.' });
    }

    const bookings = await db.collection('bookings').find({ roomId: req.params.id }).toArray();
    const bookingIds = bookings.map((b) => b._id);

    if (bookingIds.length > 0) {
      await db.collection('user').updateMany(
        { bookings: { $in: bookingIds } },
        { $pull: { bookings: { $in: bookingIds } } }
      );
      await db.collection('bookings').deleteMany({ roomId: req.params.id });
    }

    await db.collection('rooms').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
