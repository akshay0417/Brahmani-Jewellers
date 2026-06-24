const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const User = require('./models/User');
const bcrypt = require('bcryptjs');


const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('<h1>Brahmani Jewellers Backend API is running successfully! ✅ (Version: 1.2.0-newsletter-live)</h1>');
});

app.use('/api', apiRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection & Server Start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/brahmani_jewellers';

const connectWithFallback = async () => {
  console.log('Attempting to connect to MongoDB Atlas...');
  try {
    // Attempt connecting to MongoDB Atlas with a 5-second timeout
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB Atlas successfully! ☁️');
    return true;
  } catch (atlasErr) {
    console.warn(`[MONGO WARN] Atlas connection failed (${atlasErr.message}). Falling back to local MongoDB... 🔌`);
    try {
      await mongoose.connect(LOCAL_MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('Connected to Local MongoDB successfully! 💻');
      return true;
    } catch (localErr) {
      console.error('[MONGO ERROR] Both Atlas and Local MongoDB connections failed!');
      console.error(`Local error: ${localErr.message}`);
      return false;
    }
  }
};

// Start Express server immediately to prevent frontend socket buffering/hangs
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} 🚀`);
  
  const connected = await connectWithFallback();
  if (connected) {
    // Create default admin if not exists
    try {
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newAdmin = new User({
          name: 'Brahmani Admin',
          email: 'info.brahmanijewellers@gmail.com',
          mobile: '7621967577',
          password: hashedPassword,
          role: 'admin'
        });
        await newAdmin.save();
        console.log('Default Admin created: info.brahmanijewellers@gmail.com / admin123');
      }
    } catch (err) {
      console.error('Error creating default admin:', err.message);
    }
  } else {
    console.warn('[WARNING] Running server without database connection! Database-dependent routes will fail.');
  }
});

