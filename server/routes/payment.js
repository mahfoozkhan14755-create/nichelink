const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Initialize Stripe (Aap yahan apni live/test secret key daal sakte hain ya .env file se le sakte hain)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mockkey_for_testing');

// Verify token middleware helper
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'yoursupersecretkey');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Create Checkout Session
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'NicheLink Pro Membership ⭐',
              description: 'Unlock exclusive Pro-only communities and features.',
            },
            unit_amount: 1500, // $15.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/dashboard?success=true',
      cancel_url: 'http://localhost:3000/dashboard?canceled=true',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upgrade User to Pro on Success
router.post('/upgrade-success', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    await User.findByIdAndUpdate(userId, { isPro: true });
    res.json({ message: 'Successfully upgraded to Pro!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;