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
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { createShipment } = require('../services/delhivery');

// Razorpay Configuration
let razorpayInstance = null;
try {
  const rzpKey = process.env.RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  if (rzpKey && rzpKey !== 'rzp_test_mockKeyId123' && rzpKey !== '') {
    razorpayInstance = new Razorpay({
      key_id: rzpKey,
      key_secret: rzpSecret
    });
    console.log('Razorpay configured successfully! 💳');
  } else {
    console.warn('[WARNING] Razorpay is running in SIMULATION mode.');
  }
} catch (err) {
  console.error('Razorpay config error:', err.message);
}

// Cloudinary Configuration
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured successfully! ☁️');
} else {
  console.warn('[WARNING] Cloudinary is not configured in .env. Falling back to local/base64 storage.');
}

// API Health Check
router.get('/', (req, res) => {
  res.json({ 
    message: 'Brahmani Jewellers API is running successfully! ✅', 
    status: 'online', 
    version: '1.3.0-email-otp-fixed',
    emailUserConfigured: !!process.env.EMAIL_USER,
    emailPassConfigured: !!process.env.EMAIL_PASS
  });
});

// Live SMTP Email Debug Endpoint
router.get('/auth/debug-email', async (req, res) => {
  const { to } = req.query;
  if (!to) return res.status(400).json({ error: 'Please provide a "to" email address in the query' });
  
  try {
    console.log(`[DEBUG EMAIL] Triggered test email to ${to}...`);
    await sendEmail(to, 'Brahmani Jewellers Live SMTP Debug Test', '<h3>Hello! If you see this, the live website SMTP works perfectly.</h3>');
    res.json({ success: true, message: `Debug email successfully sent to ${to}!` });
  } catch (err) {
    console.error(`[DEBUG EMAIL ERROR]:`, err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: err.message,
      stack: err.stack,
      envUser: process.env.EMAIL_USER ? 'Configured' : 'Missing',
      envPass: process.env.EMAIL_PASS ? 'Configured' : 'Missing'
    });
  }
});


// Models
const Rate = require('../models/Rate');
const Gallery = require('../models/Gallery');
const User = require('../models/User');
const Message = require('../models/Message');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Subscriber = require('../models/Subscriber');
const Review = require('../models/Review');
const InstagramPost = require('../models/InstagramPost');

// Gmail API OAuth2 Helpers
const getGmailAccessToken = async () => {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail API OAuth2 credentials missing in .env');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to refresh Gmail access token: ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
};

const sendViaGmailApi = async (to, subject, html) => {
  const accessToken = await getGmailAccessToken();
  const fromName = 'Brahmani Jewellers';
  const fromEmail = process.env.EMAIL_USER || 'info.brahmanijewellers@gmail.com';

  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@gmail.com>`;
  const dateStr = new Date().toUTCString();
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: "${fromName}" <${fromEmail}>`,
    `To: ${to}`,
    `Date: ${dateStr}`,
    `Message-ID: ${messageId}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    '',
    html
  ];
  const message = messageParts.join('\r\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedMessage
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail API send failed: ${errText}`);
  }

  return await response.json();
};

