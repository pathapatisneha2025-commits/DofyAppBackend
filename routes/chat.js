// chatRouter.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // your PostgreSQL pool connection
// Example: const pool = require('../db'); where db.js exports Pool instance

// --- Send a chat message ---
router.post('/send', async (req, res) => {
  const { task_id, sender_type, sender_id, message } = req.body;

  if (!task_id || !sender_type || !sender_id || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (task_id, sender_type, sender_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [task_id, sender_type, sender_id, message]
    );

    res.json({ success: true, message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending message' });
  }
});

router.get('/receive/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        cm.*,
        CASE 
          WHEN cm.sender_type = 'agent' THEN dd.name
          WHEN cm.sender_type = 'customer' THEN cu.name
        END AS sender_name
      FROM chat_messages cm
      LEFT JOIN dofy_dudes dd
        ON cm.sender_id = dd.id AND cm.sender_type = 'agent'
      LEFT JOIN customers cu
        ON cm.sender_id = cu.id AND cm.sender_type = 'customer'
      WHERE cm.task_id = $1
      ORDER BY cm.created_at ASC
    `, [taskId]);

    res.json({ messages: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Optional: Delete all messages for a task ---
router.delete('/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    await pool.query(
      `DELETE FROM messages WHERE task_id = $1`,
      [taskId]
    );
    res.json({ success: true, message: 'Messages deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting messages' });
  }
});

module.exports = router;
