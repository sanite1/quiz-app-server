const Patient = require("../models/Patient");
const bcrypt = require("bcrypt");
const { createToken } = require("./authService");
require("dotenv").config();


//Get Patient By Email
const getPatientByEmail = async (email) => {
  const patient = await Patient.findOne({ email });

  if (patient !== null) {
    return [true, patient];
  } else {
    return [false, "Patient with that email doesn't exist"];
  }
};

const getPatientById = async (id) => {
  try {
    const patient = await Patient.findById(id);
    if (patient !== null) {
      return { success: true, data: patient };
    } else {
      return {
        success: false,
        message: "Patient doesn't exist. It is null and/or has been deleted.",
      };
    }
  } catch (error) {
    return { success: false, message: translateError(error) };
  }
};

//Login Service
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Incorrect Email" });
    }

    const auth = await bcrypt.compare(password, patient.password);
    if (!auth) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Incorrect Password" });
    }

    const { password: omitPassword, ...patientData } = patient.toObject();
    const token = createToken(patient._id, patient.role);
    const maxAge = 3 * 24 * 60 * 60;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: maxAge * 1000,
    });
    patient.examTaken = true;
    await patient.save();
    res.status(200).json({
      status: "OK",
      message: "Login Successfull",
      data: patientData,
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ status: "ERROR", message: "Login failed", error: error.message });
  }
};




module.exports = {
  getPatientByEmail,
  login,
  getPatientById,
};
