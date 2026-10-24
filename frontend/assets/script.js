// ==============================================================================
// HOSTEL & MESS MANAGEMENT SYSTEM (DA2) - FRONTEND APPLICATION SCRIPT
// ==============================================================================

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : 'http://localhost:4000/api';

// State Store
let state = {
  students: [],
  filteredStudents: [],
  allocations: [],
  rooms: [],
  messes: [],
  messRegistrations: [],
  queries: [],
  activeQueryId: 1,
  deleteTarget: null
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  setupNavigation();
  initApplication();
});

async function initApplication() {
  await fetchSystemStatus();
  await loadStudents();
  await loadRoomsAndAllocations();
  await loadMessData();
  await loadQueryCatalog();
  loadMenu();
}

// ==============================================================================
// 1. NAVIGATION & STATUS
// ==============================================================================

function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const tabEl = document.getElementById(tabId);
  const btnEl = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);

  if (tabEl) tabEl.classList.add('active');
  if (btnEl) btnEl.classList.add('active');
}

async function fetchSystemStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`);
    const data = await res.json();
    const badgeText = document.getElementById('engine-status-text');
    const badgeDot = document.querySelector('.status-dot');

    if (badgeText && badgeDot) {
      if (data.isFallback) {
        badgeText.textContent = `High-Fidelity Engine [Active]`;
        badgeDot.style.background = '#38bdf8';
      } else {
        badgeText.textContent = `MySQL 8.0 [Connected]`;
        badgeDot.style.background = '#10b981';
      }
    }

    // Update KPI counters
    const stEl = document.getElementById('stat-total-students');
    const allocEl = document.getElementById('stat-active-allocations');
    const messEl = document.getElementById('stat-active-mess');
    const roomsEl = document.getElementById('stat-total-rooms');

    if (stEl) stEl.textContent = data.totalStudents || 0;
    if (allocEl) allocEl.textContent = data.activeAllocations || 0;
    if (messEl) messEl.textContent = data.activeMessRegistrations || 0;
    if (roomsEl) roomsEl.textContent = data.totalRooms || 0;
  } catch (err) {
    const badgeText = document.getElementById('engine-status-text');
    if (badgeText) badgeText.textContent = 'Backend Offline';
  }
}

// ==============================================================================
// 2. STUDENTS MANAGEMENT (CRUD)
// ==============================================================================

async function loadStudents() {
  try {
    const res = await fetch(`${API_BASE}/students`);
    state.students = await res.json();
    state.filteredStudents = [...state.students];
    renderStudentsTable();
    populateStudentSelectDropdowns();
  } catch (err) {
    showToast('Failed to load students: ' + err.message, 'error');
  }
}

function filterStudents() {
  const search = document.getElementById('student-search-input').value.toLowerCase().trim();
  const branch = document.getElementById('student-branch-filter').value;
  const year = document.getElementById('student-year-filter').value;

  state.filteredStudents = state.students.filter(st => {
    const matchesSearch = !search ||
      st.full_name.toLowerCase().includes(search) ||
      st.reg_no.toLowerCase().includes(search) ||
      st.email.toLowerCase().includes(search);

    const matchesBranch = !branch || st.branch === branch;
    const matchesYear = !year || String(st.year_of_study) === String(year);

    return matchesSearch && matchesBranch && matchesYear;
  });

  renderStudentsTable();
}

function renderStudentsTable() {
  const tbody = document.getElementById('students-table-body');
  if (!state.filteredStudents.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No matching students found.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.filteredStudents.map(st => `
    <tr>
      <td><strong>#${st.student_id}</strong></td>
      <td><span class="badge badge-accent">${st.reg_no}</span></td>
      <td>
        <strong>${st.full_name}</strong><br>
        <small style="color: var(--text-dim);">${st.email}</small>
      </td>
      <td>${st.course} • <strong>${st.branch}</strong></td>
      <td>Year ${st.year_of_study}</td>
      <td>${st.gender}</td>
      <td>${st.phone_number}</td>
      <td>
        <small>${st.parent_name || 'N/A'}</small><br>
        <small style="color: var(--text-dim);">${st.parent_contact || 'N/A'}</small>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditStudentModal(${st.student_id})">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteStudent(${st.student_id}, '${st.full_name}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddStudentModal() {
  document.getElementById('modal-student-title').textContent = 'Add New Student (Insert)';
  document.getElementById('student-form-id').value = '';
  document.getElementById('form-student').reset();
  document.getElementById('btn-student-submit').textContent = 'Save Student (Insert)';
  openModal('modal-student');
}

