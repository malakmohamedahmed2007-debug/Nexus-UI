/* ================================================
   NEXUS UI — Todo CRUD Controller
   todo.js
   ================================================ */

// ── State ──
let tasks       = [];
let currentFilter = 'all';
let pendingDeleteId = null;

// ── DOM ──
const input        = document.getElementById('todo-input');
const addBtn       = document.getElementById('add-btn');
const list         = document.getElementById('todo-list');
const statTotal    = document.getElementById('stat-total');
const statDone     = document.getElementById('stat-done');
const statPending  = document.getElementById('stat-pending');
const confirmPopup = document.getElementById('confirm-popup');
const confirmText  = document.getElementById('confirm-text');
const confirmDel   = document.getElementById('confirm-delete');
const confirmCancel= document.getElementById('confirm-cancel');
const filterBtns   = document.querySelectorAll('.filter-btn');

/* ── Audio ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playAdd() {
  try {
    const ac = getCtx();
    [440, 554, 659].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ac.currentTime + i * 0.055);
      g.gain.linearRampToValueAtTime(0.09, ac.currentTime + i * 0.055 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.055 + 0.14);
      o.start(ac.currentTime + i * 0.055);
      o.stop(ac.currentTime + i * 0.055 + 0.16);
    });
  } catch(e) {}
}

function playDelete() {
  try {
    const ac = getCtx();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    o.start(); o.stop(ac.currentTime + 0.25);
  } catch(e) {}
}

function playComplete() {
  try {
    const ac = getCtx();
    [523, 784].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ac.currentTime + i * 0.1);
      g.gain.linearRampToValueAtTime(0.1, ac.currentTime + i * 0.1 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.18);
      o.start(ac.currentTime + i * 0.1);
      o.stop(ac.currentTime + i * 0.1 + 0.22);
    });
  } catch(e) {}
}

function playClick() {
  try {
    const ac = getCtx();
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.start(); o.stop(ac.currentTime + 0.12);
  } catch(e) {}
}

/* ── localStorage ── */
function save() {
  localStorage.setItem('nexus-tasks', JSON.stringify(tasks));
}

function load() {
  const raw = localStorage.getItem('nexus-tasks');
  tasks = raw ? JSON.parse(raw) : [];
}

/* ── Counter animation ── */
function animateCounter(el, target) {
  const start   = parseInt(el.textContent) || 0;
  const delta   = target - start;
  const steps   = 20;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(start + delta * (step / steps));
    if (step >= steps) clearInterval(timer);
  }, 16);
}

function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;

  animateCounter(statTotal,   total);
  animateCounter(statDone,    done);
  animateCounter(statPending, pending);
}

/* ── Render ── */
function renderEmpty() {
  list.innerHTML = `
    <div class="todo-empty">
      <div class="todo-empty-icon">&#9744;</div>
      <h3>No tasks yet</h3>
      <p>Type something above and press Enter — your tasks are saved automatically.</p>
    </div>
  `;
}

function getFilteredTasks() {
  if (currentFilter === 'completed') return tasks.filter(t => t.completed);
  if (currentFilter === 'pending')   return tasks.filter(t => !t.completed);
  return tasks;
}

function render() {
  const filtered = getFilteredTasks();
  updateStats();

  if (filtered.length === 0) {
    renderEmpty();
    return;
  }

  list.innerHTML = '';

  filtered.forEach((task, fi) => {
    const el = document.createElement('div');
    el.className = 'todo-item' + (task.completed ? ' completed' : '');
    el.dataset.id = task.id;
    el.style.animationDelay = (fi * 0.04) + 's';

    el.innerHTML = `
      <div class="todo-checkbox${task.completed ? ' checked' : ''}" data-id="${task.id}" title="Toggle complete"></div>
      <span class="todo-text">${escapeHTML(task.text)}</span>
      <input type="text" class="todo-edit-input" value="${escapeHTML(task.text)}" maxlength="140" />
      <div class="todo-actions">
        <button class="todo-action-btn edit" data-id="${task.id}" title="Edit">&#9998;</button>
        <button class="todo-action-btn save" data-id="${task.id}" title="Save" style="display:none">&#10003;</button>
        <button class="todo-action-btn delete" data-id="${task.id}" title="Delete">&#128465;</button>
      </div>
    `;

    list.appendChild(el);
  });

  // Attach handlers
  list.querySelectorAll('.todo-checkbox').forEach(cb => {
    cb.addEventListener('click', () => toggleTask(cb.dataset.id));
  });

  list.querySelectorAll('.todo-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });

  list.querySelectorAll('.todo-action-btn.save').forEach(btn => {
    btn.addEventListener('click', () => saveEdit(btn.dataset.id));
  });

  list.querySelectorAll('.todo-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => showConfirm(btn.dataset.id));
  });

  list.querySelectorAll('.todo-edit-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      const id = inp.closest('.todo-item').dataset.id;
      if (e.key === 'Enter') saveEdit(id);
      if (e.key === 'Escape') cancelEdit(id);
    });
  });
}

