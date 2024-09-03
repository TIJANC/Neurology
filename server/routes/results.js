const express = require('express');
const Result = require('../models/Result');
const router = express.Router();

router.post('/results', async (req, res) => {

  try {
    const { name, responses, test, completionDate } = req.body;

    if (!name || !responses || !test || !completionDate) {
      console.log('Missing name, responses, test, or completionDate');
      return res.status(400).json({ message: 'Name, responses, test, and completionDate are required' });
    }

    const newResult = new Result({ name, responses, test, completionDate });
    await newResult.save();

    console.log('Result saved:', newResult);
    res.status(201).json({ message: 'Results saved successfully', result: newResult });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
