const express = require('express');
const { Parser } = require('json2csv');
const db = require('../db');
const { ok } = require('../middleware/validate');

const router = express.Router();

function costBreakdown() {
  const vehicles = db.prepare(`SELECT * FROM vehicles WHERE status != 'Retired'`).all();
  return vehicles.map(v => {
    const fuel_total = db.prepare('SELECT COALESCE(SUM(cost),0) as t FROM fuel_logs WHERE vehicle_id = ?').get(v.id).t;
    const maintenance_total = db.prepare('SELECT COALESCE(SUM(cost),0) as t FROM maintenance_logs WHERE vehicle_id = ?').get(v.id).t;
    const expense_total = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE vehicle_id = ?').get(v.id).t;
    const revenue_total = db.prepare(`SELECT COALESCE(SUM(revenue),0) as t FROM trips WHERE vehicle_id = ? AND status = 'Completed'`).get(v.id).t;
    const operational_cost = fuel_total + maintenance_total + expense_total;
    const roi_pct = v.acquisition_cost > 0
      ? Math.round(((revenue_total - (maintenance_total + fuel_total)) / v.acquisition_cost) * 1000) / 10
      : 0;
    return {
      vehicle_id: v.id, registration_number: v.registration_number, name: v.name,
      fuel_total, maintenance_total, expense_total, operational_cost, revenue_total, roi_pct
    };
  });
}

router.get('/fuel-efficiency', (req, res) => {
  const vehicles = db.prepare(`SELECT * FROM vehicles`).all();
  const data = vehicles.map(v => {
    const row = db.prepare(`
      SELECT COALESCE(SUM(actual_distance),0) as dist, COALESCE(SUM(fuel_consumed),0) as fuel
      FROM trips WHERE vehicle_id = ? AND status = 'Completed'`).get(v.id);
    const efficiency = row.fuel > 0 ? Math.round((row.dist / row.fuel) * 100) / 100 : null;
    return { vehicle_id: v.id, name: v.name, registration_number: v.registration_number,
      total_distance: row.dist, total_fuel: row.fuel, km_per_liter: efficiency };
  });
  return ok(res, data);
});

router.get('/utilization', (req, res) => {
  const types = db.prepare(`SELECT DISTINCT type FROM vehicles`).all().map(r => r.type);
  const data = types.map(type => {
    const total = db.prepare(`SELECT COUNT(*) as c FROM vehicles WHERE type = ? AND status != 'Retired'`).get(type).c;
    const onTrip = db.prepare(`SELECT COUNT(*) as c FROM vehicles WHERE type = ? AND status = 'On Trip'`).get(type).c;
    return { type, utilization_pct: total > 0 ? Math.round((onTrip / total) * 1000) / 10 : 0 };
  });
  return ok(res, data);
});

router.get('/operational-cost', (req, res) => {
  return ok(res, costBreakdown());
});

router.get('/roi', (req, res) => {
  return ok(res, costBreakdown().map(r => ({
    vehicle_id: r.vehicle_id, registration_number: r.registration_number, name: r.name, roi_pct: r.roi_pct
  })));
});

router.get('/export.csv', (req, res) => {
  const data = costBreakdown();
  const parser = new Parser();
  const csv = parser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.attachment('transitops_cost_roi_report.csv');
  return res.send(csv);
});

module.exports = router;
