-- ==============================================================================
-- HOSTEL & MESS MANAGEMENT SYSTEM (RDBMS LAB CSC2131 - MANIPAL UNIVERSITY JAIPUR)
-- Students: Shaurya Pathak (2502051505), Vaibhav Saxena (2502052896)
-- Database Engine: MySQL 8.0+ / MariaDB / Oracle PL/SQL Compatible Routines
-- ==============================================================================

DROP DATABASE IF EXISTS hostel_mess_management;
CREATE DATABASE hostel_mess_management;
USE hostel_mess_management;

SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------------------------
-- 1. TABLE DEFINITIONS
-- ------------------------------------------------------------------------------

-- Student Table
CREATE TABLE Student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    reg_no VARCHAR(20) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    year_of_study TINYINT NOT NULL,
    gender ENUM('Male','Female','Other') NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    parent_contact VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_regno (reg_no),
    UNIQUE KEY uq_student_phone (phone_number),
    UNIQUE KEY uq_student_email (email),
    CONSTRAINT chk_student_year CHECK (year_of_study BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Hostel Table
CREATE TABLE Hostel (
    hostel_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_name VARCHAR(100) NOT NULL,
    hostel_type ENUM('Boys','Girls') NOT NULL,
    warden_name VARCHAR(100) NULL,
    warden_contact VARCHAR(15) NULL,
    UNIQUE KEY uq_hostel_name (hostel_name)
) ENGINE=InnoDB;

-- Block Table
CREATE TABLE Block (
    block_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    block_name VARCHAR(20) NOT NULL,
    CONSTRAINT fk_block_hostel FOREIGN KEY (hostel_id)
        REFERENCES Hostel(hostel_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_block_per_hostel (hostel_id, block_name)
) ENGINE=InnoDB;

-- Floor Table
CREATE TABLE Floor (
    floor_id INT AUTO_INCREMENT PRIMARY KEY,
    block_id INT NOT NULL,
    floor_number TINYINT NOT NULL,
    CONSTRAINT fk_floor_block FOREIGN KEY (block_id)
        REFERENCES Block(block_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_floor_per_block (block_id, floor_number),
    CONSTRAINT chk_floor_number CHECK (floor_number >= 0)
) ENGINE=InnoDB;

-- RoomType Table
CREATE TABLE RoomType (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    capacity TINYINT NOT NULL,
    ac_type ENUM('AC','Non-AC') NOT NULL,
    fee_per_year DECIMAL(10,2) NOT NULL, -- annual hostel fee
    UNIQUE KEY uq_roomtype_combo (capacity, ac_type),
    CONSTRAINT chk_roomtype_capacity CHECK (capacity IN (2,3)), -- 3 = 1st-year triple, 2 = double
    CONSTRAINT chk_roomtype_fee CHECK (fee_per_year >= 0)
) ENGINE=InnoDB;

-- Room Table
CREATE TABLE Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    floor_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    current_occupancy TINYINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_room_floor FOREIGN KEY (floor_id)
        REFERENCES Floor(floor_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_room_roomtype FOREIGN KEY (room_type_id)
        REFERENCES RoomType(room_type_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_room_per_floor (floor_id, room_number),
    CONSTRAINT chk_room_occupancy CHECK (current_occupancy >= 0)
) ENGINE=InnoDB;

-- RoomAllocation Table
CREATE TABLE RoomAllocation (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    room_id INT NOT NULL,
    allocation_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    vacate_date DATE NULL,
    status ENUM('Active','Vacated') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_alloc_student FOREIGN KEY (student_id)
        REFERENCES Student(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_alloc_room FOREIGN KEY (room_id)
        REFERENCES Room(room_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_alloc_dates CHECK (vacate_date IS NULL OR vacate_date >= allocation_date),
    INDEX idx_alloc_student_status (student_id, status),
    INDEX idx_alloc_room_status (room_id, status)
) ENGINE=InnoDB;

-- Caterer Table
CREATE TABLE Caterer (
    caterer_id INT AUTO_INCREMENT PRIMARY KEY,
    caterer_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NULL,
    contact_number VARCHAR(15) NOT NULL,
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NULL,
    CONSTRAINT chk_caterer_contract CHECK (contract_end_date IS NULL OR contract_end_date >= contract_start_date)
) ENGINE=InnoDB;

-- Mess Table
CREATE TABLE Mess (
    mess_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NULL, -- NULL = co-ed mess shared by all hostels
    caterer_id INT NOT NULL,
    mess_name VARCHAR(100) NOT NULL,
    mess_category ENUM('Veg','Non-Veg','Special') NOT NULL,
    annual_fee DECIMAL(8,2) NOT NULL,
    capacity INT NOT NULL,
    CONSTRAINT fk_mess_hostel FOREIGN KEY (hostel_id)
        REFERENCES Hostel(hostel_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_mess_caterer FOREIGN KEY (caterer_id)
        REFERENCES Caterer(caterer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_mess_name_per_hostel (hostel_id, mess_name),
    CONSTRAINT chk_mess_capacity CHECK (capacity > 0),
    CONSTRAINT chk_mess_fee CHECK (annual_fee >= 0)
) ENGINE=InnoDB;

-- MessRegistration Table
CREATE TABLE MessRegistration (
    mess_reg_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    end_date DATE NULL,
    status ENUM('Active','Ended') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_messreg_student FOREIGN KEY (student_id)
        REFERENCES Student(student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_messreg_mess FOREIGN KEY (mess_id)
        REFERENCES Mess(mess_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_messreg_dates CHECK (end_date IS NULL OR end_date >= registration_date),
    INDEX idx_messreg_student_status (student_id, status)
) ENGINE=InnoDB;

-- MessMenu Table
CREATE TABLE MessMenu (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    mess_id INT NOT NULL,
    week_start_date DATE NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    meal_type ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
    CONSTRAINT fk_menu_mess FOREIGN KEY (mess_id)
        REFERENCES Mess(mess_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_menu_slot (mess_id, week_start_date, day_of_week, meal_type)
) ENGINE=InnoDB;

-- MenuItem Table
CREATE TABLE MenuItem (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_menuitem_menu FOREIGN KEY (menu_id)
        REFERENCES MessMenu(menu_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- MealAttendance Table
CREATE TABLE MealAttendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    mess_reg_id INT NOT NULL,
    attendance_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    meal_type ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
    CONSTRAINT fk_attendance_messreg FOREIGN KEY (mess_reg_id)
        REFERENCES MessRegistration(mess_reg_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_attendance_slot (mess_reg_id, attendance_date, meal_type)
) ENGINE=InnoDB;

-- MessFeePayment Table
CREATE TABLE MessFeePayment (
    mess_payment_id INT AUTO_INCREMENT PRIMARY KEY,
    mess_reg_id INT NOT NULL,
    payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    amount_paid DECIMAL(8,2) NOT NULL,
    academic_year CHAR(7) NOT NULL COMMENT 'Format: YYYY-YY, e.g. 2026-27',
    payment_mode ENUM('Cash','Online','Card') NOT NULL DEFAULT 'Online',
    CONSTRAINT fk_messpay_messreg FOREIGN KEY (mess_reg_id)
        REFERENCES MessRegistration(mess_reg_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uq_messpay_year (mess_reg_id, academic_year),
    CONSTRAINT chk_messpay_amount CHECK (amount_paid >= 0)
) ENGINE=InnoDB;

-- MessFeedback Table
CREATE TABLE MessFeedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    mess_id INT NOT NULL,
    feedback_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    rating TINYINT NOT NULL,
    comments VARCHAR(500) NULL,
    CONSTRAINT fk_feedback_student FOREIGN KEY (student_id)
        REFERENCES Student(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_mess FOREIGN KEY (mess_id)
        REFERENCES Mess(mess_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 2. TRIGGERS (AUTOMATION & INTEGRITY ENFORCEMENT)
-- ------------------------------------------------------------------------------

DELIMITER $$

-- Trigger: Automatically increment room occupancy upon active allocation
CREATE TRIGGER trg_alloc_after_insert AFTER INSERT ON RoomAllocation
FOR EACH ROW BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE Room SET current_occupancy = current_occupancy + 1 WHERE room_id = NEW.room_id;
    END IF;
END$$

-- Trigger: Automatically update room occupancy when allocation status changes
CREATE TRIGGER trg_alloc_after_update AFTER UPDATE ON RoomAllocation
FOR EACH ROW BEGIN
    IF OLD.status = 'Active' AND NEW.status = 'Vacated' THEN
        UPDATE Room SET current_occupancy = current_occupancy - 1 WHERE room_id = OLD.room_id;
    ELSEIF OLD.status = 'Vacated' AND NEW.status = 'Active' THEN
        UPDATE Room SET current_occupancy = current_occupancy + 1 WHERE room_id = NEW.room_id;
    END IF;
    IF NEW.status = 'Active' AND OLD.status = 'Active' AND NEW.room_id <> OLD.room_id THEN
        UPDATE Room SET current_occupancy = current_occupancy - 1 WHERE room_id = OLD.room_id;
        UPDATE Room SET current_occupancy = current_occupancy + 1 WHERE room_id = NEW.room_id;
    END IF;
END$$

-- Trigger: Prevent multiple active room allocations for the same student
CREATE TRIGGER trg_alloc_before_insert_single_active BEFORE INSERT ON RoomAllocation
FOR EACH ROW BEGIN
    DECLARE active_count INT;
    IF NEW.status = 'Active' THEN
        SELECT COUNT(*) INTO active_count FROM RoomAllocation
        WHERE student_id = NEW.student_id AND status = 'Active';
        IF active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity Violation: Student already has an active room allocation.';
        END IF;
    END IF;
END$$

-- Trigger: Ensure updates do not violate single active room allocation
CREATE TRIGGER trg_alloc_before_update_single_active BEFORE UPDATE ON RoomAllocation
FOR EACH ROW BEGIN
    DECLARE active_count INT;
    IF NEW.status = 'Active' AND OLD.status <> 'Active' THEN
        SELECT COUNT(*) INTO active_count FROM RoomAllocation
        WHERE student_id = NEW.student_id AND status = 'Active' AND allocation_id <> NEW.allocation_id;
        IF active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity Violation: Student already has an active room allocation.';
        END IF;
    END IF;
END$$

-- Trigger: Prevent duplicate active mess registrations
CREATE TRIGGER trg_messreg_before_insert_single_active BEFORE INSERT ON MessRegistration
FOR EACH ROW BEGIN
    DECLARE active_count INT;
    IF NEW.status = 'Active' THEN
        SELECT COUNT(*) INTO active_count FROM MessRegistration
        WHERE student_id = NEW.student_id AND status = 'Active';
        IF active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity Violation: Student already has an active mess registration.';
        END IF;
    END IF;
END$$

-- Trigger: Ensure updates preserve single active mess registration
CREATE TRIGGER trg_messreg_before_update_single_active BEFORE UPDATE ON MessRegistration
FOR EACH ROW BEGIN
    DECLARE active_count INT;
    IF NEW.status = 'Active' AND OLD.status <> 'Active' THEN
        SELECT COUNT(*) INTO active_count FROM MessRegistration
        WHERE student_id = NEW.student_id AND status = 'Active' AND mess_reg_id <> NEW.mess_reg_id;
        IF active_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Integrity Violation: Student already has an active mess registration.';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 3. VIEWS FOR REPORTING & ANALYTICS
-- ------------------------------------------------------------------------------

-- View 1: Hostel Occupancy Analytics
CREATE OR REPLACE VIEW HostelOccupancy AS
SELECT h.hostel_id, h.hostel_name, h.hostel_type,
       COUNT(DISTINCT bl.block_id) AS total_blocks,
       COUNT(DISTINCT fl.floor_id) AS total_floors,
       COUNT(DISTINCT r.room_id) AS total_rooms,
       COALESCE(SUM(rt.capacity),0) AS total_bed_capacity,
       COALESCE(SUM(r.current_occupancy),0) AS current_occupancy,
       ROUND(100 * COALESCE(SUM(r.current_occupancy),0) / NULLIF(SUM(rt.capacity),0),2) AS occupancy_percentage
FROM Hostel h
LEFT JOIN Block bl ON bl.hostel_id = h.hostel_id
LEFT JOIN Floor fl ON fl.block_id = bl.block_id
LEFT JOIN Room r ON r.floor_id = fl.floor_id
LEFT JOIN RoomType rt ON rt.room_type_id = r.room_type_id
GROUP BY h.hostel_id, h.hostel_name, h.hostel_type;

-- View 2: Detailed Student Room Allocations
CREATE OR REPLACE VIEW StudentRoomDetails AS
SELECT s.student_id, s.reg_no, s.full_name,
       h.hostel_name, bl.block_name, fl.floor_number, r.room_number,
       rt.capacity, rt.ac_type, ra.allocation_date, ra.status AS allocation_status
FROM Student s
JOIN RoomAllocation ra ON ra.student_id = s.student_id AND ra.status = 'Active'
JOIN Room r ON r.room_id = ra.room_id
JOIN Floor fl ON fl.floor_id = r.floor_id
JOIN Block bl ON bl.block_id = fl.block_id
JOIN Hostel h ON h.hostel_id = bl.hostel_id
JOIN RoomType rt ON rt.room_type_id = r.room_type_id;

-- View 3: Active Student Mess Subscriptions
CREATE OR REPLACE VIEW StudentMessDetails AS
SELECT s.student_id, s.reg_no, s.full_name,
       m.mess_name, m.mess_category, c.caterer_name, mr.registration_date, mr.status AS registration_status
FROM Student s
JOIN MessRegistration mr ON mr.student_id = s.student_id AND mr.status = 'Active'
JOIN Mess m ON m.mess_id = mr.mess_id
JOIN Caterer c ON c.caterer_id = m.caterer_id;

-- View 4: Revenue Summary per Mess
CREATE OR REPLACE VIEW MessRevenueSummary AS
SELECT m.mess_id, m.mess_name, m.mess_category,
       COALESCE(fee.total_fee_collected,0) AS total_fee_collected,
       COALESCE(fee.total_transactions,0) AS total_transactions
FROM Mess m
LEFT JOIN (
    SELECT mr.mess_id, 
           SUM(mfp.amount_paid) AS total_fee_collected,
           COUNT(mfp.mess_payment_id) AS total_transactions
    FROM MessFeePayment mfp
    JOIN MessRegistration mr ON mr.mess_reg_id = mfp.mess_reg_id
    GROUP BY mr.mess_id
) fee ON fee.mess_id = m.mess_id;

-- ------------------------------------------------------------------------------
-- 4. PL/SQL STORED FUNCTIONS
-- ------------------------------------------------------------------------------

DELIMITER $$

-- Function 1: Available Beds in a Room
CREATE FUNCTION AvailableBeds(p_room_id INT) RETURNS INT NOT DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_occupancy INT;
    SELECT rt.capacity, r.current_occupancy INTO v_capacity, v_occupancy
    FROM Room r JOIN RoomType rt ON rt.room_type_id = r.room_type_id
    WHERE r.room_id = p_room_id;
    IF v_capacity IS NULL THEN RETURN NULL; END IF;
    RETURN v_capacity - v_occupancy;
END$$

-- Function 2: Occupancy Percentage of a Hostel
CREATE FUNCTION HostelOccupancyPercentage(p_hostel_id INT) RETURNS DECIMAL(5,2) NOT DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_capacity INT; DECLARE v_occupied INT;
    SELECT COALESCE(SUM(rt.capacity),0), COALESCE(SUM(r.current_occupancy),0) INTO v_capacity, v_occupied
    FROM Room r
    JOIN Floor fl ON fl.floor_id = r.floor_id
    JOIN Block bl ON bl.block_id = fl.block_id
    JOIN RoomType rt ON rt.room_type_id = r.room_type_id
    WHERE bl.hostel_id = p_hostel_id;
    IF v_capacity = 0 THEN RETURN 0.00; END IF;
    RETURN ROUND(100 * v_occupied / v_capacity,2);
END$$

-- Function 3: Active Student Count in a Mess
CREATE FUNCTION CountStudentsInMess(p_mess_id INT) RETURNS INT NOT DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count FROM MessRegistration WHERE mess_id = p_mess_id AND status = 'Active';
    RETURN v_count;
END$$

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 5. PL/SQL STORED PROCEDURES
-- ------------------------------------------------------------------------------

DELIMITER $$

-- Procedure 1: Safe Room Allocation with Bed Capacity Verification
CREATE PROCEDURE AllocateRoom(IN p_student_id INT, IN p_room_id INT)
BEGIN
    DECLARE v_available INT; 
    DECLARE v_existing INT;
    START TRANSACTION;
    
    SELECT COUNT(*) INTO v_existing FROM RoomAllocation WHERE student_id = p_student_id AND status = 'Active';
    IF v_existing > 0 THEN 
        ROLLBACK; 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student already has an active room allocation.'; 
    END IF;
    
    SET v_available = AvailableBeds(p_room_id);
    IF v_available IS NULL THEN 
        ROLLBACK; 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Specified room does not exist.'; 
    ELSEIF v_available <= 0 THEN 
        ROLLBACK; 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No available beds remaining in this room.'; 
    END IF;
    
    INSERT INTO RoomAllocation (student_id, room_id, allocation_date, status) 
    VALUES (p_student_id, p_room_id, CURDATE(), 'Active');
    
    COMMIT;
END$$

-- Procedure 2: Safe Room Vacate Procedure
CREATE PROCEDURE VacateRoom(IN p_allocation_id INT)
BEGIN
    START TRANSACTION;
    UPDATE RoomAllocation 
    SET status = 'Vacated', vacate_date = CURDATE() 
    WHERE allocation_id = p_allocation_id AND status = 'Active';
    COMMIT;
END$$

-- Procedure 3: Register / Switch Student Mess
CREATE PROCEDURE RegisterMess(IN p_student_id INT, IN p_mess_id INT)
BEGIN
    START TRANSACTION;
    -- End existing active mess registration if any
    UPDATE MessRegistration 
    SET status = 'Ended', end_date = CURDATE() 
    WHERE student_id = p_student_id AND status = 'Active';
    
    -- Insert new active mess registration
    INSERT INTO MessRegistration (student_id, mess_id, registration_date, status) 
    VALUES (p_student_id, p_mess_id, CURDATE(), 'Active');
    
    COMMIT;
END$$

-- Procedure 4: Record Mess Fee Payment
CREATE PROCEDURE PayMessFee(IN p_mess_reg_id INT, IN p_amount DECIMAL(8,2), IN p_year CHAR(7), IN p_mode VARCHAR(20))
BEGIN
    INSERT INTO MessFeePayment (mess_reg_id, payment_date, amount_paid, academic_year, payment_mode)
    VALUES (p_mess_reg_id, CURDATE(), p_amount, p_year, p_mode);
END$$

DELIMITER ;

-- ------------------------------------------------------------------------------
-- 6. FULL POPULATION OF SAMPLE DATA
-- ------------------------------------------------------------------------------

-- Insert Students (Manipal University Jaipur sample batch)
INSERT INTO Student (student_id, reg_no, full_name, course, branch, year_of_study, gender, phone_number, email, parent_name, parent_contact) VALUES
(1, '2502051123', 'Arjun Mehra', 'B.Tech', 'CSE', 2, 'Male', '9876543201', 'arjun.2502051123@muj.manipal.edu', 'Rakesh Mehra', '9876500001'),
(2, '2502051347', 'Kunal Rathore', 'B.Tech', 'CSE', 2, 'Male', '9876543202', 'kunal.2502051347@muj.manipal.edu', 'Mahendra Rathore', '9876500002'),
(3, '2502052218', 'Ishita Sharma', 'B.Tech', 'ECE', 2, 'Female', '9876543203', 'ishita.2502052218@muj.manipal.edu', 'Anil Sharma', '9876500003'),
(4, '2502052564', 'Yash Agarwal', 'B.Tech', 'ME', 2, 'Male', '9876543204', 'yash.2502052564@muj.manipal.edu', 'Pawan Agarwal', '9876500004'),
(5, '2502053109', 'Riya Khandelwal', 'BBA LLB', 'Law', 2, 'Female', '9876543205', 'riya.2502053109@muj.manipal.edu', 'Sunil Khandelwal', '9876500005'),
(6, '2502053482', 'Dev Shekhawat', 'B.Tech', 'Civil', 2, 'Male', '9876543206', 'dev.2502053482@muj.manipal.edu', 'Vikram Shekhawat', '9876500006'),
(7, '2602061056', 'Tanvi Jain', 'B.Tech', 'CSE', 1, 'Female', '9876543207', 'tanvi.2602061056@muj.manipal.edu', 'Manoj Jain', '9876500007'),
(8, '2602061391', 'Harsh Choudhary', 'B.Tech', 'ECE', 1, 'Male', '9876543208', 'harsh.2602061391@muj.manipal.edu', 'Ramesh Choudhary', '9876500008'),
(9, '2602062274', 'Sakshi Bansal', 'BBA LLB', 'Law', 1, 'Female', '9876543209', 'sakshi.2602062274@muj.manipal.edu', 'Ajay Bansal', '9876500009'),
(10, '2602062618', 'Aryan Malhotra', 'B.Tech', 'ME', 1, 'Male', '9876543210', 'aryan.2602062618@muj.manipal.edu', 'Sanjeev Malhotra', '9876500010'),
(11, '2602063035', 'Muskan Goyal', 'B.Tech', 'Civil', 1, 'Female', '9876543211', 'muskan.2602063035@muj.manipal.edu', 'Deepak Goyal', '9876500011'),
(12, '2602063470', 'Rohit Saini', 'B.Tech', 'CSE', 1, 'Male', '9876543212', 'rohit.2602063470@muj.manipal.edu', 'Naresh Saini', '9876500012');

-- Insert Hostels
INSERT INTO Hostel (hostel_id, hostel_name, hostel_type, warden_name, warden_contact) VALUES
(1, 'Boys Hostel B1', 'Boys', 'Dr. Ravi Shankar Mathur', '9414100001'),
(2, 'Boys Hostel B2', 'Boys', 'Prof. Alok Bhargava', '9414100002'),
(3, 'Boys Hostel B3', 'Boys', 'Dr. Naveen Kumar Sharma', '9414100003'),
(4, 'Boys Hostel B4', 'Boys', 'Prof. Sandeep Rathi', '9414100004'),
(5, 'Boys Hostel B5', 'Boys', 'Dr. Manish Tiwari', '9414100005'),
(6, 'Boys Hostel B6', 'Boys', 'Prof. Hemant Joshi', '9414100006'),
(7, 'Boys Hostel B7', 'Boys', 'Dr. Vivek Saxena', '9414100007'),
(8, 'Boys Hostel B8', 'Boys', 'Prof. Rajendra Singh', '9414100008'),
(9, 'Boys Hostel B9', 'Boys', 'Dr. Pankaj Kulshreshtha', '9414100009'),
(10, 'Boys Hostel B10', 'Boys', 'Prof. Ashok Vyas', '9414100010'),
(11, 'Boys Hostel B11', 'Boys', 'Dr. Gaurav Dixit', '9414100011'),
(12, 'Boys Hostel B12', 'Boys', 'Prof. Sushil Meena', '9414100012'),
(13, 'Girls Hostel G1', 'Girls', 'Dr. Kavita Sharma', '9414200001'),
(14, 'Girls Hostel G2', 'Girls', 'Prof. Neelam Agarwal', '9414200002'),
(15, 'Girls Hostel G3', 'Girls', 'Dr. Rekha Mathur', '9414200003'),
(16, 'Girls Hostel G4', 'Girls', 'Prof. Shalini Gupta', '9414200004'),
(17, 'Girls Hostel G5', 'Girls', 'Dr. Anjali Purohit', '9414200005'),
(18, 'Girls Hostel G6', 'Girls', 'Prof. Meenu Jain', '9414200006'),
(19, 'Girls Hostel G7', 'Girls', 'Dr. Pooja Bhatnagar', '9414200007'),
(20, 'Girls Hostel G8', 'Girls', 'Prof. Sunita Choudhary', '9414200008');

-- Insert Blocks
INSERT INTO Block (block_id, hostel_id, block_name) VALUES
(1, 1, 'B1'),
(2, 2, 'B2'),
(3, 3, 'B3'),
(4, 4, 'B4'),
(5, 5, 'B5'),
(6, 6, 'B6'),
(7, 7, 'B7'),
(8, 8, 'B8'),
(9, 9, 'B9'),
(10, 10, 'B10'),
(11, 11, 'B11'),
(12, 12, 'B12'),
(13, 13, 'G1'),
(14, 14, 'G2'),
(15, 15, 'G3'),
(16, 16, 'G4'),
(17, 17, 'G5'),
(18, 18, 'G6'),
(19, 19, 'G7'),
(20, 20, 'G8');

-- Insert Floors
INSERT INTO Floor (floor_id, block_id, floor_number) VALUES
(1, 3, 0), -- Floor 0 of Boys Hostel B3
(2, 3, 1), -- Floor 1 of Boys Hostel B3
(3, 7, 2), -- Floor 2 of Boys Hostel B7
(4, 7, 1), -- Floor 1 of Boys Hostel B7
(5, 10, 1), -- Floor 1 of Boys Hostel B10
(6, 14, 1), -- Floor 1 of Girls Hostel G2
(7, 18, 2); -- Floor 2 of Girls Hostel G6

-- Insert Room Types
INSERT INTO RoomType (room_type_id, capacity, ac_type, fee_per_year) VALUES
(1, 3, 'AC', 272000.00), -- 1st-year package: 3-Bed in Sem 1, 2-Bed from Sem 2
(2, 2, 'AC', 265000.00); -- 2-Bed AC, 2nd year onwards

-- Insert Rooms
INSERT INTO Room (room_id, floor_id, room_type_id, room_number, current_occupancy, is_active) VALUES
(1, 1, 2, '001', 0, TRUE), -- 2-Bed AC, B3
(2, 1, 2, '002', 0, TRUE), -- 2-Bed AC, B3
(3, 2, 2, '101', 0, TRUE), -- 2-Bed AC, B3
(4, 2, 2, '102', 0, TRUE), -- 2-Bed AC, B3
(5, 3, 1, '201', 0, TRUE), -- 3-Bed AC, 1st yr, B7
(6, 4, 1, '105', 0, TRUE), -- 3-Bed AC, 1st yr, B7
(7, 5, 1, '110', 0, TRUE), -- 3-Bed AC, 1st yr, B10
(8, 6, 2, '101', 0, TRUE), -- 2-Bed AC, G2
(9, 6, 1, '102', 0, TRUE), -- 3-Bed AC, 1st yr, G2
(10, 7, 2, '201', 0, TRUE); -- 2-Bed AC, G6

-- Insert Caterers
INSERT INTO Caterer (caterer_id, caterer_name, contact_person, contact_number, contract_start_date, contract_end_date) VALUES
(1, 'Annapoorna Hospitality Services', 'Mr. S. Venkatraman', '9840112233', '2026-01-01', '2027-12-31'),
(2, 'Royal Feast Gourmet Caterers', 'Mr. Gurpreet Singh', '9840223344', '2026-01-01', '2027-12-31'),
(3, 'Green Leaf Nutrition Mess Services', 'Ms. Anita Swaminathan', '9840334455', '2026-01-01', '2027-12-31');

-- Insert Messes
INSERT INTO Mess (mess_id, hostel_id, caterer_id, mess_name, mess_category, annual_fee, capacity) VALUES
(1, NULL, 1, 'Bluspring', 'Special', 80000.00, 1500),
(2, NULL, 2, 'Bluedove', 'Special', 80000.00, 1500);

-- Insert Room Allocations (Triggers will adjust room occupancy automatically)
INSERT INTO RoomAllocation (allocation_id, student_id, room_id, allocation_date, vacate_date, status) VALUES
(1, 1, 1, '2026-07-10', NULL, 'Active'), -- Arjun Mehra in Room 001, 2-Bed AC, B3
(2, 2, 1, '2026-07-10', NULL, 'Active'), -- Kunal Rathore in Room 001, 2-Bed AC, B3
(3, 3, 8, '2026-07-11', NULL, 'Active'), -- Ishita Sharma in Room 101, 2-Bed AC, G2
(4, 4, 3, '2026-07-11', NULL, 'Active'), -- Yash Agarwal in Room 101, 2-Bed AC, B3
(5, 5, 8, '2026-07-12', NULL, 'Active'), -- Riya Khandelwal in Room 101, 2-Bed AC, G2
(6, 6, 3, '2026-07-12', NULL, 'Active'), -- Dev Shekhawat in Room 101, 2-Bed AC, B3
(7, 7, 9, '2026-08-01', NULL, 'Active'), -- Tanvi Jain in Room 102, 3-Bed AC, 1st yr, G2
(8, 8, 5, '2026-08-01', NULL, 'Active'), -- Harsh Choudhary in Room 201, 3-Bed AC, 1st yr, B7
(9, 9, 9, '2026-08-01', NULL, 'Active'), -- Sakshi Bansal in Room 102, 3-Bed AC, 1st yr, G2
(10, 10, 5, '2026-08-02', NULL, 'Active'), -- Aryan Malhotra in Room 201, 3-Bed AC, 1st yr, B7
(11, 11, 9, '2026-08-02', NULL, 'Active'), -- Muskan Goyal in Room 102, 3-Bed AC, 1st yr, G2
(12, 12, 5, '2026-08-02', NULL, 'Active'); -- Rohit Saini in Room 201, 3-Bed AC, 1st yr, B7

-- Insert Past Vacated Room Allocations (History records)
INSERT INTO RoomAllocation (allocation_id, student_id, room_id, allocation_date, vacate_date, status) VALUES
(13, 6, 7, '2025-08-01', '2026-05-20', 'Vacated'), -- Dev Shekhawat, 1st year (2025-26) in Room 110, B10
(14, 4, 7, '2025-08-01', '2026-05-20', 'Vacated'); -- Yash Agarwal, 1st year (2025-26) in Room 110, B10

-- Insert Mess Registrations
INSERT INTO MessRegistration (mess_reg_id, student_id, mess_id, registration_date, end_date, status) VALUES
(1, 1, 2, '2026-07-10', NULL, 'Active'), -- Arjun -> Bluedove
(2, 2, 1, '2026-07-10', NULL, 'Active'), -- Kunal -> Bluspring
(3, 3, 1, '2026-07-11', NULL, 'Active'), -- Ishita -> Bluspring
(4, 4, 2, '2026-07-11', NULL, 'Active'), -- Yash -> Bluedove
(5, 5, 2, '2026-07-12', NULL, 'Active'), -- Riya -> Bluedove
(6, 6, 2, '2026-07-12', NULL, 'Active'), -- Dev -> Bluedove
(7, 7, 1, '2026-08-01', NULL, 'Active'), -- Tanvi -> Bluspring
(8, 8, 1, '2026-08-01', NULL, 'Active'), -- Harsh -> Bluspring
(9, 9, 1, '2026-08-01', NULL, 'Active'), -- Sakshi -> Bluspring
(10, 10, 2, '2026-08-02', NULL, 'Active'), -- Aryan -> Bluedove
(11, 11, 2, '2026-08-02', NULL, 'Active'), -- Muskan -> Bluedove
(12, 12, 2, '2026-08-02', NULL, 'Active'); -- Rohit -> Bluedove

-- Insert Weekly Mess Menus (Bluspring & Bluedove)
INSERT INTO MessMenu (menu_id, mess_id, week_start_date, day_of_week, meal_type) VALUES
(1, 1, '2026-10-05', 'Monday', 'Breakfast'),
(2, 1, '2026-10-05', 'Monday', 'Lunch'),
(3, 1, '2026-10-05', 'Monday', 'Snacks'),
(4, 1, '2026-10-05', 'Monday', 'Dinner'),
(5, 1, '2026-10-05', 'Tuesday', 'Breakfast'),
(6, 1, '2026-10-05', 'Tuesday', 'Lunch'),
(7, 1, '2026-10-05', 'Wednesday', 'Lunch'),
(8, 1, '2026-10-05', 'Sunday', 'Dinner'),
(9, 2, '2026-10-05', 'Monday', 'Breakfast'),
(10, 2, '2026-10-05', 'Monday', 'Lunch'),
(11, 2, '2026-10-05', 'Monday', 'Dinner'),
(12, 2, '2026-10-05', 'Wednesday', 'Dinner');

-- Insert Menu Items
INSERT INTO MenuItem (menu_id, item_name) VALUES
(1, 'Idli & Medu Vada'),
(1, 'Coconut Chutney & Sambar'),
(1, 'Filter Coffee / Tea'),
(2, 'Steamed Rice & Dal Tadka'),
(2, 'Paneer Butter Masala'),
(2, 'Chapati & Salad'),
(2, 'Curd & Pickle'),
(3, 'Veg Samosa & Mint Chutney'),
(3, 'Hot Ginger Tea'),
(4, 'Tawa Roti & Dal Makhani'),
(4, 'Jeera Rice & Aloo Gobi'),
(4, 'Gulab Jamun'),
(5, 'Masala Dosa with Sambar'),
(6, 'South Indian Meals with Rasam'),
(7, 'Chole Bhature & Boondi Raita'),
(8, 'Special Shahi Paneer & Pulao'),
(9, 'Egg Bhurji / Boiled Eggs & Toast'),
(10, 'Chicken Curry & Steamed Rice'),
(11, 'Chicken Biryani & Onion Raita'),
(12, 'Butter Chicken & Butter Naan');

-- Insert Meal Attendance
INSERT INTO MealAttendance (mess_reg_id, attendance_date, meal_type) VALUES
(1, '2026-10-05', 'Breakfast'),
(1, '2026-10-05', 'Lunch'),
(1, '2026-10-05', 'Dinner'),
(2, '2026-10-05', 'Breakfast'),
(2, '2026-10-05', 'Lunch'),
(3, '2026-10-05', 'Breakfast'),
(3, '2026-10-05', 'Lunch'),
(4, '2026-10-05', 'Dinner'),
(5, '2026-10-05', 'Lunch'),
(6, '2026-10-05', 'Dinner'),
(1, '2026-10-06', 'Breakfast'),
(1, '2026-10-06', 'Lunch');

-- Insert Mess Fee Payments
INSERT INTO MessFeePayment (mess_reg_id, payment_date, amount_paid, academic_year, payment_mode) VALUES
(1, '2026-07-10', 80000.00, '2026-27', 'Online'),
(2, '2026-07-10', 80000.00, '2026-27', 'Online'),
(3, '2026-07-11', 80000.00, '2026-27', 'Card'),
(4, '2026-07-11', 80000.00, '2026-27', 'Online'),
(5, '2026-07-12', 80000.00, '2026-27', 'Online'),
(6, '2026-07-12', 80000.00, '2026-27', 'Online'),
(7, '2026-08-01', 80000.00, '2026-27', 'Card'),
(10, '2026-08-02', 80000.00, '2026-27', 'Online'),
(12, '2026-08-02', 80000.00, '2026-27', 'Cash');

-- Insert Mess Feedback
INSERT INTO MessFeedback (feedback_id, student_id, mess_id, feedback_date, rating, comments) VALUES
(1, 1, 2, '2026-10-04', 4, 'Non-veg biryani on Mondays is excellent. Good portion sizes.'),
(2, 2, 1, '2026-10-05', 5, 'Very hygienic food and punctual breakfast timings.'),
(3, 3, 1, '2026-10-06', 4, 'Good healthy options and fresh salads everyday.'),
(4, 4, 2, '2026-10-06', 3, 'Food is decent, but dinner rush causes long queue.'),
(5, 5, 2, '2026-10-07', 2, 'Rice was not cooked properly earlier this week, need better quality check.'),
(6, 6, 2, '2026-10-07', 5, 'Great variety in weekly rotation. Friendly staff.'),
(7, 10, 2, '2026-10-08', 4, 'North Indian paneer dishes are top tier.');

-- ==============================================================================
-- END OF INITIALIZATION SCRIPT
-- ==============================================================================
