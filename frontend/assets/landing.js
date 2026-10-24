// ==============================================================================
// HOSTELHUB - LANDING PAGE MOTION & INTERACTION CONTROLLER
// Handles Floating Connectors, Sticky Nav, Showcase Tabs, Database Explorer,
// SQL Preview Execution, Gallery Slider, and Scroll-Triggered Reveals.
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initFloatingNav();
  initHeroConnectors();
  initShowcaseTabs();
  initSqlRunnerPreview();
  initDatabaseExplorer();
  initCountUpStats();
  initScrollReveals();
  initMobileMenu();
});

// ==============================================================================
// 1. FLOATING NAVIGATION BAR
// ==============================================================================

function initFloatingNav() {
  const navWrapper = document.querySelector('.nav-wrapper');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navWrapper.classList.add('scrolled');
    } else {
      navWrapper.classList.remove('scrolled');
    }
  }, { passive: true });

  // Active section indicator on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(sec => observer.observe(sec));
}

// ==============================================================================
// 2. HERO SVG CONNECTORS & FLOATING CARDS (Matches Reference Image 1 & 2)
// ==============================================================================

function initHeroConnectors() {
  const svg = document.getElementById('hero-connections-svg');
  if (!svg) return;

  function updateLines() {
    if (window.innerWidth < 768) {
      svg.innerHTML = '';
      return;
    }

    const heroSection = document.querySelector('.hero-section');
    const heroRect = heroSection.getBoundingClientRect();

    const titleEl = document.querySelector('.hero-title');
    const titleRect = titleEl.getBoundingClientRect();

    const centerPoint = {
      x: titleRect.left + titleRect.width / 2 - heroRect.left,
      y: titleRect.top + titleRect.height * 0.3 - heroRect.top
    };

    const floatCards = [
      document.querySelector('.card-student-1'),
      document.querySelector('.card-center-top'),
      document.querySelector('.card-fee'),
      document.querySelector('.card-mess'),
      document.querySelector('.card-student-2')
    ];

    let svgHtml = '';

    floatCards.forEach((card, idx) => {
      if (!card) return;
      const cardRect = card.getBoundingClientRect();

      let targetX = cardRect.left + cardRect.width / 2 - heroRect.left;
      let targetY = cardRect.top + cardRect.height / 2 - heroRect.top;

      // Curved or stepped bezier path connecting card to central hub
      const midX = (centerPoint.x + targetX) / 2;
      const pathD = `M ${targetX} ${targetY} Q ${midX} ${centerPoint.y} ${centerPoint.x} ${centerPoint.y}`;

      svgHtml += `<path d="${pathD}" />`;
      svgHtml += `<circle class="pulse-node" cx="${targetX}" cy="${targetY}" r="3.5" />`;
    });

    svg.innerHTML = svgHtml;
  }

  updateLines();
  window.addEventListener('resize', updateLines);

  // Subtle Parallax on Hero Mousemove
  const heroSection = document.querySelector('.hero-section');
  heroSection.addEventListener('mousemove', (e) => {
    if (window.innerWidth < 1024) return;
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const deltaX = (clientX - centerX) / centerX;
    const deltaY = (clientY - centerY) / centerY;

    const cards = document.querySelectorAll('.float-card');
    cards.forEach((card, i) => {
      const factor = (i + 1) * 6;
      card.style.transform = `translate(${deltaX * factor}px, ${deltaY * factor}px)`;
    });
  });

  heroSection.addEventListener('mouseleave', () => {
    const cards = document.querySelectorAll('.float-card');
    cards.forEach(card => card.style.transform = '');
  });
}

// ==============================================================================
// 3. SHOWCASE TABS (Section 5)
// ==============================================================================

function initShowcaseTabs() {
  const tabBtns = document.querySelectorAll('.showcase-tab-btn');
  const panels = document.querySelectorAll('.showcase-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      const targetPanel = document.getElementById(target);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

// ==============================================================================
// 4. SQL RUNNER PREVIEW (Showcase E)
// ==============================================================================

function initSqlRunnerPreview() {
  const runBtn = document.getElementById('preview-run-sql-btn');
  if (!runBtn) return;

  const statusText = document.getElementById('preview-sql-status');
  const latencyText = document.getElementById('preview-sql-latency');
  const rowsText = document.getElementById('preview-sql-rows');

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    statusText.textContent = 'Executing Query...';

    setTimeout(() => {
      runBtn.disabled = false;
      runBtn.textContent = '▶ Run Query';
      statusText.innerHTML = '<span style="color: #3FB950;">● Success</span>';
      latencyText.textContent = '18.4 ms';
      rowsText.textContent = '5 records returned';
    }, 450);
  });
}

// ==============================================================================
// 5. INTERACTIVE DATABASE ARCHITECTURE EXPLORER (Section 6)
// ==============================================================================

const SCHEMA_DATA = {
  Student: {
    badge: 'Master Record',
    desc: 'Core student records with unique registration numbers, branch, and contact details.',
    columns: [
      { name: 'student_id', type: 'INT', key: 'PK' },
      { name: 'reg_no', type: 'VARCHAR(20)', key: 'UQ' },
      { name: 'full_name', type: 'VARCHAR(100)' },
      { name: 'course', type: 'VARCHAR(50)' },
      { name: 'branch', type: 'VARCHAR(50)' },
      { name: 'year_of_study', type: 'TINYINT' },
      { name: 'email', type: 'VARCHAR(100)', key: 'UQ' }
    ],
    relations: ['RoomAllocation', 'MessRegistration', 'MessFeedback']
  },
  Hostel: {
    badge: 'Facility Entity',
    desc: 'Residential facility master entity (Boys/Girls blocks) with designated warden contacts.',
    columns: [
      { name: 'hostel_id', type: 'INT', key: 'PK' },
      { name: 'hostel_name', type: 'VARCHAR(100)', key: 'UQ' },
      { name: 'hostel_type', type: 'ENUM(Boys,Girls)' },
      { name: 'warden_name', type: 'VARCHAR(100)' }
    ],
    relations: ['Block', 'Mess']
  },
  Block: {
    badge: 'Facility Child',
    desc: 'Hierarchical block partitions under hostel residences.',
    columns: [
      { name: 'block_id', type: 'INT', key: 'PK' },
      { name: 'hostel_id', type: 'INT', key: 'FK' },
      { name: 'block_name', type: 'VARCHAR(20)' }
    ],
    relations: ['Hostel', 'Floor']
  },
  Floor: {
    badge: 'Floor Partition',
    desc: 'Individual residential levels inside blocks.',
    columns: [
      { name: 'floor_id', type: 'INT', key: 'PK' },
      { name: 'block_id', type: 'INT', key: 'FK' },
      { name: 'floor_number', type: 'TINYINT' }
    ],
    relations: ['Block', 'Room']
  },
  RoomType: {
    badge: 'Pricing & Specs',
    desc: 'All-AC rooms: 3-bed (1st-year Sem 1) and 2-bed, with annual fees.',
    columns: [
      { name: 'room_type_id', type: 'INT', key: 'PK' },
      { name: 'capacity', type: 'TINYINT' },
      { name: 'ac_type', type: 'ENUM(AC,Non-AC)' },
      { name: 'fee_per_year', type: 'DECIMAL(10,2)' }
    ],
    relations: ['Room']
  },
  Room: {
    badge: 'Room Inventory',
    desc: 'Physical room units with live capacity and current occupancy counts.',
    columns: [
      { name: 'room_id', type: 'INT', key: 'PK' },
      { name: 'floor_id', type: 'INT', key: 'FK' },
      { name: 'room_type_id', type: 'INT', key: 'FK' },
      { name: 'room_number', type: 'VARCHAR(10)' },
      { name: 'current_occupancy', type: 'TINYINT' }
    ],
    relations: ['Floor', 'RoomType', 'RoomAllocation']
  },
  RoomAllocation: {
    badge: 'Transaction Record',
    desc: 'Maps active student room assignments with single-allocation trigger constraints.',
    columns: [
      { name: 'allocation_id', type: 'INT', key: 'PK' },
      { name: 'student_id', type: 'INT', key: 'FK' },
      { name: 'room_id', type: 'INT', key: 'FK' },
      { name: 'allocation_date', type: 'DATE' },
      { name: 'status', type: 'ENUM(Active,Vacated)' }
    ],
    relations: ['Student', 'Room']
  },
  Mess: {
    badge: 'Dining Facility',
    desc: 'Hostel mess dining facilities mapped to caterer vendor contracts.',
    columns: [
      { name: 'mess_id', type: 'INT', key: 'PK' },
      { name: 'hostel_id', type: 'INT', key: 'FK' },
      { name: 'caterer_id', type: 'INT', key: 'FK' },
      { name: 'mess_name', type: 'VARCHAR(100)' },
      { name: 'mess_category', type: 'ENUM(Veg,Non-Veg,Special)' },
      { name: 'annual_fee', type: 'DECIMAL(8,2)' }
    ],
    relations: ['Hostel', 'Caterer', 'MessRegistration', 'MessMenu', 'MessFeedback']
  },
  MessRegistration: {
    badge: 'Subscription',
    desc: 'Active student subscriptions to dining facilities with fee tracking.',
    columns: [
      { name: 'mess_reg_id', type: 'INT', key: 'PK' },
      { name: 'student_id', type: 'INT', key: 'FK' },
      { name: 'mess_id', type: 'INT', key: 'FK' },
      { name: 'registration_date', type: 'DATE' },
      { name: 'status', type: 'ENUM(Active,Ended)' }
    ],
    relations: ['Student', 'Mess', 'MessFeePayment', 'MealAttendance']
  }
};

