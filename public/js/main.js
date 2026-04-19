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

// ═══════════════════════════════════════════════════════════════
// TERRAFORM TERMINAL
// ═══════════════════════════════════════════════════════════════

// Generate a stable session ID per browser session
const SESSION_ID = (() => {
  let id = sessionStorage.getItem('tf_session');
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('tf_session', id); }
  return id;
})();

let termHistory = [];
let termHistoryIdx = -1;

// ANSI escape code → HTML converter
function ansiToHtml(text) {
  if (!text) return '';
  const map = {
    '\\x1b\\[0m':  '</span>',
    '\\x1b\\[1m':  '<span class="ansi-bold">',
    '\\x1b\\[32m': '<span class="ansi-green">',
    '\\x1b\\[31m': '<span class="ansi-red">',
    '\\x1b\\[33m': '<span class="ansi-yellow">',
    '\\x1b\\[36m': '<span class="ansi-cyan">',
    '\\x1b\\[37m': '<span style="color:#e6edf3">',
    '\\x1b\\[90m': '<span class="ansi-gray">',
    '\\x1b\\[1;32m': '<span class="ansi-bgreen">',
    '\\x1b\\[1;31m': '<span class="ansi-bred">',
    '\\x1b\\[1;33m': '<span class="ansi-byellow">',
    '\\x1b\\[1;36m': '<span class="ansi-bcyan">',
    '\\x1b\\[2J\\x1b\\[H': '__CLEAR__',
  };

  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Replace ANSI codes
  for (const [code, tag] of Object.entries(map)) {
    html = html.replace(new RegExp(code, 'g'), tag);
  }

  // Close any unclosed spans at end of line
  const openCount = (html.match(/<span/g) || []).length;
  const closeCount = (html.match(/<\/span>/g) || []).length;
  html += '</span>'.repeat(Math.max(0, openCount - closeCount));

  return html;
}

function appendToTerminal(cmdText, outputText, isClear) {
  const out = document.getElementById('term-output');
  if (!out) return;

  if (isClear) {
    // Keep welcome message, clear the rest
    const welcome = out.querySelector('.terminal-welcome');
    out.innerHTML = '';
    if (welcome) out.appendChild(welcome);
    return;
  }

  // Print the command line
  if (cmdText) {
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-prompt-line';
    cmdLine.innerHTML = `<span class="terminal-ps1">$&nbsp;</span><span class="terminal-cmd-echo">${cmdText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;
    out.appendChild(cmdLine);
  }

  // Print output
  if (outputText) {
    const outputEl = document.createElement('div');
    outputEl.style.marginBottom = '8px';
    outputEl.innerHTML = ansiToHtml(outputText);
    out.appendChild(outputEl);
  }

  // Scroll to bottom
  out.scrollTop = out.scrollHeight;
}

async function runTerminalCommand(cmd) {
  const dayId = typeof DAY_ID !== 'undefined' ? DAY_ID : 1;
  const trimmed = cmd.trim();
  if (!trimmed) return;

  // Add to history
  if (termHistory[termHistory.length - 1] !== trimmed) {
    termHistory.push(trimmed);
  }
  termHistoryIdx = termHistory.length;

  // Show command immediately
  appendToTerminal(trimmed, null, false);

  // Handle clear locally
  if (trimmed === 'clear' || trimmed === 'cls') {
    appendToTerminal(null, null, true);
    return;
  }

  // Show typing indicator for slow commands
  const slow = ['terraform apply', 'terraform destroy', 'terraform init'].some(c => trimmed.startsWith(c));
  let thinkEl = null;
  if (slow) {
    thinkEl = document.createElement('div');
    thinkEl.style.cssText = 'color:#8b949e;font-family:var(--mono);font-size:12px;padding:2px 0';
    thinkEl.textContent = '...';
    document.getElementById('term-output').appendChild(thinkEl);
  }

  try {
    const res = await fetch('/api/terminal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: trimmed, dayId, sessionId: SESSION_ID }),
    });
    const data = await res.json();
    if (thinkEl) thinkEl.remove();

    if (data.clear) {
      appendToTerminal(null, null, true);
    } else {
      appendToTerminal(null, data.output || '', false);
    }
  } catch (e) {
    if (thinkEl) thinkEl.remove();
    appendToTerminal(null, `\x1b[1;31mError:\x1b[0m Could not reach server.`, false);
  }
}

function handleTermKey(e) {
  const input = document.getElementById('term-input');
  if (!input) return;

  if (e.key === 'Enter') {
    const cmd = input.value;
    input.value = '';
    runTerminalCommand(cmd);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (termHistoryIdx > 0) {
      termHistoryIdx--;
      input.value = termHistory[termHistoryIdx] || '';
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (termHistoryIdx < termHistory.length - 1) {
      termHistoryIdx++;
      input.value = termHistory[termHistoryIdx] || '';
    } else {
      termHistoryIdx = termHistory.length;
      input.value = '';
    }
  } else if (e.key === 'Tab') {
    e.preventDefault();
    // Simple tab completion for terraform commands
    const val = input.value;
    const completions = [
      'terraform init', 'terraform validate', 'terraform fmt',
      'terraform plan', 'terraform apply', 'terraform apply -auto-approve',
      'terraform output', 'terraform state list', 'terraform state show ',
      'terraform destroy', 'terraform destroy -auto-approve',
      'terraform workspace list', 'terraform workspace new ',
      'terraform workspace select ', 'ls', 'cat main.tf',
      'cat variables.tf', 'cat locals.tf', 'cat outputs.tf',
    ];
    const match = completions.find(c => c.startsWith(val) && c !== val);
    if (match) input.value = match;
  }
}

function toggleTerminalHints() {
  const panel = document.getElementById('term-hints');
  if (panel) panel.classList.toggle('open');
}

async function resetTerminal() {
  const dayId = typeof DAY_ID !== 'undefined' ? DAY_ID : 1;
  await fetch('/api/terminal/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dayId, sessionId: SESSION_ID }),
  });
  termHistory = [];
  termHistoryIdx = -1;
  const out = document.getElementById('term-output');
  if (out) {
    const welcome = out.querySelector('.terminal-welcome');
    out.innerHTML = '';
    if (welcome) out.appendChild(welcome);
    // Print reset message
    appendToTerminal(null, '\x1b[90mTerminal reset. Session state cleared.\x1b[0m', false);
  }
}

// Focus terminal input when lab tab is clicked
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab === 'lab') {
        setTimeout(() => {
          const input = document.getElementById('term-input');
          if (input) input.focus();
        }, 100);
      }
    });
  });

  // Click anywhere in terminal output to focus input
  const termOut = document.getElementById('term-output');
  if (termOut) {
    termOut.addEventListener('click', () => {
      const input = document.getElementById('term-input');
      if (input) input.focus();
    });
  }
});
