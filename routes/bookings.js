const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { connectDB } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Book a room (Private)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    const { roomId, date, startTime, endTime, specialNote } = req.body;

    if (!roomId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing booking details.' });
    }

    if (!ObjectId.isValid(roomId)) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const room = await db.collection('rooms').findOne({ _id: new ObjectId(roomId) });
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);

    if (endHour <= startHour) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const totalCost = (endHour - startHour) * room.hourlyRate;

    const conflict = await db.collection('bookings').findOne({
      roomId,
      date,
      status: 'confirmed',
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(400).json({
        message: 'Booking conflict! This room is already booked during the selected time slot.',
      });
    }

    const newBooking = {
      roomId,
      userId: req.user.id,
      date,
      startTime,
      endTime,
      totalCost,
      specialNote: specialNote || '',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(newBooking);
    const savedBooking = { _id: result.insertedId, ...newBooking };

    await db.collection('user').updateOne(
      { _id: req.user.id },
      { $push: { bookings: savedBooking._id } }
    );

    await db.collection('rooms').updateOne(
      { _id: new ObjectId(roomId) },
      { $inc: { bookingCount: 1 } }
    );

    res.status(201).json({
      message: 'Room booked successfully!',
      booking: savedBooking,
    });
  } catch (error) {
    console.error('Booking creation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/my
// @desc    Get bookings of the logged-in user (Private)
// @access  Private
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    const bookings = await db
      .collection('bookings')
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate room details for each booking
    const populatedBookings = await Promise.all(
      bookings.map(async (b) => {
        let room = null;
        if (b.roomId && ObjectId.isValid(b.roomId)) {
          room = await db.collection('rooms').findOne(
            { _id: new ObjectId(b.roomId) },
            { projection: { name: 1, image: 1, hourlyRate: 1, floor: 1 } }
          );
        }
        return {
          ...b,
          roomId: room || b.roomId,
        };
      })
    );

    res.json(populatedBookings);
  } catch (error) {
    console.error('Fetch my bookings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking (Private)
// @access  Private
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = await db.collection('bookings').findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId !== req.user.id && booking.userId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    await db.collection('bookings').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );

    await db.collection('user').updateOne(
      { _id: req.user.id },
      { $pull: { bookings: booking._id } }
    );

    if (booking.roomId && ObjectId.isValid(booking.roomId)) {
      await db.collection('rooms').updateOne(
        { _id: new ObjectId(booking.roomId) },
        { $inc: { bookingCount: -1 } }
      );
    }

    res.json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Cancel booking error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
