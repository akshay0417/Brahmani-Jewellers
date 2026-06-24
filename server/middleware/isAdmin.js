const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators are authorized.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
