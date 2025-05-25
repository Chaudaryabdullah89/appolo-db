const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('Getting cart for user:', req.user._id);
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price image stock');

    console.log('Found cart:', cart);

    if (!cart) {
      console.log('No cart found, creating new cart');
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    // Ensure we're returning an array of items with populated product data
    const cartItems = cart.items.map(item => ({
      _id: item._id,
      product: item.product ? {
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        stock: item.product.stock
      } : null,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image,
      size: item.size
    }));

    console.log('Returning cart items:', cartItems);
    res.json(cartItems);
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ message: 'Error getting cart', error: error.message });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('Adding item to cart:', req.body);
    const { product, quantity, size } = req.body;

    // Verify product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    console.log('Found cart:', cart);

    if (!cart) {
      console.log('No cart found, creating new cart');
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === product);
    console.log('Existing item:', existingItem);

    if (existingItem) {
      console.log('Updating existing item quantity');
      existingItem.quantity += quantity;
    } else {
      console.log('Adding new item to cart');
      const newItem = {
        product,
        quantity,
        price: productExists.price,
        name: productExists.name,
        image: productExists.image || '/images/placeholder.jpg',
        size: size || 'M'
      };
      console.log('New item to be added:', newItem);
      cart.items.push(newItem);
    }

    await cart.save();
    console.log('Saved cart:', cart);

    // Return the updated cart items with populated product data
    const updatedCart = await Cart.findById(cart._id).populate('items.product', 'name price image stock');
    const cartItems = updatedCart.items.map(item => ({
      _id: item._id,
      product: item.product ? {
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        stock: item.product.stock
      } : null,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image || item.product?.image || '/images/placeholder.jpg',
      size: item.size
    }));

    console.log('Returning updated cart items:', cartItems);
    res.json(cartItems);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
router.put('/:productId', protect, async (req, res) => {
  try {
    console.log('Updating item quantity:', { productId: req.params.productId, quantity: req.body.quantity });
    const cart = await Cart.findOne({ user: req.user._id });
    console.log('Found cart:', cart);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.product.toString() === req.params.productId);
    console.log('Found item:', item);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = req.body.quantity;
    await cart.save();
    console.log('Saved cart:', cart);

    // Return the updated cart items
    const cartItems = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image,
      size: item.size
    }));

    console.log('Returning updated cart items:', cartItems);
    res.json(cartItems);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    console.log('Removing item from cart:', req.params.productId);
    const cart = await Cart.findOne({ user: req.user._id });
    console.log('Found cart:', cart);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    console.log('Saved cart after removal:', cart);

    // Return the updated cart items
    const cartItems = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image,
      size: item.size
    }));

    console.log('Returning updated cart items:', cartItems);
    res.json(cartItems);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart', error: error.message });
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    console.log('Clearing cart for user:', req.user._id);
    const cart = await Cart.findOne({ user: req.user._id });
    console.log('Found cart:', cart);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    console.log('Cleared cart');

    res.json([]);
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

module.exports = router; 