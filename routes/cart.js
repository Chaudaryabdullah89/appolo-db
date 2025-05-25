const express = require('express');
const router = express.Router();

// Get cart
router.get('/', async (req, res) => {
    try {
        res.json({ message: 'Cart route working' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 