const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Store = require('../models/Store');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Get admin settings
router.get('/settings', protect, admin, async (req, res) => {
  try {
    console.log('Fetching admin settings for user:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.error('User not found:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Create default store if it doesn't exist
    let store = await Store.findOne({ user: req.user._id });
    if (!store) {
      console.log('Creating default store for user:', req.user._id);
      store = new Store({
        user: req.user._id,
        storeName: `${user.name}'s Store`,
        currency: 'USD',
        taxRate: 0,
        shippingCost: 0,
        freeShippingThreshold: 0,
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      });
      await store.save();
    }

    console.log('Successfully fetched settings for user:', req.user._id);
    res.json({
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address?.street || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || ''
      },
      store: store
    });
  } catch (error) {
    console.error('Error in /settings route:', error);
    res.status(500).json({ 
      message: 'Error fetching settings',
      error: error.message 
    });
  }
});

// Update profile settings
router.put('/settings/profile', protect, admin, async (req, res) => {
  try {
    const { name, email, phone, address, city, state, zipCode, country } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.address = address;
    user.city = city;
    user.state = state;
    user.zipCode = zipCode;
    user.country = country;

    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update store settings
router.put('/settings/store', protect, admin, async (req, res) => {
  try {
    const {
      storeName,
      storeDescription,
      currency,
      taxRate,
      shippingCost,
      freeShippingThreshold,
      contactEmail,
      contactPhone,
      socialMedia
    } = req.body;

    let store = await Store.findOne({ user: req.user._id });

    if (store) {
      // Update existing store
      store.storeName = storeName;
      store.storeDescription = storeDescription;
      store.currency = currency;
      store.taxRate = taxRate;
      store.shippingCost = shippingCost;
      store.freeShippingThreshold = freeShippingThreshold;
      store.contactEmail = contactEmail;
      store.contactPhone = contactPhone;
      store.socialMedia = socialMedia;
    } else {
      // Create new store
      store = new Store({
        user: req.user._id,
        storeName,
        storeDescription,
        currency,
        taxRate,
        shippingCost,
        freeShippingThreshold,
        contactEmail,
        contactPhone,
        socialMedia
      });
    }

    await store.save();
    res.json({ message: 'Store settings updated successfully' });
  } catch (error) {
    console.error('Error updating store settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update security settings (password)
router.put('/settings/security', protect, admin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all settings
router.get('/settings', protect, admin, async (req, res) => {
  try {
    console.log('Fetching settings for admin user:', req.user._id);
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('No settings found, creating default settings');
      // Create default settings if none exist
      settings = await Settings.create({
        siteName: 'My Blog',
        siteDescription: 'Welcome to my blog',
        contactEmail: '',
        socialMedia: {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: ''
        },
        blogSettings: {
          postsPerPage: 10,
          allowComments: true,
          requireApproval: true,
          allowGuestComments: false
        },
        emailSettings: {
          sendNotifications: true,
          notifyOnNewComment: true,
          notifyOnNewBlog: true
        },
        maintenanceMode: false
      });
    }
    
    console.log('Successfully fetched settings');
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Update settings
router.put('/settings', protect, admin, async (req, res) => {
  try {
    console.log('Updating settings for admin user:', req.user._id);
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('No settings found, creating new settings');
      settings = new Settings(req.body);
    } else {
      console.log('Updating existing settings');
      Object.assign(settings, req.body);
    }

    await settings.save();
    console.log('Settings updated successfully');
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt for email:', email);

    // Check if admin exists
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      console.log('Admin login failed: Admin not found');
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      console.log('Admin login failed: Admin account is inactive');
      return res.status(401).json({ message: 'Admin account is inactive' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log('Admin login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Create token with consistent structure
    const token = jwt.sign(
      { 
        id: admin._id,
        role: admin.role,
        type: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare admin data without sensitive information
    const adminData = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      type: 'admin'
    };

    console.log('Admin login successful, sending response');
    // Send response with the structure expected by the frontend
    res.status(200).json({
      token,
      admin: adminData  // Changed from 'user' to 'admin' to match frontend expectations
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin profile
router.get('/profile', protect, admin, async (req, res) => {
  try {
    console.log('Fetching admin profile for:', req.user._id);
    
    // Use the admin ID from the request user object
    const admin = await Admin.findById(req.user._id).select('-password');
    if (!admin) {
      console.log('Admin not found:', req.user._id);
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Send the admin data
    console.log('Sending admin profile data');
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin verify route
router.get('/verify', protect, admin, async (req, res) => {
  try {
    console.log('Verifying admin:', req.user._id);
    
    // Get admin data without sensitive information
    const adminData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      type: 'admin'
    };

    res.status(200).json({
      admin: adminData
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(401).json({ message: 'Not authorized' });
  }
});

module.exports = router; 