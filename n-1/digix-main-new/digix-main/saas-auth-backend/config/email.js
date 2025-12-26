// config/email.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send OTP Email
const sendOTPEmail = async (email, otp, type = 'password_reset') => {
    const transporter = createTransporter();
    
    const subject = type === 'password_reset' 
        ? 'Password Reset OTP - SaaS Platform' 
        : 'Email Verification OTP - SaaS Platform';
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: #667eea; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 ${type === 'password_reset' ? 'Password Reset' : 'Email Verification'}</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>${type === 'password_reset' 
                    ? 'We received a request to reset your password. Use the OTP below to proceed:' 
                    : 'Please verify your email address using the OTP below:'}</p>
                
                <div class="otp-box">${otp}</div>
                
                <p><strong>This OTP will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</strong></p>
                
                <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
                </div>
                
                <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>© 2024 SaaS Platform. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const mailOptions = {
        from: `"SaaS Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: subject,
        html: htmlContent
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        throw new Error('Failed to send email');
    }
};

// Send Welcome Email
const sendWelcomeEmail = async (email, firstName) => {
    const transporter = createTransporter();
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to SaaS Platform!</h1>
            </div>
            <div class="content">
                <p>Hello ${firstName},</p>
                <p>Thank you for registering! Your account has been created successfully.</p>
                <p>You now have access to all our amazing features:</p>
                <ul>
                    <li>✅ Full Demo Access</li>
                    <li>✅ Dashboard Analytics</li>
                    <li>✅ Premium Features</li>
                </ul>
                <a href="${process.env.FRONTEND_URL}/login" class="btn">Login to Your Account</a>
            </div>
            <div class="footer">
                <p>© 2024 SaaS Platform. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    const mailOptions = {
        from: `"SaaS Platform" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Welcome to SaaS Platform! 🎉',
        html: htmlContent
    };
    
    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('❌ Welcome email error:', error);
        // Don't throw - welcome email is not critical
        return { success: false };
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail
};
