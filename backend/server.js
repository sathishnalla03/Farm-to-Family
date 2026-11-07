
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "./database.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Farm to Family API is running!"
  });
});

// Farmer Registration
app.post("/api/farmers/register", async (req, res) => {
  try {
    const { name, phone, village, district, password } = req.body;

    if (!name || !phone || !village || !district || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid mobile number"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    db.run(
      `INSERT INTO farmers
       (name, phone, village, district, password)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        phone,
        village.trim(),
        district.trim(),
        hashedPassword
      ],
      function (error) {
        if (error) {
          if (error.message.includes("UNIQUE")) {
            return res.status(409).json({
              message: "Mobile number already registered"
            });
          }

          return res.status(500).json({
            message: "Registration failed"
          });
        }

        const token = jwt.sign(
          { id: this.lastID, role: "farmer" },
          JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.status(201).json({
          message: "Account created successfully",
          token,
          farmer: {
            id: this.lastID,
            name,
            phone,
            village,
            district
          }
        });
      }
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// Farmer Login
app.post("/api/farmers/login", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      message: "Phone and password are required"
    });
  }

  db.get(
    "SELECT * FROM farmers WHERE phone = ?",
    [phone],
    async (error, farmer) => {
      if (error) {
        return res.status(500).json({
          message: "Database error"
        });
      }

      if (!farmer) {
        return res.status(401).json({
          message: "Invalid phone number or password"
        });
      }

      const validPassword = await bcrypt.compare(
        password,
        farmer.password
      );

      if (!validPassword) {
        return res.status(401).json({
          message: "Invalid phone number or password"
        });
      }

      const token = jwt.sign(
        { id: farmer.id, role: "farmer" },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        farmer: {
          id: farmer.id,
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village,
          district: farmer.district
        }
      });
    }
  );
});

// Authentication middleware
function authenticateFarmer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "farmer") {
      return res.status(403).json({
        message: "Farmer access only"
      });
    }

    req.farmerId = decoded.id;
    next();

  } catch {
    res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

// Customer Authentication middleware
function authenticateCustomer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Customer login required"
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "customer") {
      return res.status(403).json({
        message: "Customer access only"
      });
    }

    req.customerId = decoded.customerId;

    next();

  } catch {
    res.status(401).json({
      message: "Invalid or expired customer token"
    });
  }
}

app.post("/api/products", authenticateFarmer, (req, res) => {
  const {
    rice_name,
    description,
    price_per_kg,
    stock_kg,
    image_url
  } = req.body;

  if (
    !rice_name ||
    !Number.isFinite(Number(price_per_kg)) ||
    !Number.isFinite(Number(stock_kg)) ||
    Number(price_per_kg) <= 0 ||
    Number(stock_kg) <= 0
  ) {
    return res.status(400).json({
      message: "Enter valid rice name, price and stock"
    });
  }

  db.run(
    `INSERT INTO products
    (farmer_id, rice_name, description, price_per_kg, stock_kg, image_url)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.farmerId,
      rice_name.trim(),
      description || "",
      Number(price_per_kg),
      Number(stock_kg),
      image_url || ""
    ],
    function (error) {
      if (error) {
        console.error(error);
        return res.status(500).json({
          message: "Could not add product"
        });
      }

      res.status(201).json({
        message: "Rice product added successfully",
        productId: this.lastID
      });
    }
  );
});

// Get products belonging to the logged-in farmer
app.get("/api/products/my-products", authenticateFarmer, (req, res) => {
  db.all(
    `SELECT * FROM products
     WHERE farmer_id = ?
     ORDER BY created_at DESC`,
    [req.farmerId],
    (error, products) => {
      if (error) {
        return res.status(500).json({
          message: "Could not fetch products"
        });
      }

      res.json({ products });
    }
  );
});

