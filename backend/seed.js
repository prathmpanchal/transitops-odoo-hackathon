const db = require('./db');
const bcrypt = require('bcryptjs');

console.log('Seeding full demo data...');

const hashedPassword = bcrypt.hashSync('demo1234', 10);

// Clear data
db.exec('DELETE FROM users');
db.exec('DELETE FROM vehicles');
db.exec('DELETE FROM drivers');
db.exec('DELETE FROM trips');
db.exec('DELETE FROM maintenance_logs');
db.exec('DELETE FROM fuel_logs');
db.exec('DELETE FROM expenses');

// Users
const usersStmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
usersStmt.run('Priya Fleet', 'fleet@transitops.com', hashedPassword, 'FleetManager');
usersStmt.run('Alex Driver', 'driver@transitops.com', hashedPassword, 'Driver');
usersStmt.run('Sara Safety', 'safety@transitops.com', hashedPassword, 'SafetyOfficer');
usersStmt.run('Raj Finance', 'finance@transitops.com', hashedPassword, 'FinancialAnalyst');

// Vehicles
const vehicleStmt = db.prepare('INSERT INTO vehicles (registration_number, name, type, max_load_capacity, acquisition_cost, region, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
vehicleStmt.run('GJ-01-AB-1111', 'Tata Ace', 'Van', 500, 450000, 'Ahmedabad', 'Available');
vehicleStmt.run('GJ-01-AB-2222', 'Mahindra Bolero', 'Truck', 1500, 900000, 'Ahmedabad', 'Available');
vehicleStmt.run('GJ-01-AB-3333', 'Honda Activa', 'Bike', 50, 90000, 'Gandhinagar', 'Available');
vehicleStmt.run('GJ-01-AB-4444', 'Maruti Eeco', 'Van', 400, 380000, 'Ahmedabad', 'In Shop');
vehicleStmt.run('GJ-01-AB-5555', 'Tata 407', 'Truck', 2500, 1200000, 'Gandhinagar', 'Available');
vehicleStmt.run('GJ-01-AB-6666', 'Old Van', 'Van', 350, 200000, 'Ahmedabad', 'Retired');

// Drivers
const driverStmt = db.prepare('INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
driverStmt.run('Alex Kumar', 'GJ01-2019-001', 'LMV', '2027-06-01', '9998887771', 92, 'Available');
driverStmt.run('Vikram Singh', 'GJ01-2018-002', 'HMV', '2025-12-01', '9998887772', 60, 'Suspended'); // Expired + Suspended for demo
driverStmt.run('Deepak Rao', 'GJ01-2015-003', 'LMV', '2025-01-01', '9998887773', 78, 'Available'); // Expired
driverStmt.run('Meena Patel', 'GJ01-2020-004', 'LMV', '2027-03-15', '9998887774', 95, 'Available');
driverStmt.run('Suresh Nair', 'GJ01-2021-005', 'HMV', '2027-09-01', '9998887775', 88, 'On Trip');

// Trips — spans all four statuses so dashboard/reports have real data to show
const tripStmt = db.prepare(`INSERT INTO trips
  (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status, revenue)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
tripStmt.run('Ahmedabad', 'Gandhinagar', 5, 5, 1200, 35, null, null, 'Dispatched', 3000);
tripStmt.run('Ahmedabad', 'Vadodara', 1, 1, 300, 110, 112, 9.5, 'Completed', 5500);
tripStmt.run('Ahmedabad', 'Surat', 2, 4, 900, 260, 265, 28, 'Completed', 12000);
tripStmt.run('Gandhinagar', 'Ahmedabad', 3, 1, 40, 30, null, null, 'Draft', 800);
tripStmt.run('Ahmedabad', 'Rajkot', 2, 4, 1100, 220, null, null, 'Cancelled', 0);

// Maintenance logs
const maintStmt = db.prepare(`INSERT INTO maintenance_logs
  (vehicle_id, description, cost, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)`);
maintStmt.run(4, 'Brake pad replacement', 4500, '2026-07-10', null, 'Open');
maintStmt.run(1, 'Oil change', 1200, '2026-06-15', '2026-06-16', 'Closed');

// Fuel logs
const fuelStmt = db.prepare(`INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES (?, ?, ?, ?)`);
fuelStmt.run(2, 30, 2850, '2026-07-05');
fuelStmt.run(5, 15, 1425, '2026-07-11');
fuelStmt.run(1, 9.5, 902, '2026-06-20');
fuelStmt.run(2, 28, 2660, '2026-06-22');

// Expenses
const expStmt = db.prepare(`INSERT INTO expenses (vehicle_id, type, amount, date) VALUES (?, ?, ?, ?)`);
expStmt.run(1, 'Toll', 150, '2026-07-08');
expStmt.run(2, 'Parking', 80, '2026-07-09');

console.log('✅ Full basic demo data seeded successfully!');
console.log('Demo logins: fleet@transitops.com / demo1234 (and others)');