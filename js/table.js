/* ================================================
   NEXUS UI — Dynamic Table Controller
   table.js
   ================================================ */

// ── Initial Dataset ──
let tableData = [
  { id:1,  fname:'Layla',   lname:'Hassan',   role:'Lead Engineer',    dept:'Engineering', status:'active',   projects:9,  joined:'2021-03-14' },
  { id:2,  fname:'Marcus',  lname:'Reid',     role:'UX Designer',       dept:'Design',      status:'active',   projects:6,  joined:'2022-07-08' },
  { id:3,  fname:'Yuna',    lname:'Kim',      role:'Product Manager',   dept:'Product',     status:'review',   projects:4,  joined:'2023-01-20' },
  { id:4,  fname:'Dante',   lname:'Cruz',     role:'DevOps Engineer',   dept:'Engineering', status:'active',   projects:11, joined:'2020-11-03' },
  { id:5,  fname:'Sofia',   lname:'Adler',    role:'Marketing Lead',    dept:'Marketing',   status:'pending',  projects:3,  joined:'2023-06-15' },
  { id:6,  fname:'Elian',   lname:'Morel',    role:'Data Scientist',    dept:'Engineering', status:'active',   projects:7,  joined:'2021-09-27' },
  { id:7,  fname:'Priya',   lname:'Sharma',   role:'Finance Analyst',   dept:'Finance',     status:'inactive', projects:2,  joined:'2022-04-11' },
  { id:8,  fname:'Noah',    lname:'Svensson', role:'UI Developer',       dept:'Design',      status:'active',   projects:5,  joined:'2023-02-28' },
  { id:9,  fname:'Amara',   lname:'Diallo',   role:'HR Specialist',     dept:'HR',          status:'active',   projects:1,  joined:'2022-10-05' },
  { id:10, fname:'Riku',    lname:'Tanaka',   role:'Backend Engineer',   dept:'Engineering', status:'review',   projects:8,  joined:'2021-05-19' },
  { id:11, fname:'Celia',   lname:'Fontaine', role:'Brand Designer',     dept:'Design',      status:'pending',  projects:4,  joined:'2023-08-30' },
  { id:12, fname:'Omar',    lname:'Farouk',   role:'Systems Architect',  dept:'Engineering', status:'active',   projects:14, joined:'2020-02-17' },
];

let nextId      = 13;
let sortCol     = null;
let sortDir     = 'asc';
let searchQuery = '';

// ── DOM ──
const tbody       = document.getElementById('table-body');
const tableCount  = document.getElementById('table-count');
const sortInfo    = document.getElementById('table-sort-info');
const searchInput = document.getElementById('table-search');
const addRowModal = document.getElementById('add-row-modal');
const addRowBack  = document.getElementById('add-row-backdrop');

