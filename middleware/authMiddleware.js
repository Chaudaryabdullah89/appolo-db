const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      // Check if this is an admin route
      const isAdminRoute = req.path.startsWith('/admin');
      console.log('Is admin route:', isAdminRoute);
      
      if (isAdminRoute || decoded.type === 'admin') {
        // For admin routes or admin tokens, verify against Admin model
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
          console.log('Admin not found:', decoded.id);
          return res.status(401).json({ message: 'Not authorized as admin' });
        }
        if (!admin.isActive) {
          console.log('Admin account is inactive:', decoded.id);
          return res.status(401).json({ message: 'Admin account is inactive' });
        }
        console.log('Admin found:', admin._id);
        req.user = admin;
      } else {
        // For regular routes, verify against User model
        const user = await User.findById(decoded.userId || decoded.id).select('-password');
        if (!user) {
          console.log('User not found:', decoded.userId || decoded.id);
          return res.status(401).json({ message: 'Not authorized' });
        }
        console.log('User found:', user._id);
        req.user = user;
      }

      // Set token in request for potential use in other middleware
      req.token = token;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin middleware
const admin = async (req, res, next) => {
  try {
    if (!req.user) {
      console.log('No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Checking admin role for user:', req.user._id, 'Role:', req.user.role);

    // Check if user is an admin
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
      console.log('User is not an admin');
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('User is authorized as admin');
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { protect, admin }; 