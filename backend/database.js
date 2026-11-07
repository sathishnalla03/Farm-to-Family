
import sqlite3 from "sqlite3";

const db = new sqlite3.Database(
  process.env.DB_PATH || "./farm-to-family.db",
  (err) => { 
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("SQLite database connected successfully");
  }
});

// Enable foreign key relationships
db.run("PRAGMA foreign_keys = ON");

// Farmers table
db.run(`
  CREATE TABLE IF NOT EXISTS farmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Products table
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    rice_name TEXT NOT NULL,
    description TEXT,
    price_per_kg REAL NOT NULL,
    stock_kg REAL NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id)
  )
`);

db.run(
  `ALTER TABLE products
   ADD COLUMN status TEXT DEFAULT 'active'`,
  (error) => {
    if (
      error &&
      !error.message.includes("duplicate column name")
    ) {
      console.error(
        "Products status update:",
        error.message
      );
    }
  }
);

db.run(
  `UPDATE products
   SET status = 'active'
   WHERE status IS NULL`,
  (error) => {
    if (error) {
      console.error(
        "Products status initialization:",
        error.message
      );
    }
  }
);

// Customer orders table
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    pincode TEXT NOT NULL,
    total_amount REAL NOT NULL,
    customer_id INTEGER,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add customer_id to existing orders table if it does not exist
db.run(
  `ALTER TABLE orders ADD COLUMN customer_id INTEGER`,
  (error) => {
    if (error && !error.message.includes("duplicate column name")) {
      console.error("Orders customer_id update:", error.message);
    }
  }
);

// Individual products inside each order
db.run(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    farmer_id INTEGER NOT NULL,
    rice_name TEXT NOT NULL,
    price_per_kg REAL NOT NULL,
    quantity_kg REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (farmer_id) REFERENCES farmers(id)
  )
`);



export default db;
