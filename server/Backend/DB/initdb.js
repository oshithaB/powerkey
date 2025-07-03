const mysql = require('mysql2/promise');
const createTables = require('./createTables');
require('dotenv').config();

async function initDatabase() {
  try {
    // Step 1: Temporary connection (no database yet)
    const tempDb = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    console.log('Connected to MySQL (no DB selected yet)');

    // Step 2: Create database
    await tempDb.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await tempDb.end();

    // Step 3: Connect with selected database to create tables
    const setupDb = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log(`Connected to MySQL database: ${process.env.DB_NAME}`);
    await createTables(setupDb); // Pass setup connection
    await setupDb.end(); // Close the connection after table creation

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

module.exports = initDatabase;
