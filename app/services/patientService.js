const Patient = require("../models/Patient");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const PatientVerification = require("../models/PatientVerification");
const PatientPasswordReset = require("../models/PatientPasswordReset");
const { createToken } = require("./authService");
const User = require("../models/User");
require("dotenv").config();

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});
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

//send verification mail
const sendVerificationEmail = async (patient, res) => {
  const { _id, email } = patient;
  const uniqueString = uuidv4() + _id;
  let url = `http://localhost:3000/verify-patient/${_id}/${uniqueString}`;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Verify your email address to complete the signup and login</p>
    <p>This expires in 6 hours</p><p>Press <a href=${url}>here</a> to proceed</p>`,
  };

  const saltBounds = 10;
  bcrypt
    .hash(uniqueString, saltBounds)
    .then((hashedUniqueString) => {
      const newVerification = new PatientVerification({
        patientId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });

      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              patient
                .save()
                .then(() => {
                  res.status(201).json({
                    status: "OK",
                    message:
                      "Verification Message Sent Successfully Please Check Your Email And Login",
                  });
                })
                .catch((error) => {
                  console.log(error);
                  return res.status(500).json({
                    status: "ERROR",
                    message: "Error In Signing Up",
                    error: error.message,
                  });
                });
            })
            .catch((error) => {
              console.log(error);
              return res.status(500).json({
                status: "ERROR",
                message: "Error In Sending Verification Email",
                error: error.message,
              });
            });
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            status: "ERROR",
            message: "Error In Creating Verification Email",
            error: error.message,
          });
        });
    })
    .catch((error) => {
      return res.status(500).json({
        status: "ERROR",
        message: "Error In Creating Verification Email",
        error: error.message,
      });
    });
};

const verifyUser = async (patientId, uniqueString, res) => {
  try {
    let patient = await PatientVerification.find({ patientId });

    if (patient.length > 0) {
      const { expiresAt } = patient[0];
      const hashedUniqueString = patient[0].uniqueString;
      if (expiresAt < Date.now()) {
        PatientVerification.deleteOne({ patientId })
          .then((result) => {
            Patient.deleteOne({ _id: patientId })
              .then(() => {
                return res.status(200).json({
                  staus: "OK",
                  message: "Link Has Expired Please Sign Up",
                });
              })
              .catch((error) => {
                return res.status(500).json({
                  staus: "ERROR",
                  message: "Could Not Delete Patient From Record",
                  error: error.message,
                });
              });
          })
          .catch((error) => {
            return res.status(500).json({
              staus: "ERROR",
              message: "Could Not Delete Patient From Record",
              error: error.message,
            });
          });
      } else {
        bcrypt
          .compare(uniqueString, hashedUniqueString)
          .then((result) => {
            if (result) {
              Patient.updateOne({ _id: patientId }, { verified: true })
                .then(() => {
                  const newUser = new User({
                    userId: patientId,
                    role: "Patient",
                  });

                  newUser
                    .save()
                    .then(
                      PatientVerification.deleteOne({ patientId })
                        .then(() => {
                          return res.status(200).json({
                            staus: "OK",
                            message:
                              "Patient Verified successfully Please Login",
                          });
                        })
                        .catch((error) => {
                          return res.status(500).json({
                            status: "ERROR",
                            message: "Error Verifying Patient ",
                            error: error.message,
                          });
                        })
                    )
                    .catch((error) => {
                      return res.status(500).json({
                        status: "ERROR",
                        message: "Error Occured while checking new user",
                        error: error.message,
                      });
                    });
                })
                .catch((error) => {
                  return res.status(500).json({
                    status: "ERROR",
                    message:
                      "Error Occured while checking for existing patient recoord ",
                    error: error.message,
                  });
                });
            } else {
              return res.status(500).json({
                status: "ERROR",
                message:
                  "Error Occured while checking for existing patient recoord ",
                error: error.message,
              });
            }
          })
          .catch((error) => {
            return res.status(500).json({
              status: "ERROR",
              message:
                "Error Occured while checking for existing patient recoord ",
              error: error.message,
            });
          });
      }
    } else {
      return res.status(404).json({
        status: "ERROR",
        message: "Patient To Verify Not Found",
        error: error.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Error Verifying Email",
      error: error.message,
    });
  }
};

//send reset password
const sendResetPwdMail = async (patient, res) => {
  const { _id, email, firstName } = patient;
  const resetString = uuidv4() + _id;
  PatientPasswordReset.deleteMany({ patientId: _id })
    .then((result) => {
      let url = `http://localhost:3000/resetPassword/patient/${_id}/${resetString}`;

      let mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Patient reset password",
        html: `
           Hi  <strong>${firstName}</strong>,
           <p>Having an issue with remembering your password? Well don't worry! </p>
           <p>Click the link below to complete your password reset process </p>
           <br> <a href="${url}">Click here to reset your password</a>
        `,
      };
      const saltBounds = 10;
      bcrypt
        .hash(resetString, saltBounds)
        .then((hashedResetString) => {
          const newReset = new PatientPasswordReset({
            patientId: _id,
            resetString: hashedResetString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
          });

          newReset
            .save()
            .then(() => {
              transporter
                .sendMail(mailOptions)
                .then(() => {
                  return res.status(201).json({
                    status: "OK",
                    message: "Reset Link Sent Successfully",
                  });
                })
                .catch((error) => {
                  console.log(error);
                  return res.status(500).json({
                    status: "ERROR",
                    message: "Error In Sending Reset Link",
                    error: error.message,
                  });
                });
            })
            .catch((error) => {
              console.log(error);
              return res.status(500).json({
                status: "ERROR",
                message: "Error In Sending Reset Link",
                error: error.message,
              });
            });
        })
        .catch((error) => {
          return res.status(500).json({
            status: "ERROR",
            message: "Error In Sending Reset Link",
            error: error.message,
          });
        });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        status: "ERROR",
        message: "Error Deleting Records",
        error: error.message,
      });
    });
};
const resetPassword = async (patientId, resetString, newPassword, res) => {
  try {
    let patient = await PatientPasswordReset.find({ patientId });

    if (patient.length > 0) {
      const { expiresAt } = patient[0];
      const hashedResetString = patient[0].resetString;
      if (expiresAt < Date.now()) {
        PatientPasswordReset.deleteOne({ patientId })
          .then((result) => {
            return res.status(200).json({
              staus: "OK",
              message: "Link Has Expired Please Try Again",
            });
          })
          .catch((error) => {
            return res.status(500).json({
              staus: "ERROR",
              message: "Could Not Delete Patient From Record",
              error: error.message,
            });
          });
      } else {
        bcrypt
          .compare(resetString, hashedResetString)
          .then((result) => {
            if (result) {
              const saltBounds = 10;
              bcrypt
                .hash(newPassword, saltBounds)
                .then((hashedNewPassword) => {
                  Patient.updateOne(
                    { _id: patientId },
                    { password: hashedNewPassword }
                  )
                    .then(() => {
                      PatientPasswordReset.deleteOne({ patientId })
                        .then(() => {
                          return res.status(200).json({
                            staus: "OK",
                            message: "Patient Password Reset successfull",
                          });
                        })
                        .catch((error) => {
                          return res.status(500).json({
                            status: "ERROR",
                            message: "Updating Patient Password Failed",
                            error: error.message,
                          });
                        });
                    })
                    .catch((error) => {
                      return res.status(500).json({
                        status: "ERROR",
                        message:
                          "Error Occured while checking for existing patient recoord ",
                        error: error.message,
                      });
                    });
                })
                .catch(() => {
                  return res.status(500).json({
                    status: "ERROR",
                    message: "An error occured while hashing password",
                    error: error.message,
                  });
                });
            } else {
              return res.status(500).json({
                status: "ERROR",
                message:
                  "Error Occured while checking for existing patient recoord ",
                error: error.message,
              });
            }
          })
          .catch((error) => {
            return res.status(500).json({
              status: "ERROR",
              message:
                "Error Occured while checking for existing patient recoord ",
              error: error.message,
            });
          });
      }
    } else {
      return res.status(404).json({
        status: "ERROR",
        message: "Patient To Reset Not Found",
        error: error.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Error Resetting Password",
      error: error.message,
    });
  }
};

module.exports = {
  getPatientByEmail,
  login,
  sendVerificationEmail,
  verifyUser,
  sendResetPwdMail,
  resetPassword,
  getPatientById,
};
