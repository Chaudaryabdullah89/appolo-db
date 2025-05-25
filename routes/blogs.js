const express = require('express');
const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
    try {
        res.json({ message: 'Blogs route working' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 