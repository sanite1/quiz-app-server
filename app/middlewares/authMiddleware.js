const jwt = require("jsonwebtoken");
const { getPatientById } = require("../services/patientService");

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization || false;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        res
          .status(401)
          .json({ success: true, message: { error: "Invalid Token" } });
      } else {
        next();
      }
    });
  } else {
    res.status(401).json({
      status: "ERROR",
      message: "No Valid Token Please Login",
    });
  }
};

module.exports = { requireAuth,  };
