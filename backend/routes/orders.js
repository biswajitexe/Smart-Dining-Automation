const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');

let memoryOrders = [];

// @route   GET api/orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('table')
      .populate('items.menuItem')
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    res.json(memoryOrders);
  }
});

// @route   GET api/orders/analytics
router.get('/analytics', async (req, res) => {
  let totalSales = 0;
  let orderCount = memoryOrders.length;
  let categorySales = { 'Starters': 0, 'Main Course': 0, 'Beverages': 0, 'Desserts': 0 };
  let popularDishes = {};

  memoryOrders.forEach(order => {
    totalSales += order.totalAmount || 0;
    (order.items || []).forEach(item => {
      if (item.menuItem) {
        const cat = item.menuItem.category || 'Starters';
        if (categorySales[cat] !== undefined) {
          categorySales[cat] += (item.menuItem.price || 0) * item.quantity;
        }
        const dishName = item.menuItem.name || 'Dish';
        popularDishes[dishName] = (popularDishes[dishName] || 0) + item.quantity;
      }
    });
  });

  const sortedPopular = Object.keys(popularDishes)
    .map(name => ({ name, count: popularDishes[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({ totalSales, orderCount, categorySales, popularDishes: sortedPopular });
});

// @route   GET api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('items.menuItem');
    if (order) return res.json(order);
  } catch (error) {}

  const found = memoryOrders.find(o => o._id === req.params.id);
  if (found) return res.json(found);
  res.status(404).json({ message: 'Order not found' });
});

// @route   POST api/orders
router.post('/', async (req, res) => {
  const { tableNumber, items } = req.body;
  if (!tableNumber || !items || items.length === 0) {
    return res.status(400).json({ message: 'Please provide table number and items' });
  }

  // Fetch menu fallback items if needed
  const menuRoutes = require('./menu');
  let totalAmount = 0;

  const populatedItems = items.map(i => {
    // calculate dummy price if needed
    const price = 200;
    totalAmount += price * i.quantity;
    return {
      menuItem: {
        _id: i.menuItem,
        name: i.name || 'Delicious Dish',
        price: price,
        category: 'Starters'
      },
      quantity: i.quantity,
      notes: i.notes || ''
    };
  });

  const newOrder = {
    _id: 'ord_' + Date.now(),
    table: { number: Number(tableNumber) },
    items: populatedItems,
    status: 'Placed',
    totalAmount: totalAmount,
    createdAt: new Date().toISOString()
  };

  memoryOrders.unshift(newOrder);

  // Notify socket
  const io = req.app.get('socketio');
  if (io) {
    io.emit('newOrder', newOrder);
  }

  res.status(201).json(newOrder);
});

// @route   PUT api/orders/:id
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Please provide status' });

  const idx = memoryOrders.findIndex(o => o._id === req.params.id);
  if (idx > -1) {
    memoryOrders[idx].status = status;
    const io = req.app.get('socketio');
    if (io) {
      io.to(`order_${memoryOrders[idx]._id}`).emit('orderStatusUpdated', memoryOrders[idx]);
      io.emit('orderUpdated', memoryOrders[idx]);
    }
    return res.json(memoryOrders[idx]);
  }

  res.status(404).json({ message: 'Order not found' });
});

module.exports = router;
