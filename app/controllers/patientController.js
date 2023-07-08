const Patient = require("../models/Patient");
// const PatientVerification = require("../models/PatientVerification");
const { encryptPassword } = require("../services/authService");
const { translateError } = require("../services/mongo_helper");
const {
  login,
  verifyUser,
  getPatientById,
} = require("../services/patientService");
require("dotenv").config();
const bcrypt = require("bcrypt");
const User = require("../models/User");
// const { comparePassword } = require("../services/doctorService");

//Signup Route
module.exports.signup_post = async (req, res) => {
  try {
    let filepath = req.file && req.file.path;
    const {
      email,
      password,
    } = req.body;

    let patient = new Patient({
      email,
      password: await encryptPassword(password),
      examTaken: false
    });
    try {
      await patient.save();
      return res.status(200).json({
        status: "OK",
        message: "Successfully Created Account",
        // error: error.message,
      });
    } catch (error) {
      return res.status(500).json({
        status: "ERROR",
        message: "Error In Signing Up",
        error: error.message,
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Error In Signing Up",
      error: error.message,
    });
  }
};

//Verify Patient Email
module.exports.verify_user = async (req, res) => {
  let { patientId, uniqueString } = req.params;

  try {
    await verifyUser(patientId, uniqueString, res);
  } catch (error) {
    return res.status(404).json({
      status: "ERROR",
      message: "Patient To Verify Not Found",
      error: error.message,
    });
  }
};

module.exports.login_post = async (req, res) => {
  try {
    await login(req, res);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: translateError(error),
    });
  }
};
module.exports.get_patient = async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    if (patient.success !== false) {
      res.status(200).json({
        status: "OK",
        message: "User Found",
        data: patient.data,
      });
    } else {
      res.status(500).json({
        status: "ERROR",
        message: "User Not Found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Something Went wrong",
      error: error.message,
    });
  }
};
