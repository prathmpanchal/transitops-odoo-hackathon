const express = require('express');
const db = require('../db');
const { ok, fail } = require('../middleware/validate');

const router = express.Router();

router.get('/available', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`SELECT * FROM drivers WHERE status = 'Available' AND license_expiry_date >= ? ORDER BY name`).all(today);
  return ok(res, rows);
});

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM drivers WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY id';
  const rows = db.prepare(query).all(...params);
  return ok(res, rows);
});

router.get('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return fail(res, 404, 'Driver not found');
  return ok(res, driver);
});

router.post('/', (req, res) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score } = req.body;

  if (!name || !license_number || !license_expiry_date || !contact_number) {
    return fail(res, 400, 'Name, license number, license expiry date, and contact number are required');
  }

  try {
    const result = db.prepare(`INSERT INTO drivers
      (name, license_number, license_category, license_expiry_date, contact_number, safety_score)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
        name, license_number, license_category || 'LMV', license_expiry_date, contact_number, safety_score ?? 100
      );
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
    return ok(res, driver, 201);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return fail(res, 409, 'License number already exists');
    return fail(res, 500, 'Server error creating driver');
  }
});

router.put('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return fail(res, 404, 'Driver not found');

  const { name, license_category, license_expiry_date, contact_number, safety_score, status } = req.body;
  if (status && !['Available','On Trip','Off Duty','Suspended'].includes(status)) {
    return fail(res, 400, 'Invalid driver status');
  }

  db.prepare(`UPDATE drivers SET name = ?, license_category = ?, license_expiry_date = ?, contact_number = ?, safety_score = ?, status = ? WHERE id = ?`)
    .run(name ?? driver.name, license_category ?? driver.license_category, license_expiry_date ?? driver.license_expiry_date,
         contact_number ?? driver.contact_number, safety_score ?? driver.safety_score, status ?? driver.status, req.params.id);

  const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  return ok(res, updated);
});

module.exports = router;