/* ── Audio ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playClick() {
  try {
    const ac = getCtx();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.07, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.start(); o.stop(ac.currentTime + 0.12);
  } catch(e) {}
}

function playAdd() {
  try {
    const ac = getCtx();
    [440, 554].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ac.currentTime + i * 0.07);
      g.gain.linearRampToValueAtTime(0.09, ac.currentTime + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.07 + 0.14);
      o.start(ac.currentTime + i * 0.07);
      o.stop(ac.currentTime + i * 0.07 + 0.18);
    });
  } catch(e) {}
}

/* ── Status badge HTML ── */
function badgeHTML(status) {
  const MAP = {
    active:   ['badge-active',   'Active'],
    pending:  ['badge-pending',  'Pending'],
    inactive: ['badge-inactive', 'Inactive'],
    review:   ['badge-review',   'In Review'],
  };
  const [cls, label] = MAP[status] || ['badge-review', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

/* ── Avatar color ── */
const AVATAR_CLASSES = ['avatar-cyan', 'avatar-purple', 'avatar-neon'];
function avatarClass(id) {
  return AVATAR_CLASSES[id % AVATAR_CLASSES.length];
}

/* ── Format date ── */
function fmtDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

/* ── Filter + sort ── */
function getDisplayData() {
  let data = [...tableData];

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    data = data.filter(r =>
      (r.fname + ' ' + r.lname).toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.dept.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sortCol) {
    data.sort((a, b) => {
      let av, bv;
      if (sortCol === 'name')     { av = a.fname + a.lname; bv = b.fname + b.lname; }
      else if (sortCol === 'role')     { av = a.role;     bv = b.role; }
      else if (sortCol === 'dept')     { av = a.dept;     bv = b.dept; }
      else if (sortCol === 'status')   { av = a.status;   bv = b.status; }
      else if (sortCol === 'projects') { av = a.projects; bv = b.projects; }
      else if (sortCol === 'joined')   { av = a.joined;   bv = b.joined; }
      else { av = ''; bv = ''; }

      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }

  return data;
}

/* ── Render ── */
function render() {
  const data = getDisplayData();
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No records match your search query.</td></tr>`;
    tableCount.textContent = '0 records';
    return;
  }

  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.028) + 's';

    const initials = (row.fname[0] + row.lname[0]).toUpperCase();

    tr.innerHTML = `
      <td>
        <div class="name-cell">
          <div class="avatar ${avatarClass(row.id)}">${initials}</div>
          <div>
            <div class="name-main">${row.fname} ${row.lname}</div>
            <div class="name-sub">#NX-${String(row.id).padStart(4,'0')}</div>
          </div>
        </div>
      </td>
      <td>${row.role}</td>
      <td>${row.dept}</td>
      <td>${badgeHTML(row.status)}</td>
      <td>
        <span style="font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--cyan);">${row.projects}</span>
        <span style="color:var(--text-muted);font-size:.75rem;margin-left:.25rem;">proj.</span>
      </td>
      <td style="font-family:var(--font-mono);font-size:.8rem;">${fmtDate(row.joined)}</td>
    `;

    tbody.appendChild(tr);
  });

  tableCount.textContent = `${data.length} record${data.length !== 1 ? 's' : ''}`;
}

/* ── Sort headers ── */
document.querySelectorAll('.data-table th').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (!col) return;

    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = 'asc';
    }

    // Update UI
    document.querySelectorAll('.data-table th').forEach(h => {
      h.classList.remove('sorted');
      h.querySelector('.sort-icon').textContent = '⇅';
    });
    th.classList.add('sorted');
    th.querySelector('.sort-icon').textContent = sortDir === 'asc' ? '↑' : '↓';
    sortInfo.textContent = `Sorted by ${col} (${sortDir})`;

    render();
    playClick();
  });
});

/* ── Search ── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  render();
});

/* ── Reset ── */
document.getElementById('reset-btn').addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  sortCol = null;
  sortDir = 'asc';
  sortInfo.textContent = 'Click a column header to sort';
  document.querySelectorAll('.data-table th').forEach(h => {
    h.classList.remove('sorted');
    const si = h.querySelector('.sort-icon');
    if (si) si.textContent = '⇅';
  });
  render();
  playClick();
});

/* ── Add row modal ── */
function openAddModal() {
  addRowModal.classList.add('active');
  document.getElementById('add-row-modal').querySelector('.modal-box').style.transform = '';
  document.getElementById('add-row-modal').querySelector('.modal-box').style.opacity = '';
  playClick();
}

function closeAddModal() {
  addRowModal.classList.remove('active');
}

document.getElementById('add-row-btn').addEventListener('click', openAddModal);
document.getElementById('add-row-close').addEventListener('click', closeAddModal);
document.getElementById('add-row-cancel').addEventListener('click', closeAddModal);
addRowBack.addEventListener('click', closeAddModal);

document.getElementById('add-row-confirm').addEventListener('click', () => {
  const fname    = document.getElementById('field-fname').value.trim();
  const lname    = document.getElementById('field-lname').value.trim();
  const role     = document.getElementById('field-role').value.trim();
  const dept     = document.getElementById('field-dept').value;
  const status   = document.getElementById('field-status').value;
  const projects = parseInt(document.getElementById('field-projects').value) || 0;

  if (!fname || !lname || !role) {
    ['field-fname','field-lname','field-role'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--danger)';
        setTimeout(() => el.style.borderColor = '', 1200);
      }
    });
    return;
  }

  const today = new Date().toISOString().slice(0,10);

  tableData.unshift({
    id: nextId++, fname, lname, role, dept, status, projects, joined: today
  });

  // Clear form
  ['field-fname','field-lname','field-role'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('field-projects').value = '1';

  closeAddModal();
  render();
  playAdd();
});

/* ── Export CSV ── */
document.getElementById('export-btn').addEventListener('click', () => {
  const data = getDisplayData();
  const headers = ['ID','First Name','Last Name','Role','Department','Status','Projects','Joined'];
  const rows    = data.map(r => [r.id, r.fname, r.lname, r.role, r.dept, r.status, r.projects, r.joined]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'nexus-table-export.csv';
  a.click();
  URL.revokeObjectURL(url);
  playAdd();
});

/* ── Init ── */
render();
