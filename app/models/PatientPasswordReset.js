const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const patientPasswordResetSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
  },
  resetString: { type: String },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

const PatientPasswordReset = mongoose.model(
  "PatientPasswordReset", 
  patientPasswordResetSchema
);

module.exports = PatientPasswordReset;
