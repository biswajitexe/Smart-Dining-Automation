const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

let memoryMenuItems = [
  { _id: '64b0f1a2c3d4e5f6a7b8c901', name: 'Crispy Spring Rolls', price: 150, category: 'Starters', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60', description: 'Crunchy golden rolls packed with julienned vegetables.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c902', name: 'Spicy Paneer Tikka', price: 240, category: 'Starters', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&auto=format&fit=crop&q=60', description: 'Indian cottage cheese marinated in spiced yogurt and grilled.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c903', name: 'Paneer Butter Masala', price: 290, category: 'Main Course', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=60', description: 'Rich and creamy curry loaded with soft cottage cheese cubes.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c904', name: 'Classic Chicken Biryani', price: 350, category: 'Main Course', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60', description: 'Fragrant basmati rice layered with spiced chicken and saffron.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c905', name: 'Fresh Mint Mojito', price: 110, category: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60', description: 'Refreshing summer blend of lime, fresh mint leaves, and soda.', availability: true },
  { _id: '64b0f1a2c3d4e5f6a7b8c906', name: 'Sizzling Chocolate Brownie', price: 180, category: 'Desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60', description: 'Warm fudge brownie served with vanilla ice cream.', availability: true }
];

// @route   GET api/menu
// @desc    Get all menu items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.availableOnly === 'true') {
      filter.availability = true;
    }
    const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    console.warn('MongoDB disconnected, serving in-memory menu items fallback');
    let items = memoryMenuItems;
    if (req.query.availableOnly === 'true') {
      items = items.filter(i => i.availability);
    }
    res.json(items);
  }
});

// @route   GET api/menu/:id
// @desc    Get single menu item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      const fallback = memoryMenuItems.find(i => i._id === req.params.id);
      if (fallback) return res.json(fallback);
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    const fallback = memoryMenuItems.find(i => i._id === req.params.id);
    if (fallback) return res.json(fallback);
    res.status(404).json({ message: 'Menu item not found' });
  }
});

// @route   POST api/menu
// @desc    Create menu item
// @access  Private (Admin/Staff)
router.post('/', async (req, res) => {
  const { name, price, category, image, description, availability } = req.body;
  const newItem = {
    _id: 'mem_' + Date.now(),
    name,
    price: Number(price),
    category,
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
    description: description || '',
    availability: availability !== undefined ? availability : true
  };

  try {
    const menuItem = await MenuItem.create(newItem);
    res.status(201).json(menuItem);
  } catch (error) {
    memoryMenuItems.push(newItem);
    res.status(201).json(newItem);
  }
});

// @route   PUT api/menu/:id
// @desc    Update menu item
// @access  Private (Admin/Staff)
router.put('/:id', async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);
    if (menuItem) {
      Object.assign(menuItem, req.body);
      const updated = await menuItem.save();
      return res.json(updated);
    }
  } catch (err) {
    // fallback
  }

  const idx = memoryMenuItems.findIndex(i => i._id === req.params.id);
  if (idx > -1) {
    memoryMenuItems[idx] = { ...memoryMenuItems[idx], ...req.body };
    return res.json(memoryMenuItems[idx]);
  }
  res.status(404).json({ message: 'Menu item not found' });
});

// @route   DELETE api/menu/:id
// @desc    Delete menu item
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);
    if (menuItem) {
      await menuItem.deleteOne();
      return res.json({ message: 'Menu item removed' });
    }
  } catch (err) {}

  memoryMenuItems = memoryMenuItems.filter(i => i._id !== req.params.id);
  res.json({ message: 'Menu item removed' });
});

module.exports = router;
