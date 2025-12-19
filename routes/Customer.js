const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Import shared pool

// ------------------- REGISTER -------------------
router.post('/register', async (req, res) => {
  const { name, phone, email, password, address1, address2, city, state, pincode } = req.body;

  if (!name || !phone || !email || !password || !address1 || !city || !state || !pincode) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields' });
  }

  try {
    // Check if user exists
    const existing = await pool.query('SELECT * FROM customers WHERE phone=$1 OR email=$2', [phone, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      'INSERT INTO customers (name, phone, email, password, address1, address2, city, state, pincode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [name, phone, email, hashedPassword, address1, address2, city, state, pincode]
    );

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- LOGIN -------------------
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Phone and password are required' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM customers WHERE phone=$1', [phone]);
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
        address1: user.address1,
        address2: user.address2,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
