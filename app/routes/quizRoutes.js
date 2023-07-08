const { Router } = require("express");
const router = Router();
const patientController = require("../controllers/patientController");
const quizController = require("../controllers/quizController");
const authController = require("../controllers/authController");
const {
  patientSignupValidator,
  patientLoginValidator,
} = require("../validations/patientValidation");
// const { upload } = require("../services/upload");

//GET Requests
router.get("/logout", authController.logout_get);
router.get("/user/:id", patientController.get_patient);
router.get("/questions", quizController.getAllQuestions);
router.get("/results", quizController.getAllResults);

//POST Requests
router.post(
  "/user/signup",
  patientSignupValidator(), 
  patientController.signup_post
);
router.post(
  "/user/login",
  patientLoginValidator(),
  patientController.login_post
);
router.post(
  "/create-question",
  quizController.createQuestion
);
router.post(
  "/store-answer",
  quizController.storeUserAnswer
);
router.post(
  "/calculate-result",
  quizController.calculateUserResult
);


module.exports = router;
