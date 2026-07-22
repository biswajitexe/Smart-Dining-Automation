const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
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
    ref: 'Table',
    required: true
  },
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ['Placed', 'Preparing', 'Ready', 'Served'],
    default: 'Placed'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
