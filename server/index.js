const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const apiRoutes = require('./routes/api');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

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
  res.send('<h1>Brahmani Jewellers Backend API is running successfully! ✅</h1>');
});

app.use('/api', apiRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create default admin if not exists
    try {
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const newAdmin = new User({
          name: 'Brahmani Admin',
          email: 'info.brahmanijewellers@gmail.com',
          mobile: '9925811771',
          password: hashedPassword,
          role: 'admin'
        });
        await newAdmin.save();
        console.log('Default Admin created: info.brahmanijewellers@gmail.com / admin123');
      }
    } catch (err) {
      console.error('Error creating default admin:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });
