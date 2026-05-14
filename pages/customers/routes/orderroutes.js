const express = require("express");
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder } = require("../models/order");

// 🟢 **Create Order**
router.post("/", (req, res) => {
    const { orderID, address, quantity } = req.body;
    createOrder(orderID, address, quantity, (err, result) => {
        if (err) return res.status(500).json({ error: "Error placing order" });
        res.json({ message: "Order placed successfully!" });
    });
});

// 🔵 **Get All Orders**
router.get("/", (req, res) => {
    getAllOrders((err, results) => {
        if (err) return res.status(500).json({ error: "Error fetching orders" });
        res.json(results);
    });
});

// 🟠 **Get Order by ID**
router.get("/:id", (req, res) => {
    getOrderById(req.params.id, (err, result) => {
        if (err) return res.status(500).json({ error: "Error fetching order" });
        if (!result.length) return res.status(404).json({ error: "Order not found" });
        res.json(result[0]);
    });
});

// 🟡 **Update Order**
router.put("/:id", (req, res) => {
    const { status } = req.body;
    updateOrder(req.params.id, status, (err, result) => {
        if (err) return res.status(500).json({ error: "Error updating order" });
        res.json({ message: "Order updated successfully!" });
    });
});

// 🔴 **Delete Order**
router.delete("/:id", (req, res) => {
    deleteOrder(req.params.id, (err, result) => {
        if (err) return res.status(500).json({ error: "Error deleting order" });
        res.json({ message: "Order deleted successfully!" });
    });
});

module.exports = router;
