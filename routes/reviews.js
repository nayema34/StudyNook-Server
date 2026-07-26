const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { connectDB } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/reviews/room/:roomId
// @desc    Get reviews for a specific room
// @access  Public
router.get('/room/:roomId', async (req, res) => {
  try {
    const { db } = await connectDB();
    const reviews = await db
      .collection('reviews')
      .find({ roomId: req.params.roomId })
      .sort({ createdAt: -1 })
      .toArray();

    const populatedReviews = await Promise.all(
      reviews.map(async (rev) => {
        let user = null;
        if (rev.userId) {
          const userDoc = await db.collection('user').findOne(
            { _id: rev.userId },
            { projection: { name: 1, image: 1, photoUrl: 1 } }
          );
          if (userDoc) {
            user = {
              _id: userDoc._id,
              name: userDoc.name,
              photoUrl: userDoc.image || userDoc.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            };
          }
        }
        return {
          ...rev,
          userId: user || rev.userId,
        };
      })
    );

    res.json(populatedReviews);
  } catch (error) {
    console.error('Fetch reviews error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Add a review for a room
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { db } = await connectDB();
    const { roomId, rating, comment } = req.body;

    if (!roomId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide roomId, rating, and comment' });
    }

    const newReview = {
      roomId,
      userId: req.user.id,
      rating: Number(rating),
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('reviews').insertOne(newReview);
    const review = { _id: result.insertedId, ...newReview };

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Add review error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
