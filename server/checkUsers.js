const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brahmani_jewellers');
    console.log('\n=== REGISTERED USERS IN DATABASE ===\n');
    
    const users = await User.find({}).select('-password'); // Exclude passwords for safety
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        if (user.email) console.log(`   Email: ${user.email}`);
        if (user.mobile) console.log(`   Mobile: ${user.mobile}`);
        console.log(`   Registered At: ${new Date(user.createdAt).toLocaleString()}`);
        console.log('-----------------------------------');
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    process.exit(1);
  }
};

checkUsers();
