const express = require('express');
const db = require('../db');
const { ok, fail } = require('../middleware/validate');

const router = express.Router();

router.get('/fuel-logs', (req, res) => {
  const rows = db.prepare(`
    SELECT fuel_logs.*, vehicles.name as vehicle_name, vehicles.registration_number
    FROM fuel_logs JOIN vehicles ON fuel_logs.vehicle_id = vehicles.id
    ORDER BY fuel_logs.date DESC
  `).all();
  return ok(res, rows);
});

router.post('/fuel-logs', (req, res) => {
  const { vehicle_id, liters, cost, date } = req.body;
  if (!vehicle_id || !(liters > 0) || !(cost >= 0)) {
    return fail(res, 400, 'Vehicle, liters (>0), and cost (>=0) are required');
  }
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');

  const result = db.prepare(`INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES (?, ?, ?, ?)`)
    .run(vehicle_id, liters, cost, date || new Date().toISOString().slice(0, 10));
  const log = db.prepare('SELECT * FROM fuel_logs WHERE id = ?').get(result.lastInsertRowid);
  return ok(res, log, 201);
});

router.get('/expenses', (req, res) => {
  const rows = db.prepare(`
    SELECT expenses.*, vehicles.name as vehicle_name, vehicles.registration_number
    FROM expenses JOIN vehicles ON expenses.vehicle_id = vehicles.id
    ORDER BY expenses.date DESC
  `).all();
  return ok(res, rows);
});

router.post('/expenses', (req, res) => {
  const { vehicle_id, type, amount, date } = req.body;
  if (!vehicle_id || !type || !(amount >= 0)) {
    return fail(res, 400, 'Vehicle, type, and amount (>=0) are required');
  }
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');

  const result = db.prepare(`INSERT INTO expenses (vehicle_id, type, amount, date) VALUES (?, ?, ?, ?)`)
    .run(vehicle_id, type, amount, date || new Date().toISOString().slice(0, 10));
  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  return ok(res, expense, 201);
});

module.exports = router;
