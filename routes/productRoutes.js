const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for product image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.use(express.json());

// Public routes
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected routes (admin only)
router.post('/', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, stock, brand, features, specifications } = req.body;

    // Basic backend validation
    if (!name || !description || !price || !category || !stock || !brand) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Validate and convert price and stock to numbers
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Invalid price.' });
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Invalid stock.' });
    }

    // Handle uploaded images
    const imagePaths = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];

    const product = new Product({
      name,
      description,
      price: parsedPrice,
      category,
      stock: parsedStock,
      images: imagePaths,
      brand,
      features,
      specifications
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    
    // If there was a file upload error, remove the uploaded files
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error removing uploaded file:', unlinkError);
        }
      });
    }

    res.status(400).json({ message: error.message || 'Failed to create product.' });
  }
});

router.put('/:id', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, stock, brand, features, specifications } = req.body;

    // Basic validation
    if (!name || !description || !price || !category || !stock || !brand) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Invalid price.' });
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Invalid stock.' });
    }

    // Get existing product to keep old images if no new ones are uploaded
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle uploaded images
    let imagePaths = existingProduct.images;
    if (req.files && req.files.length > 0) {
      // Delete old images if new ones are uploaded
      existingProduct.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
      imagePaths = req.files.map(file => `/uploads/products/${file.filename}`);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price: parsedPrice,
        category,
        stock: parsedStock,
        images: imagePaths,
        brand,
        features,
        specifications,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.json(product);
  } catch (error) {
    // If there was a file upload error, remove the uploaded files
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error removing uploaded file:', unlinkError);
        }
      });
    }
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get products by collection
router.get('/collection/:type', async (req, res) => {
  try {
    const { type } = req.params;
    let query = {};

    // Define collection-specific queries
    switch (type) {
      case 'mens':
        query = { category: { $in: ['shirts', 'pants', 'jackets'] }, gender: 'men' };
        break;
      case 'womens':
        query = { category: { $in: ['dresses', 'tops', 'skirts'] }, gender: 'women' };
        break;
      case 'footwear':
        query = { category: { $in: ['sneakers', 'formal', 'casual', 'sports'] } };
        break;
      case 'accessories':
        query = { category: { $in: ['bags', 'watches', 'jewelry', 'belts'] } };
        break;
      default:
        return res.status(400).json({ message: 'Invalid collection type' });
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching collection products:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