// Update a rice product
app.put(
  "/api/products/:id",
  authenticateFarmer,
  (req, res) => {

    const { id } = req.params;

    const {
      rice_name,
      description,
      price_per_kg,
      stock_kg,
      image_url
    } = req.body;

    // Validate input
    if (
      !rice_name?.trim() ||
      !Number.isFinite(Number(price_per_kg)) ||
      !Number.isFinite(Number(stock_kg)) ||
      Number(price_per_kg) <= 0 ||
      Number(stock_kg) < 0
    ) {
      return res.status(400).json({
        message: "Enter valid rice name, price and stock"
      });
    }

    // Check that this product belongs to the logged-in farmer
    db.get(
      `SELECT id
       FROM products
       WHERE id = ? AND farmer_id = ?`,
      [id, req.farmerId],
      (error, product) => {

        if (error) {
          console.error("Product check error:", error);

          return res.status(500).json({
            message: "Database error"
          });
        }

        if (!product) {
          return res.status(404).json({
            message: "Product not found or you do not have permission"
          });
        }

        // Update product
        db.run(
          `UPDATE products
           SET
             rice_name = ?,
             description = ?,
             price_per_kg = ?,
             stock_kg = ?,
             image_url = ?
           WHERE id = ? AND farmer_id = ?`,
          [
            rice_name.trim(),
            description?.trim() || "",
            Number(price_per_kg),
            Number(stock_kg),
            image_url?.trim() || "",
            id,
            req.farmerId
          ],
          function (updateError) {

            if (updateError) {
              console.error(
                "Product update error:",
                updateError
              );

              return res.status(500).json({
                message: "Could not update product"
              });
            }

            res.json({
              message: "Rice product updated successfully"
            });
          }
        );
      }
    );
  }
);

// Delete a rice product
app.delete(
  "/api/products/:id",
  authenticateFarmer,
  (req, res) => {

    const { id } = req.params;

    db.get(
      `SELECT id, status
       FROM products
       WHERE id = ? AND farmer_id = ?`,
      [id, req.farmerId],
      (error, product) => {

        if (error) {
          console.error("Product check error:", error);

          return res.status(500).json({
            message: "Database error"
          });
        }

        if (!product) {
          return res.status(404).json({
            message: "Product not found or you do not have permission"
          });
        }

        db.run(
          `UPDATE products
           SET status = 'inactive'
           WHERE id = ? AND farmer_id = ?`,
          [id, req.farmerId],
          function (updateError) {

            if (updateError) {
              console.error(
                "Product deactivate error:",
                updateError
              );

              return res.status(500).json({
                message: "Could not remove product"
              });
            }

            res.json({
              message:
                "Rice product removed from customer marketplace successfully"
            });
          }
        );
      }
    );
  }
);

app.put(
  "/api/products/:id/reactivate",
  authenticateFarmer,
  (req, res) => {

    const { id } = req.params;

    db.get(
      `SELECT id, stock_kg, status
       FROM products
       WHERE id = ? AND farmer_id = ?`,
      [id, req.farmerId],
      (error, product) => {

        if (error) {
          console.error("Product check error:", error);

          return res.status(500).json({
            message: "Database error"
          });
        }

        if (!product) {
          return res.status(404).json({
            message: "Product not found or you do not have permission"
          });
        }

        if (Number(product.stock_kg) <= 0) {
          return res.status(400).json({
            message:
              "Add available stock before reactivating this product"
          });
        }

        db.run(
          `UPDATE products
           SET status = 'active'
           WHERE id = ? AND farmer_id = ?`,
          [id, req.farmerId],
          function (updateError) {

            if (updateError) {
              console.error(
                "Product reactivate error:",
                updateError
              );

              return res.status(500).json({
                message: "Could not reactivate product"
              });
            }

            res.json({
              message:
                "Rice product is active again and visible to customers"
            });
          }
        );
      }
    );
  }
);

// Get all available rice products for customers
app.get("/api/products", (req, res) => {

  const sql = `
    SELECT
      p.id,
      p.rice_name AS name,
      p.description,
      p.price_per_kg AS price,
      p.stock_kg,
      p.image_url AS image,
      f.name AS farmer,
      f.village,
      f.district,
      f.village || ', ' || f.district AS location
    FROM products p
    JOIN farmers f ON p.farmer_id = f.id
    WHERE p.status = 'active'
    AND p.stock_kg > 0
    ORDER BY p.created_at DESC
  `;

  db.all(sql, [], (error, products) => {

    if (error) {
      console.error("Product fetch error:", error);

      return res.status(500).json({
        message: "Unable to fetch rice products"
      });
    }

    res.json({ products });

  });
});

