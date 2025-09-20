const mysql = require('mysql2');
require('dotenv').config();


// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',    // ← Add this line
    dateStrings: true      // ← Add this line
});

// Export pool as a promise
const promisePool = pool.promise();

module.exports = promisePool;
