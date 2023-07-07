const mongoose = require('mongoose');

const correctAnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  correctOption: {
    type: String,
    required: true,
  },
});

const CorrectAnswer = mongoose.model('CorrectAnswer', correctAnswerSchema);

module.exports = CorrectAnswer;
