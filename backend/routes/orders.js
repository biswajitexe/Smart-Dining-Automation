const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');

let memoryOrders = [];

// @route   GET api/orders
router.get('/', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const orders = await Order.find({})
        .populate('table')
        .populate('items.menuItem')
        .sort({ createdAt: -1 });
      if (orders && orders.length > 0) return res.json(orders);
    } catch (error) {}
  }
  res.json(memoryOrders);
});

// @route   GET api/orders/analytics
router.get('/analytics', async (req, res) => {
  let totalSales = 0;
  let orderCount = memoryOrders.length;
  let categorySales = { 'Starters': 0, 'Main Course': 0, 'Beverages': 0, 'Desserts': 0 };
  let popularDishes = {};
  let ratings = [];
  let feedbacks = [];

  memoryOrders.forEach(order => {
    totalSales += order.totalAmount || 0;
    if (order.rating) {
      ratings.push(order.rating);
      if (order.comment) {
        feedbacks.push({
          id: order._id,
          rating: order.rating,
          comment: order.comment,
          tableNumber: order.table?.number || order.tableNumber || 1,
          createdAt: order.createdAt || new Date().toISOString()
        });
      }
    }

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

  const avgRating = ratings.length > 0
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : '4.9';

  res.json({ 
    totalSales, 
    orderCount, 
    categorySales, 
    popularDishes: sortedPopular,
    avgRating: Number(avgRating),
    totalReviews: ratings.length,
    recentFeedbacks: feedbacks.slice(0, 10)
  });
});

// @route   GET api/orders/:id
router.get('/:id', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const order = await Order.findById(req.params.id)
        .populate('table')
        .populate('items.menuItem');
      if (order) return res.json(order);
    } catch (error) {}
  }

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

  let totalAmount = 0;

  const populatedItems = items.map(i => {
    const price = i.price || 200;
    totalAmount += price * i.quantity;
    return {
      menuItem: {
        _id: i.menuItem,
        name: i.name || 'Delicious Dish',
        price: price,
        category: 'Starters'
      },
      name: i.name || 'Delicious Dish',
      price: price,
      quantity: i.quantity,
      notes: i.notes || ''
    };
  });

  const newOrder = {
    _id: 'ord_' + Date.now(),
    table: { number: Number(tableNumber) },
    tableNumber: Number(tableNumber),
    items: populatedItems,
    status: 'Placed',
    paymentStatus: 'Pending',
    totalAmount: totalAmount,
    createdAt: new Date().toISOString()
  };

  memoryOrders.unshift(newOrder);

  if (mongoose.connection.readyState === 1) {
    try {
      await Order.create({
        tableNumber: Number(tableNumber),
        items: items.map(i => ({ menuItem: i.menuItem, quantity: i.quantity, notes: i.notes })),
        totalAmount
      });
    } catch (e) {}
  }

  const io = req.app.get('socketio');
  if (io) {
    io.emit('newOrder', newOrder);
  }

  res.status(201).json(newOrder);
});

// @route   POST api/orders/:id/pay
router.post('/:id/pay', async (req, res) => {
  const idx = memoryOrders.findIndex(o => o._id === req.params.id);
  if (idx > -1) {
    memoryOrders[idx].paymentStatus = 'Paid';
    const io = req.app.get('socketio');
    if (io) {
      io.to(`order_${memoryOrders[idx]._id}`).emit('orderStatusUpdated', memoryOrders[idx]);
      io.emit('orderUpdated', memoryOrders[idx]);
    }
    return res.json(memoryOrders[idx]);
  }

  res.status(404).json({ message: 'Order not found' });
});

// @route   POST api/orders/:id/feedback
router.post('/:id/feedback', async (req, res) => {
  const { rating, comment } = req.body;
  const idx = memoryOrders.findIndex(o => o._id === req.params.id);
  if (idx > -1) {
    memoryOrders[idx].rating = Number(rating) || 5;
    memoryOrders[idx].comment = comment || '';
    const io = req.app.get('socketio');
    if (io) {
      io.to(`order_${memoryOrders[idx]._id}`).emit('orderStatusUpdated', memoryOrders[idx]);
      io.emit('orderUpdated', memoryOrders[idx]);
    }
    return res.json(memoryOrders[idx]);
  }

  res.status(404).json({ message: 'Order not found' });
});

// @route   PUT api/orders/:id
router.put('/:id', async (req, res) => {
  const { status, paymentStatus } = req.body;

  const idx = memoryOrders.findIndex(o => o._id === req.params.id);
  if (idx > -1) {
    if (status) memoryOrders[idx].status = status;
    if (paymentStatus) memoryOrders[idx].paymentStatus = paymentStatus;
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
