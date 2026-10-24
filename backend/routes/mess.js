const express = require('express');
const router = express.Router();
const pool = require('../db');

// List all messes with caterer & hostel info
router.get('/messes', async (_, res) => {
  try {
    if (pool.getRawData) {
      const data = pool.getRawData();
      const rows = data.messes.map(m => {
        const h = data.hostels.find(hs => hs.hostel_id === m.hostel_id) || {};
        const c = data.caterers.find(ct => ct.caterer_id === m.caterer_id) || {};
        const activeCount = data.messRegistrations.filter(r => r.mess_id === m.mess_id && r.status === 'Active').length;
        return {
          mess_id: m.mess_id,
          mess_name: m.mess_name,
          mess_category: m.mess_category,
          annual_fee: m.annual_fee,
          capacity: m.capacity,
          hostel_name: h.hostel_name || 'Co-ed (All Hostels)',
          caterer_name: c.caterer_name || 'Campus Catering',
          active_students: activeCount
        };
      });
      return res.json(rows);
    }
    const [rows] = await pool.query(`
      SELECT m.mess_id, m.mess_name, m.mess_category, m.annual_fee, m.capacity,
             COALESCE(h.hostel_name, 'Co-ed (All Hostels)') AS hostel_name, c.caterer_name,
             CountStudentsInMess(m.mess_id) AS active_students
      FROM Mess m
      LEFT JOIN Hostel h ON h.hostel_id = m.hostel_id
      JOIN Caterer c ON c.caterer_id = m.caterer_id
      ORDER BY m.mess_id`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all active mess registrations
router.get('/registrations/active', async (_, res) => {
  try {
    if (pool.getRawData) {
      const data = pool.getRawData();
      const rows = data.messRegistrations
        .filter(r => r.status === 'Active')
        .map(r => {
          const s = data.students.find(st => st.student_id === r.student_id) || {};
          const m = data.messes.find(ms => ms.mess_id === r.mess_id) || {};
          return {
            mess_reg_id: r.mess_reg_id,
            student_id: r.student_id,
            mess_id: r.mess_id,
            reg_no: s.reg_no,
            full_name: s.full_name,
            mess_name: m.mess_name,
            mess_category: m.mess_category,
            annual_fee: m.annual_fee,
            registration_date: r.registration_date,
            status: r.status
          };
        });
      return res.json(rows);
    }
    const [rows] = await pool.query(`
      SELECT mr.mess_reg_id, mr.student_id, mr.mess_id,
             s.reg_no, s.full_name, m.mess_name, m.mess_category, m.annual_fee,
             mr.registration_date, mr.status
      FROM MessRegistration mr
      JOIN Student s ON s.student_id = mr.student_id
      JOIN Mess m ON m.mess_id = mr.mess_id
      WHERE mr.status = 'Active'
      ORDER BY mr.registration_date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register or Switch student mess (uses stored procedure RegisterMess)
router.post('/register', async (req, res) => {
  const { student_id, mess_id } = req.body;
  if (!student_id || !mess_id) {
    return res.status(400).json({ error: 'student_id and mess_id are required' });
  }
  try {
    await pool.execute('CALL RegisterMess(?, ?)', [Number(student_id), Number(mess_id)]);
    res.json({ success: true, message: 'Student successfully registered to mess.' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

// Record a mess fee payment
router.post('/payment', async (req, res) => {
  const { mess_reg_id, payment_date, amount_paid, academic_year, payment_mode } = req.body;
  if (!mess_reg_id || !academic_year || amount_paid == null) {
    return res.status(400).json({ error: 'mess_reg_id, amount_paid and academic_year are required' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO MessFeePayment (mess_reg_id, payment_date, amount_paid, academic_year, payment_mode)
       VALUES (?,?,?,?,?)`,
      [Number(mess_reg_id), payment_date || new Date().toISOString().split('T')[0], Number(amount_paid), academic_year, payment_mode || 'Online']
    );
    res.json({ success: true, insertedId: result.insertId, message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List recent fee payments
router.get('/payments', async (_, res) => {
  try {
    if (pool.getRawData) {
      const data = pool.getRawData();
      const rows = data.messFeePayments.map(p => {
        const reg = data.messRegistrations.find(r => r.mess_reg_id === p.mess_reg_id) || {};
        const s = data.students.find(st => st.student_id === reg.student_id) || {};
        const m = data.messes.find(ms => ms.mess_id === reg.mess_id) || {};
        return {
          mess_payment_id: p.mess_payment_id,
          reg_no: s.reg_no,
          full_name: s.full_name,
          mess_name: m.mess_name,
          payment_date: p.payment_date,
          amount_paid: p.amount_paid,
          academic_year: p.academic_year,
          payment_mode: p.payment_mode
        };
      }).sort((a, b) => b.mess_payment_id - a.mess_payment_id);
      return res.json(rows);
    }
    const [rows] = await pool.query(`
      SELECT mfp.mess_payment_id, s.reg_no, s.full_name, m.mess_name,
             mfp.payment_date, mfp.amount_paid, mfp.academic_year, mfp.payment_mode
      FROM MessFeePayment mfp
      JOIN MessRegistration mr ON mr.mess_reg_id = mfp.mess_reg_id
      JOIN Student s ON s.student_id = mr.student_id
      JOIN Mess m ON m.mess_id = mr.mess_id
      ORDER BY mfp.mess_payment_id DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weekly menu for a mess
router.get('/menu/:messId/:weekStart', async (req, res) => {
  const { messId } = req.params;
  try {
    if (pool.getRawData) {
      const data = pool.getRawData();
      const rows = data.messMenus
        .filter(m => m.mess_id === Number(messId))
        .map(m => ({
          day_of_week: m.day_of_week,
          meal_type: m.meal_type,
          items: m.items.join(', ')
        }));
      return res.json(rows);
    }
    const [rows] = await pool.execute(
      `SELECT mm.day_of_week,
              mm.meal_type,
              GROUP_CONCAT(mi.item_name SEPARATOR ', ') AS items
       FROM MessMenu mm
       JOIN MenuItem mi ON mi.menu_id = mm.menu_id
       WHERE mm.mess_id = ?
       GROUP BY mm.menu_id, mm.day_of_week, mm.meal_type
       ORDER BY FIELD(mm.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), mm.meal_type`,
      [messId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit mess feedback
router.post('/feedback', async (req, res) => {
  const { student_id, mess_id, rating, comments } = req.body;
  if (!student_id || !mess_id || rating == null) {
    return res.status(400).json({ error: 'student_id, mess_id and rating required' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO MessFeedback (student_id, mess_id, rating, comments) VALUES (?,?,?,?)`,
      [Number(student_id), Number(mess_id), Number(rating), comments || null]
    );
    res.json({ success: true, insertedId: result.insertId, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
