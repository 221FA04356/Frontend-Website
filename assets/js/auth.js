/* ========================================
   Authentication JavaScript
   ======================================== */

// Configuration
const CONFIG = {
    demoPageUrl: 'index-eleven.html', // Your SaaS demo page
    loginPageUrl: 'login.html',
    otpLength: 6,
    otpExpiry: 60 // seconds
};

// Simulated user database (Replace with actual backend API)
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Show alert message
function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    alertBox.classList.remove('hidden');
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number
function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

// Check password strength
function checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    if (!strengthIndicator) return;
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    strengthIndicator.className = 'password-strength';
    
    if (password.length === 0) {
        strengthIndicator.className = 'password-strength';
    } else if (strength < 2) {
        strengthIndicator.classList.add('weak');
    } else if (strength < 4) {
        strengthIndicator.classList.add('medium');
    } else {
        strengthIndicator.classList.add('strong');
    }
}

// ========================================
// LOGIN FUNCTIONALITY
// ========================================

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Clear previous errors
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    
    // Validation
    let isValid = true;
    
    if (!username) {
        document.getElementById('usernameError').textContent = 'Username or email is required';
        isValid = false;
    }
    
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required';
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Check credentials
    const user = usersDB.find(u => 
        (u.username === username || u.email === username) && u.password === password
    );
    
    if (user) {
        // Successful login
        const sessionData = {
            userId: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            loggedIn: true,
            loginTime: new Date().toISOString()
        };
        
        if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
        
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to demo page
        setTimeout(() => {
            window.location.href = CONFIG.demoPageUrl;
        }, 1500);
    } else {
        showAlert('Invalid username or password. Please try again.', 'error');
    }
}

// ========================================
// REGISTRATION FUNCTIONALITY
// ========================================

function handleRegistration() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const areaCode = document.getElementById('areaCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Clear previous errors
    const errorFields = ['firstName', 'lastName', 'email', 'phone', 'regUsername', 'regPassword', 'confirmPassword'];
    errorFields.forEach(field => {
        const errorEl = document.getElementById(field + 'Error');
        if (errorEl) errorEl.textContent = '';
    });
    
    // Validation
    let isValid = true;
    
    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'First name is required';
        isValid = false;
    }
    
    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'Last name is required';
        isValid = false;
    }
    
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required';
        isValid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email';
        isValid = false;
    } else if (usersDB.some(u => u.email === email)) {
        document.getElementById('emailError').textContent = 'Email already registered';
        isValid = false;
    }
    
    if (!phoneNumber) {
        document.getElementById('phoneError').textContent = 'Phone number is required';
        isValid = false;
    } else if (!isValidPhone(phoneNumber)) {
        document.getElementById('phoneError').textContent = 'Please enter a valid 10-digit phone number';
        isValid = false;
    }
    
    if (!username) {
        document.getElementById('regUsernameError').textContent = 'Username is required';
        isValid = false;
    } else if (username.length < 4) {
        document.getElementById('regUsernameError').textContent = 'Username must be at least 4 characters';
        isValid = false;
    } else if (usersDB.some(u => u.username === username)) {
        document.getElementById('regUsernameError').textContent = 'Username already taken';
        isValid = false;
    }
    
    if (!password) {
        document.getElementById('regPasswordError').textContent = 'Password is required';
        isValid = false;
    } else if (password.length < 8) {
        document.getElementById('regPasswordError').textContent = 'Password must be at least 8 characters';
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        isValid = false;
    }
    
    if (!agreeTerms) {
        showAlert('Please agree to the Terms & Conditions', 'warning');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        phone: areaCode + phoneNumber,
        username,
        password, // In production, this should be hashed
        createdAt: new Date().toISOString()
    };
    
    usersDB.push(newUser);
    localStorage.setItem('usersDB', JSON.stringify(usersDB));
    
    showAlert('Registration successful! Redirecting to login...', 'success');
    
    setTimeout(() => {
        window.location.href = CONFIG.loginPageUrl;
    }, 2000);
}

// ========================================
// FORGOT PASSWORD FUNCTIONALITY
// ========================================

let currentEmail = '';
let generatedOTP = '';
let otpTimer = null;

