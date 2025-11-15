require('dotenv').config();
const mysql = require('mysql');
const util = require('util');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'helmet_store',
  charset: 'utf8mb4'
});

// Promisify pool.query để dùng async/await
pool.query = util.promisify(pool.query);
pool.getConnection = util.promisify(pool.getConnection);

pool.on('error', (err) => {
  console.error('MySQL pool error', err);
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('Database pool created and connection tested.');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // optional: thoát nếu cần
  }
}

testConnection();

module.exports = pool;