const mongoose = require('mongoose');

const answerSheetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOption: {
    type: String,
    required: true,
  },
});

const AnswerSheet = mongoose.model('AnswerSheet', answerSheetSchema);

module.exports = AnswerSheet;