// Get orders for the logged-in farmer
app.get(
  "/api/farmers/orders",
  authenticateFarmer,
  (req, res) => {

    const sql = `
      SELECT
        o.id AS order_id,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        o.village,
        o.district,
        o.pincode,
        o.status,
        o.created_at,

        oi.id AS order_item_id,
        oi.product_id,
        oi.rice_name,
        oi.price_per_kg,
        oi.quantity_kg,
        oi.subtotal

      FROM orders o

      JOIN order_items oi
        ON o.id = oi.order_id

      WHERE oi.farmer_id = ?

      ORDER BY o.created_at DESC
    `;

    db.all(
      sql,
      [req.farmerId],
      (error, orders) => {

        if (error) {
          console.error("Farmer orders error:", error);

          return res.status(500).json({
            message: "Unable to fetch orders"
          });
        }

        res.json({
          orders
        });

      }
    );

  }
);

// Farmer Profile
app.get(
  "/api/farmers/profile",
  authenticateFarmer,
  (req, res) => {
    db.get(
      `SELECT id, name, phone, village, district, created_at
       FROM farmers WHERE id = ?`,
      [req.farmerId],
      (error, farmer) => {
        if (error) {
          return res.status(500).json({
            message: "Database error"
          });
        }

        if (!farmer) {
          return res.status(404).json({
            message: "Farmer not found"
          });
        }

        res.json({ farmer });
      }
    );
  }
);


// CUSTOMER PLACE ORDER API

