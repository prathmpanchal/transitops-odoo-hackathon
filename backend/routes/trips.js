const express = require('express');
const db = require('../db');
const { ok, fail } = require('../middleware/validate');

const router = express.Router();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Shared validation: can this vehicle+driver combo legally be dispatched right now?
// Returns null if OK, or a string error message if not.
function validateAssignment(vehicle, driver, cargo_weight) {
  if (cargo_weight > vehicle.max_load_capacity) return 'Cargo weight exceeds vehicle capacity';
  if (vehicle.status !== 'Available') return 'Vehicle is not available';
  if (driver.status === 'Suspended') return 'Driver is suspended';
  if (driver.license_expiry_date < todayISO()) return 'Driver license has expired';
  if (driver.status !== 'Available') return 'Driver is not available';
  return null;
}

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT trips.*, vehicles.name as vehicle_name, vehicles.registration_number,
           drivers.name as driver_name
    FROM trips
    JOIN vehicles ON trips.vehicle_id = vehicles.id
    JOIN drivers ON trips.driver_id = drivers.id
    ORDER BY trips.id DESC
  `).all();
  return ok(res, rows);
});

router.get('/:id', (req, res) => {
  const trip = db.prepare(`
    SELECT trips.*, vehicles.name as vehicle_name, drivers.name as driver_name
    FROM trips JOIN vehicles ON trips.vehicle_id = vehicles.id
    JOIN drivers ON trips.driver_id = drivers.id
    WHERE trips.id = ?`).get(req.params.id);
  if (!trip) return fail(res, 404, 'Trip not found');
  return ok(res, trip);
});

// Create as Draft — validate up front so obviously-invalid trips can't even be drafted
router.post('/', (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue } = req.body;

  if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
    return fail(res, 400, 'Source, destination, vehicle, driver, cargo weight, and planned distance are required');
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  if (!vehicle) return fail(res, 404, 'Vehicle not found');
  if (!driver) return fail(res, 404, 'Driver not found');

  const error = validateAssignment(vehicle, driver, cargo_weight);
  if (error) return fail(res, 400, error);

  const result = db.prepare(`INSERT INTO trips
    (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue ?? 0
    );

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);
  return ok(res, trip, 201);
});

// Dispatch: RE-VALIDATE everything (state may have changed since Draft was created)
router.put('/:id/dispatch', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return fail(res, 404, 'Trip not found');
  if (trip.status !== 'Draft') return fail(res, 409, 'Only draft trips can be dispatched');

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(trip.vehicle_id);
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(trip.driver_id);

  const error = validateAssignment(vehicle, driver, trip.cargo_weight);
  if (error) return fail(res, 409, error);

  const dispatch = db.transaction(() => {
    db.prepare(`UPDATE trips SET status = 'Dispatched' WHERE id = ?`).run(trip.id);
    db.prepare(`UPDATE vehicles SET status = 'On Trip' WHERE id = ?`).run(vehicle.id);
    db.prepare(`UPDATE drivers SET status = 'On Trip' WHERE id = ?`).run(driver.id);
  });
  dispatch();

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
  return ok(res, updated);
});

// Complete: capture actuals, restore statuses, auto-log fuel
router.put('/:id/complete', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return fail(res, 404, 'Trip not found');
  if (trip.status !== 'Dispatched') return fail(res, 409, 'Trip must be dispatched before it can be completed');

  const { actual_distance, fuel_consumed } = req.body;
  if (!(actual_distance > 0) || !(fuel_consumed > 0)) {
    return fail(res, 400, 'Actual distance and fuel consumed must both be greater than 0');
  }

  const complete = db.transaction(() => {
    db.prepare(`UPDATE trips SET status = 'Completed', actual_distance = ?, fuel_consumed = ? WHERE id = ?`)
      .run(actual_distance, fuel_consumed, trip.id);
    db.prepare(`UPDATE vehicles SET status = 'Available', odometer = odometer + ? WHERE id = ?`)
      .run(actual_distance, trip.vehicle_id);
    db.prepare(`UPDATE drivers SET status = 'Available' WHERE id = ?`).run(trip.driver_id);
    db.prepare(`INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES (?, ?, 0, ?)`)
      .run(trip.vehicle_id, fuel_consumed, todayISO());
  });
  complete();

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
  return ok(res, updated);
});

// Cancel: only dispatched trips can be cancelled
router.put('/:id/cancel', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return fail(res, 404, 'Trip not found');
  if (trip.status !== 'Dispatched') return fail(res, 409, 'Only dispatched trips can be cancelled');

  const cancel = db.transaction(() => {
    db.prepare(`UPDATE trips SET status = 'Cancelled' WHERE id = ?`).run(trip.id);
    db.prepare(`UPDATE vehicles SET status = 'Available' WHERE id = ?`).run(trip.vehicle_id);
    db.prepare(`UPDATE drivers SET status = 'Available' WHERE id = ?`).run(trip.driver_id);
  });
  cancel();

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id);
  return ok(res, updated);
});

module.exports = router;
