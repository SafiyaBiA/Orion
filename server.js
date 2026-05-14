import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import exceljs from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(__dirname));


// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Safiya@123"
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        process.exit(1);
    }
    console.log("✅ Connected to MySQL Server");

    // Initialize Database and Tables
    db.query("CREATE DATABASE IF NOT EXISTS orders_db", (err) => {
        if (err) throw err;
        db.query("USE orders_db", (err) => {
            if (err) throw err;
            
            const createOrdersTable = `
                CREATE TABLE IF NOT EXISTS orders (
                    orderID VARCHAR(50) PRIMARY KEY,
                    address TEXT,
                    quantity INT,
                    status VARCHAR(50) DEFAULT 'Pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            const createVehiclesTable = `
                CREATE TABLE IF NOT EXISTS vehicles (
                    vehicle_id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100),
                    weight_capacity INT,
                    volume_capacity INT,
                    current_weight INT DEFAULT 0,
                    current_volume INT DEFAULT 0,
                    source VARCHAR(100),
                    destination VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'Active'
                )
            `;
            
            db.query(createOrdersTable, (err) => {
                if (err) throw err;
                db.query(createVehiclesTable, (err) => {
                    if (err) throw err;
                    console.log("✅ Database and Tables initialized");
                    
                    // Seed some vehicles if empty
                    db.query("SELECT COUNT(*) as count FROM vehicles", (err, results) => {
                        if (!err && results[0].count === 0) {
                            const seedQuery = `
                                INSERT INTO vehicles (vehicle_id, name, weight_capacity, volume_capacity, current_weight, current_volume, source, destination, status) VALUES 
                                ('ORION001', 'Truck 1', 10000, 50, 5000, 25, 'Mumbai', 'Delhi', 'Active'),
                                ('ORION002', 'Truck 2', 8000, 40, 2000, 10, 'Bangalore', 'Chennai', 'Active'),
                                ('ORION003', 'Truck 3', 12000, 60, 3000, 20, 'Delhi', 'Kolkata', 'Active'),
                                ('ORION0301', 'Truck 4', 20000, 100, 0, 0, 'Available', 'Available', 'Active')
                            `;
                            db.query(seedQuery, (err) => {
                                if(!err) console.log("✅ Seeded vehicles");
                            });
                        }
                    });
                });
            });
        });
    });
});

// ✅ **Save Order** (alias for frontend)
app.post("/add_order", (req, res) => {
    const { order_id, address, quantity, status } = req.body;
    if (!order_id || !address || !quantity) return res.status(400).json({ error: "Missing fields (order_id, address, quantity)" });
    const sql = "INSERT INTO orders (orderID, address, quantity, status, created_at) VALUES (?, ?, ?, ?, NOW())";
    db.query(sql, [order_id, address, quantity, status || "Pending"], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "✅ Order placed successfully!" });
    });
});

// ✅ **Fetch Orders** — returns {orders: [...]} with snake_case fields
app.get("/api/orders", (req, res) => {
    db.query("SELECT orderID as order_id, address, quantity, status, created_at FROM orders ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        res.json({ orders: results });
    });
});

// ✅ **Update Order Status** (alias for frontend)
app.put("/update_order/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.query("UPDATE orders SET status = ? WHERE orderID = ?", [status, id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update status" });
        res.json({ message: "✅ Status updated successfully" });
    });
});

// ✅ **Delete Order**
app.delete("/api/orders/:orderID", (req, res) => {
    db.query("DELETE FROM orders WHERE orderID = ?", [req.params.orderID], (err) => {
        if (err) return res.status(500).json({ error: "Error deleting order" });
        res.json({ message: "✅ Order deleted successfully" });
    });
});


// ✅ **Download Orders as Excel**
app.get("/download/orders", async (req, res) => {
    try {
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet("Order History");
        worksheet.columns = [
            { header: "Order ID", key: "orderID", width: 20 },
            { header: "Address", key: "address", width: 30 },
            { header: "Quantity", key: "quantity", width: 15 },
            { header: "Status", key: "status", width: 15 },
            { header: "Placed On", key: "created_at", width: 20 }
        ];
        db.query("SELECT * FROM orders", (err, results) => {
            if (err) return res.status(500).json({ error: "Database Error" });
            results.forEach(order => worksheet.addRow(order));
            res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            workbook.xlsx.write(res).then(() => res.end());
        });
    } catch (error) {
        res.status(500).json({ error: "Error generating Excel file" });
    }
});

// ✅ **Fetch Vehicles**
app.get("/api/vehicles", (req, res) => {
    db.query("SELECT * FROM vehicles", (err, results) => {
        if (err) return res.status(500).json({ error: "Database Error" });
        let activeCount = 0, availableCount = 0;
        results.forEach(vehicle => {
            if (vehicle.status === "Active") activeCount++;
            if (vehicle.current_weight < vehicle.weight_capacity && vehicle.current_volume < vehicle.volume_capacity) availableCount++;
        });
        res.json({ vehicles: results, activeCount, availableCount });
    });
});

// ✅ **Add Vehicle**
app.post("/add_vehicle", (req, res) => {
    const { vehicle_id, name, weight_capacity, volume_capacity, source, destination, status } = req.body;
    const sql = "INSERT INTO vehicles (vehicle_id, name, weight_capacity, volume_capacity, current_weight, current_volume, source, destination, status) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)";
    db.query(sql, [vehicle_id, name, weight_capacity, volume_capacity, source || 'Available', destination || 'Available', status || 'Active'], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "✅ Vehicle Added Successfully!" });
    });
});

// ✅ **Delete Vehicle**
app.delete("/delete_vehicle/:id", (req, res) => {
    db.query("DELETE FROM vehicles WHERE vehicle_id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Vehicle Deleted Successfully!" });
    });
});

// ✅ **Load Allocation Logic**
app.post("/api/allocate", (req, res) => {
    const { weight, volume, source, destination } = req.body;
    
    db.query("SELECT * FROM vehicles", (err, vehicles) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        let bestMatch = null;
        let availableTrucks = [];

        for (let vehicle of vehicles) {
            let availableWeight = vehicle.weight_capacity - vehicle.current_weight;
            let availableVolume = vehicle.volume_capacity - vehicle.current_volume;

            if (weight <= availableWeight && volume <= availableVolume) {
                if (vehicle.source === source && vehicle.destination === destination) {
                    // Match existing route
                    db.query("UPDATE vehicles SET current_weight = current_weight + ?, current_volume = current_volume + ? WHERE vehicle_id = ?", [weight, volume, vehicle.vehicle_id], (updateErr) => {
                        if (updateErr) return res.status(500).json({ error: "Failed to update database" });
                        return res.json({
                            vehicle_id: vehicle.vehicle_id,
                            weight_capacity: vehicle.weight_capacity,
                            volume_capacity: vehicle.volume_capacity,
                            available_weight: availableWeight - weight,
                            available_volume: availableVolume - volume,
                            status: "Load Added to Existing Route"
                        });
                    });
                    return; // Ensure we don't continue loop or function
                }
                if (vehicle.source === "Available" || vehicle.source === "") {
                    availableTrucks.push(vehicle);
                }
            }
        }

        if (availableTrucks.length > 0) {
            bestMatch = availableTrucks[0];
            db.query("UPDATE vehicles SET current_weight = current_weight + ?, current_volume = current_volume + ?, source = ?, destination = ? WHERE vehicle_id = ?", [weight, volume, source, destination, bestMatch.vehicle_id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: "Failed to update database" });
                return res.json({
                    vehicle_id: bestMatch.vehicle_id,
                    weight_capacity: bestMatch.weight_capacity,
                    volume_capacity: bestMatch.volume_capacity,
                    available_weight: bestMatch.weight_capacity - (bestMatch.current_weight + weight),
                    available_volume: bestMatch.volume_capacity - (bestMatch.current_volume + volume),
                    status: "Newly Assigned"
                });
            });
            return; // Ensure we don't return 400 below
        }

        res.status(400).json({ error: "No suitable vehicle found" });
    });
});

// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
