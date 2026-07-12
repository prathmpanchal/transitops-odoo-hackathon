const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const logs = db.prepare('SELECT * FROM maintenance_logs').all();
  res.json({ success: true, data: logs });
});

router.post('/', (req, res) => {
  const { vehicle_id, description, cost } = req.body;

  const vehicle = db.prepare('SELECT status FROM vehicles WHERE id = ?').get(vehicle_id);
  if (vehicle.status === 'On Trip') {
    return res.status(409).json({ success: false, error: 'Cannot send a vehicle on trip to maintenance' });
  }

  const stmt = db.prepare('INSERT INTO maintenance_logs (vehicle_id, description, cost, start_date) VALUES (?, ?, ?, CURRENT_DATE)');
  const info = stmt.run(vehicle_id, description, cost || 0);

  // Auto update vehicle status
  db.prepare("UPDATE vehicles SET status = 'In Shop' WHERE id = ?").run(vehicle_id);

  res.status(201).json({ success: true, data: { id: info.lastInsertRowid } });
});

router.put('/:id/close', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE maintenance_logs SET status = "Closed", end_date = CURRENT_DATE WHERE id = ?').run(id);
  // Auto restore vehicle (unless Retired)
  db.prepare(`
    UPDATE vehicles SET status = 'Available' 
    WHERE id = (SELECT vehicle_id FROM maintenance_logs WHERE id = ?) 
    AND status != 'Retired'
  `).run(id);
  res.json({ success: true });
});

module.exports = router;