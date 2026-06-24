require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const setTestCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brahmani_jewellers');
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const hashedPasswordAdmin = await bcrypt.hash('admin123', salt);
    const hashedPasswordCustomer = await bcrypt.hash('password123', salt);

    // 1. Setup Admin Account
    let adminUser = await User.findOne({ email: 'admin@brahmani.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Demo Admin',
        email: 'admin@brahmani.com',
        password: hashedPasswordAdmin,
        role: 'admin',
        isVerified: true,
        isApproved: true,
        termsAccepted: true
      });
      await adminUser.save();
      console.log('Demo Admin created successfully!');
    } else {
      adminUser.role = 'admin';
      adminUser.password = hashedPasswordAdmin;
      adminUser.isVerified = true;
      adminUser.isApproved = true;
      await adminUser.save();
      console.log('Demo Admin updated successfully!');
    }

    // 2. Setup Customer Account
    let customerUser = await User.findOne({ email: 'customer@gmail.com' });
    if (!customerUser) {
      customerUser = new User({
        name: 'Demo Customer',
        email: 'customer@gmail.com',
        password: hashedPasswordCustomer,
        role: 'user',
        isVerified: true,
        isApproved: true,
        termsAccepted: true
      });
      await customerUser.save();
      console.log('Demo Customer created successfully!');
    } else {
      customerUser.role = 'user';
      customerUser.password = hashedPasswordCustomer;
      customerUser.isVerified = true;
      customerUser.isApproved = true;
      await customerUser.save();
      console.log('Demo Customer updated successfully!');
    }

    console.log('\nTest Credentials Configured Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error setting test credentials:', err.message);
    process.exit(1);
  }
};

setTestCredentials();
