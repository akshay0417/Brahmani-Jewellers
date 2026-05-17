const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// API Health Check
router.get('/', (req, res) => {
  res.json({ message: 'Brahmani Jewellers API is running successfully! ✅', status: 'online' });
});

// Models
const Rate = require('../models/Rate');
const Gallery = require('../models/Gallery');
const User = require('../models/User');
const Message = require('../models/Message');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Email Helper Function
const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[EMAIL] Credentials missing in .env. Skipping email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465, // Use SSL for 465, STARTTLS for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    family: 4, // Force IPv4 to avoid Render IPv6 timeout
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.sendMail({
      from: `"Brahmani Jewellers" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[EMAIL] Successfully sent to ${to}`);
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
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    newUser.otp = otp;
    newUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await newUser.save();

    console.log(`[MOCK OTP] Your OTP for ${mobile} / ${email} is ${otp}`);

    if (email) {
      try {
        const welcomeHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #f4f4f4; padding-bottom: 10px; margin-bottom: 20px;">
              <h2 style="color: #d4af37; margin: 0;">Welcome to Brahmani Jewellers!</h2>
            </div>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your account has been successfully created. We are thrilled to have you with us!</p>
            <p>To finalize your registration, please use the following One-Time Password (OTP):</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border: 1px dashed #ccc;">
              <h1 style="letter-spacing: 4px; color: #d4af37; margin: 10px 0;">${otp}</h1>
              <p style="font-size: 0.85em; color: #777; margin-bottom: 0;">This OTP is valid for 10 minutes.</p>
            </div>
            <p style="font-size: 0.9em;">If you did not initiate this registration, please safely ignore this email.</p>
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; font-size: 0.9em; color: #555;">
              <p style="margin: 0;">Best Regards,</p>
              <p style="margin: 5px 0 0 0;"><strong>Brahmani Jewellers Team</strong></p>
            </div>
          </div>
        `;
        sendEmail(email, 'Welcome to Brahmani Jewellers - Verify Your Account', welcomeHtml).catch(console.error);
      } catch (err) {
        // Continue even if email fails during development
      }
    }
    
    if (mobile) {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
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

    res.status(201).json({ message: `User registered successfully.`, identifier: mobile || email });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
      return res.status(403).json({ message: 'Please verify your account with OTP first.', unverified: true });
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

    if (email) {
      try {
        const otpHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
            <h2 style="color: #d4af37; text-align: center;">Login Verification</h2>
            <p>Hello,</p>
            <p>You requested a login OTP for your Brahmani Jewellers account.</p>
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
              <h1 style="letter-spacing: 5px; color: #333; margin: 0;">${otp}</h1>
              <p style="color: #888; font-size: 0.8em; margin-top: 10px;">This code expires in 10 minutes.</p>
            </div>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `;
        sendEmail(email, 'Your Login OTP - Brahmani Jewellers', otpHtml).catch(console.error);
      } catch (err) {
        // Log handled in helper
      }
      res.json({ message: `OTP sent to your email address` });
    } else {
      // Send WhatsApp/SMS OTP
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          twilioClient.messages.create({
            body: `Your Brahmani Jewellers Login OTP is: ${otp}`,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `+91${mobile}` // Assuming Indian numbers, adjust as needed
          }).then(() => {
            console.log(`[SMS/WA] Login OTP successfully sent to ${mobile}`);
          }).catch((smsErr) => {
            console.error(`[SMS/WA ERROR] Failed to send to ${mobile}:`, smsErr);
          });
        } catch (smsErr) {
          console.error(`[SMS/WA ERROR] Failed to send to ${mobile}:`, smsErr);
        }
      } else {
        console.log(`[SMS/WA] Twilio credentials missing in .env. Skipping SMS.`);
      }
      res.json({ message: `OTP sent to your mobile number` });
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
  const { category, weight, purity, price, targetPage, makingCharges, otherCharges } = req.body;
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${b64}`;

    const newItem = new Gallery({
      imageUrl: imageUrl,
      category,
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
  const { category, weight, purity, price, targetPage, makingCharges, otherCharges } = req.body;
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (category) item.category = category;
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
