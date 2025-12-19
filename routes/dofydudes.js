// routes/customers.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db'); // PostgreSQL pool connection

/// ------------------- REGISTER -------------------
router.post('/register', async (req, res) => {
  const { name, phone, email, password, selfie, govID } = req.body;

  if (!name || !phone || !email || !password || !selfie || !govID) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if user exists
    const existing = await pool.query('SELECT * FROM dofy_dudes WHERE phone=$1 OR email=$2', [phone, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      'INSERT INTO dofy_dudes (name, phone, email, password, selfie, govID, kyc_approved) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [name, phone, email, hashedPassword, selfie, govID, false] // KYC not approved yet
    );

    res.status(201).json({ success: true, message: 'Registration successful! Await KYC approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- LOGIN -------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // Login with email

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM dofy_dudes WHERE email=$1', [email]);
    if (userRes.rows.length === 0) return res.status(400).json({ success: false, message: 'User not found' });

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password' });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        selfie: user.selfie,
        govID: user.govid,
        kyc_approved: user.kyc_approved,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
module.exports = router;
