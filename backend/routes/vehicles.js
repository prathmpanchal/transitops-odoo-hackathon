const express = require('express');
const db = require('../db');
const { ok, fail } = require('../middleware/validate');

const router = express.Router();

router.get('/available', (req, res) => {
  const rows = db.prepare(`SELECT * FROM vehicles WHERE status = 'Available' ORDER BY name`).all();
  return ok(res, rows);
});

router.get('/', (req, res) => {
  const { status, type, region } = req.query;
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (type) { query += ' AND type = ?'; params.push(type); }
  if (region) { query += ' AND region = ?'; params.push(region); }
  query += ' ORDER BY id';
  const rows = db.prepare(query).all(...params);
  return ok(res, rows);
});

router.get('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');
  return ok(res, vehicle);
});

router.get('/:id/cost', (req, res) => {
  const id = req.params.id;
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');

  const fuel_total = db.prepare('SELECT COALESCE(SUM(cost),0) as t FROM fuel_logs WHERE vehicle_id = ?').get(id).t;
  const maintenance_total = db.prepare('SELECT COALESCE(SUM(cost),0) as t FROM maintenance_logs WHERE vehicle_id = ?').get(id).t;
  const expense_total = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE vehicle_id = ?').get(id).t;

  return ok(res, {
    fuel_total, maintenance_total, expense_total,
    operational_cost: fuel_total + maintenance_total + expense_total
  });
});

router.post('/', (req, res) => {
  const { registration_number, name, type, max_load_capacity, acquisition_cost, region } = req.body;

  if (!registration_number || !name || !type) return fail(res, 400, 'Registration number, name, and type are required');
  if (!['Truck','Van','Bike','Car'].includes(type)) return fail(res, 400, 'Invalid vehicle type');
  if (!(max_load_capacity > 0)) return fail(res, 400, 'Max load capacity must be greater than 0');
  if (!(acquisition_cost >= 0)) return fail(res, 400, 'Acquisition cost cannot be negative');

  try {
    const result = db.prepare(`INSERT INTO vehicles
      (registration_number, name, type, max_load_capacity, acquisition_cost, region)
      VALUES (?, ?, ?, ?, ?, ?)`).run(registration_number, name, type, max_load_capacity, acquisition_cost, region || null);
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    return ok(res, vehicle, 201);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return fail(res, 409, 'Registration number already exists');
    return fail(res, 500, 'Server error creating vehicle');
  }
});

router.put('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');

  const { name, type, max_load_capacity, acquisition_cost, region } = req.body;
  if (max_load_capacity !== undefined && !(max_load_capacity > 0)) return fail(res, 400, 'Max load capacity must be greater than 0');
  if (acquisition_cost !== undefined && !(acquisition_cost >= 0)) return fail(res, 400, 'Acquisition cost cannot be negative');

  db.prepare(`UPDATE vehicles SET name = ?, type = ?, max_load_capacity = ?, acquisition_cost = ?, region = ? WHERE id = ?`)
    .run(name ?? vehicle.name, type ?? vehicle.type, max_load_capacity ?? vehicle.max_load_capacity,
         acquisition_cost ?? vehicle.acquisition_cost, region ?? vehicle.region, req.params.id);

  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  return ok(res, updated);
});

// Soft delete = retire, never hard-delete
router.delete('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');
  if (vehicle.status === 'On Trip') return fail(res, 409, 'Cannot retire a vehicle currently on a trip');

  db.prepare(`UPDATE vehicles SET status = 'Retired' WHERE id = ?`).run(req.params.id);
  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  return ok(res, updated);
});

module.exports = router;
