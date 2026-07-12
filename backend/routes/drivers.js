const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all drivers
router.get('/', (req, res) => {
  const drivers = db.prepare('SELECT * FROM drivers').all();
  res.json({ success: true, data: drivers });
});

// Get available drivers
router.get('/available', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const drivers = db.prepare(`
    SELECT * FROM drivers 
    WHERE status = 'Available' 
    AND license_expiry_date >= ?
  `).all(today);
  res.json({ success: true, data: drivers });
});

// Create driver
router.post('/', (req, res) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, license_number, license_category, license_expiry_date, contact_number, safety_score || 100);
    res.status(201).json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'License number already exists' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;