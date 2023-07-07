const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  resultType: {
    type: String,
    required: true,
  },
  resultText: {
    type: String,
    required: true,
  },
  resultLink: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
