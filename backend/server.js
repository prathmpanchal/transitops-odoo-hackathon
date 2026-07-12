const express = require('express');
const cors = require('cors');
require('./db'); // ensures tables exist on boot

const { requireAuth, requireRole } = require('./middleware/validate');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const fuelExpenseRoutes = require('./routes/fuelExpenses');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Public
app.use('/api/auth', authRoutes);

// Everything below requires a valid login
app.use('/api/vehicles', requireAuth, vehicleRoutes);
app.use('/api/drivers', requireAuth, driverRoutes);
app.use('/api/trips', requireAuth, tripRoutes);
app.use('/api/maintenance', requireAuth, maintenanceRoutes);
app.use('/api', requireAuth, fuelExpenseRoutes); // exposes /api/fuel-logs and /api/expenses
app.use('/api/dashboard', requireAuth, dashboardRoutes);

// CSV export restricted to Financial Analysts as a light RBAC demonstration
app.get('/api/reports/export.csv', requireAuth, requireRole('FinancialAnalyst', 'FleetManager'), (req, res, next) => {
  req.url = '/export.csv';
  reportRoutes(req, res, next);
});
app.use('/api/reports', requireAuth, reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Server error' });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`TransitOps backend running on http://localhost:${PORT}`));
