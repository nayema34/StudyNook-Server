const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');

// @route   GET /api/reviews/room/:roomId
// @desc    Get reviews for a specific room
// @access  Public
router.get('/room/:roomId', async (req, res) => {
  try {
    const reviews = await Review.find({ roomId: req.params.roomId })
      .populate('userId', 'name photoUrl')
      .sort({ createdAt: -1 });
    res.json(reviews);
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
    const { roomId, rating, comment } = req.body;

    if (!roomId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide roomId, rating, and comment' });
    }

    const review = new Review({
      roomId,
      userId: req.user.id,
      rating: Number(rating),
      comment,
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Add review error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
