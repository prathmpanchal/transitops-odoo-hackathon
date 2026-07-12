const Database = require('better-sqlite3');
const db = new Database('transitops.db', { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('FleetManager','Driver','SafetyOfficer','FinancialAnalyst'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Truck','Van','Bike','Car')),
    max_load_capacity REAL NOT NULL CHECK(max_load_capacity > 0),
    odometer REAL NOT NULL DEFAULT 0,
    acquisition_cost REAL NOT NULL CHECK(acquisition_cost >= 0),
    region TEXT,
    status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','In Shop','Retired')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    license_category TEXT NOT NULL,
    license_expiry_date TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    safety_score INTEGER NOT NULL DEFAULT 100 CHECK(safety_score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','Off Duty','Suspended')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    vehicle_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    cargo_weight REAL NOT NULL CHECK(cargo_weight > 0),
    planned_distance REAL NOT NULL CHECK(planned_distance > 0),
    actual_distance REAL,
    fuel_consumed REAL,
    revenue REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Dispatched','Completed','Cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    cost REAL NOT NULL DEFAULT 0 CHECK(cost >= 0),
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Closed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    liters REAL NOT NULL CHECK(liters > 0),
    cost REAL NOT NULL CHECK(cost >= 0),
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    date TEXT NOT NULL
  );
`);

console.log('✅ Database and tables created successfully!');
module.exports = db;