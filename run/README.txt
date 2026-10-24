==============================================================================
HOSTEL & MESS MANAGEMENT SYSTEM (RDBMS LAB CSC2131 - MANIPAL UNIVERSITY JAIPUR)
Students: Shaurya Pathak (2502051505), Vaibhav Saxena (2502052896)
==============================================================================

QUICK RUN INSTRUCTIONS:
-----------------------
Simply double-click:
    RUN.bat (located inside this 'run' folder)

It will automatically:
1. Start the backend server on http://localhost:4000
2. Direct your default web browser straight to the application dashboard!

ADDITIONAL RUN UTILITIES IN THIS FOLDER:
---------------------------------------
- RUN.bat                : Master click-to-run launcher (starts server & opens browser).
- START_BACKEND.bat      : Launches the Node.js API server in an open console for logs.
- OPEN_DASHBOARD.bat     : Directly opens http://localhost:4000 in your browser.
- SETUP_MYSQL_DATABASE.bat : Automatically imports database\init.sql into your MySQL.

FEATURES IMPLEMENTED:
--------------------
1. Complete Database Schema (15 Relational Tables fully populated with data).
2. Advanced PL/SQL Routines:
   - Stored Procedures: AllocateRoom, VacateRoom, RegisterMess, PayMessFee
   - Stored Functions : AvailableBeds, HostelOccupancyPercentage, CountStudentsInMess
   - Triggers         : Dynamic Room Occupancy tracking & Single Active Allocation constraints
   - Views            : HostelOccupancy, StudentRoomDetails, StudentMessDetails, MessRevenueSummary
3. Modern Web Dashboard:
   - Student Management with full INSERT, UPDATE, and DELETE (CRUD).
   - Room Allocation management with bed vacancy calculation.
   - Mess Management with subscription changes, payments, and menus.
4. Interactive SQL & PL/SQL Query Console:
   - 12 pre-configured analytical queries with live execution, timing benchmarks, and tabular results.
