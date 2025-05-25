const express = require('express');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        res.json({ message: 'Products route working' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 