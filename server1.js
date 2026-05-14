const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Safiya@123",  // Update your password
  database: "vehicles"
});

db.connect((err) => {
  if (err) {
    console.error("Database Connection Failed!", err);
    return;
  }
  console.log("Connected to MySQL database!");
});

// **1. Add Vehicle (Auto calculate FreeSpace)**
app.post("/add_vehicle", (req, res) => {
    const { name, capacity, mileage, loadedQuantity, status } = req.body;
    
    console.log("🚗 Vehicle Data Received:", req.body);
  
    const sql = "INSERT INTO Vehicles (Name, Capacity, Mileage, LoadedQuantity, Status) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, capacity, mileage, loadedQuantity, status], (err, result) => {
      if (err) {
        console.error("❌ Error Adding Vehicle:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "✅ Vehicle Added Successfully!" });
    });
  });
  

// **2. Fetch All Vehicles**
app.get("/vehicles", (req, res) => {
  db.query("SELECT * FROM Vehicles", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// **3. Delete Vehicle**
app.delete("/delete_vehicle/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM Vehicles WHERE ID = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Vehicle Deleted Successfully!" });
  });
});

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
