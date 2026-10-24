const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE student
router.post('/', async (req, res) => {
  const {
    reg_no, full_name, course, branch, year_of_study,
    gender, phone_number, email, parent_name, parent_contact
  } = req.body;
  try {
    const [result] = await pool.execute(
      `INSERT INTO Student (reg_no, full_name, course, branch, year_of_study, gender, phone_number, email, parent_name, parent_contact)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [reg_no, full_name, course, branch, year_of_study, gender, phone_number, email, parent_name, parent_contact]
    );
    res.json({ insertedId: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all students
router.get('/', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Student ORDER BY student_id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ single student
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute('SELECT * FROM Student WHERE student_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE student (partial updates allowed)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => fields[k]);
  values.push(id);
  try {
    const [result] = await pool.execute(`UPDATE Student SET ${setClause} WHERE student_id = ?`, values);
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE student
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM Student WHERE student_id = ?', [id]);
    res.json({ affectedRows: result.affectedRows });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
