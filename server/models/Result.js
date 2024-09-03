const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  responses: { type: Array, required: true },
  test: { type: String, required: true },
  completionDate: { type: Date, required: true }
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
