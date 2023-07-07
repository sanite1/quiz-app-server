//ERROR HANDLING and VALIDATION

const { check, body, validationResult } = require("express-validator");
const { getPatientByEmail } = require("../services/patientService");

const patientSignupValidator = () => {
  return [
    //Check that email isn't taken
    check("email")
      .custom(async (value) => {
        let patientExist = await getPatientByEmail(value);

        if (patientExist[0] !== false) {
          return Promise.reject();
        }
      })
      .withMessage("Email is taken! If it belongs to you, please login!"),
    //Email validation
    body("email", "Username is required").trim().notEmpty(),
    body("email", "Username must be valid containing @ and a domain (e.g .com)")
      .isEmail()
      .isLength({ min: 10 }),
    //Password validation
    body("password", "Password is required").trim().notEmpty(),
    body("confirmPassword", "Please enter your password again")
      .trim()
      .notEmpty(),
    check("confirmPassword")
      .custom((value, { req }) => {
        const { password } = req.body;
        if (value === password) {
          return true;
        } else {
          return Promise.reject(); //return false or return Promise.reject() would both work since this isn't an async function
        }
      })
      .withMessage("Passwords must be the same"),
    body("password")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
      .withMessage(
        "Password must be atleast 8 characters long and a combination of at least one upper and lower case letter and one number."
      ),
  ];
};

const patientLoginValidator = () => {
  return [
    check("email")
      .custom(async (value) => {
        let patientExist = await getPatientByEmail(value);

        if (!patientExist[0]) {
          return Promise.reject();
        }
      })
      .withMessage("Email not valid, please signup!"),
    //Email validation
    body("email", "Username is required").trim().notEmpty(),
    body("email", "Username must be valid containing @ and a domain (e.g .com)")
      .isEmail()
      .isLength({ min: 10 }),
    //Password validation
    body("password", "Password is required").trim().notEmpty(),
  ];
};
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  // errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  errors.array().map((err) => extractedErrors.push(err.msg));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

module.exports = {
  patientSignupValidator,
  patientLoginValidator,
  validate,
};