function openEditStudentModal(id) {
  const st = state.students.find(s => s.student_id === id);
  if (!st) return;

  document.getElementById('modal-student-title').textContent = `Edit Student: ${st.full_name} (Update)`;
  document.getElementById('student-form-id').value = st.student_id;
  document.getElementById('student-regno').value = st.reg_no;
  document.getElementById('student-fullname').value = st.full_name;
  document.getElementById('student-course').value = st.course;
  document.getElementById('student-branch').value = st.branch;
  document.getElementById('student-year').value = st.year_of_study;
  document.getElementById('student-gender').value = st.gender;
  document.getElementById('student-phone').value = st.phone_number;
  document.getElementById('student-email').value = st.email;
  document.getElementById('student-parent-name').value = st.parent_name || '';
  document.getElementById('student-parent-contact').value = st.parent_contact || '';
  document.getElementById('btn-student-submit').textContent = 'Update Student';
  openModal('modal-student');
}

async function handleStudentSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('student-form-id').value;
  const payload = {
    reg_no: document.getElementById('student-regno').value.trim(),
    full_name: document.getElementById('student-fullname').value.trim(),
    course: document.getElementById('student-course').value.trim(),
    branch: document.getElementById('student-branch').value,
    year_of_study: Number(document.getElementById('student-year').value),
    gender: document.getElementById('student-gender').value,
    phone_number: document.getElementById('student-phone').value.trim(),
    email: document.getElementById('student-email').value.trim(),
    parent_name: document.getElementById('student-parent-name').value.trim(),
    parent_contact: document.getElementById('student-parent-contact').value.trim()
  };

  try {
    if (id) {
      // UPDATE
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Student #${id} updated successfully!`, 'success');
    } else {
      // INSERT
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`New student registered successfully (ID: ${data.insertedId})!`, 'success');
    }

    closeModal('modal-student');
    await loadStudents();
    await fetchSystemStatus();
  } catch (err) {
    showToast('Failed to save student: ' + err.message, 'error');
  }
}

function confirmDeleteStudent(id, name) {
  state.deleteTarget = { type: 'student', id };
  document.getElementById('modal-confirm-title').textContent = 'Delete Student';
  document.getElementById('modal-confirm-message').textContent = `Are you sure you want to delete student "${name}" (#${id})? This will also remove any linked allocations or records.`;
  document.getElementById('btn-confirm-delete').onclick = executeDelete;
  openModal('modal-confirm');
}

async function executeDelete() {
  if (!state.deleteTarget) return;
  const { type, id } = state.deleteTarget;

  try {
    if (type === 'student') {
      const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Student #${id} deleted successfully.`, 'success');
      await loadStudents();
    }

    closeModal('modal-confirm');
    await fetchSystemStatus();
  } catch (err) {
    showToast('Delete operation failed: ' + err.message, 'error');
  }
}

// ==============================================================================
// 3. ROOMS & ALLOCATIONS (PL/SQL Stored Procedure & Functions)
// ==============================================================================