app.post("/api/orders", authenticateCustomer, (req, res) => {

  const {
    customer_name,
    customer_phone,
    delivery_address,
    village,
    district,
    pincode,
    items
  } = req.body;

  // Validate customer details
  if (
    !customer_name?.trim() ||
    !customer_phone ||
    !delivery_address?.trim() ||
    !village?.trim() ||
    !district?.trim() ||
    !pincode
  ) {
    return res.status(400).json({
      message: "Please fill in all customer and delivery details"
    });
  }

  if (!/^[6-9]\d{9}$/.test(customer_phone)) {
    return res.status(400).json({
      message: "Enter a valid 10-digit mobile number"
    });
  }

  if (!/^\d{6}$/.test(String(pincode))) {
    return res.status(400).json({
      message: "Enter a valid 6-digit pincode"
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Your order must contain at least one product"
    });
  }

  // Validate and combine duplicate product IDs
  const itemMap = new Map();

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > 100000
    ) {
      return res.status(400).json({
        message: "Invalid product or quantity"
      });
    }

    itemMap.set(
      productId,
      (itemMap.get(productId) || 0) + quantity
    );
  }

  const orderItems = Array.from(itemMap, ([productId, quantity]) => ({
    productId,
    quantity
  }));

  // Start database transaction
  db.run("BEGIN IMMEDIATE TRANSACTION", (beginError) => {

    if (beginError) {
      console.error("Transaction error:", beginError);

      return res.status(500).json({
        message: "Unable to start order"
      });
    }

    // Roll back if anything goes wrong
    const failOrder = (status, message) => {
      db.run("ROLLBACK", () => {
        res.status(status).json({ message });
      });
    };

    const selectedProducts = [];

    // Fetch and verify every product
    const checkProduct = (index) => {

      if (index >= orderItems.length) {
        saveOrder();
        return;
      }

      const item = orderItems[index];

      db.get(
        `SELECT id, farmer_id, rice_name, price_per_kg, stock_kg
         FROM products
         WHERE id = ?`,
        [item.productId],
        (error, product) => {

          if (error) {
            console.error(error);
            return failOrder(500, "Unable to verify products");
          }

          if (!product) {
            return failOrder(404, "A selected rice product was not found");
          }

          if (Number(product.stock_kg) < item.quantity) {
            return failOrder(
              400,
              `Insufficient stock for ${product.rice_name}. Available: ${product.stock_kg} kg`
            );
          }

          selectedProducts.push({
            ...product,
            quantity: item.quantity,
            subtotal: Number(product.price_per_kg) * item.quantity
          });

          checkProduct(index + 1);

        }
      );

    };

    // Save customer order
    const saveOrder = () => {

      const totalAmount = Number(
        selectedProducts.reduce(
          (total, item) => total + item.subtotal,
          0
        ).toFixed(2)
      );

      db.run(
  `INSERT INTO orders
  (customer_id, customer_name, customer_phone, delivery_address,
   village, district, pincode, total_amount)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    req.customerId,
    customer_name.trim(),
    customer_phone,
    delivery_address.trim(),
    village.trim(),
    district.trim(),
    String(pincode),
    totalAmount
  ],
        function (error) {

          if (error) {
            console.error(error);
            return failOrder(500, "Unable to save your order");
          }

          const orderId = this.lastID;

          // Save each order item and reduce product stock
          saveOrderItem(0, orderId, totalAmount);

        }
      );

    };

    // Process order items one by one
    const saveOrderItem = (index, orderId, totalAmount) => {

      if (index >= selectedProducts.length) {

        db.run("COMMIT", (error) => {

          if (error) {
            console.error(error);
            return failOrder(500, "Unable to complete your order");
          }

          return res.status(201).json({
            message: "Order placed successfully!",
            orderId,
            totalAmount,
            status: "Pending"
          });

        });

        return;
      }

      const item = selectedProducts[index];

      // Reduce available stock safely
      db.run(
        `UPDATE products
         SET stock_kg = stock_kg - ?
         WHERE id = ? AND stock_kg >= ?`,
        [
          item.quantity,
          item.id,
          item.quantity
        ],
        function (error) {

          if (error) {
            console.error(error);
            return failOrder(500, "Unable to update rice stock");
          }

          if (this.changes !== 1) {
            return failOrder(
              400,
              `Insufficient stock for ${item.rice_name}`
            );
          }

          // Save product details in order_items
          db.run(
            `INSERT INTO order_items
            (order_id, product_id, farmer_id, rice_name,
             price_per_kg, quantity_kg, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              item.id,
              item.farmer_id,
              item.rice_name,
              item.price_per_kg,
              item.quantity,
              item.subtotal
            ],
            (error) => {

              if (error) {
                console.error(error);
                return failOrder(500, "Unable to save order items");
              }

              saveOrderItem(index + 1, orderId, totalAmount);

            }
          );

        }
      );

    };

    checkProduct(0);

  });

});

// Update order status for the logged-in farmer
app.put(
  "/api/farmers/orders/:orderItemId/status",
  authenticateFarmer,
  (req, res) => {

    const { status } = req.body;
    const { orderItemId } = req.params;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Out for Delivery",
      "Delivered"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    db.get(
      `SELECT id, farmer_id
       FROM order_items
       WHERE id = ?`,
      [orderItemId],
      (error, item) => {

        if (error) {
          console.error(error);

          return res.status(500).json({
            message: "Database error"
          });
        }

        if (!item) {
          return res.status(404).json({
            message: "Order item not found"
          });
        }

        if (item.farmer_id !== req.farmerId) {
          return res.status(403).json({
            message: "You can only update your own orders"
          });
        }

        db.run(
          `UPDATE orders
           SET status = ?
           WHERE id = (
             SELECT order_id
             FROM order_items
             WHERE id = ?
           )`,
          [status, orderItemId],
          function (updateError) {

            if (updateError) {
              console.error(updateError);

              return res.status(500).json({
                message: "Unable to update order status"
              });
            }

            res.json({
              message: "Order status updated successfully",
              status
            });

          }
        );

      }
    );

  }
);

// ==============================
// CUSTOMER ORDER TRACKING
// ==============================