/* ── Escape HTML ── */
function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Generate ID ── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── Add Task ── */
function addTask() {
  const text = input.value.trim();
  if (!text) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }

  tasks.unshift({ id: genId(), text, completed: false, created: Date.now() });
  save();
  render();
  input.value = '';
  input.focus();
  playAdd();
}

/* ── Toggle ── */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  save();
  render();
  playComplete();
}

/* ── Edit ── */
function startEdit(id) {
  const el     = list.querySelector(`[data-id="${id}"].todo-item`);
  const span   = el.querySelector('.todo-text');
  const inp    = el.querySelector('.todo-edit-input');
  const editBtn= el.querySelector('.todo-action-btn.edit');
  const saveBtn= el.querySelector('.todo-action-btn.save');

  span.classList.add('editing');
  inp.classList.add('active');
  editBtn.style.display = 'none';
  saveBtn.style.display = '';
  inp.focus();
  inp.select();
  playClick();
}

function cancelEdit(id) {
  render(); // re-render resets edit state
}

function saveEdit(id) {
  const el  = list.querySelector(`[data-id="${id}"].todo-item`);
  const inp = el.querySelector('.todo-edit-input');
  const newText = inp.value.trim();

  if (!newText) return;

  const task = tasks.find(t => t.id === id);
  if (task) {
    task.text = newText;
    save();
    render();
    playClick();
  }
}

/* ── Delete Confirm ── */
function showConfirm(id) {
  pendingDeleteId = id;
  const task = tasks.find(t => t.id === id);
  confirmText.textContent = task
    ? `"${task.text.slice(0, 48)}${task.text.length > 48 ? '…' : ''}" will be permanently removed.`
    : 'This task will be permanently removed.';
  confirmPopup.classList.add('show');
  playClick();
}

function hideConfirm() {
  confirmPopup.classList.remove('show');
  pendingDeleteId = null;
}

confirmDel.addEventListener('click', () => {
  if (!pendingDeleteId) return;

  const el = list.querySelector(`[data-id="${pendingDeleteId}"].todo-item`);
  if (el) {
    el.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== pendingDeleteId);
      save();
      render();
    }, 350);
  } else {
    tasks = tasks.filter(t => t.id !== pendingDeleteId);
    save();
    render();
  }

  playDelete();
  hideConfirm();
});

confirmCancel.addEventListener('click', hideConfirm);

/* ── Filter buttons ── */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
    playClick();
  });
});

/* ── Input events ── */
addBtn.addEventListener('click', addTask);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

/* ── Shake animation ── */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-6px)}
    40%{transform:translateX(6px)}
    60%{transform:translateX(-4px)}
    80%{transform:translateX(4px)}
  }
  .shake { animation: shake 0.35s ease; }
`;
document.head.appendChild(shakeStyle);

/* ── Init ── */
load();

// Seed with demo tasks if empty
if (tasks.length === 0) {
  tasks = [
    { id: genId(), text: 'Build the NEXUS UI project', completed: true,  created: Date.now() - 9e5 },
    { id: genId(), text: 'Add glassmorphism card components', completed: true,  created: Date.now() - 6e5 },
    { id: genId(), text: 'Implement particle background system', completed: false, created: Date.now() - 3e5 },
    { id: genId(), text: 'Add sound effects to all interactions', completed: false, created: Date.now() - 1e5 },
    { id: genId(), text: 'Write full documentation', completed: false, created: Date.now() },
  ];
  save();
}

render();