async function loadRoomsAndAllocations() {
  try {
    const [allocRes, roomsRes] = await Promise.all([
      fetch(`${API_BASE}/rooms/allocations/active`),
      fetch(`${API_BASE}/rooms/available`)
    ]);

    state.allocations = await allocRes.json();
    state.rooms = await roomsRes.json();

    renderAllocationsTable();
    renderRoomsInventoryGrid();
    renderHostelOccupancyDashboard();
  } catch (err) {
    showToast('Failed to load room data: ' + err.message, 'error');
  }
}

function renderAllocationsTable() {
  const tbody = document.getElementById('allocations-table-body');
  if (!state.allocations.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No active room allocations recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.allocations.map(al => `
    <tr>
      <td><strong>#${al.allocation_id}</strong></td>
      <td><span class="badge badge-accent">${al.reg_no}</span></td>
      <td><strong>${al.full_name}</strong></td>
      <td><span class="badge badge-neutral">Room ${al.room_number}</span></td>
      <td>${al.allocation_date}</td>
      <td><span class="badge badge-success">${al.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="vacateRoom(${al.allocation_id})">
          Vacate Room (Update)
        </button>
      </td>
    </tr>
  `).join('');
}

function renderRoomsInventoryGrid() {
  const grid = document.getElementById('rooms-inventory-grid');
  if (!state.rooms.length) {
    grid.innerHTML = `<p class="empty-state">No rooms available.</p>`;
    return;
  }

  grid.innerHTML = state.rooms.map(r => {
    const isFull = r.vacant_beds === 0;
    return `
      <div class="room-card">
        <div class="room-card-head">
          <span class="room-no">Room ${r.room_number}</span>
          <span class="bed-badge ${isFull ? 'bed-full' : 'bed-vacant'}">
            ${isFull ? 'Full' : `${r.vacant_beds} Beds Free`}
          </span>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          ${r.hostel_name || 'Hostel'}<br>
          ${r.block_name || 'Block'}, Floor ${r.floor_number}
        </div>
        <div style="font-size: 0.8rem; display: flex; justify-content: space-between; margin-top: 6px;">
          <span>Type: <strong>${r.ac_type} (${r.capacity}-Bed)</strong></span>
          <span>₹${Number(r.fee_per_year).toLocaleString()}</span>
        </div>
        <div class="progress-bar-bg" style="margin-top: 6px;">
          <div class="progress-bar-fill" style="width: ${(r.current_occupancy / r.capacity) * 100}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderHostelOccupancyDashboard() {
  const container = document.getElementById('hostel-occupancy-list');
  const hostels = {};

  state.rooms.forEach(r => {
    const hName = r.hostel_name || 'General';
    if (!hostels[hName]) {
      hostels[hName] = { name: hName, capacity: 0, occupancy: 0 };
    }
    hostels[hName].capacity += r.capacity;
    hostels[hName].occupancy += r.current_occupancy;
  });

  container.innerHTML = Object.values(hostels).map(h => {
    const pct = h.capacity > 0 ? ((h.occupancy / h.capacity) * 100).toFixed(1) : 0;
    return `
      <div class="occupancy-item">
        <div class="occupancy-item-header">
          <span class="occupancy-title">${h.name}</span>
          <span class="occupancy-stat">${h.occupancy} / ${h.capacity} Beds Occupied (${pct}%)</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function openAllocateRoomModal() {
  const studentSelect = document.getElementById('allocate-student-select');
  const roomSelect = document.getElementById('allocate-room-select');

  // Filter students who don't already have an active allocation
  const activeStudentIds = state.allocations.map(a => a.student_id);
  const eligibleStudents = state.students.filter(s => !activeStudentIds.includes(s.student_id));

  studentSelect.innerHTML = eligibleStudents.length
    ? eligibleStudents.map(s => `<option value="${s.student_id}">${s.reg_no} - ${s.full_name} (${s.branch})</option>`).join('')
    : `<option value="">All students currently have active room allocations</option>`;

  // Filter rooms with vacant beds
  const availableRooms = state.rooms.filter(r => r.vacant_beds > 0);
  roomSelect.innerHTML = availableRooms.length
    ? availableRooms.map(r => `<option value="${r.room_id}">Room ${r.room_number} (${r.hostel_name} - ${r.vacant_beds} beds free, ${r.ac_type})</option>`).join('')
    : `<option value="">No rooms currently have available beds</option>`;

  openModal('modal-allocate');
}

async function handleAllocateSubmit(e) {
  e.preventDefault();
  const student_id = document.getElementById('allocate-student-select').value;
  const room_id = document.getElementById('allocate-room-select').value;

  if (!student_id || !room_id) {
    showToast('Please select both an eligible student and an available room.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/rooms/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, room_id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Room successfully allocated (via AllocateRoom PL/SQL Routine)!', 'success');
    closeModal('modal-allocate');
    await loadRoomsAndAllocations();
    await fetchSystemStatus();
  } catch (err) {
    showToast('Allocation failed: ' + err.message, 'error');
  }
}

async function vacateRoom(allocation_id) {
  try {
    const res = await fetch(`${API_BASE}/rooms/vacate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocation_id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Room allocation #${allocation_id} vacated successfully. Bed released!`, 'success');
    await loadRoomsAndAllocations();
    await fetchSystemStatus();
  } catch (err) {
    showToast('Failed to vacate room: ' + err.message, 'error');
  }
}

// ==============================================================================
// 4. MESS MANAGEMENT, MENUS & BILLING
// ==============================================================================

async function loadMessData() {
  try {
    const [messesRes, regsRes] = await Promise.all([
      fetch(`${API_BASE}/mess/messes`),
      fetch(`${API_BASE}/mess/registrations/active`)
    ]);

    state.messes = await messesRes.json();
    state.messRegistrations = await regsRes.json();

    renderMessFacilitiesGrid();
    renderMessRegistrationsTable();
  } catch (err) {
    showToast('Failed to load mess data: ' + err.message, 'error');
  }
}

function renderMessFacilitiesGrid() {
  const container = document.getElementById('mess-facilities-grid');
  if (!state.messes.length) return;

  container.innerHTML = state.messes.map(m => `
    <div class="mess-card">
      <div class="mess-card-header">
        <span class="mess-title">${m.mess_name}</span>
        <span class="badge ${m.mess_category === 'Veg' ? 'badge-success' : (m.mess_category === 'Non-Veg' ? 'badge-danger' : 'badge-warning')}">
          ${m.mess_category}
        </span>
      </div>
      <div class="mess-meta">
        <strong>Caterer:</strong> ${m.caterer_name}<br>
        <strong>Annual Fee:</strong> ₹${Number(m.annual_fee).toLocaleString()} / year<br>
        <strong>Subscribers:</strong> ${m.active_students || 0} / ${m.capacity} capacity
      </div>
    </div>
  `).join('');
}

function renderMessRegistrationsTable() {
  const tbody = document.getElementById('mess-registrations-table-body');
  if (!state.messRegistrations.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No active mess registrations.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.messRegistrations.map(r => `
    <tr>
      <td><strong>#${r.mess_reg_id}</strong></td>
      <td><span class="badge badge-accent">${r.reg_no}</span></td>
      <td><strong>${r.full_name}</strong></td>
      <td>${r.mess_name}</td>
      <td><span class="badge badge-neutral">${r.mess_category}</span></td>
      <td>₹${Number(r.annual_fee).toLocaleString()}</td>
      <td>${r.registration_date}</td>
      <td><span class="badge badge-success">${r.status}</span></td>
    </tr>
  `).join('');
}

async function loadMenu() {
  const messId = document.getElementById('menu-mess-select').value || 1;
  const container = document.getElementById('menu-items-grid');

  try {
    const res = await fetch(`${API_BASE}/mess/menu/${messId}/2026-10-05`);
    const items = await res.json();

    if (!items.length) {
      container.innerHTML = `<p class="empty-state">No scheduled menu items found for this mess.</p>`;
      return;
    }

    container.innerHTML = items.map(it => `
      <div class="menu-day-card">
        <h4>${it.day_of_week} • ${it.meal_type}</h4>
        <p style="color: var(--text-muted); font-size: 0.88rem;">${it.items}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Failed to load menu: ${err.message}</p>`;
  }
}

function openRegisterMessModal() {
  const studentSelect = document.getElementById('messreg-student-select');
  const messSelect = document.getElementById('messreg-mess-select');

  studentSelect.innerHTML = state.students.map(s => `
    <option value="${s.student_id}">${s.reg_no} - ${s.full_name}</option>
  `).join('');

  messSelect.innerHTML = state.messes.map(m => `
    <option value="${m.mess_id}">${m.mess_name} (${m.mess_category} - ₹${Number(m.annual_fee).toLocaleString()}/yr)</option>
  `).join('');

  openModal('modal-mess-reg');
}

async function handleMessRegSubmit(e) {
  e.preventDefault();
  const student_id = document.getElementById('messreg-student-select').value;
  const mess_id = document.getElementById('messreg-mess-select').value;

  try {
    const res = await fetch(`${API_BASE}/mess/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, mess_id })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Mess registration updated successfully via RegisterMess procedure!', 'success');
    closeModal('modal-mess-reg');
    await loadMessData();
    await fetchSystemStatus();
  } catch (err) {
    showToast('Mess registration failed: ' + err.message, 'error');
  }
}

function openPaymentModal() {
  const regSelect = document.getElementById('payment-reg-select');
  regSelect.innerHTML = state.messRegistrations.map(r => `
    <option value="${r.mess_reg_id}">${r.reg_no} - ${r.full_name} (${r.mess_name})</option>
  `).join('');

  document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
  openModal('modal-payment');
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const payload = {
    mess_reg_id: document.getElementById('payment-reg-select').value,
    amount_paid: Number(document.getElementById('payment-amount').value),
    academic_year: document.getElementById('payment-month').value.trim(),
    payment_mode: document.getElementById('payment-mode').value,
    payment_date: document.getElementById('payment-date').value
  };

  try {
    const res = await fetch(`${API_BASE}/mess/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Mess fee payment recorded successfully!', 'success');
    closeModal('modal-payment');
  } catch (err) {
    showToast('Payment recording failed: ' + err.message, 'error');
  }
}

function openFeedbackModal() {
  const studentSelect = document.getElementById('feedback-student-select');
  const messSelect = document.getElementById('feedback-mess-select');

  studentSelect.innerHTML = state.students.map(s => `<option value="${s.student_id}">${s.reg_no} - ${s.full_name}</option>`).join('');
  messSelect.innerHTML = state.messes.map(m => `<option value="${m.mess_id}">${m.mess_name}</option>`).join('');

  openModal('modal-feedback');
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const payload = {
    student_id: document.getElementById('feedback-student-select').value,
    mess_id: document.getElementById('feedback-mess-select').value,
    rating: Number(document.getElementById('feedback-rating').value),
    comments: document.getElementById('feedback-comments').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/mess/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('Feedback submitted successfully!', 'success');
    closeModal('modal-feedback');
  } catch (err) {
    showToast('Feedback submission failed: ' + err.message, 'error');
  }
}

// ==============================================================================
// 5. SQL & PL/SQL QUERY CONSOLE (12 Analytical Queries)
// ==============================================================================

async function loadQueryCatalog() {
  try {
    const res = await fetch(`${API_BASE}/queries/list`);
    state.queries = await res.json();
    renderQuerySidebar();
    selectQuery(1);
  } catch (err) {
    showToast('Failed to load query catalog: ' + err.message, 'error');
  }
}

function renderQuerySidebar() {
  const container = document.getElementById('query-buttons-list');
  container.innerHTML = state.queries.map(q => `
    <button class="query-btn ${q.id === state.activeQueryId ? 'active' : ''}" onclick="selectQuery(${q.id})" id="q-btn-${q.id}">
      <span class="query-btn-cat">${q.category}</span>
      <span class="query-btn-title">Q${q.id}: ${q.title}</span>
    </button>
  `).join('');
}

function selectQuery(id) {
  state.activeQueryId = id;
  const q = state.queries.find(item => item.id === id);
  if (!q) return;

  document.querySelectorAll('.query-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`q-btn-${id}`);
  if (btn) btn.classList.add('active');

  document.getElementById('query-active-category').textContent = q.category;
  document.getElementById('query-active-title').textContent = `Q${q.id}: ${q.title}`;
  document.getElementById('query-active-desc').textContent = q.description;
  document.getElementById('query-active-sql').textContent = q.sql;

  // Reset results container to pristine view
  document.getElementById('query-stats-bar').style.display = 'none';
  document.getElementById('query-result-head').innerHTML = '';
  document.getElementById('query-result-body').innerHTML = `
    <tr><td class="empty-state">Ready to execute. Click 'Run Query' above.</td></tr>
  `;
}

async function executeCurrentQuery() {
  const runBtn = document.getElementById('btn-run-query');
  runBtn.disabled = true;
  runBtn.innerHTML = `Running...`;

  try {
    const res = await fetch(`${API_BASE}/queries/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: state.activeQueryId })
    });
    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Display Benchmark metrics
    document.getElementById('query-stats-bar').style.display = 'flex';
    document.getElementById('query-exec-time').textContent = `${result.durationMs} ms`;
    document.getElementById('query-exec-rows').textContent = `${result.rowCount} records`;

    // Render Data Table
    renderQueryResultTable(result.columns, result.data);
    showToast(`Query Q${state.activeQueryId} executed in ${result.durationMs}ms (${result.rowCount} rows).`, 'success');
  } catch (err) {
    showToast('Query execution error: ' + err.message, 'error');
    document.getElementById('query-result-body').innerHTML = `
      <tr><td class="empty-state" style="color: var(--accent-rose);">Execution Error: ${err.message}</td></tr>
    `;
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = 'Run Query';
  }
}

function renderQueryResultTable(columns, data) {
  const thead = document.getElementById('query-result-head');
  const tbody = document.getElementById('query-result-body');

  if (!data || !data.length) {
    thead.innerHTML = '';
    tbody.innerHTML = `<tr><td class="empty-state">Query executed successfully, but returned 0 rows.</td></tr>`;
    return;
  }

  thead.innerHTML = `<tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>`;

  tbody.innerHTML = data.map(row => `
    <tr>
      ${columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return `<td style="color: var(--text-dim); font-style: italic;">NULL</td>`;
        if (typeof val === 'number') return `<td><strong>${val}</strong></td>`;
        return `<td>${val}</td>`;
      }).join('')}
    </tr>
  `).join('');
}

function copySqlCode() {
  const sql = document.getElementById('query-active-sql').textContent;
  navigator.clipboard.writeText(sql).then(() => {
    showToast('SQL statement copied to clipboard!', 'info');
  });
}

// ==============================================================================
// 6. UTILITIES & MODAL HELPERS
// ==============================================================================

function populateStudentSelectDropdowns() {
  // Utility for general population
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ==============================================================================
// 7. THEME TOGGLE ENGINE (DARK & LIGHT MODE)
// ==============================================================================

function initThemeToggle() {
  const savedTheme = localStorage.getItem('app-theme') || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('app-theme', newTheme);
  showToast(`Switched to ${newTheme.toUpperCase()} mode`, 'info');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon && label) {
    if (theme === 'dark') {
      icon.textContent = '☀️';
      label.textContent = 'Light';
    } else {
      icon.textContent = '🌙';
      label.textContent = 'Dark';
    }
  }
}