// Email Helper Function
const sendEmail = async (to, subject, html) => {
  // 1. Try sending via Gmail API (OAuth2 over HTTP) if credentials are provided
  // This is 100% reliable on Render as it uses HTTPS port 443!
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    console.log(`[EMAIL SETUP] Attempting HTTP send via Gmail API for ${to}...`);
    try {
      await sendViaGmailApi(to, subject, html);
      console.log(`[EMAIL SUCCESS] Sent successfully via Gmail API to ${to} ✅`);
      return;
    } catch (apiErr) {
      console.error(`[EMAIL WARNING] Gmail API failed:`, apiErr.message);
    }
  }

  // 2. Try sending via Brevo (Sendinblue) HTTP API if API key is provided
  // This is 100% reliable on Render because it runs over HTTPS (Port 443) which is never blocked!
  if (process.env.BREVO_API_KEY) {
    console.log(`[EMAIL SETUP] Attempting HTTP API send via Brevo for ${to}...`);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'Brahmani Jewellers', email: 'info.brahmanijewellers@gmail.com' },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      }, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      });
      console.log(`[EMAIL SUCCESS] Sent successfully via Brevo HTTP API to ${to} ✅`);
      return;
    } catch (apiErr) {
      console.error(`[EMAIL WARNING] Brevo HTTP API failed:`, apiErr.response?.data || apiErr.message);
    }
  }

  // 2. Try sending via Resend HTTP API if API key is provided (Alternative HTTP API)
  if (process.env.RESEND_API_KEY) {
    console.log(`[EMAIL SETUP] Attempting HTTP API send via Resend for ${to}...`);
    try {
      await axios.post('https://api.resend.com/emails', {
        from: 'Brahmani Jewellers <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[EMAIL SUCCESS] Sent successfully via Resend HTTP API to ${to} ✅`);
      return;
    } catch (apiErr) {
      console.error(`[EMAIL WARNING] Resend HTTP API failed:`, apiErr.response?.data || apiErr.message);
    }
  }

  // 3. Fallback: Standard SMTP Transporter (Only works locally because Render blocks SMTP ports)
  const customHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const customPort = parseInt(process.env.EMAIL_PORT) || 465;
  const customUser = process.env.EMAIL_USER;
  const customPass = process.env.EMAIL_PASS;
  
  if (customUser && customPass) {
    console.log(`[EMAIL SETUP] Attempting custom SMTP send via ${customHost}:${customPort} using ${customUser}...`);
    try {
      const transporter = nodemailer.createTransport({
        host: customHost,
        port: customPort,
        secure: customPort === 465,
        auth: {
          user: customUser,
          pass: customPass
        },
        family: 4, // Force IPv4 to prevent Render IPv6 timeout
        tls: {
          rejectUnauthorized: false
        }
      });
      await transporter.sendMail({
        from: `"Brahmani Jewellers" <${customUser}>`,
        to,
        subject,
        html
      });
      console.log(`[EMAIL SUCCESS] Sent successfully via custom SMTP to ${to}`);
      return; // Success! Skip fallback
    } catch (customErr) {
      console.error(`[EMAIL WARNING] Custom SMTP failed. Retrying with guaranteed fallback. Error:`, customErr.message);
    }
  }

  // 4. Guaranteed Local Fallback: Force send using our 100% verified working Google App Credentials
  const fallbackUser = 'info.brahmanijewellers@gmail.com';
  const fallbackPass = 'drwcqzjagditmxke';
  console.log(`[EMAIL SETUP] Attempting fallback SMTP send via smtp.gmail.com:465 using ${fallbackUser}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: fallbackUser,
      pass: fallbackPass
    },
    family: 4, // Force IPv4 to prevent Render IPv6 timeout
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.sendMail({
      from: `"Brahmani Jewellers" <${fallbackUser}>`,
      to,
      subject,
      html
    });
    console.log(`[EMAIL SUCCESS] Sent successfully via fallback SMTP to ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Both custom and fallback SMTP failed for ${to}:`, err);
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

    const newUser = new User({ name, email: email ? email.toLowerCase() : undefined, mobile, password: hashedPassword, country, state, city, isApproved: false });
    
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
            <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">Thank you for registering an account with Brahmani Jewellers. To complete your registration and secure your profile, please verify your email address by clicking the button below or using the OTP verification code.</p>
            
            <!-- OTP Verification Code Card -->
            <div style="background-color: #FCF0DA; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px solid #EBA938;">
              <p style="margin: 0 0 10px 0; color: #3D2B1F; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your OTP Verification Code</p>
              <h1 style="letter-spacing: 5px; color: #3D2B1F; margin: 0; font-size: 2.2em; font-family: monospace;">${otp}</h1>
              <p style="color: #666; font-size: 12px; margin-top: 10px; margin-bottom: 0;">This verification code is valid for 10 minutes.</p>
            </div>

            <!-- Verification Button Link -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verifyUrl}" style="background-color: #3D2B1F; color: #FFFDF9; border: 1px solid #d4af37; padding: 14px 35px; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(61, 43, 31, 0.15);">Verify Email Address Directly</a>
            </div>
            
            <p style="font-size: 13px; color: #7A695D; text-align: center; margin-top: 10px; margin-bottom: 25px;">The verification button link is valid for 24 hours.</p>
            
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

// 1. GET /auth/verify-email - Renders a luxurious confirmation landing page
router.get('/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    let clientUrl = process.env.FRONTEND_URL || 'https://brahmanijewellers.com';
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
      return res.status(400).send(`
        <div style="font-family: Georgia, serif; text-align: center; margin-top: 100px; padding: 40px; background-color: #FFFDF9; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <h2 style="color: #d9534f; margin-bottom: 20px;">Invalid or Expired Link</h2>
          <p style="color: #5C4A3E; margin-bottom: 30px; line-height: 1.6;">The verification link is invalid, expired, or has already been used.</p>
          <a href="${clientUrl}/login" style="background-color: #3D2B1F; color: #FFFDF9; border: 1px solid #d4af37; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Go to Login</a>
        </div>
      `);
    }

    // Render verification landing page
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verify Your Account - Brahmani Jewellers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Georgia', serif;
            background-color: #FCF9F3;
            color: #3D2B1F;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background-color: #FFFDF9;
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 12px;
            padding: 50px 30px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(61, 43, 31, 0.05);
          }
          h1 {
            font-size: 28px;
            margin-top: 0;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #3D2B1F;
          }
          .subtitle {
            color: #d4af37;
            font-size: 11px;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 40px;
            font-weight: bold;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #5C4A3E;
            margin-bottom: 35px;
          }
          button {
            background-color: #3D2B1F;
            color: #FFFDF9;
            border: 1px solid #d4af37;
            padding: 15px 40px;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            text-transform: uppercase;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(61, 43, 31, 0.15);
          }
          button:hover {
            background-color: #d4af37;
            color: #3D2B1F;
            border-color: #3D2B1F;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Brahmani Jewellers</h1>
          <div class="subtitle">Purity & Trust Since 1992</div>
          <p>Please click the button below to confirm your email address and activate your account.</p>
          <form action="/api/auth/verify-email" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <button type="submit">Verify & Activate Account</button>
          </form>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[VERIFY EMAIL GET ERROR]:', err);
    res.status(500).send('Server error');
  }
});

// 2. POST /auth/verify-email - Performs the actual user verification
router.post('/auth/verify-email', async (req, res) => {
  const { token } = req.body;
  try {
    let clientUrl = process.env.FRONTEND_URL || 'https://brahmanijewellers.com';
    const host = req.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168')) {
      clientUrl = 'http://localhost:5173';
    }

    if (!token) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px; padding: 20px;">
          <h2 style="color: #d9534f;">Verification Failed</h2>
          <p>Verification token is missing.</p>
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

    // Send Welcome / Successful Registration Email if it's the first time
    if (!user.lastLogin && user.email) {
      try {
        const welcomeHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 40px 30px; background-color: #FFFDF9; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #3D2B1F; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Brahmani Jewellers</h1>
              <p style="color: #d4af37; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Purity & Trust Since 1992</p>
            </div>
            <h2 style="color: #3D2B1F; font-size: 20px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; text-align: center; letter-spacing: 1px;">Account Successfully Verified</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">Dear <strong>${user.name}</strong>,</p>
            <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">Congratulations! Your email address has been successfully verified, and your Brahmani Jewellers account is now active.</p>
            
            <div style="background-color: #FDF9F3; border-left: 3px solid #d4af37; padding: 15px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 13px; color: #5C4A3E;"><strong>Your Registration Details:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #7A695D;"><strong>Name:</strong> ${user.name}</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; color: #7A695D;"><strong>Registered Email / Username:</strong> ${user.email}</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; color: #7A695D;"><strong>Registered Mobile:</strong> ${user.mobile}</p>
            </div>

            <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">You can now log in using your password or via OTP. Explore our exclusive collections of gold and silver jewelry and shop directly from our platform.</p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${clientUrl}/login" style="background-color: #3D2B1F; color: #FFFDF9; border: 1px solid #d4af37; padding: 14px 35px; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(61, 43, 31, 0.15);">Login to Your Account</a>
            </div>
            
            <p style="font-size: 14px; color: #7A695D; margin-bottom: 0; text-align: center;">If you have any questions, feel free to contact us at <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #d4af37; text-decoration: none;">info.brahmanijewellers@gmail.com</a>.</p>
            
            <div style="margin-top: 40px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 25px; font-size: 13px; color: #7A695D; text-align: center;">
              <p style="margin: 0; font-weight: bold; color: #3D2B1F;">Brahmani Jewellers Team</p>
            </div>
          </div>
        `;
        sendEmail(user.email, 'Account Created & Verified Successfully - Brahmani Jewellers', welcomeHtml).catch(console.error);
      } catch (err) {
        // Handled
      }
    }

    // Redirect to login page with success message
    const redirectUrl = `${clientUrl}/login?verified=true&message=Your email has been successfully verified! You can now log in.`;
    return res.redirect(redirectUrl);
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
  const { identifier, password, source } = req.body;
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

    if (source === 'app' && !user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is pending approval from the administrator to access the mobile application. You will receive an email once approved.', unapproved: true });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const userRole = (user.role === 'admin' && user.email === 'info.brahmanijewellers@gmail.com') ? 'admin' : 'customer';
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: userRole } });
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

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password. Please choose a different one.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request OTP for Login
router.post('/auth/request-otp', async (req, res) => {
  const { identifier, source } = req.body;
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

    // Enforce email verification link first
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Your account is not verified yet. Please check your email for the verification link.', unverified: true });
    }

    if (source === 'app' && !user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is pending approval from the administrator to access the mobile application. You will receive an email once approved.', unapproved: true });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 mins
    await user.save();

    console.log(`[MOCK OTP] Your OTP for ${identifier} is ${otp}`);

    if (user.email) {
      // Send Email Asynchronously in the Background to eliminate client-side buffering!
      const otpHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 40px 30px; background-color: #FFFDF9; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #3D2B1F; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Brahmani Jewellers</h1>
            <p style="color: #d4af37; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Purity & Trust Since 1992</p>
          </div>
          <h3 style="color: #3D2B1F; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Login Verification Code</h3>
          <p style="font-size: 16px; margin-bottom: 10px;">Dear <strong>${user.name}</strong>,</p>
          <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">You requested a login OTP for your Brahmani Jewellers account.</p>
          <div style="background-color: #FCF0DA; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px solid #EBA938;">
            <p style="margin: 0 0 10px 0; color: #3D2B1F; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
            <h1 style="letter-spacing: 5px; color: #3D2B1F; margin: 0; font-size: 2.2em; font-family: monospace;">${otp}</h1>
            <p style="color: #666; font-size: 12px; margin-top: 10px; margin-bottom: 0;">This code will expire in 2 minutes.</p>
          </div>
          <p style="font-size: 14px; color: #7A695D; margin-bottom: 25px;">If you didn't request this, please ignore this email or contact support.</p>
          <div style="margin-top: 40px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 25px; font-size: 13px; color: #7A695D; text-align: center;">
            <p style="margin: 0; font-weight: bold; color: #3D2B1F;">Brahmani Jewellers Team</p>
            <p style="margin: 5px 0 0 0;">For inquiries: <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #d4af37; text-decoration: none;">info.brahmanijewellers@gmail.com</a></p>
          </div>
        </div>
      `;
      sendEmail(user.email, 'Your Login OTP - Brahmani Jewellers', otpHtml).catch((err) => {
        console.error(`[OTP EMAIL ERROR]:`, err);
      });
      
      // Mask the email for security (e.g. akshay@gmail.com becomes ak***@gmail.com)
      const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
      res.json({ message: `OTP has been successfully sent to your registered email: ${maskedEmail}` });
    } else {
      res.status(400).json({ message: 'No registered email found for this user.' });
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

    const clientUrl = req.headers.origin || 'https://brahmanijewellers.com';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    
    try {
      const resetHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 40px 30px; background-color: #FFFDF9; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #3D2B1F; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Brahmani Jewellers</h1>
            <p style="color: #d4af37; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Purity & Trust Since 1992</p>
          </div>
          <h2 style="color: #3D2B1F; font-size: 20px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Password Reset Request</h2>
          <p style="font-size: 16px; margin-bottom: 10px;">Dear Customer,</p>
          <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">You requested to reset your password for your Brahmani Jewellers account. Click the button below to choose a new password.</p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${resetUrl}" style="background-color: #3D2B1F; color: #FFFDF9; border: 1px solid #d4af37; padding: 14px 35px; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(61, 43, 31, 0.15);">Reset Password</a>
          </div>
          
          <p style="font-size: 13px; color: #7A695D; text-align: center; margin-top: 10px; margin-bottom: 25px;">This password reset link is valid for 30 minutes.</p>
          
          <div style="background-color: #FDF9F3; border-left: 3px solid #d4af37; padding: 15px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 13px; color: #5C4A3E; font-style: italic;">If the button above does not work, copy and paste the following URL into your browser:</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #d4af37; word-break: break-all;"><a href="${resetUrl}" style="color: #d4af37; text-decoration: underline;">${resetUrl}</a></p>
          </div>
          
          <p style="font-size: 14px; color: #5C4A3E; margin-bottom: 0;">If you did not make this request, you can safely ignore this email; your password will remain unchanged.</p>
          
          <div style="margin-top: 40px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 25px; font-size: 13px; color: #7A695D; text-align: center;">
            <p style="margin: 0; font-weight: bold; color: #3D2B1F;">Brahmani Jewellers Team</p>
            <p style="margin: 5px 0 0 0;">For inquiries: <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #d4af37; text-decoration: none;">info.brahmanijewellers@gmail.com</a></p>
          </div>
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

    // Check if new password matches current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password. Please choose a different one.' });
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
  const { identifier, otp, source } = req.body;
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

    if (source === 'app' && !user.isApproved && user.role !== 'admin') {
      return res.status(403).json({ message: 'Your account is pending approval from the administrator to access the mobile application. You will receive an email once approved.', unapproved: true });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

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

// Approve/Disapprove User (Admin only)
router.put('/users/:id/approve', auth, isAdmin, async (req, res) => {
  const { isApproved } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isApproved = isApproved;
    await user.save();

    // Send notification email to the user when their account is approved
    if (isApproved && user.email) {
      try {
        const clientUrl = process.env.CLIENT_URL || 'https://brahmanijewellers.com';
        const approvalHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 40px 30px; background-color: #FFFDF9; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #3D2B1F; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Brahmani Jewellers</h1>
              <p style="color: #d4af37; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Purity & Trust Since 1992</p>
            </div>
            <h2 style="color: #3D2B1F; font-size: 20px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; text-align: center; letter-spacing: 1px;">Account Approved</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">Dear <strong>${user.name}</strong>,</p>
            <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">We are pleased to inform you that your Brahmani Jewellers account has been approved by our administrator.</p>
            <p style="font-size: 15px; color: #5C4A3E; margin-bottom: 25px;">You now have full access to log in, view live rates, explore collections, and make purchases.</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${clientUrl}/login" style="background-color: #3D2B1F; color: #FFFDF9; border: 1px solid #d4af37; padding: 14px 35px; text-decoration: none; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; display: inline-block;">Login to Your Account</a>
            </div>
            <div style="margin-top: 40px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 25px; font-size: 13px; color: #7A695D; text-align: center;">
              <p style="margin: 0; font-weight: bold; color: #3D2B1F;">Brahmani Jewellers Team</p>
              <p style="margin: 5px 0 0 0;">For inquiries: <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #d4af37; text-decoration: none;">info.brahmanijewellers@gmail.com</a></p>
            </div>
          </div>
        `;
        sendEmail(user.email, 'Account Approved - Brahmani Jewellers', approvalHtml).catch(console.error);
      } catch (err) {
        console.error('[APPROVAL EMAIL ERROR]:', err);
      }
    }

    res.json({ message: `User account has been ${isApproved ? 'approved' : 'disapproved'} successfully`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- RATE ROUTES ---

// Get Rates
router.get('/rates', async (req, res) => {
  try {
    const rate = await Rate.findOne().sort({ lastUpdated: -1 });
    res.json(rate || { gold22K: 0, gold18K: 0, silver90: 0, isManual: true, freeDeliveryKmLimit: 10, deliveryChargePerKm: 15 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Rates (Admin only)
router.post('/rates', auth, isAdmin, async (req, res) => {
  const { isManual, goldImpFine, silverFine, manualGold24K, manualGold22K, manualGold18K, manualSilver90, freeDeliveryKmLimit, deliveryChargePerKm, bankName, bankAccountName, bankAccountNumber, bankIfsc, bankBranch } = req.body;
  try {
    let rate = await Rate.findOne();
    if (!rate) {
      rate = new Rate();
    }
    
    rate.isManual = isManual !== undefined ? isManual : rate.isManual;
    if (freeDeliveryKmLimit !== undefined) rate.freeDeliveryKmLimit = freeDeliveryKmLimit;
    if (deliveryChargePerKm !== undefined) rate.deliveryChargePerKm = deliveryChargePerKm;
    
    // Update Bank Details if provided
    if (bankName !== undefined) rate.bankName = bankName;
    if (bankAccountName !== undefined) rate.bankAccountName = bankAccountName;
    if (bankAccountNumber !== undefined) rate.bankAccountNumber = bankAccountNumber;
    if (bankIfsc !== undefined) rate.bankIfsc = bankIfsc;
    if (bankBranch !== undefined) rate.bankBranch = bankBranch;

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

// --- REVIEW ROUTES ---

// Get Reviews & Stats
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    // Calculate Stats
    let totalCount = reviews.length;
    let averageRating = 0;
    
    if (totalCount > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = parseFloat((sum / totalCount).toFixed(1));
    } else {
      // Default fallback reviews to show if DB is empty
      const defaultReviews = [
        {
          name: "Rakesh Patel",
          rating: 5,
          text: "Excellent collection of gold and antique jewellery. The staff is very polite and rates are genuine. Highly recommended!",
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        },
        {
          name: "Meghna Shah",
          rating: 5,
          text: "Bought my bridal jewellery from Brahmani Jewellers. The designs are unique and they explained the purity details very well. Very trustworthy.",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: "Dinesh Prajapati",
          rating: 5,
          text: "Best jewellery showroom in Amraiwadi. We have been their customers for 15 years. They always provide the best service and 100% pure gold.",
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      ];
      
      return res.json({
        reviews: defaultReviews,
        averageRating: 5.0,
        totalCount: 3
      });
    }
    
    res.json({
      reviews,
      averageRating,
      totalCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Logged-in User's Review
router.get('/reviews/my', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ user: req.user });
    res.json({ review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Post or Edit a Review (Authenticated)
router.post('/reviews', auth, async (req, res) => {
  const { rating, text } = req.body;
  if (rating === undefined || !text) {
    return res.status(400).json({ message: 'Rating and text are required.' });
  }
  
  try {
    // Get user details to populate the real name
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has already submitted a review
    let review = await Review.findOne({ user: req.user });
    
    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.text = text;
      // In case they updated their name in their profile
      review.name = user.name;
      review.createdAt = Date.now(); // update time to float it to the top
      
      const updatedReview = await review.save();
      return res.json({ message: 'Review updated successfully!', review: updatedReview });
    } else {
      // Create new review
      review = new Review({
        user: req.user,
        name: user.name,
        rating: Number(rating),
        text
      });
      
      const newReview = await review.save();
      return res.status(201).json({ message: 'Review submitted successfully!', review: newReview });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// --- INSTAGRAM SHOWCASE ROUTES ---

// Get all Instagram posts
router.get('/instagram', async (req, res) => {
  try {
    const posts = await InstagramPost.find().sort({ createdAt: -1 });
    
    if (posts.length > 0) {
      return res.json(posts);
    }
    
    // Default seed posts if database is empty
    const instagramUrl = "https://www.instagram.com/brahmanijewellers___?igsh=MTBpaW9kbWx2cTI0dg%3D%3D&utm_source=qr";
    const defaultPosts = [
      {
        _id: "default1",
        imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80",
        likes: 342,
        comments: 24,
        caption: "Timeless elegance in pure gold. ✨",
        postUrl: instagramUrl
      },
      {
        _id: "default2",
        imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
        likes: 512,
        comments: 45,
        caption: "Exquisite bridal sets hand-crafted for your special day. 👑",
        postUrl: instagramUrl
      },
      {
        _id: "default3",
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80",
        likes: 289,
        comments: 12,
        caption: "Adorn yourself with pure gold rings. 💍",
        postUrl: instagramUrl
      },
      {
        _id: "default4",
        imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80",
        likes: 601,
        comments: 58,
        caption: "Celebrate tradition with our classic royal bangles. 🌸",
        postUrl: instagramUrl
      },
      {
        _id: "default5",
        imageUrl: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=600&q=80",
        likes: 418,
        comments: 30,
        caption: "Designs that inspire trust for 35+ years. 💛",
        postUrl: instagramUrl
      },
      {
        _id: "default6",
        imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80",
        likes: 375,
        comments: 19,
        caption: "Add a touch of royalty with our premium collection. ✨",
        postUrl: instagramUrl
      }
    ];
    
    res.json(defaultPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload Instagram Post (Admin only)
router.post('/instagram', auth, isAdmin, (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { postUrl, caption, likes, comments } = req.body;
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    if (!postUrl) return res.status(400).json({ message: 'Instagram post URL is required' });

    let imageUrl = '';
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

    if (isCloudinaryConfigured) {
      const { Readable } = require('stream');
      const uploadPromise = () => new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'brahmani_instagram',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        Readable.from(req.file.buffer).pipe(uploadStream);
      });
      imageUrl = await uploadPromise();
    } else {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      imageUrl = `data:${req.file.mimetype};base64,${b64}`;
    }

    const newPost = new InstagramPost({
      imageUrl,
      postUrl,
      caption,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Instagram upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Edit Instagram Post details (Admin only)
router.put('/instagram/:id', auth, isAdmin, async (req, res) => {
  const { postUrl, caption, likes, comments } = req.body;
  try {
    const post = await InstagramPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Instagram post not found' });

    if (postUrl !== undefined) post.postUrl = postUrl;
    if (caption !== undefined) post.caption = caption;
    if (likes !== undefined) post.likes = Number(likes) || 0;
    if (comments !== undefined) post.comments = Number(comments) || 0;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Instagram Post (Admin only)
router.delete('/instagram/:id', auth, isAdmin, async (req, res) => {
  try {
    const post = await InstagramPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Instagram post not found' });

    // Delete from Cloudinary if configured
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    if (isCloudinaryConfigured && post.imageUrl && post.imageUrl.includes('cloudinary.com')) {
      try {
        const parts = post.imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
          const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log(`Successfully deleted Instagram image from Cloudinary: ${publicId}`);
          }
        }
      } catch (cloudinaryErr) {
        console.error('Failed to delete Instagram image from Cloudinary:', cloudinaryErr);
      }
    }

    await InstagramPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Instagram post deleted successfully' });
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

    let imageUrl = '';
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary using stream
      const { Readable } = require('stream');
      const uploadPromise = () => new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'brahmani_jewellers',
            resource_type: 'image'
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        Readable.from(req.file.buffer).pipe(uploadStream);
      });
      imageUrl = await uploadPromise();
    } else {
      // Fallback to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      imageUrl = `data:${req.file.mimetype};base64,${b64}`;
    }

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

    // Delete from Cloudinary if configured and the image is stored there
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    if (isCloudinaryConfigured && item.imageUrl && item.imageUrl.includes('cloudinary.com')) {
      try {
        const parts = item.imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
          const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
          }
        }
      } catch (cloudinaryErr) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryErr);
      }
    }

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

    // Send luxurious golden email notification to the agent/admin
    try {
      const adminEmail = 'info.brahmanijewellers@gmail.com';
      const notificationHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid #EBA938; border-radius: 8px; padding: 25px; background-color: #FFF6E6;">
          <div style="text-align: center; border-bottom: 1px solid #EBA938; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="color: #3D2B1F; margin: 0; font-family: 'Georgia', serif; font-size: 1.8em; letter-spacing: 1px;">Brahmani Jewellers</h1>
            <p style="color: #EBA938; margin: 5px 0 0 0; text-transform: uppercase; font-size: 0.8em; letter-spacing: 2px;">New Customer Message</p>
          </div>
          
          <p>Dear Admin,</p>
          <p>A new customer has sent a direct message through the online contact form. Here are the details:</p>
          
          <div style="background-color: #FCF0DA; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(235, 169, 56, 0.3);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 120px; color: #3D2B1F; vertical-align: top;">Name:</td>
                <td style="padding: 6px 0; color: #5C4A3E;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #3D2B1F; vertical-align: top;">Email:</td>
                <td style="padding: 6px 0; color: #5C4A3E;"><a href="mailto:${email}" style="color: #EBA938; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #3D2B1F; vertical-align: top;">Date:</td>
                <td style="padding: 6px 0; color: #5C4A3E;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 6px 0; font-weight: bold; color: #3D2B1F; vertical-align: top;" colspan="2">Message:</td>
              </tr>
              <tr>
                <td style="padding: 10px; background-color: #FFFDF9; border: 1px solid rgba(61, 43, 31, 0.1); border-radius: 4px; color: #5C4A3E; white-space: pre-wrap;" colspan="2">${message}</td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 0.9em; color: #666; text-align: center; margin-top: 25px; border-top: 1px solid rgba(61, 43, 31, 0.1); padding-top: 15px;">
            This inquiry was sent automatically from the Brahmani Jewellers web application contact portal.
          </p>
        </div>
      `;
      // Send email to admin asynchronously to avoid blocking client response
      sendEmail(adminEmail, `New Customer Message from ${name}`, notificationHtml).catch(err => {
        console.error('[MESSAGE EMAIL ERROR]:', err);
      });
    } catch (emailErr) {
      console.error('[MESSAGE EMAIL SETUP ERROR]:', emailErr);
    }

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

// Send a broadcast email to all newsletter subscribers (Admin only)
router.post('/subscribers/broadcast', auth, isAdmin, async (req, res) => {
  const { subject, message } = req.body;
  
  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required.' });
  }

  try {
    const subscribers = await Subscriber.find();
    if (subscribers.length === 0) {
      return res.status(404).json({ message: 'No subscribers found to send email to.' });
    }

    // Send emails in parallel to keep it fast
    const emailPromises = subscribers.map(s => {
      const broadcastHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #3D2B1F; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 40px 30px; background-color: #FFFDF9; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #3D2B1F; font-size: 28px; font-weight: 700; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Brahmani Jewellers</h1>
            <p style="color: #d4af37; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Purity & Trust Since 1992</p>
          </div>
          
          <h2 style="color: #3D2B1F; font-size: 18px; margin-bottom: 20px; border-left: 3px solid #d4af37; padding-left: 10px;">${subject}</h2>
          
          <div style="font-size: 15px; color: #5C4A3E; margin-bottom: 30px; white-space: pre-wrap;">${message}</div>
          
          <div style="background-color: #FDF9F3; border-top: 1px solid rgba(212, 175, 55, 0.2); padding: 20px; margin-top: 30px; text-align: center; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #7A695D;">You received this email because you subscribed to updates from Brahmani Jewellers.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #d4af37;">Visit our website: <a href="https://brahmanijewellers.vercel.app" style="color: #d4af37; text-decoration: underline;">brahmanijewellers.vercel.app</a></p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; font-size: 13px; color: #7A695D;">
            <p style="margin: 0; font-weight: bold; color: #3D2B1F;">Brahmani Jewellers Team</p>
            <p style="margin: 5px 0 0 0;">Inquiries: <a href="mailto:info.brahmanijewellers@gmail.com" style="color: #d4af37; text-decoration: none;">info.brahmanijewellers@gmail.com</a></p>
          </div>
        </div>
      `;
      return sendEmail(s.email, subject, broadcastHtml).catch(err => {
        console.error(`[BROADCAST ERROR] Failed to send to ${s.email}:`, err);
      });
    });

    await Promise.all(emailPromises);

    res.json({ message: `Successfully sent broadcast email to ${subscribers.length} subscribers!` });
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

// Place a new order (COD flow)
router.post('/orders', auth, async (req, res) => {
  const { items, totalAmount, shippingAddress, paymentMethod, shippingCharge, distanceKm } = req.body;
  try {
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });

    const newOrder = new Order({
      user: req.user,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      shippingCharge: shippingCharge || 0,
      distanceKm: distanceKm || 0
    });

    await newOrder.save();

    // Auto-trigger Delhivery shipment
    try {
      const shipRes = await createShipment(newOrder);
      if (shipRes.success) {
        newOrder.trackingId = shipRes.trackingId;
        newOrder.status = 'Processing';
        await newOrder.save();
      }
    } catch (shipErr) {
      console.error('[Delhivery Auto Shipment Error]:', shipErr.message);
    }

    // Clear the cart after placing order
    await Cart.findOneAndDelete({ user: req.user });

    // Update targetPage to 'collection' for all purchased items in the order
    try {
      for (const item of items) {
        await Gallery.findByIdAndUpdate(item.product, { targetPage: 'collection' });
      }
      console.log(`[Gallery Auto-Hide] Updated ordered items to collection-only page for order ${newOrder._id}`);
    } catch (hideErr) {
      console.error('[Gallery Auto-Hide Error]:', hideErr.message);
    }

    res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a Razorpay Order
router.post('/orders/razorpay-order', auth, async (req, res) => {
  const { totalAmount } = req.body;
  try {
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    if (razorpayInstance) {
      const options = {
        amount: Math.round(totalAmount * 100), // amount in paisa
        currency: 'INR',
        receipt: 'receipt_' + Date.now()
      };
      const order = await razorpayInstance.orders.create(options);
      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } else {
      // Mock Mode: Generate a mock Razorpay Order ID
      const mockOrderId = 'order_mock_' + Math.random().toString(36).substring(2, 15);
      res.json({
        id: mockOrderId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        isMock: true
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Razorpay Payment and Place Order
router.post('/orders/verify-payment', auth, async (req, res) => {
  const { orderData, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  try {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    let isVerified = false;

    // Verify payment signature
    if (razorpayInstance) {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing Razorpay parameters' });
      }
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');

      if (generated_signature === razorpay_signature) {
        isVerified = true;
      } else {
        return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
      }
    } else {
      // Mock Mode: automatically verify payment
      isVerified = true;
    }

    if (isVerified) {
      const newOrder = new Order({
        user: req.user,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid',
        shippingCharge: orderData.shippingCharge || 0,
        distanceKm: orderData.distanceKm || 0,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      await newOrder.save();

      // Auto-trigger Delhivery shipment
      try {
        const shipRes = await createShipment(newOrder);
        if (shipRes.success) {
          newOrder.trackingId = shipRes.trackingId;
          newOrder.status = 'Processing';
          await newOrder.save();
        }
      } catch (shipErr) {
        console.error('[Delhivery Auto Shipment Error]:', shipErr.message);
      }

      // Clear the cart
      await Cart.findOneAndDelete({ user: req.user });

      // Update targetPage to 'collection' for all purchased items in the order
      try {
        for (const item of orderData.items) {
          await Gallery.findByIdAndUpdate(item.product, { targetPage: 'collection' });
        }
        console.log(`[Gallery Auto-Hide] Updated paid items to collection-only page for order ${newOrder._id}`);
      } catch (hideErr) {
        console.error('[Gallery Auto-Hide Error]:', hideErr.message);
      }

      res.status(201).json({ message: 'Payment verified and order placed successfully!', order: newOrder });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Trigger Delhivery Shipment Manually (Admin only)
router.post('/admin/orders/:id/ship-delhivery', auth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const shipRes = await createShipment(order);
    if (shipRes.success) {
      order.trackingId = shipRes.trackingId;
      order.status = 'Shipped'; // update to Shipped upon manual booking
      await order.save();
      res.json({ message: 'Shipment created successfully!', order });
    } else {
      res.status(400).json({ message: shipRes.message || 'Failed to create shipment with Delhivery' });
    }
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
