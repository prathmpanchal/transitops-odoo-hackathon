const express = require('express');
const db = require('../db');

const router = express.Router();

// Get all trips
router.get('/', (req, res) => {
  const trips = db.prepare(`
    SELECT t.*, v.name as vehicle_name, d.name as driver_name 
    FROM trips t 
    JOIN vehicles v ON t.vehicle_id = v.id 
    JOIN drivers d ON t.driver_id = d.id
  `).all();
  res.json({ success: true, data: trips });
});

// Create trip (Draft)
router.post('/', (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue } = req.body;

  // Basic validation
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle || vehicle.status !== 'Available') {
    return res.status(400).json({ success: false, error: 'Vehicle is not available' });
  }
  if (cargo_weight > vehicle.max_load_capacity) {
    return res.status(400).json({ success: false, error: 'Cargo weight exceeds vehicle capacity' });
  }

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  if (!driver || driver.status !== 'Available') {
    return res.status(400).json({ success: false, error: 'Driver is not available' });
  }

  const today = new Date().toISOString().split('T')[0];
  if (driver.license_expiry_date < today || driver.status === 'Suspended') {
    return res.status(400).json({ success: false, error: driver.license_expiry_date < today ? 'Driver license has expired' : 'Driver is suspended' });
  }

  const stmt = db.prepare(`
    INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue || 0);

  res.status(201).json({ success: true, data: { id: info.lastInsertRowid, status: 'Draft' } });
});

module.exports = router;