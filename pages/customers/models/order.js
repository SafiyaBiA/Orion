const db = require("../config/db"); // ✅ Import database connection

// **📌 Ensure Orders Table Exists**
const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderID VARCHAR(50) NOT NULL UNIQUE,
        address TEXT NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        status ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(createOrdersTable, (err, result) => {
    if (err) console.error("❌ Error creating orders table:", err);
    else console.log("✅ Orders table is ready!");
});

// **📌 Insert a New Order**
const createOrder = (orderID, address, quantity, callback) => {
    const sql = "INSERT INTO orders (orderID, address, quantity) VALUES (?, ?, ?)";
    db.query(sql, [orderID, address, quantity], (err, results) => {
        if (err) return callback(err, null);
        callback(null, { id: results.insertId, orderID, address, quantity, status: "Pending" });
    });
};

// **📌 Get All Orders**
const getAllOrders = (callback) => {
    const sql = "SELECT * FROM orders ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return callback(err, null);
        callback(null, results);
    });
};

// **📌 Get Order by ID**
const getOrderById = (id, callback) => {
    const sql = "SELECT * FROM orders WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err, null);
        callback(null, results.length > 0 ? results[0] : null);
    });
};

// **📌 Update Order (Change Status)**
const updateOrder = (id, status, callback) => {
    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
        return callback(new Error("Invalid status"), null);
    }

    const sql = "UPDATE orders SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, results) => {
        if (err) return callback(err, null);
        callback(null, { message: "Order updated successfully", affectedRows: results.affectedRows });
    });
};

// **📌 Delete Order**
const deleteOrder = (id, callback) => {
    const sql = "DELETE FROM orders WHERE id = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return callback(err, null);
        callback(null, { message: "Order deleted successfully", affectedRows: results.affectedRows });
    });
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder };
