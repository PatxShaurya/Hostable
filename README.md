# 🏫 Hostel & Mess Management System (RDBMS Lab Project)

**Student Name:** Shaurya Pathak, Vaibhav Saxena

**Registration Number:** 2502051505, 2502052896  
**Course:** Relational Database Management Systems Lab (CSC2131)  
**Database Engines Supported:** MySQL 8.0+ / High-Fidelity Local Engine  

---

## 🚀 Quick Start (One-Click Run)

To run and immediately launch the system:
1. Open the **`run/`** folder.
2. Double-click **`RUN.bat`**.
3. The launcher will automatically start the backend server and direct your default browser to:
   ```
   http://localhost:4000
   ```

---

## 📁 Project Architecture

```
Hostable/
├── backend/
│   ├── routes/
│   │   ├── students.js       # CRUD API for Students
│   │   ├── rooms.js          # Room inventory & AllocateRoom procedure API
│   │   ├── mess.js           # Mess subscriptions, payments & menus API
│   │   └── queries.js        # SQL & PL/SQL Query Console execution engine
│   ├── db.js                 # Dual-mode engine (MySQL 8.0 + High-Fidelity Fallback)
│   ├── package.json          # Node dependencies (express, cors, mysql2, dotenv)
│   ├── server.js             # Express web server & static frontend host
│   └── .env                  # MySQL configuration settings
├── database/
│   ├── init.sql              # Complete DDL, 15 tables, triggers, views, stored procedures, sample data
│   └── queries.sql           # 12 system-specific SQL & PL/SQL queries with explanations
├── frontend/
│   ├── assets/
│   │   ├── style.css         # Modern dark-mode UI design system & glassmorphism
│   │   └── script.js         # Reactive UI logic, REST API connectors, query console
│   └── index.html            # Main web application dashboard
└── run/
    ├── RUN.bat               # Master click-to-run launcher (starts backend & opens browser)
    ├── START_BACKEND.bat     # Launches backend console window for log monitoring
    ├── OPEN_DASHBOARD.bat    # Opens http://localhost:4000 directly
    ├── SETUP_MYSQL_DATABASE.bat # Imports init.sql into MySQL Server
    └── README.txt            # Quick guide for evaluators
```

---

## 📊 Database Specifications & Schema

The database `hostel_mess_management` consists of **15 relational tables**:
1. **Student**: Core student master records with registration numbers, branches, years, and parent contacts.
2. **Hostel**: Residential facilities (Boys & Girls blocks) and warden contacts.
3. **Block**: Architectural blocks associated with each hostel.
4. **Floor**: Floor designations per block.
5. **RoomType**: All rooms are AC. 1st years: 3-bed in Sem 1, then 2-bed from Sem 2 (Rs 2,72,000 per year). 2nd year onwards: 2-bed (Rs 2,65,000 per year).
6. **Room**: Physical room inventory with dynamic occupancy counters.
7. **RoomAllocation**: Student room allotments (Active / Vacated).
8. **Caterer**: Catering vendors and contract terms.
9. **Mess**: Two co-ed messes (Bluspring and Bluedove), open to all hostels, Rs 80,000 per year.
10. **MessRegistration**: Active and historical student mess subscriptions.
11. **MessMenu**: Rotational schedules by day and meal slot.
12. **MenuItem**: Specific food and beverage items served per slot.
13. **MealAttendance**: Daily meal check-ins.
14. **MessFeePayment**: Annual fee transaction records, academic years, and payment modes.
15. **MessFeedback**: Student ratings (1 to 5 stars) and feedback comments.

---

## ⚡ PL/SQL Stored Routines & Automation

### 1. Stored Procedures
- `CALL AllocateRoom(p_student_id, p_room_id)`: Allocates room with transaction safety, ensuring the student has no active allocation and the room has available beds.
- `CALL VacateRoom(p_allocation_id)`: Safely vacates a room allocation and updates occupancy.
- `CALL RegisterMess(p_student_id, p_mess_id)`: Ends any previous mess registration and activates the new mess enrollment.
- `CALL PayMessFee(p_mess_reg_id, p_amount, p_year, p_mode)`: Records an annual mess fee payment for an academic year.

### 2. Stored Functions
- `AvailableBeds(p_room_id)`: Computes remaining free beds for any room.
- `HostelOccupancyPercentage(p_hostel_id)`: Calculates aggregate percentage occupancy for a hostel.
- `CountStudentsInMess(p_mess_id)`: Returns the active headcount registered to a mess.

### 3. Triggers
- `trg_alloc_after_insert`: Automatically increments room `current_occupancy` upon active allocation.
- `trg_alloc_after_update`: Decrements or updates occupancy when a student vacates.
- `trg_alloc_before_insert_single_active`: Integrity constraint preventing multiple simultaneous active room allocations.
- `trg_messreg_before_insert_single_active`: Prevents duplicate simultaneous active mess registrations.

---

## 🔍 SQL & PL/SQL Queries Implemented (12 Queries)

| # | Query Title | Category | Technical Concepts Demonstrated |
|---|---|---|---|
| **Q1** | Active Resident Allocations | Relational Joins | 5-table inner join across student, room, block, and hostel hierarchy |
| **Q2** | Hostel Occupancy Analytics | Views & Aggregations | Queries `HostelOccupancy` view with bed utilization percentage |
| **Q3** | Vacant Beds per Room | PL/SQL Stored Function | Invokes `AvailableBeds(room_id)` scalar function with vacancy filtering |
| **Q4** | Fully Occupied Rooms | Relational Filtering | Identifies rooms reaching 100% capacity |
| **Q5** | Weekly Mess Menu Schedule | String Aggregation | `GROUP_CONCAT` with `FIELD` day-of-week sorting |
| **Q6** | Monday Dinner Cross-Comparison | Multi-Table Join | Evaluates meal options across all mess facilities |
| **Q7** | Student Meal Attendance Audit | Aggregations | Quantifies dining attendance per student for current week |
| **Q8** | Mess Fee Defaulters | Correlated Subquery | `NOT EXISTS` subquery identifying unpaid annual fees for `2026-27` |
| **Q9** | Mess Revenue Summary | Financial Rollup | Queries `MessRevenueSummary` view for collection totals |
| **Q10** | Caterer Satisfaction Scores | Aggregate Functions | Computes `AVG(rating)` and `ROUND` across student reviews |
| **Q11** | Mess Capacity Utilization | PL/SQL Stored Function | Uses `CountStudentsInMess(mess_id)` to verify capacity |
| **Q12** | Rank Hostels by Occupancy | Window Functions | Uses `RANK() OVER (ORDER BY occupancy_percentage DESC)` |

---

## 🖥️ Web Interface Features

- **Dashboard**: Live KPI counters, hostel occupancy progress bars, and architecture specs.
- **Student CRUD**: Interactive table with real-time search, branch/year filtering, modal forms for **Insert**, **Update**, and **Delete**.
- **Room Allocations**: Manage room assignments via `AllocateRoom` procedure, vacancy calculations, and one-click vacate updates.
- **Mess & Dining**: Multi-mess facility viewer, registration switches via `RegisterMess`, fee payment recorder, and rotational menu explorer.
- **Query Console**: Interactive test runner for all 12 queries showing SQL code, copy button, live execution benchmark (ms), row counts, and formatted tabular output.
