// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// ============================================
// PUBLIC ROUTES
// ============================================

// Register
router.post('/register',
    authLimiter,
    [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('username')
            .trim()
            .isLength({ min: 4 })
            .withMessage('Username must be at least 4 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('phone.areaCode').notEmpty().withMessage('Area code is required'),
        body('phone.number')
            .matches(/^[0-9]{10}$/)
            .withMessage('Valid 10-digit phone number is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
    ],
    validate,
    authController.register
);

// Login
router.post('/login',
    loginLimiter,
    [
        body('username').trim().notEmpty().withMessage('Username or email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    authController.login
);

// Forgot Password - Send OTP
router.post('/forgot-password',
    otpLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
    ],
    validate,
    authController.forgotPassword
);

// Verify OTP
router.post('/verify-otp',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    ],
    validate,
    authController.verifyOTP
);

// Reset Password
router.post('/reset-password',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('resetToken').notEmpty().withMessage('Reset token is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
    ],
    validate,
    authController.resetPassword
);

// Refresh Token
router.post('/refresh-token', authController.refreshToken);

// ============================================
// PROTECTED ROUTES
// ============================================

// Get current user
router.get('/me', protect, authController.getMe);

// Check authentication status
router.get('/check', protect, authController.checkAuth);

// Logout
router.post('/logout', protect, authController.logout);

module.exports = router;