function sendOTP() {
    const email = document.getElementById('resetEmail').value.trim();
    
    document.getElementById('resetEmailError').textContent = '';
    
    if (!email) {
        document.getElementById('resetEmailError').textContent = 'Email is required';
        return;
    }
    
    if (!isValidEmail(email)) {
        document.getElementById('resetEmailError').textContent = 'Please enter a valid email';
        return;
    }
    
    // Check if email exists
    const user = usersDB.find(u => u.email === email);
    if (!user) {
        document.getElementById('resetEmailError').textContent = 'Email not found in our records';
        return;
    }
    
    currentEmail = email;
    
    // Generate OTP (In production, send via email/SMS)
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', generatedOTP); // For testing - remove in production
    
    // Show OTP step
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    // Start timer
    startOTPTimer();
    
    showAlert(`OTP sent to ${email}. (Check console for demo)`, 'success');
}

function startOTPTimer() {
    let timeLeft = CONFIG.otpExpiry;
    const timerEl = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendBtn');
    
    timerEl.classList.remove('hidden');
    resendBtn.classList.add('hidden');
    
    otpTimer = setInterval(() => {
        timeLeft--;
        timerEl.innerHTML = `Resend OTP in <strong>${timeLeft}s</strong>`;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            timerEl.classList.add('hidden');
            resendBtn.classList.remove('hidden');
        }
    }, 1000);
}

function resendOTP() {
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('New OTP:', generatedOTP);
    startOTPTimer();
    showAlert('New OTP sent!', 'success');
}

function verifyOTP() {
    const otpInputs = document.querySelectorAll('.otp-input');
    let enteredOTP = '';
    
    otpInputs.forEach(input => {
        enteredOTP += input.value;
    });
    
    document.getElementById('otpError').textContent = '';
    
    if (enteredOTP.length !== CONFIG.otpLength) {
        document.getElementById('otpError').textContent = 'Please enter complete OTP';
        return;
    }
    
    if (enteredOTP !== generatedOTP) {
        document.getElementById('otpError').textContent = 'Invalid OTP. Please try again.';
        return;
    }
    
    // OTP verified, show password reset step
    clearInterval(otpTimer);
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.remove('hidden');
}

function resetPassword() {
    const newPassword = document.getElementById('newPassword').value;
    const reenterPassword = document.getElementById('reenterPassword').value;
    
    document.getElementById('newPasswordError').textContent = '';
    document.getElementById('reenterPasswordError').textContent = '';
    
    let isValid = true;
    
    if (!newPassword) {
        document.getElementById('newPasswordError').textContent = 'Password is required';
        isValid = false;
    } else if (newPassword.length < 8) {
        document.getElementById('newPasswordError').textContent = 'Password must be at least 8 characters';
        isValid = false;
    }
    
    if (newPassword !== reenterPassword) {
        document.getElementById('reenterPasswordError').textContent = 'Passwords do not match';
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Update password in database
    const userIndex = usersDB.findIndex(u => u.email === currentEmail);
    if (userIndex !== -1) {
        usersDB[userIndex].password = newPassword;
        localStorage.setItem('usersDB', JSON.stringify(usersDB));
    }
    
    // Show success
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step4').classList.remove('hidden');
}

// Setup OTP inputs auto-focus
function setupOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
        
        // Only allow numbers
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });
}

// ========================================
// SESSION MANAGEMENT
// ========================================

function checkAuth() {
    const session = JSON.parse(localStorage.getItem('userSession')) || 
                   JSON.parse(sessionStorage.getItem('userSession'));
    return session && session.loggedIn;
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('userSession')) || 
           JSON.parse(sessionStorage.getItem('userSession'));
}

function logout() {
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('userSession');
    window.location.href = CONFIG.loginPageUrl;
}

// ========================================
// PAGE PROTECTION
// ========================================

// Add this to protected pages (demo pages)
function protectPage() {
    if (!checkAuth()) {
        window.location.href = CONFIG.loginPageUrl;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Refresh usersDB from localStorage
    usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];
});

document.addEventListener("DOMContentLoaded", () => {
  fetch("header.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;
    });
});
