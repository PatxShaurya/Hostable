-- ==============================================================================
-- HOSTEL & MESS MANAGEMENT SYSTEM (RDBMS LAB CSC2131 QUERIES - MANIPAL UNIVERSITY JAIPUR)
-- Students: Shaurya Pathak (2502051505), Vaibhav Saxena (2502052896)
-- Contains: Advanced SQL (Joins, Subqueries, Aggregations, Window Functions, Views)
--           and PL/SQL Stored Routines (Stored Functions & Procedures)
-- ==============================================================================

USE hostel_mess_management;

-- ------------------------------------------------------------------------------
-- QUERY 1: Active Student Room Allocations with Complete Hierarchy
-- Category: Multi-Table Inner Join (5 Tables) & View Demonstration
-- Purpose: Retrieve all active residents of Hostel A with complete block, floor,
--          room type, and air conditioning details.
-- ------------------------------------------------------------------------------
SELECT 
    s.reg_no,
    s.full_name,
    s.branch,
    s.year_of_study,
    h.hostel_name,
    bl.block_name,
    fl.floor_number,
    r.room_number,
    rt.capacity,
    rt.ac_type,
    ra.allocation_date
FROM Student s
JOIN RoomAllocation ra ON ra.student_id = s.student_id AND ra.status = 'Active'
JOIN Room r ON r.room_id = ra.room_id
JOIN Floor fl ON fl.floor_id = r.floor_id
JOIN Block bl ON bl.block_id = fl.block_id
JOIN Hostel h ON h.hostel_id = bl.hostel_id
JOIN RoomType rt ON rt.room_type_id = r.room_type_id
ORDER BY h.hostel_name, r.room_number;


-- ------------------------------------------------------------------------------
-- QUERY 2: Hostel Occupancy Analytics & Capacity Utilization
-- Category: Aggregations & View Query (HostelOccupancy)
-- Purpose: Calculate total block count, total rooms, aggregate capacity, 
--          current occupancy, and occupancy percentage per hostel.
-- ------------------------------------------------------------------------------
SELECT 
    hostel_id,
    hostel_name,
    hostel_type,
    total_blocks,
    total_rooms,
    total_bed_capacity,
    current_occupancy,
    occupancy_percentage
FROM HostelOccupancy
ORDER BY occupancy_percentage DESC;


-- ------------------------------------------------------------------------------
-- QUERY 3: Available Beds per Room (Calling PL/SQL Stored Function)
-- Category: PL/SQL Stored Function Execution (AvailableBeds)
-- Purpose: Calls user-defined scalar function AvailableBeds(room_id) to find
--          rooms that currently have vacant beds for new admissions.
-- ------------------------------------------------------------------------------
SELECT 
    r.room_id,
    r.room_number,
    rt.capacity,
    r.current_occupancy,
    AvailableBeds(r.room_id) AS vacant_beds,
    rt.ac_type,
    rt.fee_per_year
FROM Room r
JOIN RoomType rt ON rt.room_type_id = r.room_type_id
WHERE AvailableBeds(r.room_id) > 0
ORDER BY vacant_beds DESC, r.room_number;


-- ------------------------------------------------------------------------------
-- QUERY 4: Rooms at 100% Capacity (Fully Occupied)
-- Category: Relational Comparison & Capacity Check
-- Purpose: Identify rooms where current occupancy matches or exceeds maximum capacity.
-- ------------------------------------------------------------------------------
SELECT 
    r.room_id,
    r.room_number,
    rt.capacity,
    r.current_occupancy,
    rt.ac_type,
    'Fully Occupied' AS occupancy_status
FROM Room r
JOIN RoomType rt ON rt.room_type_id = r.room_type_id
WHERE r.current_occupancy >= rt.capacity;


-- ------------------------------------------------------------------------------
-- QUERY 5: Weekly Mess Menu Schedule with Concatenated Items
-- Category: String Aggregation (GROUP_CONCAT) & Custom Field Ordering
-- Purpose: Formats the entire menu for a specific mess by meal type and day.
-- ------------------------------------------------------------------------------
SELECT 
    mm.day_of_week,
    mm.meal_type,
    GROUP_CONCAT(mi.item_name ORDER BY mi.menu_item_id SEPARATOR ', ') AS served_menu
