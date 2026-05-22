const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Gallery = require('./models/Gallery');
const Order = require('./models/Order');

const API_URL = 'http://localhost:5000/api';

async function run() {
  console.log('Connecting to MongoDB...');
  const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/brahmani_jewellers';
  const MONGODB_URI = process.env.MONGODB_URI;

  try {
    console.log('Attempting local MongoDB connection...');
    await mongoose.connect(LOCAL_MONGODB_URI);
    console.log('Connected to local MongoDB successfully.');
  } catch (err) {
    console.warn(`Local connection failed: ${err.message}. Trying Atlas...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully.');
  }

  const testEmail = 'testshopper_e2e@example.com';
  const testName = 'E2E Test Shopper';

  // 1. Clean up existing test user
  console.log('Cleaning up existing test user and orders...');
  const existingUser = await User.findOne({ email: testEmail });
  if (existingUser) {
    await Order.deleteMany({ user: existingUser._id });
    await User.deleteOne({ _id: existingUser._id });
  }

  // 2. Create verified & approved test user directly in DB
  console.log('Creating verified test user...');
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  const testUser = new User({
    name: testName,
    email: testEmail,
    password: hashedPassword,
    role: 'user',
    isVerified: true,
    isApproved: true
  });
  await testUser.save();
  console.log('Test user created.');

  // Create a mock product in Gallery if empty, or pick one
  console.log('Ensuring a product exists in Gallery...');
  let product = await Gallery.findOne();
  if (!product) {
    product = new Gallery({
      imageUrl: 'https://via.placeholder.com/150',
      category: 'gold',
      subCategory: 'Ring',
      name: 'Test Ring',
      description: 'Gold test ring',
      targetPage: 'both',
      weight: 5,
      purity: '22K',
      price: 35000
    });
    await product.save();
    console.log('Created a dummy product in Gallery.');
  } else {
    console.log(`Found existing product in Gallery: ${product.name || product.category}`);
  }

  // 3. Log in via API to get token
  console.log('Logging in via API...');
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    identifier: testEmail,
    password: 'testpass123'
  });
  const token = loginRes.data.token;
  console.log('Login successful. Token obtained.');

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 4. Test POST /orders/razorpay-order (Razorpay order ID generation)
  console.log('Testing Razorpay Order ID generation...');
  const totalAmount = 35225; // Product price + mock delivery
  const rzpOrderRes = await axios.post(`${API_URL}/orders/razorpay-order`, { totalAmount }, authHeaders);
  console.log('Razorpay Order Response:', rzpOrderRes.data);
  if (!rzpOrderRes.data.id) {
    throw new Error('Failed to generate Razorpay order ID!');
  }
  const rzpOrderId = rzpOrderRes.data.id;

  // 5. Test POST /orders/verify-payment (Payment verification and order placement)
  console.log('Testing payment verification & order placement...');
  const orderData = {
    items: [{
      product: product._id,
      quantity: 1,
      priceAtPurchase: product.price || 35000
    }],
    totalAmount,
    shippingAddress: {
      name: testName,
      mobile: '9876543210',
      address: '102 Royal Arcade, Near Amraiwadi Metro',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380026'
    },
    paymentMethod: 'Razorpay',
    shippingCharge: 225,
    distanceKm: 25
  };

  const verifyRes = await axios.post(`${API_URL}/orders/verify-payment`, {
    orderData,
    razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
    razorpay_order_id: rzpOrderId,
    razorpay_signature: 'sig_mock_' + Math.random().toString(36).substring(2, 10)
  }, authHeaders);

  console.log('Payment Verification Response:', verifyRes.data);
  if (!verifyRes.data.order) {
    throw new Error('Order was not returned after payment verification!');
  }

  const orderId = verifyRes.data.order._id;

  // 6. Retrieve the order from the DB to inspect fields
  console.log('Fetching order details from DB...');
  const savedOrder = await Order.findById(orderId);
  console.log('Saved Order Details:');
  console.log(`- ID: ${savedOrder._id}`);
  console.log(`- Payment Method: ${savedOrder.paymentMethod}`);
  console.log(`- Payment Status: ${savedOrder.paymentStatus}`);
  console.log(`- Delhivery Tracking ID (AWB): ${savedOrder.trackingId || 'NONE'}`);
  console.log(`- Status: ${savedOrder.status}`);

  if (savedOrder.paymentMethod !== 'Razorpay' || savedOrder.paymentStatus !== 'Paid') {
    throw new Error('Order payment details do not match!');
  }

  if (!savedOrder.trackingId) {
    console.warn('[WARNING] Delhivery auto-shipment did not generate a tracking ID.');
  } else {
    console.log('SUCCESS! Delhivery auto-shipment generated AWB tracking ID successfully.');
  }

  console.log('Creating dedicated temporary admin user for manual test...');
  const tempAdminEmail = 'admin_e2e_temp@example.com';
  const tempAdminPassword = 'tempadminpass123';
  
  // Clean up if temp admin already exists
  await User.deleteOne({ email: tempAdminEmail });
  
  const hashedAdminPassword = await bcrypt.hash(tempAdminPassword, 10);
  const adminUser = new User({
    name: 'E2E Temp Admin',
    email: tempAdminEmail,
    mobile: '9999999999',
    password: hashedAdminPassword,
    role: 'admin',
    isVerified: true,
    isApproved: true
  });
  await adminUser.save();

  console.log('Logging in as admin...');
  const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
    identifier: tempAdminEmail,
    password: tempAdminPassword
  });
  const adminToken = adminLoginRes.data.token;
  const adminAuthHeaders = {
    headers: { Authorization: `Bearer ${adminToken}` }
  };

  console.log('Testing manual Delhivery shipment endpoint (admin only)...');
  // Clear tracking ID first to simulate a manual booking on an order without tracking ID
  savedOrder.trackingId = undefined;
  await savedOrder.save();

  const manualShipRes = await axios.post(`${API_URL}/admin/orders/${orderId}/ship-delhivery`, {}, adminAuthHeaders);
  console.log('Manual Shipment Trigger Response:', manualShipRes.data);
  if (!manualShipRes.data.order.trackingId) {
    throw new Error('Manual shipment creation did not return a tracking ID!');
  }
  console.log(`SUCCESS! Manual shipment created. Tracking ID: ${manualShipRes.data.order.trackingId}`);

  // Clean up
  console.log('Cleaning up database...');
  await Order.deleteOne({ _id: orderId });
  await User.deleteOne({ _id: testUser._id });
  await User.deleteOne({ _id: adminUser._id });
  await mongoose.disconnect();
  console.log('E2E Payment and Shipping Verification completed successfully! All assertions passed.');
}

run().catch(async (err) => {
  console.error('VERIFICATION FAILED:', err.message);
  if (err.response) {
    console.error('API Error Response:', err.response.data);
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
