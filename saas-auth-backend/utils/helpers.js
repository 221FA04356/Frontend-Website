const crypto = require("crypto");

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP before saving
 */
const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Compare OTP
 */
const verifyOTP = (enteredOtp, hashedOtp) => {
  const enteredHash = hashOTP(enteredOtp);
  return enteredHash === hashedOtp;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
};
