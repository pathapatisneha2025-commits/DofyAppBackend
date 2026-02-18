// routes/adminPricing.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL pool connection


// ------------------- GET PRICING -------------------
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pricing_settings WHERE id=$1',
      [1]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found',
      });
    }

    res.json({
      success: true,
      pricing: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});


// ------------------- UPDATE PRICING -------------------
router.put('/pricing', async (req, res) => {
  const { km_rate, hour_rate, urgent_multiplier } = req.body;

  if (
    km_rate == null ||
    hour_rate == null ||
    urgent_multiplier == null
  ) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    // Check if pricing row exists
    const check = await pool.query(
      'SELECT * FROM pricing_settings WHERE id=$1',
      [1]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found',
      });
    }

    // Update pricing
    const updateRes = await pool.query(
      `UPDATE pricing_settings 
       SET km_rate=$1,
           hour_rate=$2,
           urgent_multiplier=$3,
           updated_at=CURRENT_TIMESTAMP
       WHERE id=$4
       RETURNING *`,
      [km_rate, hour_rate, urgent_multiplier, 1]
    );

    res.json({
      success: true,
      message: 'Pricing updated successfully',
      pricing: updateRes.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});


module.exports = router;
