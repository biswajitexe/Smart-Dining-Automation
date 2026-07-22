const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const QRCode = require('qrcode');

let memoryTables = [
  { _id: 'tbl_1', number: 1, status: 'vacant', qrCode: '' },
  { _id: 'tbl_2', number: 2, status: 'vacant', qrCode: '' },
  { _id: 'tbl_3', number: 3, status: 'vacant', qrCode: '' },
  { _id: 'tbl_4', number: 4, status: 'vacant', qrCode: '' },
  { _id: 'tbl_5', number: 5, status: 'vacant', qrCode: '' }
];

// Helper to ensure QR codes in memory
const ensureQRs = async () => {
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  for (let t of memoryTables) {
    if (!t.qrCode) {
      const link = `${frontendBaseUrl}/table/${t.number}`;
      t.qrCode = await QRCode.toDataURL(link, { width: 300 });
    }
  }
};
ensureQRs();

// @route   GET api/tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find({}).sort({ number: 1 });
    res.json(tables);
  } catch (error) {
    await ensureQRs();
    res.json(memoryTables);
  }
});

// @route   GET api/tables/:number
router.get('/:number', async (req, res) => {
  try {
    const table = await Table.findOne({ number: req.params.number });
    if (table) return res.json(table);
  } catch (error) {}

  await ensureQRs();
  const num = parseInt(req.params.number);
  const found = memoryTables.find(t => t.number === num);
  if (found) return res.json(found);

  // Return generated mock table
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendBaseUrl}/table/${num}`;
  const qrCode = await QRCode.toDataURL(link, { width: 300 });
  res.json({ _id: `tbl_${num}`, number: num, status: 'vacant', qrCode });
});

// @route   POST api/tables
router.post('/', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ message: 'Please provide table number' });

  const num = parseInt(number);
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const qrCode = await QRCode.toDataURL(`${frontendBaseUrl}/table/${num}`, { width: 300 });
  const newTbl = { _id: `tbl_${num}_${Date.now()}`, number: num, status: 'vacant', qrCode };

  try {
    const table = await Table.create({ number: num, qrCode, status: 'vacant' });
    res.status(201).json(table);
  } catch (error) {
    memoryTables.push(newTbl);
    res.status(201).json(newTbl);
  }
});

// @route   PUT api/tables/:id
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const table = await Table.findById(req.params.id);
    if (table) {
      if (status) table.status = status;
      const updated = await table.save();
      return res.json(updated);
    }
  } catch (err) {}

  const idx = memoryTables.findIndex(t => t._id === req.params.id || t.number == req.params.id);
  if (idx > -1) {
    if (status) memoryTables[idx].status = status;
    return res.json(memoryTables[idx]);
  }
  res.status(404).json({ message: 'Table not found' });
});

// @route   DELETE api/tables/:id
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (table) {
      await table.deleteOne();
      return res.json({ message: 'Table removed' });
    }
  } catch (err) {}

  memoryTables = memoryTables.filter(t => t._id !== req.params.id);
  res.json({ message: 'Table removed' });
});

module.exports = router;
