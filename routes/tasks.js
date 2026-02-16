const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a new task
router.post('/create', async (req, res) => {  // removed extra space in route
  const { user_id, pickup_address, drop_address, task_time, estimated_time, description, amount, pickup_type } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, pickup_address, drop_address, task_time, estimated_time, description, amount, pickup_type) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [user_id, pickup_address, drop_address, task_time, estimated_time, description, amount, pickup_type]
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
      `SELECT t.*, d.name AS dofy_dude_name 
       FROM tasks t 
       LEFT JOIN dofy_dudes d ON t.dofy_dude_id = d.id
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
      `SELECT t.*, c.name AS customer_name 
       FROM tasks t 
       LEFT JOIN customers c ON t.user_id = c.id
       WHERE t.status='pending'
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
router.post('/accept/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { dofy_dude_id } = req.body;

  if (!dofy_dude_id) {
    return res.status(400).json({ message: 'Agent ID is required' });
  }

  try {
    // Get the dofy dude name from dofy_dudes table
    const agentResult = await pool.query(
      'SELECT name FROM dofy_dudes WHERE id = $1',
      [dofy_dude_id]
    );

    if (agentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const dofy_dude_name = agentResult.rows[0].name;

    // Check if task exists
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskResult.rows[0];

    if (task.status === 'Accepted') {
      return res.status(400).json({ message: 'Task already accepted' });
    }

    // Update task
    const updateResult = await pool.query(
      `UPDATE tasks
       SET status = 'Accepted', dofy_dude_id = $1, dofy_dude_name = $2
       WHERE id = $3
       RETURNING *`,
      [dofy_dude_id, dofy_dude_name, taskId]
    );

    const updatedTask = updateResult.rows[0];

    // Optional: notify customer via Socket.io
    // io.to(task.user_id).emit('taskAccepted', updatedTask);

    res.json({ message: 'Task accepted successfully', task: updatedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while accepting task' });
  }
});
module.exports = router;
