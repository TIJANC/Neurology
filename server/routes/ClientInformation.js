const express = require('express');
const Result = require('../models/Result');
const router = express.Router();

// Route to fetch tests completed by a user based on their name
router.get('/user-tests/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const userTests = await Result.find({ name: name });
    res.status(200).json({ tests: userTests });
  } catch (error) {
    console.error('Error fetching user tests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
