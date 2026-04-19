// ── Progress management ──
function getCompleted() {
  return JSON.parse(localStorage.getItem('tf30_completed') || '[]');
}
function saveCompleted(arr) {
  localStorage.setItem('tf30_completed', JSON.stringify(arr));
}

// ── Dashboard: restore progress dots ──
document.addEventListener('DOMContentLoaded', () => {
  const done = getCompleted();
  done.forEach(id => {
    const check = document.getElementById('check-' + id);
    if (check) check.classList.add('checked');
    const card = document.querySelector('.day-card[data-day="' + id + '"]');
    if (card) card.style.opacity = '0.65';
  });

  // Apply HCL syntax highlight to all code blocks on the page
  document.querySelectorAll('pre.code-block code').forEach(block => {
    block.innerHTML = highlightHCL(block.textContent);
  });
});

// ── HCL / Terraform syntax highlighter ──
function highlightHCL(raw) {
  let code = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments first
  code = code.replace(/(#[^\n]*)/g, '<span class="cm">$1</span>');

  // Strings
  code = code.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="str">$1</span>');

  // HCL block keywords
  const kws = ['terraform','provider','resource','data','variable','locals','output','module',
    'for_each','count','depends_on','lifecycle','dynamic','backend','required_providers',
    'required_version','features','validation','prevent_destroy','create_before_destroy','ignore_changes'];
  kws.forEach(kw => {
    const re = new RegExp('(?<![\\w-])(' + kw + ')(?![\\w-])', 'g');
    code = code.replace(re, '<span class="kw">$1</span>');
  });

  // Booleans
  code = code.replace(/\b(true|false|null)\b/g, '<span class="num">$1</span>');

  // Numbers
  code = code.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');

  return code;
}

// ── Copy code button ──
function copyCode(btn) {
  const pre = btn.closest('.code-wrap').querySelector('code');
  const text = pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copied';
    setTimeout(() => btn.textContent = 'Copy', 1800);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ Copied';
    setTimeout(() => btn.textContent = 'Copy', 1800);
  });
}

// ── Mark day complete ──
function markDone(id) {
  const done = getCompleted();
  const btn = document.getElementById('mark-done-btn');
  const idx = done.indexOf(id);
  if (idx > -1) {
    done.splice(idx, 1);
    if (btn) { btn.textContent = 'Mark complete'; btn.classList.add('undone'); }
  } else {
    done.push(id);
    if (btn) { btn.textContent = '✓ Complete'; btn.classList.remove('undone'); }
  }
  saveCompleted(done);
  const dot = document.querySelector('.sidebar-day[data-day="' + id + '"] .s-dot');
  if (dot) dot.classList.toggle('done', idx === -1);
}

// ── Toggles ──
function toggleHints() {
  const el = document.getElementById('hints-list');
  if (el) el.classList.toggle('open');
}
function toggleSolution() {
  const el = document.getElementById('solution-code');
  if (el) el.classList.toggle('open');
}
