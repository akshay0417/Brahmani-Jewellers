require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brahmani_jewellers');
    console.log('Connected to MongoDB');

    const email = 'brahmanijewellers911@gmail.com';
    const password = 'Mehul@1910'; // simple password for testing

    let adminUser = await User.findOne({ email });

    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      adminUser = new User({
        name: 'Master Admin',
        email: email,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log(`Admin account created successfully!`);
    } else {
      adminUser.role = 'admin';
      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash(password, salt);
      await adminUser.save();
      console.log(`Admin account updated successfully!`);
    }

    console.log(`
---------------------------------------
You can now log in with:
Email:    brahmanijewellers911@gmail.com
Password: Mehul@1910
---------------------------------------
    `);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();
