const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const axios = require('axios');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// API Health Check
router.get('/', (req, res) => {
  res.json({ 
    message: 'Brahmani Jewellers API is running successfully! ✅', 
    status: 'online', 
    version: '1.2.0-newsletter-live',
    emailUserConfigured: !!process.env.EMAIL_USER,
    emailPassConfigured: !!process.env.EMAIL_PASS
  });
});

// Models
const Rate = require('../models/Rate');
const Gallery = require('../models/Gallery');
const User = require('../models/User');
const Message = require('../models/Message');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Subscriber = require('../models/Subscriber');

// Email Helper Function
const sendEmail = async (to, subject, html) => {
  // Use official Gmail credentials as fallbacks to ensure emails always send
  const emailUser = process.env.EMAIL_USER || 'info.brahmanijewellers@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'drwcqzjagditmxke';
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT) || 587;

  console.log(`[EMAIL SETUP] Attempting to send email via ${emailHost}:${emailPort} from ${emailUser}...`);

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // Use SSL for 465, STARTTLS for 587
    auth: {
      user: emailUser,
      pass: emailPass
    },
    family: 4, // Force IPv4 to avoid Render IPv6 timeout
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.sendMail({
      from: `"Brahmani Jewellers" <${emailUser}>`,
      to,
      subject,
      html
    });
    console.log(`[EMAIL SUCCESS] Sent successfully to ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, err);
    throw err;
  }
};

// Multer Config for Local Uploads
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg and .png images are allowed'));
    }
  }
});

// --- AUTHENTICATION ROUTES ---

// User Registration
router.post('/auth/register', async (req, res) => {
  const { name, email, mobile, password, country, state, city } = req.body;
  try {
    const query = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (mobile) query.push({ mobile });

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email or mobile number' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email: email ? email.toLowerCase() : undefined, mobile, password: hashedPassword, country, state, city });
    
    // Generate OTP for mobile/fallback verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    newUser.otp = otp;
    newUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Generate secure crypto verification token for email link
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = verificationToken;
    newUser.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await newUser.save();

    console.log(`[MOCK OTP] Your OTP for ${mobile} / ${email} is ${otp}`);

    if (email) {
      try {
        const backendUrl = `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;
        
        const welcomeHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 40px 30px; background-color: #FFFDF9; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #3D2B1F; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Brahmani Jewellers</h1>
              <p style="color: #d4af37; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Purity & Trust Since 1992</p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 10px;">Dear <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">Thank you for registering an account with Brahmani Jewellers. To complete your registration and secure your profile, please verify your email address by clicking the button below.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verifyUrl}" style="background-color: #3D2B1F; color: #FFFDF9; border: 1px solid #d4af37; padding: 14px 35px; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(61, 43, 31, 0.15);">Verify Email Address</a>
            </div>
            
            <p style="font-size: 13px; color: #7A695D; text-align: center; margin-top: 10px; margin-bottom: 25px;">This verification link is valid for 24 hours.</p>
            
            <div style="background-color: #FDF9F3; border-left: 3px solid #d4af37; padding: 15px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 13px; color: #5C4A3E; font-style: italic;">Alternatively, you can copy and paste the following URL into your browser:</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #d4af37; word-break: break-all;"><a href="${verifyUrl}" style="color: #d4af37; text-decoration: underline;">${verifyUrl}</a></p>
            </div>
            
            <p style="font-size: 14px; color: #5C4A3E; margin-bottom: 0;">If you did not create this account, please safely disregard this message.</p>
            
            <div style="margin-top: 40px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 25px; font-size: 13px; color: #7A695D; text-align: center;">
              <p style="margin: 0; font-weight: bold; color: #3D2B1F;">Brahmani Jewellers Team</p>
              <p style="margin: 5px 0 0 0;">For inquiries: <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #d4af37; text-decoration: none;">info.brahmanijewellers@gmail.com</a></p>
            </div>
          </div>
        `;
        sendEmail(email, 'Welcome to Brahmani Jewellers - Verify Your Account', welcomeHtml).catch(console.error);
      } catch (err) {
        // Continue even if email fails during development
      }
    }
    
    if (mobile) {
      if (process.env.FAST2SMS_API_KEY) {
        try {
          await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
              authorization: process.env.FAST2SMS_API_KEY,
              variables_values: otp,
              route: 'otp',
              numbers: mobile
            }
          });
          console.log(`[Fast2SMS] OTP successfully sent to ${mobile}`);
        } catch (smsErr) {
          console.error(`[Fast2SMS ERROR] Failed to send to ${mobile}:`, smsErr.message);
        }
      } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          twilioClient.messages.create({
            body: `Your Brahmani Jewellers Registration OTP is: ${otp}`,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `+91${mobile}`
          }).then(() => {
            console.log(`[SMS/WA] OTP successfully sent to ${mobile}`);
          }).catch((smsErr) => {
            console.error(`[SMS/WA ERROR] Failed to send to ${mobile}:`, smsErr);
          });
        } catch (smsErr) {
          console.error(`[SMS/WA ERROR] Failed to send to ${mobile}:`, smsErr);
        }
      } else {
        console.log(`[SMS/WA] Twilio credentials not found in .env. Skipping SMS.`);
      }
    }

    res.status(201).json({ message: `User registered successfully. A verification email has been sent.`, identifier: mobile || email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Email Link
router.get('/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    let clientUrl = process.env.FRONTEND_URL || 'https://brahmani-jewellers.vercel.app';
    const host = req.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168')) {
      clientUrl = 'http://localhost:5173';
    }

    if (!token) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px; padding: 20px;">
          <h2 style="color: #d9534f;">Verification Failed</h2>
          <p>Verification token is missing.</p>
          <a href="${clientUrl}/login" style="background-color: #3D2B1F; color: #EBA938; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Login</a>
        </div>
      `);
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.redirect(`${clientUrl}/login?verified=false&message=Invalid or expired verification link.`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    
    // Clear OTP details since user is now successfully verified
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    // Send Welcome Email if it's the first time
    if (!user.lastLogin && user.email) {
      try {
        const welcomeHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid #EBA938; padding: 30px; background-color: #FFF6E6;">
            <h2 style="color: #3D2B1F; text-align: center; border-bottom: 1px solid #EBA938; padding-bottom: 10px;">Welcome to Brahmani Jewellers</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Your account has been successfully created and verified at <strong>Brahmani Jewellers</strong>.</p>
            <p>You can now explore our exclusive collection of gold and silver jewelry and shop directly from our platform.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${clientUrl}/login" style="background-color: #3D2B1F; color: #EBA938; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Login to Your Account</a>
            </div>
            <p style="font-size: 0.9em; color: #666;">If you have any questions, feel free to contact us via WhatsApp or Phone.</p>
          </div>
        `;
        sendEmail(user.email, 'Account Created Successfully - Brahmani Jewellers', welcomeHtml).catch(console.error);
      } catch (err) {
        // Handled
      }
    }

    // Redirect to login page with success message
    return res.redirect(`${clientUrl}/login?verified=true&message=Your account has been verified successfully! Please log in.`);
  } catch (err) {
    console.error('[VERIFY EMAIL ERROR]:', err);
    res.status(500).send(`
      <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px; padding: 20px;">
        <h2 style="color: #d9534f;">Server Error</h2>
        <p>An error occurred while verifying your email. Please try again later.</p>
      </div>
    `);
  }
});


// User Login (Password)
router.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    let email = null;
    let mobile = null;

    if (identifier.includes('@')) {
      email = identifier.toLowerCase();
    } else {
      mobile = identifier;
    }

    const query = [];
    if (email) query.push({ email });
    if (mobile) query.push({ mobile });

    const user = await User.findOne({ $or: query });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Your account is not verified yet. Please click the verification link sent to your email or verify via OTP.', unverified: true });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change Password
router.put('/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request OTP for Login
router.post('/auth/request-otp', async (req, res) => {
  const { identifier } = req.body;
  try {
    let email = null;
    let mobile = null;

    if (identifier.includes('@')) {
      email = identifier.toLowerCase();
    } else {
      mobile = identifier;
    }

    const query = [];
    if (email) query.push({ email });
    if (mobile) query.push({ mobile });

    const user = await User.findOne({ $or: query });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    console.log(`[MOCK OTP] Your OTP for ${identifier} is ${otp}`);

    if (user.email) {
      // Send Email Asynchronously in the Background to eliminate client-side buffering!
      const otpHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid #EBA938; border-radius: 8px; padding: 25px; background-color: #FFF6E6;">
          <h2 style="color: #3D2B1F; text-align: center; border-bottom: 1px solid #EBA938; padding-bottom: 10px;">Brahmani Jewellers</h2>
          <h3 style="color: #3D2B1F; text-align: center;">Login Verification Code</h3>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>You requested a login OTP for your Brahmani Jewellers account.</p>
          <div style="background-color: #FCF0DA; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #EBA938;">
            <h1 style="letter-spacing: 5px; color: #3D2B1F; margin: 0; font-size: 2.2em;">${otp}</h1>
            <p style="color: #666; font-size: 0.9em; margin-top: 10px;">This code will expire in 10 minutes.</p>
          </div>
          <p style="font-size: 0.9em; color: #666;">If you didn't request this, please ignore this email or contact support.</p>
        </div>
      `;
      sendEmail(user.email, 'Your Login OTP - Brahmani Jewellers', otpHtml).catch((err) => {
        console.error(`[OTP EMAIL ERROR]:`, err);
      });
      
      // Mask the email for security (e.g. akshay@gmail.com becomes ak***@gmail.com)
      const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
      res.json({ message: `OTP has been successfully sent to your registered email: ${maskedEmail}` });
    } else {
      // Send WhatsApp/SMS OTP Asynchronously in the Background to eliminate client-side buffering!
      if (process.env.FAST2SMS_API_KEY) {
        axios.get('https://www.fast2sms.com/dev/bulkV2', {
          params: {
            authorization: process.env.FAST2SMS_API_KEY,
            variables_values: otp,
            route: 'otp',
            numbers: mobile || user.mobile
          }
        }).then(() => {
          console.log(`[Fast2SMS] Login OTP successfully sent to ${mobile || user.mobile}`);
        }).catch((smsErr) => {
          console.error(`[Fast2SMS ERROR] Failed to send to ${mobile || user.mobile}:`, smsErr.message);
        });
      } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          twilioClient.messages.create({
            body: `Your Brahmani Jewellers Login OTP is: ${otp}`,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `+91${mobile || user.mobile}`
          }).then(() => {
            console.log(`[SMS/WA] Login OTP successfully sent to ${mobile || user.mobile}`);
          }).catch((smsErr) => {
            console.error(`[SMS/WA ERROR] Failed to send to ${mobile || user.mobile}:`, smsErr);
          });
        } catch (smsErr) {
          console.error(`[SMS/WA ERROR] Failed to send to ${mobile || user.mobile}:`, smsErr);
        }
      } else {
        console.log(`[SMS/WA] Twilio credentials missing in .env. Skipping SMS.`);
      }
      res.json({ message: `OTP sent to your registered mobile number` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Forgot Password
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't leak whether user exists or not for security, just say we sent it.
      return res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    const resetToken = require('crypto').randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const clientUrl = req.headers.origin || 'https://brahmani-jewellers.vercel.app';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    
    try {
      const resetHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          <h2 style="color: #d4af37; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for Brahmani Jewellers.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #d4af37; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #888;">${resetUrl}</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;
      sendEmail(email, 'Password Reset Request - Brahmani Jewellers', resetHtml).catch(console.error);
    } catch (err) {
      // Handled in helper
    }

    res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing forgot password request' });
  }
});

