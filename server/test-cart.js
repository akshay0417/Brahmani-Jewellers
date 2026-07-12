const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://akshayprajapati404_db_user:Akshay_0417@cluster.jh6ltpa.mongodb.net/brahmani_jewellers?retryWrites=true&w=majority';

const GallerySchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number
});
const Gallery = mongoose.model('Gallery', GallerySchema, 'galleries');

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallery', required: true },
      quantity: { type: Number, default: 1 }
    }
  ]
});
const Cart = mongoose.model('Cart', CartSchema, 'carts');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String
});
const User = mongoose.model('User', UserSchema, 'users');

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Get a user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found in database!');
      return;
    }
    console.log('Found user:', user.name, user._id);

    // Get a product
    const product = await Gallery.findOne();
    if (!product) {
      console.log('No product found in database!');
      return;
    }
    console.log('Found product:', product.name, product._id);

    // Get or create cart
    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      console.log('Creating new cart for user...');
      cart = new Cart({ user: user._id, items: [] });
    }

    console.log('Cart items before:', cart.items);

    // Try pushing product
    const itemIndex = cart.items.findIndex(p => p.product && p.product.toString() === product._id.toString());
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ product: product._id, quantity: 1 });
    }

    await cart.save();
    console.log('Cart saved successfully!');
    console.log('Cart items after:', cart.items);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected!');
  }
}

run();
