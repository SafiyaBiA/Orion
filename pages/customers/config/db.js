require("dotenv").config(); // ✅ Load environment variables
const MySQL = require("mysqMySQL");

// ✅ Create MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Safiya@123",
    database: process.env.DB_NAME || "orders_db",
    port: process.env.DB_PORT || 3306
});

// ✅ Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        process.exit(1); // Stop server if DB fails
    } else {
        console.log("✅ Connected to MySQL Database");
    }
});

module.exports = db;
