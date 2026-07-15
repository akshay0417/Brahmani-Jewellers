const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token || token === 'null' || token === 'undefined') {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify if the user still exists in the database
    const userExists = await User.findById(decoded.id);
    if (userExists) {
      req.user = decoded.id;
    }
    next();
  } catch (err) {
    // If token is invalid or expired, do not fail, just proceed as guest
    next();
  }
};
