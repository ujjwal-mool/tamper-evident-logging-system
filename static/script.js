// ── State
const API_BASE = '';
let uploadedFile = null;
let logs = [];
let verificationResult = null;
let appStatus = 'idle';
let selectedLogId = null;
let viewMode = 'verified';
let lastVerificationTime = null;

// ── Year
document.getElementById('year').textContent = new Date().getFullYear();

// ── Sample data
const sampleLogs = [
  { id:1,  timestamp:'2026-02-04T14:00:01.234Z', message:'System initialized - Secure Log Console v1.0',                  currentHash:'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', previousHash:'0000000000000000000000000000000000000000000000000000000000000000' },
  { id:2,  timestamp:'2026-02-04T14:00:05.456Z', message:'User authentication module loaded successfully',                  currentHash:'b2c3d4e5f67890123456789012345678901abcdef1234567890abcdef1234567', previousHash:'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
  { id:3,  timestamp:'2026-02-04T14:00:12.789Z', message:'Database connection established - PostgreSQL 15.2',               currentHash:'c3d4e5f678901234567890123456789012abcdef1234567890abcdef12345678', previousHash:'b2c3d4e5f67890123456789012345678901abcdef1234567890abcdef1234567' },
  { id:4,  timestamp:'2026-02-04T14:00:18.012Z', message:'Security audit logging enabled for all endpoints',                currentHash:'d4e5f6789012345678901234567890123abcdef1234567890abcdef123456789', previousHash:'c3d4e5f678901234567890123456789012abcdef1234567890abcdef12345678' },
  { id:5,  timestamp:'2026-02-04T14:01:02.345Z', message:'Admin user (admin@system.local) logged in from 192.168.1.100',   currentHash:'e5f67890123456789012345678901234abcdef1234567890abcdef1234567890', previousHash:'d4e5f6789012345678901234567890123abcdef1234567890abcdef123456789' },
  { id:6,  timestamp:'2026-02-04T14:02:15.678Z', message:'Configuration backup completed - 1.2MB archived',                currentHash:'f678901234567890123456789012345abcdef1234567890abcdef12345678901', previousHash:'e5f67890123456789012345678901234abcdef1234567890abcdef1234567890' },
  { id:7,  timestamp:'2026-02-04T14:05:30.901Z', message:'Firewall rule updated - Port 443 enabled for external access',    currentHash:'7890123456789012345678901234567abcdef1234567890abcdef123456789012', previousHash:'f678901234567890123456789012345abcdef1234567890abcdef12345678901' },
  { id:8,  timestamp:'2026-02-04T14:10:45.234Z', message:'SSL certificate renewed - Valid until 2027-02-04',                currentHash:'890123456789012345678901234567abcdef1234567890abcdef1234567890123', previousHash:'7890123456789012345678901234567abcdef1234567890abcdef123456789012' },
  { id:9,  timestamp:'2026-02-04T14:15:00.567Z', message:'Scheduled backup task initiated',                                 currentHash:'90123456789012345678901234567abcdef1234567890abcdef12345678901234', previousHash:'890123456789012345678901234567abcdef1234567890abcdef1234567890123' },
  { id:10, timestamp:'2026-02-04T14:15:45.890Z', message:'Backup completed successfully - 256 files archived',              currentHash:'0123456789012345678901234567abcdef1234567890abcdef123456789012345', previousHash:'90123456789012345678901234567abcdef1234567890abcdef12345678901234' },
];

const tamperedLogs = [
  ...sampleLogs.slice(0, 4),
  { ...sampleLogs[4], message:'Unknown user logged in from suspicious IP 10.0.0.99', currentHash:'tampered_hash_breaks_chain_1234567890abcdef9876543210fedcba9876' },
  ...sampleLogs.slice(5),
];

// ── Drag & Drop
function handleDragOver(e) { e.preventDefault(); document.getElementById('dropzone').classList.add('drag-over'); }
function handleDragLeave()  { document.getElementById('dropzone').classList.remove('drag-over'); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && isValidFile(file)) processFile(file);
}
function handleFileChange(e) {
  const file = e.target.files[0];
  if (file && isValidFile(file)) processFile(file);
}
function isValidFile(f) { return ['.log','.txt','.csv','.jsonl'].some(ext => f.name.toLowerCase().endsWith(ext)); }