function initDatabaseExplorer() {
  const tableNodes = document.querySelectorAll('.table-node-card');
  const detailTitle = document.getElementById('selected-table-name');
  const detailBadge = document.getElementById('selected-table-badge');
  const detailDesc = document.getElementById('selected-table-desc');
  const detailCols = document.getElementById('selected-table-cols');
  const detailRels = document.getElementById('selected-table-rels');

  function renderTableDetails(tableName) {
    const data = SCHEMA_DATA[tableName];
    if (!data) return;

    if (detailTitle) detailTitle.textContent = tableName;
    if (detailBadge) detailBadge.textContent = data.badge;
    if (detailDesc) detailDesc.textContent = data.desc;

    if (detailCols) {
      detailCols.innerHTML = data.columns.map(c => `
        <div class="mini-preview-row">
          <span style="font-family: var(--font-mono); font-weight: 700;">${c.name}</span>
          <span>
            ${c.key ? `<span class="col-key key-${c.key.toLowerCase()}">${c.key}</span> ` : ''}
            <span style="color: var(--text-muted); font-size: 0.78rem;">${c.type || ''}</span>
          </span>
        </div>
      `).join('');
    }

    if (detailRels) {
      detailRels.innerHTML = data.relations.map(r => `
        <span class="tag-badge tag-violet" style="font-size: 0.76rem; cursor: pointer;" onclick="highlightTableNode('${r}')">
          🔗 ${r}
        </span>
      `).join(' ');
    }

    // Highlight card
    tableNodes.forEach(node => {
      if (node.getAttribute('data-table') === tableName) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  }

  tableNodes.forEach(node => {
    node.addEventListener('click', () => {
      const tName = node.getAttribute('data-table');
      renderTableDetails(tName);
    });
  });

  // Global helper
  window.highlightTableNode = function(tableName) {
    renderTableDetails(tableName);
  };
}



// ==============================================================================
// 7. COUNT-UP STATS (Section 9)
// ==============================================================================

function initCountUpStats() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (!statNumbers.length) return;

  let hasAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        statNumbers.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const duration = 1200;
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              el.textContent = target;
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(current);
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-grid');
  if (statsSection) observer.observe(statsSection);
}

// ==============================================================================
// 8. SCROLL REVEALS
// ==============================================================================

function initScrollReveals() {
  const revealElements = document.querySelectorAll('.process-card, .bento-card, .showcase-wrapper, .schema-explorer-card, .stat-box, .cta-banner-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
}

// ==============================================================================
// 8. MOBILE MENU CONTROLLER
// ==============================================================================

function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (!toggleBtn || !navMenu) return;

  function toggleMenu(forceState) {
    const isOpening = typeof forceState === 'boolean'
      ? forceState
      : !navMenu.classList.contains('mobile-open');

    if (isOpening) {
      navMenu.classList.add('mobile-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.textContent = '✕';
    } else {
      navMenu.classList.remove('mobile-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.textContent = '☰';
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking any nav link inside mobile menu
  const navLinks = navMenu.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('mobile-open') &&
        !navMenu.contains(e.target) &&
        !toggleBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('mobile-open')) {
      toggleMenu(false);
    }
  });

  // Close on viewport resize above mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navMenu.classList.contains('mobile-open')) {
      toggleMenu(false);
    }
  }, { passive: true });
}