app.get("/api/orders/:orderId", (req, res) => {
  const { orderId } = req.params;
  const { phone } = req.query;

  if (!orderId || !phone) {
    return res.status(400).json({
      message: "Order ID and mobile number are required"
    });
  }

  const sql = `
    SELECT
      o.id AS order_id,
      o.customer_name,
      o.customer_phone,
      o.delivery_address,
      o.village,
      o.district,
      o.pincode,
      o.total_amount,
      o.status,
      o.created_at,
      oi.rice_name,
      oi.price_per_kg,
      oi.quantity_kg,
      oi.subtotal
    FROM orders o
    JOIN order_items oi
      ON o.id = oi.order_id
    WHERE o.id = ?
      AND o.customer_phone = ?
  `;

  db.all(sql, [orderId, phone], (error, orders) => {
    if (error) {
      console.error("Order tracking error:", error);

      return res.status(500).json({
        message: "Unable to fetch order"
      });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "Order not found. Check your Order ID and mobile number."
      });
    }

    const order = orders[0];

    res.json({
      order: {
        order_id: order.order_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address,
        village: order.village,
        district: order.district,
        pincode: order.pincode,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items: orders.map(item => ({
          rice_name: item.rice_name,
          price_per_kg: item.price_per_kg,
          quantity_kg: item.quantity_kg,
          subtotal: item.subtotal
        }))
      }
    });
  });
});

// ==============================
// CUSTOMER AUTHENTICATION
// ==============================

// Customer Registration
app.post("/api/customers/register", async (req, res) => {
  const { name, phone, village, district, password } = req.body;

  if (!name || !phone || !village || !district || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO customers
      (name, phone, village, district, password)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [name, phone, village, district, hashedPassword],
      function (error) {
        if (error) {
          if (error.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({
              message: "Mobile number already registered"
            });
          }

          console.error("Customer registration error:", error);

          return res.status(500).json({
            message: "Unable to register customer"
          });
        }

        const token = jwt.sign(
          {
            customerId: this.lastID,
            role: "customer"
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.status(201).json({
          message: "Customer registered successfully",
          token,
          customer: {
            id: this.lastID,
            name,
            phone,
            village,
            district
          }
        });
      }
    );
  } catch (error) {
    console.error("Customer registration error:", error);

    res.status(500).json({
      message: "Unable to register customer"
    });
  }
});


// Customer Login
app.post("/api/customers/login", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      message: "Mobile number and password are required"
    });
  }

  const sql = `
    SELECT *
    FROM customers
    WHERE phone = ?
  `;

  db.get(sql, [phone], async (error, customer) => {
    if (error) {
      console.error("Customer login error:", error);

      return res.status(500).json({
        message: "Unable to login"
      });
    }

    if (!customer) {
      return res.status(401).json({
        message: "Invalid mobile number or password"
      });
    }

    try {
      const passwordMatch = await bcrypt.compare(
        password,
        customer.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid mobile number or password"
        });
      }

      const token = jwt.sign(
        {
          customerId: customer.id,
          role: "customer"
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Customer login successful",
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          village: customer.village,
          district: customer.district
        }
      });

    } catch (err) {
      console.error("Customer password check error:", err);

      res.status(500).json({
        message: "Unable to login"
      });
    }
  });
});

// ==============================
// CUSTOMER MY ORDERS
// ==============================

app.get(
  "/api/customers/orders",
  authenticateCustomer,
  (req, res) => {

    const sql = `
      SELECT
        o.id AS order_id,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        o.village,
        o.district,
        o.pincode,
        o.total_amount,
        o.status,
        o.created_at,

        oi.id AS order_item_id,
        oi.product_id,
        oi.rice_name,
        oi.price_per_kg,
        oi.quantity_kg,
        oi.subtotal

      FROM orders o

      JOIN order_items oi
        ON o.id = oi.order_id

      WHERE o.customer_id = ?

      ORDER BY o.created_at DESC
    `;

    db.all(
      sql,
      [req.customerId],
      (error, orders) => {

        if (error) {
          console.error(
            "Customer orders error:",
            error
          );

          return res.status(500).json({
            message: "Unable to fetch your orders"
          });
        }

        res.json({
          orders
        });
      }
    );
  }
);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
