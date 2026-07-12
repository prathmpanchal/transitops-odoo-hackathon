const express = require('express');
const cors = require('cors');

// Initialize database
require('./db');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const fuelExpenseRoutes = require('./routes/fuelExpenses');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api', fuelExpenseRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TransitOps Backend Running ✅'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 TransitOps Backend running on http://localhost:${PORT}`);
});