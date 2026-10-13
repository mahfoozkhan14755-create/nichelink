const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      username: username.trim(), 
      email: cleanEmail, 
      password: hashedPassword 
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser._id, 
        username: newUser.username, 
        email: newUser.email, 
        isPro: newUser.isPro 
      } 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: 'User not found with this email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        isPro: user.isPro 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// PROFILE ROUTE (Protected)
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// UPGRADE ROUTE (Pro Tier Simulation)
router.put('/upgrade', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id, 
      { isPro: true }, 
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err) {
    console.error('Upgrade error:', err);
    res.status(500).json({ error: 'Server error during upgrade' });
  }
});

module.exports = router;