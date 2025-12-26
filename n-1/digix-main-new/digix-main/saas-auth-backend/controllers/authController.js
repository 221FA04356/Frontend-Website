// controllers/authController.js
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/email');
const crypto = require('crypto');

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    // Access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    // Refresh token cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// ============================================
// REGISTER
// ============================================
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, username, phone, password } = req.body;
        
        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Check if username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }
        
        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            phone: {
                areaCode: phone.areaCode,
                number: phone.number
            },
            password
        });
        
        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.firstName).catch(console.error);
        
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please login to continue.'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

// ============================================
// LOGIN
// ============================================
exports.login = async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username/email and password'
            });
        }
        
        // Find user by username or email (include password field)
        const user = await User.findOne({
            $or: [
                { email: username.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        }).select('+password');
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if account is locked
        if (user.isLocked()) {
            const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                success: false,
                message: `Account locked due to too many failed attempts. Try again in ${lockTimeRemaining} minutes.`
            });
        }
        
        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated. Please contact support.'
            });
        }
        
        // Verify password
        const isPasswordCorrect = await user.comparePassword(password);
        
        if (!isPasswordCorrect) {
            // Increment failed login attempts
            await user.incLoginAttempts();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        
        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        
        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        
        // Set cookies
        setTokenCookies(res, accessToken, refreshToken);
        
        // Response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                    role: user.role
                },
                accessToken,
                expiresIn: process.env.JWT_EXPIRE || '15m'
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

// ============================================
// LOGOUT
// ============================================
exports.logout = async (req, res) => {
    try {
        // Clear refresh token from database if user is authenticated
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        }
        
        // Clear cookies
        res.cookie('accessToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });
        res.cookie('refreshToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });
        
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// ============================================
// REFRESH TOKEN
// ============================================
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found'
            });
        }
        
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Find user with this refresh token
        const user = await User.findOne({
            _id: decoded.id,
            refreshToken: refreshToken
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        // Generate new access token
        const newAccessToken = user.generateAccessToken();
        
        // Set new access token cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        
        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

// ============================================
// FORGOT PASSWORD - Send OTP
// ============================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }
        
        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });
        
        // Generate OTP
        const otp = generateOTP();
        
        // Save OTP to database
        const otpExpireMinutes = parseInt(process.env.OTP_EXPIRE_MINUTES) || 10;
        await OTP.create({
            email: email.toLowerCase(),
            otp: otp,
            type: 'password_reset',
            expiresAt: new Date(Date.now() + otpExpireMinutes * 60 * 1000)
        });
        
        // Send OTP email
        await sendOTPEmail(email, otp, 'password_reset');
        
        res.status(200).json({
            success: true,
            message: `OTP sent to ${email}. Valid for ${otpExpireMinutes} minutes.`
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.'
        });
    }
};

// ============================================
// VERIFY OTP
// ============================================
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and OTP'
            });
        }
        
        // Find OTP record
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            type: 'password_reset'
        });
        
        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found. Please request a new one.'
            });
        }
        
        // Check max attempts
        if (otpRecord.isMaxAttemptsReached()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                success: false,
                message: 'Maximum OTP attempts reached. Please request a new OTP.'
            });
        }
        
        // Verify OTP
        if (otpRecord.otp !== otp) {
            await otpRecord.incrementAttempts();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - otpRecord.attempts - 1} attempts remaining.`
            });
        }
        
        // OTP verified - generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Update OTP record with reset token
        otpRecord.resetToken = resetToken;
        await otpRecord.save();
        
        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            resetToken: resetToken
        });
        
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed'
        });
    }
};

// ============================================
// RESET PASSWORD
// ============================================
exports.resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Validate password length
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }
        
        // Find and verify reset token
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            resetToken: resetToken,
            type: 'password_reset'
        });
        
        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }
        
        // Find user and update password
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Update password
        user.password = newPassword;
        user.refreshToken = null; // Invalidate all sessions
        await user.save();
        
        // Delete OTP record
        await OTP.deleteOne({ _id: otpRecord._id });
        
        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed'
        });
    }
};

// ============================================
// GET CURRENT USER
// ============================================
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                phone: user.phone,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data'
        });
    }
};

// ============================================
// CHECK AUTH STATUS
// ============================================
exports.checkAuth = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authenticated',
        user: {
            id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            username: req.user.username,
            role: req.user.role
        }
    });
};