// Reset Password
router.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Verify OTP
router.post('/auth/verify-otp', async (req, res) => {
  const { identifier, otp } = req.body;
  try {
    let email = null;
    let mobile = null;

    if (identifier.includes('@')) {
      email = identifier.toLowerCase();
    } else {
      mobile = identifier;
    }

    const query = [];
    if (email) query.push({ email });
    if (mobile) query.push({ mobile });

    const user = await User.findOne({ $or: query });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    // Send Welcome Email if it's the first time
    if (!user.lastLogin && user.email) {
      try {
        const welcomeHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid #EBA938; padding: 30px; background-color: #FFF6E6;">
            <h2 style="color: #3D2B1F; text-align: center; border-bottom: 1px solid #EBA938; padding-bottom: 10px;">Welcome to Brahmani Jewellers</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Your account has been successfully created at <strong>Brahmani Jewellers</strong>.</p>
            <p>You can now explore our exclusive collection of gold and silver jewelry and shop directly from our platform.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://brahmani-jewellers.vercel.app/login" style="background-color: #3D2B1F; color: #EBA938; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Login to Your Account</a>
            </div>
            <p style="font-size: 0.9em; color: #666;">If you have any questions, feel free to contact us via WhatsApp or Phone.</p>
          </div>
        `;
        sendEmail(user.email, 'Account Created Successfully - Brahmani Jewellers', welcomeHtml).catch(console.error);
      } catch (err) {
        // Handled in helper
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Current User
router.get('/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Current User Profile
router.put('/auth/profile', auth, async (req, res) => {
  const { name, email, mobile } = req.body;
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (mobile) user.mobile = mobile;

    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Current User Profile
router.delete('/auth/profile', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get All Users (Admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a User (Admin only)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- RATE ROUTES ---

// Get Rates
router.get('/rates', async (req, res) => {
  try {
    const rate = await Rate.findOne().sort({ lastUpdated: -1 });
    res.json(rate || { gold22K: 0, gold18K: 0, silver90: 0, isManual: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Rates (Admin only)
router.post('/rates', auth, isAdmin, async (req, res) => {
  const { isManual, goldImpFine, silverFine, manualGold24K, manualGold22K, manualGold18K, manualSilver90 } = req.body;
  try {
    let rate = await Rate.findOne();
    if (!rate) {
      rate = new Rate();
    }
    
    rate.isManual = isManual !== undefined ? isManual : rate.isManual;
    
    if (rate.isManual) {
      if (manualGold24K !== undefined) rate.gold24K = manualGold24K;
      if (manualGold22K !== undefined) rate.gold22K = manualGold22K;
      if (manualGold18K !== undefined) rate.gold18K = manualGold18K;
      if (manualSilver90 !== undefined) rate.silver90 = manualSilver90;
    } else {
      if (goldImpFine !== undefined) rate.goldImpFine = goldImpFine;
      if (silverFine !== undefined) rate.silverFine = silverFine;
      
      // Automatic Calculations
      rate.gold24K = rate.goldImpFine; // 24K is the fine rate
      rate.gold22K = Math.round(rate.goldImpFine * 0.916);
      rate.gold18K = Math.round(rate.goldImpFine * 0.78);
      rate.silver90 = Math.round(rate.silverFine * 0.90);
    }

    rate.lastUpdated = Date.now();
    await rate.save();
    
    res.json(rate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GALLERY ROUTES ---

// Get Gallery Images
router.get('/gallery', async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload Image (Admin only)
router.post('/gallery', auth, isAdmin, (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { category, subCategory, name, description, weight, purity, price, targetPage, makingCharges, otherCharges } = req.body;
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

    const newItem = new Gallery({
      imageUrl: imageUrl,
      category,
      subCategory,
      name,
      description,
      targetPage: targetPage || 'both',
      weight: parseFloat(weight) || 0,
      purity,
      price: price ? Number(price) : undefined,
      makingCharges: parseFloat(makingCharges) || 0,
      otherCharges: parseFloat(otherCharges) || 0
    });

    await newItem.save();
    res.json(newItem);
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Edit Image/Details (Admin only)
router.put('/gallery/:id', auth, isAdmin, async (req, res) => {
  const { category, subCategory, name, description, weight, purity, price, targetPage, makingCharges, otherCharges } = req.body;
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (category) item.category = category;
    if (subCategory !== undefined) item.subCategory = subCategory;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (targetPage) item.targetPage = targetPage;
    if (weight !== undefined) item.weight = parseFloat(weight) || 0;
    if (purity) item.purity = purity;
    if (price !== undefined) item.price = price ? Number(price) : undefined;
    if (makingCharges !== undefined) item.makingCharges = parseFloat(makingCharges) || 0;
    if (otherCharges !== undefined) item.otherCharges = parseFloat(otherCharges) || 0;

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Image (Admin only)
router.delete('/gallery/:id', auth, isAdmin, async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Optional: Delete from cloudinary too using public_id
    // But for now, just remove from DB
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- MESSAGE ROUTES ---

// Submit a message (Public)
router.post('/messages', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all messages (Admin only)
router.get('/messages', auth, isAdmin, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a message (Admin only)
router.delete('/messages/:id', auth, isAdmin, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEWSLETTER SUBSCRIBER ROUTES ---

// Subscribe to newsletter (Public)
router.post('/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'This email is already subscribed to our newsletter' });
    }

    const newSubscriber = new Subscriber({ email: email.toLowerCase() });
    await newSubscriber.save();

    // Send luxurious golden welcome email to subscriber
    try {
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid #EBA938; border-radius: 8px; padding: 25px; background-color: #FFF6E6;">
          <div style="text-align: center; border-bottom: 1px solid #EBA938; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #3D2B1F; margin: 0; font-family: 'Georgia', serif; font-size: 2em; letter-spacing: 2px;">Brahmani Jewellers</h1>
            <p style="color: #EBA938; margin: 5px 0 0 0; text-transform: uppercase; font-size: 0.8em; letter-spacing: 3px;">Luxury Ornaments & Fine Jewellery</p>
          </div>
          <p>Hello,</p>
          <p>Thank you for subscribing to the <strong>Brahmani Jewellers VIP List</strong>. We are thrilled to have you join our exclusive circle of patrons.</p>
          <p>As a VIP member, you will be the first to receive:</p>
          <ul style="padding-left: 20px; color: #3D2B1F;">
            <li style="margin-bottom: 8px;"><strong>Exclusive Previews</strong> of our latest pure Gold and designer Silver collections.</li>
            <li style="margin-bottom: 8px;"><strong>Early Access</strong> to seasonal exhibitions and special patron offers.</li>
            <li style="margin-bottom: 8px;"><strong>Curated Insights</strong> into jewellery care and trends.</li>
          </ul>
          <div style="background-color: #FCF0DA; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px solid rgba(235, 169, 56, 0.3);">
            <h3 style="color: #3D2B1F; margin: 0 0 10px 0; font-family: 'Georgia', serif;">VIP PATRON STATUS: CONFIRMED</h3>
            <p style="color: #666; font-size: 0.9em; margin: 0;">You will receive your exclusive updates directly at <strong>${email.toLowerCase()}</strong>.</p>
          </div>
          <p style="font-size: 0.95em; color: #3D2B1F;">Should you ever have any enquiries about our collections or bespoke designs, please feel free to reach out to us at <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #EBA938; text-decoration: none; font-weight: bold;">info.brahmanijewellers@gmail.com</a>.</p>
          <p style="margin-top: 30px; font-style: italic; color: #666; font-size: 0.9em; text-align: center; border-top: 1px solid rgba(61, 43, 31, 0.1); padding-top: 15px;">
            "Elegance that defines you."
          </p>
        </div>
      `;
      await sendEmail(email.toLowerCase(), 'VIP Subscription Confirmed - Brahmani Jewellers', welcomeHtml);
    } catch (err) {
      console.error('[SUBSCRIBER EMAIL ERROR]:', err);
    }

    res.status(201).json({ message: 'Successfully subscribed to our VIP newsletter!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all newsletter subscribers (Admin only)
router.get('/subscribers', auth, isAdmin, async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a newsletter subscriber (Admin only)
router.delete('/subscribers/:id', auth, isAdmin, async (req, res) => {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subscriber deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CART ROUTES ---

// Get User Cart
router.get('/cart', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user }).populate('items.product');
    if (!cart) {
      cart = new Cart({ user: req.user, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Item to Cart
router.post('/cart/add', auth, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user });
    if (!cart) {
      cart = new Cart({ user: req.user, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Item Quantity
router.put('/cart/update', auth, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const cart = await Cart.findOne({ user: req.user });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
    }
    const updatedCart = await Cart.findOne({ user: req.user }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove Item from Cart
router.delete('/cart/remove/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(p => p.product.toString() !== req.params.productId);
    await cart.save();
    
    const updatedCart = await Cart.findOne({ user: req.user }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ORDER ROUTES ---

// Place a new order
router.post('/orders', auth, async (req, res) => {
  const { items, totalAmount, shippingAddress, paymentMethod } = req.body;
  try {
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

    const newOrder = new Order({
      user: req.user,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod
    });

    await newOrder.save();

    // Clear the cart after placing order
    await Cart.findOneAndDelete({ user: req.user });

    res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User Orders
router.get('/orders/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user }).sort({ createdAt: -1 }).populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Orders (Admin only)
router.get('/admin/orders', auth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email mobile').populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Order Status (Admin only)
router.put('/admin/orders/:id', auth, isAdmin, async (req, res) => {
  const { status, paymentStatus } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
