const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const wishlistController = require('../controllers/wishlistController');

// All wishlist routes are protected
router.use(protect);

// Wishlist routes
router.post('/', wishlistController.addToWishlist);
router.get('/', wishlistController.getWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router; 