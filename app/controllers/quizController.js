

const Question = require('../models/Quiz/Question');
const AnswerSheet = require('../models/Quiz/AnswerSheet');
const CorrectAnswer = require('../models/Quiz/CorrectAnswer');
const Result = require('../models/Quiz/Result');

// Create a new question
async function createQuestion(req, res) {
  try {
    const { query, language, state, country, date, resultType, resultText, resultLink, options, correctAnswer } = req.body;

    // Create a new question
    const newQuestion = new Question({ query, language, state, country, date, resultType, resultText, resultLink, options: ["Highly Satisfying", "Satisfying", "Somewhat Satisfying", "Not Satisfying"] });
    await newQuestion.save();

    // Create a new correct answer entry
    const newCorrectAnswer = new CorrectAnswer({
      question: newQuestion._id,
      correctOption: correctAnswer,
    });
    await newCorrectAnswer.save();

    res.status(201).json({ message: 'Question created successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the question.' });
  }
}


// Get all questions
async function getAllQuestions(req, res) {
  try {
    const questions = await Question.find({}, { correctAnswer: 0 });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching questions.' });
  }
}

// Store user's answer
async function storeUserAnswer(req, res) {
  try {
    const { userId, questionId, selectedOption } = req.body;
    const answerSheet = new AnswerSheet({ user: userId, question: questionId, selectedOption });
    await answerSheet.save();
    res.status(200).json({ message: 'Answer stored successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while storing the answer.' });
  }
}

// Calculate and store the user's result
async function calculateUserResult(req, res) {
  try {
    const { userId, username } = req.body;

    // Get all user answers
    const userAnswers = await AnswerSheet.find({ user: userId });

    // Get all correct answers
    const correctAnswers = await CorrectAnswer.find();

    let score = 0;
    let total = 0;

    // Calculate the score
    userAnswers.forEach((userAnswer) => {
      const correctAnswer = correctAnswers.find((ans) => ans.question.equals(userAnswer.question));
      if (correctAnswer && correctAnswer.correctOption === userAnswer.selectedOption) {
        score++;
      }
      total+=1;
    });

    let percentage = (score / total) * 100
    // Store the user's result
    const result = new Result({ user: userId, username, score: percentage });
    await result.save();

    res.status(200).json({ message: 'Your result has been recorded!', result });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while calculating and storing the result.' });
  }
}

// Get all results for each user
async function getAllResults(req, res) {
  try {
    const results = await Result.find();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching results.' });
  }
}


module.exports = { storeUserAnswer, calculateUserResult, getAllQuestions, createQuestion, getAllResults };