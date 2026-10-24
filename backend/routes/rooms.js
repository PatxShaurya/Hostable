const express = require('express');
const router = express.Router();
const pool = require('../db');

// List all active room allocations (for dashboard & management)
router.get('/allocations/active', async (_, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ra.allocation_id,
             ra.student_id,
             ra.room_id,
             s.reg_no,
             s.full_name,
             r.room_number,
             ra.allocation_date,
             ra.status
      FROM RoomAllocation ra
      JOIN Student s ON s.student_id = ra.student_id
      JOIN Room r    ON r.room_id   = ra.room_id
      WHERE ra.status = 'Active'
      ORDER BY ra.allocation_date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all rooms with bed availability and room specs
router.get('/available', async (_, res) => {
  try {
    if (pool.getRawData) {
      const data = pool.getRawData();
      const rooms = data.rooms.map(r => {
        const fl = data.floors.find(f => f.floor_id === r.floor_id) || {};
        const bl = data.blocks.find(b => b.block_id === fl.block_id) || {};
        const h = data.hostels.find(hs => hs.hostel_id === bl.hostel_id) || {};
        const rt = data.roomTypes.find(t => t.room_type_id === r.room_type_id) || {};
        const vacant = Math.max(0, rt.capacity - r.current_occupancy);
        return {
          room_id: r.room_id,
          room_number: r.room_number,
          hostel_name: h.hostel_name,
          hostel_type: h.hostel_type,
          block_name: bl.block_name,
          floor_number: fl.floor_number,
          capacity: rt.capacity,
          current_occupancy: r.current_occupancy,
          vacant_beds: vacant,
          ac_type: rt.ac_type,
          fee_per_year: rt.fee_per_year
        };
      });
      return res.json(rooms);
    }

    const [rows] = await pool.query(`
      SELECT r.room_id,
             r.room_number,
             h.hostel_name,
             h.hostel_type,
             bl.block_name,
             fl.floor_number,
             rt.capacity,
             r.current_occupancy,
             AvailableBeds(r.room_id) AS vacant_beds,
             rt.ac_type,
             rt.fee_per_year
      FROM Room r
      JOIN Floor fl ON fl.floor_id = r.floor_id
      JOIN Block bl ON bl.block_id = fl.block_id
      JOIN Hostel h ON h.hostel_id = bl.hostel_id
      JOIN RoomType rt ON rt.room_type_id = r.room_type_id
      ORDER BY h.hostel_name, r.room_number`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Allocate a room (uses stored procedure AllocateRoom)
router.post('/allocate', async (req, res) => {
  const { student_id, room_id } = req.body;
  if (!student_id || !room_id) {
    return res.status(400).json({ error: 'student_id and room_id are required' });
  }
  try {
    await pool.execute('CALL AllocateRoom(?, ?)', [Number(student_id), Number(room_id)]);
    res.json({ success: true, message: 'Room successfully allocated to student.' });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

// Vacate a room (updates status to Vacated and releases bed)
router.post('/vacate', async (req, res) => {
  const { allocation_id, vacate_date } = req.body;
  if (!allocation_id) return res.status(400).json({ error: 'allocation_id is required' });
  const date = vacate_date || new Date().toISOString().split('T')[0];
  try {
    const [result] = await pool.execute(
      `UPDATE RoomAllocation SET status = 'Vacated', vacate_date = ? WHERE allocation_id = ?`,
      [date, Number(allocation_id)]
    );
    res.json({ success: true, affectedRows: result.affectedRows, message: 'Room allocation marked as Vacated.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