FROM MessMenu mm
JOIN MenuItem mi ON mi.menu_id = mm.menu_id
WHERE mm.mess_id = 1
GROUP BY mm.menu_id, mm.day_of_week, mm.meal_type
ORDER BY FIELD(mm.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
         FIELD(mm.meal_type, 'Breakfast', 'Lunch', 'Snacks', 'Dinner');


-- ------------------------------------------------------------------------------
-- QUERY 6: Compare Monday Dinner Offerings Across Mess Facilities
-- Category: Multi-table Join with Filtering
-- Purpose: Comparison report for students to see what each mess serves on Monday nights.
-- ------------------------------------------------------------------------------
SELECT 
    m.mess_name,
    m.mess_category,
    mi.item_name
FROM Mess m
JOIN MessMenu mm ON mm.mess_id = m.mess_id
JOIN MenuItem mi ON mi.menu_id = mm.menu_id
WHERE mm.day_of_week = 'Monday' AND mm.meal_type = 'Dinner'
ORDER BY m.mess_id, mi.menu_item_id;


-- ------------------------------------------------------------------------------
-- QUERY 7: Student Meal Attendance Audit for Current Week
-- Category: Aggregations & Multi-Table Relationship
-- Purpose: Quantify dining hall visits per student to audit mess utilization.
-- ------------------------------------------------------------------------------
SELECT 
    s.reg_no,
    s.full_name,
    m.mess_name,
    COUNT(ma.attendance_id) AS total_meals_consumed
FROM Student s
JOIN MessRegistration mr ON mr.student_id = s.student_id AND mr.status = 'Active'
JOIN Mess m ON m.mess_id = mr.mess_id
JOIN MealAttendance ma ON ma.mess_reg_id = mr.mess_reg_id
GROUP BY s.student_id, s.reg_no, s.full_name, m.mess_name
ORDER BY total_meals_consumed DESC;


-- ------------------------------------------------------------------------------
-- QUERY 8: Defaulters List - Active Students with Unpaid Annual Mess Fees for Current Academic Year
-- Category: Correlated Subquery with NOT EXISTS
-- Purpose: Identifies students registered to a mess who haven't paid the annual fee for '2026-27'.
-- ------------------------------------------------------------------------------
SELECT 
    s.reg_no,
    s.full_name,
    s.phone_number,
    m.mess_name,
    m.annual_fee AS fee_due,
    'Unpaid (2026-27)' AS payment_status
FROM MessRegistration mr
JOIN Student s ON s.student_id = mr.student_id
JOIN Mess m ON m.mess_id = mr.mess_id
WHERE mr.status = 'Active'
  AND NOT EXISTS (
      SELECT 1 
      FROM MessFeePayment mfp 
      WHERE mfp.mess_reg_id = mr.mess_reg_id 
        AND mfp.academic_year = '2026-27'
  )
ORDER BY s.reg_no;


-- ------------------------------------------------------------------------------
-- QUERY 9: Financial Revenue & Transaction Audit per Mess
-- Category: Financial Rollup & View Analysis (MessRevenueSummary)
-- Purpose: Aggregate total tuition/mess fee collections and total transaction count.
-- ------------------------------------------------------------------------------
SELECT 
    mess_id,
    mess_name,
    mess_category,
    total_fee_collected,
    total_transactions
FROM MessRevenueSummary
ORDER BY total_fee_collected DESC;


-- ------------------------------------------------------------------------------
-- QUERY 10: Caterer Performance & Average Feedback Rating
-- Category: Aggregation with Decimal Rounding (ROUND, AVG)
-- Purpose: Evaluates catering contractors based on student feedback scores (1-5 scale).
-- ------------------------------------------------------------------------------
SELECT 
    m.mess_id,
    m.mess_name,
    c.caterer_name,
    ROUND(AVG(mf.rating), 2) AS average_rating,
    COUNT(mf.feedback_id) AS total_reviews_received
FROM Mess m
JOIN Caterer c ON c.caterer_id = m.caterer_id
LEFT JOIN MessFeedback mf ON mf.mess_id = m.mess_id
GROUP BY m.mess_id, m.mess_name, c.caterer_name
ORDER BY average_rating DESC;


-- ------------------------------------------------------------------------------
-- QUERY 11: Headcount per Mess using PL/SQL Stored Function
-- Category: PL/SQL Stored Function (CountStudentsInMess)
-- Purpose: Verifies mess capacity limits using the CountStudentsInMess scalar function.
-- ------------------------------------------------------------------------------
SELECT 
    m.mess_id,
    m.mess_name,
    m.capacity AS max_seating_capacity,
    CountStudentsInMess(m.mess_id) AS active_registered_students,
    (m.capacity - CountStudentsInMess(m.mess_id)) AS remaining_seats
FROM Mess m
ORDER BY active_registered_students DESC;


-- ------------------------------------------------------------------------------
-- QUERY 12: Rank Hostels by Occupancy Utilizing Window Function
-- Category: Advanced SQL Window Function (RANK() OVER PARTITION/ORDER)
-- Purpose: Evaluates occupancy distribution and assigns dense ranking across hostels.
-- ------------------------------------------------------------------------------
SELECT 
    hostel_name,
    hostel_type,
    current_occupancy,
    total_bed_capacity,
    occupancy_percentage,
    RANK() OVER (ORDER BY occupancy_percentage DESC) AS occupancy_rank
FROM HostelOccupancy;


-- ------------------------------------------------------------------------------
-- QUERY 13: PL/SQL Stored Procedure Execution Demonstration
-- Category: PL/SQL Procedural Call (CALL AllocateRoom / CALL RegisterMess / CALL PayMessFee)
-- Purpose: Demonstrates execution of transaction-managed business routines.
-- ------------------------------------------------------------------------------
-- Test Procedure: Allocate student 9 to room 4
-- CALL AllocateRoom(9, 4);

-- Test Procedure: Switch student 3 to the Bluedove mess
-- CALL RegisterMess(3, 2);

-- Test Procedure: Record the annual mess fee for registration 8
-- CALL PayMessFee(8, 80000.00, '2026-27', 'Online');

