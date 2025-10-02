// DB/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5, // moderate pool size
    queueLimit: 0,
    timezone: '+00:00',
    dateStrings: true,
    ssl: {
        rejectUnauthorized: false // required for Filess.io remote SSL
    },
    connectTimeout: 100000 // 10 seconds timeout
});

module.exports = pool;
