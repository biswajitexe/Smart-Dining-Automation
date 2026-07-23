const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem'
  },
  name: {
    type: String,
    default: 'Dish'
  },
  price: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  notes: {
    type: String,
    default: ''
  }
});

const OrderSchema = new mongoose.Schema({
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  tableNumber: {
    type: Number,
    default: 1
  },
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ['Placed', 'Preparing', 'Ready', 'Served'],
    default: 'Placed'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  comment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