function processFile(file) {
  uploadedFile = file;
  setStatus('uploading');
  const dz = document.getElementById('dropzone');
  dz.classList.add('has-file');
  document.getElementById('dropzone-content').innerHTML = `
    <div class="dropzone-icon" style="background:rgba(134,239,172,0.15)">
      <svg viewBox="0 0 24 24" fill="none" stroke="#86EFAC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div class="dropzone-text">
      <strong style="color:#86EFAC">${file.name}</strong>
      <span>${formatSize(file.size)}</span>
    </div>
  `;
  setTimeout(() => {
    setStatus('idle');
    document.getElementById('verify-btn').classList.remove('hidden');
  }, 800);
}

function formatSize(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b)/Math.log(k));
  return parseFloat((b/Math.pow(k,i)).toFixed(2)) + ' ' + s[i];
}

// ── Verification
async function startVerification() {
  setStatus('verifying');
  const btn = document.getElementById('verify-btn');
  btn.disabled = true;
  btn.innerHTML = `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg><span>Verifying Hash Chain...</span>`;

  // Show dashboard immediately with shimmer
  showSection('dashboard-section-wrap');
  showShimmer();

  try {
    const res  = await fetch(`${API_BASE}/verify`);
    const data = await res.json();

    // Map backend shape → frontend shape expected by all render functions
    logs = data.logs.map(log => ({
      id:           log.log_id,
      timestamp:    log.timestamp,
      message:      log.message,
      currentHash:  log.current_hash,
      previousHash: log.previous_hash,
      isValid:      log.is_valid,
      tamperType:   log.tamper_type,
    }));

    verificationResult = {
      isValid:         data.isValid,
      totalLogs:       data.totalLogs,
      validLogs:       data.validLogs,
      tamperedLogs:    data.tamperedLogs,
      tamperedEntries: data.tamperedEntries,
    };

    lastVerificationTime = new Date().toLocaleTimeString();
    setStatus(data.tamperedLogs > 0 ? 'compromised' : 'secure');
    renderAll();
  } catch (err) {
    setStatus('idle');
    alert('Cannot reach backend. Make sure app.py is running:\n  python app.py');
  }

  btn.disabled = false;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polyline points="20 6 9 17 4 12"/></svg><span>Re-Verify</span>`;
}

// ── Add log entry → POST /add
async function addLog() {
  const eventType = document.getElementById('log-event-type').value.trim();
  const message   = document.getElementById('log-message').value.trim();
  const msg       = document.getElementById('addlog-msg');
  if (!eventType || !message) { msg.style.color='#FB7185'; msg.textContent='Both fields are required.'; return; }
  try {
    await fetch(`${API_BASE}/add`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({event_type: eventType, message}) });
    msg.style.color = '#86EFAC';
    msg.textContent = `✓ Log added — event: ${eventType}`;
    document.getElementById('log-event-type').value = '';
    document.getElementById('log-message').value    = '';
  } catch (err) { msg.style.color='#FB7185'; msg.textContent='Failed to reach backend.'; }
}

// ── Apply hash chain → POST /hash
async function applyHashChain() {
  const msg = document.getElementById('addlog-msg');
  try {
    await fetch(`${API_BASE}/hash`, { method:'POST' });
    msg.style.color = '#5EEAD4';
    msg.textContent = '✓ Hash chain applied — ready to verify.';
  } catch (err) { msg.style.color='#FB7185'; msg.textContent='Failed to reach backend.'; }
}

function showShimmer() {
  const lp = document.getElementById('log-entries-panel');
  const hp = document.getElementById('hash-chain-panel');
  lp.innerHTML = hp.innerHTML = [1,2,3,4,5].map(()=>`<div class="shimmer-row"></div>`).join('');
  document.getElementById('verification-panel').innerHTML = `
    <div class="verif-icon-wrap" style="background:rgba(129,140,248,0.15)">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="#818CF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:36px;height:36px"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
    </div>
    <div class="verif-status-title" style="color:#818CF8">Verifying Hash Chain...</div>
    <div class="verif-status-sub">Recomputing SHA-256 hashes and validating chain integrity</div>`;
}

// ── Render all sections
function renderAll() {
  renderLogEntries();
  renderHashChain();
  renderVerification();
  renderAlerts();
  renderAuditReport();
  updateInfoPanel();

  if (verificationResult && verificationResult.tamperedEntries.length > 0) {
    showSection('alerts-section-wrap');
  }
  showSection('audit-section-wrap');
}

// ── Log Entries
function renderLogEntries() {
  const panel = document.getElementById('log-entries-panel');
  const displayLogs = viewMode === 'raw'
    ? logs.map(l => ({ ...l, isValid: undefined, tamperType: undefined }))
    : logs;

  document.getElementById('log-count-badge').textContent = `${logs.length} entries`;
  panel.innerHTML = displayLogs.map(log => {
    const isTampered = log.isValid === false;
    const isSelected = selectedLogId === log.id;
    return `
    <div class="log-entry ${isTampered?'tampered':''} ${isSelected?'selected':''}" onclick="selectLog(${log.id})">
      <div style="min-width:0;flex:1">
        <div class="log-meta">
          <span>#${String(log.id).padStart(3,'0')}</span>
          <span>${fmtTime(log.timestamp)}</span>
        </div>
        <div class="log-msg">${log.message}</div>
        ${log.tamperType ? `<span class="log-tamper-badge">${log.tamperType}</span>` : ''}
      </div>
      <div style="flex-shrink:0;padding-top:2px">
        ${log.isValid === undefined ? '' :
          log.isValid
          ? `<svg class="log-status-icon" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
          : `<svg class="log-status-icon" viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
        }
      </div>
    </div>`;
  }).join('');
}

// ── Hash Chain
function renderHashChain() {
  const panel = document.getElementById('hash-chain-panel');
  const displayLogs = viewMode === 'raw'
    ? logs.map(l => ({ ...l, isValid: undefined, tamperType: undefined }))
    : logs;

  panel.innerHTML = displayLogs.map((log, i) => {
    const validClass = log.isValid === false ? 'invalid' : log.isValid === true ? 'valid' : 'neutral';
    const selClass   = selectedLogId === log.id ? 'selected' : '';
    const hashClass  = log.isValid === false ? 'corrupted' : 'current';
    const connector  = i < displayLogs.length - 1 ? `
      <div class="chain-connector">
        <svg viewBox="0 0 24 24" fill="none" stroke="${displayLogs[i+1]?.isValid===false?'#FB7185':displayLogs[i+1]?.isValid===true?'#86EFAC':'#4A4160'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">
          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
        </svg>
      </div>` : '';
    return `
    <div class="hash-block ${validClass} ${selClass}" style="margin:8px 12px" onclick="selectLog(${log.id})">
      <div class="hash-block-header">
        <span class="hash-block-id">Log #${log.id}${i===0?'<span class="genesis-badge">Genesis</span>':''}</span>
        ${log.isValid===true
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="#86EFAC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg>`
          : log.isValid===false
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
          : ''}
      </div>
      <div class="hash-field">
        <label>Current Hash</label>
        <div class="hash-value ${hashClass}" title="${log.currentHash}">${log.currentHash}</div>
      </div>
      <div class="hash-field">
        <label>Previous Hash</label>
        <div class="hash-value previous" title="${i===0?'Genesis Block':log.previousHash}">${i===0?'(Genesis Block)':log.previousHash}</div>
      </div>
      ${log.tamperType ? `
      <div class="tamper-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Integrity Violation: ${log.tamperType.charAt(0).toUpperCase()+log.tamperType.slice(1)}
      </div>` : ''}
    </div>${connector}`;
  }).join('');
}

// ── Verification panel
function renderVerification() {
  const panel = document.getElementById('verification-panel');
  const r = verificationResult;
  if (!r) return;

  if (r.isValid) {
    panel.innerHTML = `
      <div class="verif-icon-wrap" style="background:rgba(134,239,172,0.15)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#86EFAC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:36px;height:36px"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div>
        <div class="verif-status-title" style="color:#86EFAC">Chain Intact</div>
        <div class="verif-status-sub">All ${r.totalLogs} entries verified successfully</div>
      </div>
      <div class="verif-stats">
        ${statRow('Total Logs', r.totalLogs, 'var(--fg)')}
        ${statRow('Valid', r.validLogs, '#86EFAC')}
        ${statRow('Tampered', '0', '#86EFAC')}
      </div>`;
  } else {
    panel.innerHTML = `
      <div class="verif-icon-wrap" style="background:rgba(251,113,133,0.15)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:36px;height:36px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div>
        <div class="verif-status-title" style="color:#FB7185">Tampering Detected</div>
        <div class="verif-status-sub">Hash chain broken — logs unreliable</div>
      </div>
      <div class="verif-stats">
        ${statRow('Total Logs', r.totalLogs, 'var(--fg)')}
        ${statRow('Valid', r.validLogs, '#86EFAC')}
        ${statRow('Tampered', r.tamperedLogs, '#FB7185')}
      </div>`;
  }
}

function statRow(label, value, color) {
  return `<div class="verif-stat-row"><span class="verif-stat-label">${label}</span><span class="verif-stat-value" style="color:${color}">${value}</span></div>`;
}

// ── Alerts
function renderAlerts() {
  const r = verificationResult;
  if (!r || r.tamperedEntries.length === 0) return;
  document.getElementById('alert-count-label').textContent = `${r.tamperedEntries.length} integrity violation${r.tamperedEntries.length>1?'s':''} detected`;
  document.getElementById('alerts-grid').innerHTML = r.tamperedEntries.map(e => `
    <div class="alert-card section-animate">
      <div class="alert-card-header">
        <div class="alert-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Log #${e.index}
        </div>
        <span class="alert-type-badge">${e.type}</span>
      </div>
      <p>${e.message}</p>
      ${e.timestamp ? `<div class="alert-card-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Detected: ${fmtFull(e.timestamp)}</div>` : ''}
    </div>`).join('');
}

// ── Audit Report
function renderAuditReport() {
  const r = verificationResult;
  if (!r) return;
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card neutral">
      <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
      <div class="stat-card-value">${r.totalLogs}</div>
      <div class="stat-card-label">Total Logs Processed</div>
    </div>
    <div class="stat-card success">
      <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
      <div class="stat-card-value">${r.validLogs}</div>
      <div class="stat-card-label">Valid Logs</div>
    </div>
    <div class="stat-card ${r.tamperedLogs>0?'danger':'success'}">
      <div class="stat-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
      <div class="stat-card-value">${r.tamperedLogs}</div>
      <div class="stat-card-label">Tampered Logs</div>
    </div>`;

  const sb = document.getElementById('summary-box');
  sb.className = `summary-box ${r.isValid ? 'ok' : 'bad'}`;
  sb.innerHTML = `<h3>Summary</h3><p>${r.isValid
    ? `All ${r.totalLogs} log entries have been verified successfully. The hash chain is intact and no tampering has been detected. These logs can be trusted for forensic analysis.`
    : `Verification detected ${r.tamperedLogs} compromised log entr${r.tamperedLogs>1?'ies':'y'} out of ${r.totalLogs} total. The hash chain has been broken, indicating unauthorized modification, deletion, or insertion of log data. These logs should be considered unreliable for forensic purposes.`
  }</p>`;
}

