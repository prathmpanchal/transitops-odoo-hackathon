const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all vehicles
router.get('/', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles').all();
  res.json({ success: true, data: vehicles });
});

// Get available vehicles for dispatch
router.get('/available', (req, res) => {
  const vehicles = db.prepare("SELECT * FROM vehicles WHERE status = 'Available'").all();
  res.json({ success: true, data: vehicles });
});

// Create vehicle
router.post('/', (req, res) => {
  const { registration_number, name, type, max_load_capacity, acquisition_cost, region } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO vehicles (registration_number, name, type, max_load_capacity, acquisition_cost, region)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(registration_number, name, type, max_load_capacity, acquisition_cost, region);
    res.status(201).json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'Registration number already exists' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;