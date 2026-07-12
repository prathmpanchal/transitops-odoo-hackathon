const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/fuel', (req, res) => {
  const { vehicle_id, liters, cost } = req.body;
  const stmt = db.prepare('INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES (?, ?, ?, CURRENT_DATE)');
  stmt.run(vehicle_id, liters, cost);
  res.status(201).json({ success: true });
});

router.post('/expense', (req, res) => {
  const { vehicle_id, type, amount } = req.body;
  const stmt = db.prepare('INSERT INTO expenses (vehicle_id, type, amount, date) VALUES (?, ?, ?, CURRENT_DATE)');
  stmt.run(vehicle_id, type, amount);
  res.status(201).json({ success: true });
});

module.exports = router;