// ── Download
async function downloadReport() {
  try {
    const res  = await fetch(`${API_BASE}/report`);
    const text = await res.text();
    const blob = new Blob([text], {type:'text/plain'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch (err) { alert('Could not fetch report from backend.'); }
}

// ── View mode
function setViewMode(mode) {
  viewMode = mode;
  document.getElementById('toggle-raw').classList.toggle('active', mode==='raw');
  document.getElementById('toggle-verified').classList.toggle('active', mode==='verified');
  if (logs.length) { renderLogEntries(); renderHashChain(); }
}

// ── Select log
function selectLog(id) {
  selectedLogId = selectedLogId === id ? null : id;
  renderLogEntries(); renderHashChain();
}

// ── Status
function setStatus(s) {
  appStatus = s;
  const badge = document.getElementById('status-badge');
  const label = document.getElementById('status-label');
  badge.className = 'status-badge';
  const map = {
    idle:        ['status-idle',        'System Ready'],
    uploading:   ['status-verifying',   'Uploading'],
    verifying:   ['status-verifying',   'Verifying'],
    secure:      ['status-secure',      'Secure'],
    compromised: ['status-compromised', 'Compromised'],
  };
  const [cls, txt] = map[s] || map.idle;
  badge.classList.add(cls);
  label.textContent = txt;
  document.getElementById('info-status').textContent = txt;
  document.getElementById('info-status').style.color = s==='secure'?'#86EFAC':s==='compromised'?'#FB7185':s==='verifying'?'#818CF8':'var(--muted)';
}

function updateInfoPanel() {
  document.getElementById('info-last-run').textContent = lastVerificationTime || '—';
  document.getElementById('info-logs').textContent     = logs.length;
  document.getElementById('info-chain').textContent    = logs.length;
}

// ── Show section
function showSection(id) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('section-animate');
}

// ── Formatters
function fmtTime(ts) {
  return new Date(ts.replace(' ','T')).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
}
function fmtFull(ts) {
  return new Date(ts.replace(' ','T')).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
}