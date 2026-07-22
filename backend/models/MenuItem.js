const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Starters', 'Main Course', 'Beverages', 'Desserts']
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true
  },
  availability: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
