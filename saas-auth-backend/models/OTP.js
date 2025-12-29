// models/OTP.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email_verification', 'password_reset'],
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Auto-delete when expired
    }
}, {
    timestamps: true
});

// Only allow 3 OTP attempts
otpSchema.methods.isMaxAttemptsReached = function() {
    return this.attempts >= 3;
};

// Increment attempts
otpSchema.methods.incrementAttempts = function() {
    this.attempts += 1;
    return this.save();
};

module.exports = mongoose.model('OTP', otpSchema);
