require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'db',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

app.get('/health', async (req, res) => {
  try {
    // Basic health check to verify DB connection
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', message: 'Backend and Database are healthy' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
  }
});

app.post('/register', (req, res) => {
  res.json({ message: 'User registered successfully (Simulated)' });
});

app.listen(port, () => {
  console.log(`Backend listening at http://0.0.0.0:${port}`);
});
