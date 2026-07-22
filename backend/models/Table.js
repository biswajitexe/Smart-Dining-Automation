const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  qrCode: {
    type: String, // Base64 image representation
    required: false
  },
  status: {
    type: String,
    enum: ['vacant', 'active'],
    default: 'vacant'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', TableSchema);
