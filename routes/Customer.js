// routes/customers.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db'); // PostgreSQL pool connection

// ------------------- REGISTER -------------------
router.post('/register', async (req, res) => {
  const { name, phone, email, password, address1, address2, city, state, pincode } = req.body;

  if (!name || !phone || !email || !password || !address1 || !city || !state || !pincode) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields' });
  }

  try {
    const existing = await pool.query('SELECT * FROM customers WHERE phone=$1 OR email=$2', [phone, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO customers (name, phone, email, password, address1, address2, city, state, pincode) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, phone, email, hashedPassword, address1, address2, city, state, pincode]
    );

    res.status(201).json({ success: true, message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- LOGIN -------------------
// routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM customers WHERE email=$1', [email]);
    if (userRes.rows.length === 0)
      return res.status(400).json({ success: false, message: 'User not found' });

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
        pincode: user.pincode,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ------------------- GET ALL CUSTOMERS -------------------
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, phone, email, address1, address2, city, state, pincode FROM customers');
    res.json({ success: true, customers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- GET CUSTOMER BY ID -------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, name, phone, email, address1, address2, city, state, pincode FROM customers WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- UPDATE CUSTOMER -------------------
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address1, address2, city, state, pincode } = req.body;

  try {
    const result = await pool.query(
      `UPDATE customers 
       SET name=$1, phone=$2, email=$3, address1=$4, address2=$5, city=$6, state=$7, pincode=$8 
       WHERE id=$9 RETURNING *`,
      [name, phone, email, address1, address2, city, state, pincode, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });

    res.json({ success: true, message: 'Customer updated', customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ------------------- DELETE CUSTOMER -------------------
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted', customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
