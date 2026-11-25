'use strict';
const mysql = require('mysql2/promise');
const { db } = require('./config');

// Dates come back as 'YYYY-MM-DD HH:MM:SS' in Dhaka time.
const pool = mysql.createPool({ ...db, charset: 'utf8mb4', dateStrings: true, waitForConnections: true, connectionLimit: 10 });
pool.pool.on('connection', (conn) => { conn.query("SET time_zone = '+06:00'"); });

module.exports = { pool };
