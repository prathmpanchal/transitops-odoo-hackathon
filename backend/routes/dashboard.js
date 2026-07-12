const express = require('express');
const db = require('../db');
const { ok } = require('../middleware/validate');

const router = express.Router();

router.get('/stats', (req, res) => {
  const active_vehicles = db.prepare(`SELECT COUNT(*) as c FROM vehicles WHERE status != 'Retired'`).get().c;
  const available_vehicles = db.prepare(`SELECT COUNT(*) as c FROM vehicles WHERE status = 'Available'`).get().c;
  const in_maintenance = db.prepare(`SELECT COUNT(*) as c FROM vehicles WHERE status = 'In Shop'`).get().c;
  const on_trip_vehicles = db.prepare(`SELECT COUNT(*) as c FROM vehicles WHERE status = 'On Trip'`).get().c;
  const active_trips = db.prepare(`SELECT COUNT(*) as c FROM trips WHERE status = 'Dispatched'`).get().c;
  const pending_trips = db.prepare(`SELECT COUNT(*) as c FROM trips WHERE status = 'Draft'`).get().c;
  const drivers_on_duty = db.prepare(`SELECT COUNT(*) as c FROM drivers WHERE status = 'On Trip'`).get().c;

  const fleet_utilization_pct = active_vehicles > 0
    ? Math.round((on_trip_vehicles / active_vehicles) * 1000) / 10
    : 0;

  return ok(res, {
    active_vehicles, available_vehicles, in_maintenance,
    active_trips, pending_trips, drivers_on_duty, fleet_utilization_pct
  });
});

router.get('/status-breakdown', (req, res) => {
  const rows = db.prepare(`SELECT status, COUNT(*) as count FROM vehicles GROUP BY status`).all();
  return ok(res, rows);
});

module.exports = router;
