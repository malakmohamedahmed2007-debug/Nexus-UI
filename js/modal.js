/* ================================================
   NEXUS UI — Modal Controller
   modal.js
   ================================================ */

// ── DOM refs ──
const overlay       = document.getElementById('modal-overlay');
const modalBox      = document.getElementById('modal-box');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalIcon     = document.getElementById('modal-icon');
const modalTitle    = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalBodyText = document.getElementById('modal-body-text');
const modalCodeBox  = document.getElementById('modal-code-box');
const modalCodeContent = document.getElementById('modal-code-content');
const modalConfirmBtn  = document.getElementById('modal-confirm-btn');
const modalCancelBtn   = document.getElementById('modal-cancel-btn');

// ── Stats ──
let openCount = 0;

// ── Modal content definitions ──
const MODAL_CONTENT = {
  info: {
    iconClass:   '',
    iconSymbol:  '&#9432;',
    title:       'System Information',
    subtitle:    'Everything is running smoothly.',
    body:        'NEXUS UI is fully operational. All subsystems have passed diagnostic checks. No issues detected in the current session.',
    code:        'status: ONLINE\nversion: 2.4.1\nuptime: 99.97%',
    showCode:    true,
    confirmText: 'Got it',
    confirmClass:'btn-primary',
    cancelText:  'Dismiss',
  },
  success: {
    iconClass:   '',
    iconSymbol:  '&#10003;',
    title:       'Action Successful',
    subtitle:    'Your changes have been saved.',
    body:        'The operation completed without any errors. Your data has been persisted to local storage and is ready for the next session.',
    code:        'result: SUCCESS\nrecord_id: #NX-20941\ntime: 0.042ms',
    showCode:    true,
    confirmText: 'Continue',
    confirmClass:'btn-success',
    cancelText:  'Close',
  },
  warning: {
    iconClass:   'purple',
    iconSymbol:  '&#9888;',
    title:       'Action Required',
    subtitle:    'Please review before proceeding.',
    body:        'This action will modify existing records and cannot be undone without a manual restore. Make sure you have reviewed all pending changes.',
    code:        null,
    showCode:    false,
    confirmText: 'Proceed',
    confirmClass:'btn-purple',
    cancelText:  'Go Back',
  },
  danger: {
    iconClass:   'danger',
    iconSymbol:  '&#128683;',
    title:       'Irreversible Action',
    subtitle:    'This cannot be undone.',
    body:        'You are about to permanently delete this record. Once removed, the data cannot be recovered. Are you absolutely sure you want to continue?',
    code:        'target: user_data\nrecords: 248\naction: PURGE',
    showCode:    true,
    confirmText: 'Delete Forever',
    confirmClass:'btn-danger',
    cancelText:  'Cancel',
  },
};

/* ── Audio Engine ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playModalOpen() {
  try {
    const ac   = getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.12);
    gain.gain.setValueAtTime(0.14, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    osc.start();
    osc.stop(ac.currentTime + 0.25);
  } catch(e) {}
}

function playModalClose() {
  try {
    const ac   = getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ac.currentTime + 0.14);
    gain.gain.setValueAtTime(0.1, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
    osc.start();
    osc.stop(ac.currentTime + 0.22);
  } catch(e) {}
}

function playConfirm() {
  try {
    const ac   = getCtx();
    [523, 659, 784].forEach((freq, i) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ac.currentTime + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.1, ac.currentTime + i * 0.07 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.07 + 0.15);
      osc.start(ac.currentTime + i * 0.07);
      osc.stop(ac.currentTime + i * 0.07 + 0.18);
    });
  } catch(e) {}
}

/* ── Open modal ── */
function openModal(type) {
  const cfg = MODAL_CONTENT[type] || MODAL_CONTENT.info;

  // Apply icon
  modalIcon.innerHTML  = cfg.iconSymbol;
  modalIcon.className  = 'modal-icon' + (cfg.iconClass ? ' ' + cfg.iconClass : '');

  // Apply text
  modalTitle.textContent    = cfg.title;
  modalSubtitle.textContent = cfg.subtitle;
  modalBodyText.textContent = cfg.body;

  // Code block
  if (cfg.showCode && cfg.code) {
    modalCodeBox.style.display = 'block';
    modalCodeContent.textContent = cfg.code;
  } else {
    modalCodeBox.style.display = 'none';
  }

  // Confirm button style
  modalConfirmBtn.textContent = cfg.confirmText;
  modalConfirmBtn.className   = `btn btn-sm ${cfg.confirmClass}`;
  modalCancelBtn.textContent  = cfg.cancelText;

  // Store current type for confirm handler
  modalConfirmBtn.dataset.type = type;

  // Show
  overlay.classList.add('active');
  playModalOpen();

  // Update stats
  openCount++;
  document.getElementById('modal-open-count').textContent = openCount;
  document.getElementById('last-modal-type').textContent  = type.toUpperCase();
  document.getElementById('last-action').textContent      = '—';
}

/* ── Close modal ── */
function closeModal(action) {
  modalBox.classList.add('closing');
  playModalClose();

  setTimeout(() => {
    overlay.classList.remove('active');
    modalBox.classList.remove('closing');
  }, 300);

  if (action) {
    document.getElementById('last-action').textContent = action;
  }
}

/* ── Confirm button ── */
modalConfirmBtn.addEventListener('click', () => {
  playConfirm();
  closeModal('CONFIRMED');
});

/* ── Close button ── */
document.getElementById('modal-close').addEventListener('click', () => {
  closeModal('CLOSED');
});

/* ── Backdrop click ── */
modalBackdrop.addEventListener('click', () => {
  closeModal('DISMISSED');
});

/* ── ESC key ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('active')) {
    closeModal('ESC');
  }
});
