const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a new task
router.post('/create ', async (req, res) => {
  const { user_id, pickup_address, drop_address, task_time, estimated_time, description, amount } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, pickup_address, drop_address, task_time, estimated_time, description, amount) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [user_id, pickup_address, drop_address, task_time, estimated_time, description, amount]
    );
    res.json({ task: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks of a user
router.get('/my/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS dofy_dude_name 
       FROM tasks t 
       LEFT JOIN users u ON t.dofy_dude_id = u.id
       WHERE t.user_id=$1 
       ORDER BY t.task_time DESC`,
      [user_id]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks (for Dofy Dudes home page)
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS customer_name 
       FROM tasks t 
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.status='PENDING'
       ORDER BY t.task_time ASC`
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a task as completed
router.post('/complete/:id', async (req, res) => {
  const task_id = req.params.id;

  try {
    await pool.query(`UPDATE tasks SET status='COMPLETED' WHERE id=$1`, [task_id]);
    res.json({ message: 'Task marked as completed' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave feedback on a task
router.post('/feedback/:id', async (req, res) => {
  const task_id = req.params.id;
  const { rating, comment } = req.body;

  try {
    await pool.query(
      `INSERT INTO feedback (task_id, rating, comment) VALUES ($1,$2,$3)`,
      [task_id, rating, comment]
    );
    res.json({ message: 'Feedback added' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
