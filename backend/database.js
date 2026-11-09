import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { AsyncLocalStorage } from "async_hooks";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const transactionStorage = new AsyncLocalStorage();

async function getConnection() {
  const connection = transactionStorage.getStore();

  if (connection) {
    return {
      connection,
      release: false
    };
  }

  const newConnection = await pool.getConnection();

  return {
    connection: newConnection,
    release: true
  };
}

/*
  SQLite-style compatibility layer
  --------------------------------
  Existing server.js can continue using:

  db.run()
  db.get()
  db.all()

  while MySQL is used underneath.
*/

const db = {
  async run(sql, params = [], callback) {
    const command = sql.trim().toUpperCase();

    // BEGIN TRANSACTION
    if (
  command === "START TRANSACTION" ||
  command === "BEGIN IMMEDIATE TRANSACTION" ||
  command === "BEGIN TRANSACTION" ||
  command === "BEGIN"
)  {
      try {
        const connection = await pool.getConnection();

        await connection.beginTransaction();

        transactionStorage.run(connection, () => {
          if (callback) {
            callback.call({
              lastID: undefined,
              changes: 0
            }, null);
          }
        });

      } catch (error) {
        if (callback) {
          callback.call(
            {
              lastID: undefined,
              changes: 0
            },
            error
          );
        }
      }

      return;
    }

    // COMMIT
    if (command === "COMMIT") {
      const connection = transactionStorage.getStore();

      if (!connection) {
        if (callback) {
          callback.call(
            {
              lastID: undefined,
              changes: 0
            },
            new Error("No active transaction")
          );
        }
        return;
      }

      try {
        await connection.commit();
        connection.release();

        if (callback) {
          callback.call(
            {
              lastID: undefined,
              changes: 0
            },
            null
          );
        }
      } catch (error) {
        try {
          connection.release();
        } catch {}

        if (callback) {
          callback.call(
            {
              lastID: undefined,
              changes: 0
            },
            error
          );
        }
      }

      return;
    }

    // ROLLBACK
    if (command === "ROLLBACK") {
      const connection = transactionStorage.getStore();

      if (!connection) {
        if (callback) {
          callback.call(
            {
              lastID: undefined,
              changes: 0
            },
            null
          );
        }
        return;
      }

      try {
        await connection.rollback();
      } catch (error) {
        console.error("Rollback error:", error);
      }

      try {
        connection.release();
      } catch {}

      if (callback) {
        callback.call(
          {
            lastID: undefined,
            changes: 0
          },
          null
        );
      }

      return;
    }

    let connection;
    let release = false;

    try {
      const result = await getConnection();

      connection = result.connection;
      release = result.release;

      const [response] = await connection.execute(sql, params);

      const context = {
        lastID: response.insertId || 0,
        changes: response.affectedRows || 0
      };

      if (release) {
        connection.release();
      }

      if (callback) {
        callback.call(context, null);
      }

    } catch (error) {
      if (connection && release) {
        try {
          connection.release();
        } catch {}
      }

      if (callback) {
        callback.call(
          {
            lastID: 0,
            changes: 0
          },
          error
        );
      }
    }
  },

  async get(sql, params = [], callback) {
    console.log("DB GET START:", sql);
  let connection;

  try {
    const result = await getConnection();
    console.log("DB GET CONNECTION OK");

    connection = result.connection;

    const [rows] = await connection.execute(sql, params);
    console.log("DB GET QUERY OK");
    console.log("DB GET ROWS:", rows);

    const row = rows.length > 0 ? rows[0] : undefined;

    if (result.release) {
      connection.release();
    }

    console.log("DB GET CALLBACK:", row);

if (callback) {
  callback(null, row);
}
  } catch (error) {
    console.error("MySQL GET error:", error);

    if (connection) {
      try {
        connection.release();
      } catch {}
    }

    if (callback) {
      callback(error);
    }
  }
},

  async all(sql, params = [], callback) {
  let connection;

  try {
    const result = await getConnection();

    connection = result.connection;

    const [rows] = await connection.execute(sql, params);
    console.log("DB ALL QUERY OK:", sql);
console.log("DB ALL ROWS:", rows);

    if (result.release) {
      connection.release();
    }

    if (callback) {
  console.log("DB ALL CALLBACK");
  callback(null, rows);
}
  } catch (error) {
    console.error("MySQL ALL error:", error);

    if (connection) {
      try {
        connection.release();
      } catch {}
    }

    if (callback) {
      callback(error);
    }
  }
}
};

// Test MySQL connection
async function initializeDatabase() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log("MySQL database connected successfully");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS farmers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        village VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        village VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        farmer_id INT NOT NULL,
        rice_name VARCHAR(255) NOT NULL,
        description TEXT,
        price_per_kg DECIMAL(10,2) NOT NULL,
        stock_kg DECIMAL(10,2) NOT NULL,
        image_url TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (farmer_id)
        REFERENCES farmers(id)
        ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        delivery_address TEXT NOT NULL,
        village VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        farmer_id INT NOT NULL,
        rice_name VARCHAR(255) NOT NULL,
        price_per_kg DECIMAL(10,2) NOT NULL,
        quantity_kg DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,

        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

        FOREIGN KEY (farmer_id)
        REFERENCES farmers(id)
        ON DELETE CASCADE
      )
    `);

    console.log("MySQL tables initialized successfully");

  } catch (error) {
    console.error("MySQL database initialization error:", error);
    throw error;

  } finally {
    if (connection) {
      connection.release();
    }
  }
}

await initializeDatabase();

export { pool };
export default db;