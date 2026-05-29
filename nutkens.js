/**
 * nutkens.js — NUTTOKEN conversion layer
 *
 * 1 logged nut = 1,000 NUTTOKENS
 * Tracks how many nuts you've already converted so you can't double-dip.
 * NUTTOKENS live in localStorage and are used exclusively for casino play.
 * They are completely separate from the on-chain nut log count.
 */
(function () {

  const KEY_CONVERTED = 'nut_kens_converted_v1'; // total nuts ever converted → tokens
  const KEY_BAL       = 'nut_pm_bal_v1';          // shared with casino games
  const RATE          = 1000;                      // 1 nut → 1000 NUTTOKENS

  // ── Read / write balance ──────────────────────────────────────────
  function getBalance() {
    return Math.max(0, parseInt(localStorage.getItem(KEY_BAL) || '0', 10) || 0);
  }

  function _setBalance(n) {
    localStorage.setItem(KEY_BAL, String(Math.max(0, Math.floor(n))));
    const bal = getBalance();
    // Only update NUTTOKEN-specific display elements — never pmBalFloat (that shows real nut count)
    ['pmBal','ntBal','ntBalFloat','casinoHdrBal'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'casinoHdrBal') {
        el.textContent = bal.toLocaleString() + ' NUTTOKENS';
      } else if (id === 'ntBalFloat') {
        el.textContent = bal >= 1000 ? Math.round(bal/1000)+'K' : bal.toLocaleString();
      } else {
        el.textContent = bal.toLocaleString();
      }
    });
    window.dispatchEvent(new CustomEvent('nutkens:balance', { detail: { balance: bal } }));
    return bal;
  }

  // ── Conversion tracking ───────────────────────────────────────────
  function getTotalConverted() {
    return parseInt(localStorage.getItem(KEY_CONVERTED) || '0', 10) || 0;
  }

  function getConvertible(allTimeNuts) {
    return Math.max(0, Math.floor(allTimeNuts) - getTotalConverted());
  }

  /**
   * Convert `nutCount` nuts into NUTTOKENS.
   * Returns number of nuts actually converted (may be less if you ask for too many).
   */
  function convert(nutCount, allTimeNuts) {
    const available = getConvertible(allTimeNuts);
    const actual    = Math.min(Math.floor(nutCount), available);
    if (actual <= 0) return 0;

    const gained = actual * RATE;
    localStorage.setItem(KEY_CONVERTED, String(getTotalConverted() + actual));
    _setBalance(getBalance() + gained);
    return actual;
  }

  // ── Render the conversion panel UI ───────────────────────────────
  function renderPanel(allTimeNuts) {
    const el = document.getElementById('ntkConvertPanel');
    if (!el) return;
    const available  = getConvertible(allTimeNuts);
    const balance    = getBalance();
    const converted  = getTotalConverted();

    el.innerHTML = `
      <div class="ntk-header">
        <span class="ntk-title">💎 NUTTOKENS</span>
        <span class="ntk-bal-pill">${balance.toLocaleString()} NUTTOKENS</span>
      </div>
      <div class="ntk-meta">
        <span>🥜 ${converted.toLocaleString()} nuts converted · ${available.toLocaleString()} available</span>
        <span class="ntk-rate">1 nut = 1,000 NUTTOKENS</span>
      </div>
      ${available > 0 ? `
      <div class="ntk-convert-row">
        <div class="ntk-input-wrap">
          <button class="ntk-adj" onclick="NutKens._adjustInput(-1)">−</button>
          <input class="ntk-input" id="ntkInput" type="number" min="1" max="${available}"
            value="${Math.min(available, 10)}" oninput="NutKens._previewConvert()">
          <button class="ntk-adj" onclick="NutKens._adjustInput(1)">+</button>
        </div>
        <button class="ntk-max-btn" onclick="NutKens._inputMax(${available})">ALL</button>
      </div>
      <div class="ntk-preview" id="ntkPreview">= ${Math.min(available,10) * RATE} NUTTOKENS</div>
      <button class="ntk-convert-btn" onclick="NutKens._doConvert(${allTimeNuts})">
        CONVERT
      </button>
      ` : `
      <div class="ntk-empty">Log more nuts to unlock NUTTOKENS conversion.</div>
      `}
      <button class="ntk-casino-btn" onclick="NutKens.openCasino()">
        🎰 OPEN CASINO
      </button>
    `;
  }

  // ── Internal helpers ──────────────────────────────────────────────
  function _adjustInput(delta) {
    const el = document.getElementById('ntkInput');
    if (!el) return;
    el.value = Math.max(1, Math.min(parseInt(el.max), (parseInt(el.value) || 0) + delta));
    _previewConvert();
  }

  function _inputMax(max) {
    const el = document.getElementById('ntkInput');
    if (el) { el.value = max; _previewConvert(); }
  }

  function _previewConvert() {
    const inp  = document.getElementById('ntkInput');
    const prev = document.getElementById('ntkPreview');
    if (!inp || !prev) return;
    const n = Math.max(0, parseInt(inp.value) || 0);
    prev.textContent = `= ${(n * RATE).toLocaleString()} NUTTOKENS`;
  }

  function _doConvert(allTimeNuts) {
    const inp = document.getElementById('ntkInput');
    const n   = inp ? Math.max(0, parseInt(inp.value) || 0) : 0;
    const actual = convert(n, allTimeNuts);
    if (actual <= 0) { _showToast('Nothing to convert'); return; }
    _showToast(`✅ Converted ${actual} nut${actual>1?'s':''} → ${(actual * RATE).toLocaleString()} NUTTOKENS`);
    renderPanel(allTimeNuts);
  }

  function _showToast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  // ── Open casino ───────────────────────────────────────────────────
  function openCasino(tab) {
    const overlay = document.getElementById('casinoAppOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    const frame = document.getElementById('casinoAppFrame');
    const url = './casino-app.html' + (tab ? '#' + tab : '');
    if (!frame.src || frame.src === '' || frame.src === window.location.href) {
      frame.src = url;
    } else if (tab) {
      // Already loaded — just tell it to switch tabs
      frame.contentWindow && frame.contentWindow.postMessage({ type: 'casino:goto', tab }, '*');
    }
  }

  function closeCasino() {
    const overlay = document.getElementById('casinoAppOverlay');
    if (overlay) overlay.style.display = 'none';
    // Refresh balance display after casino session
    if (typeof pmSetBalance === 'function') pmSetBalance(getBalance());
    if (typeof countAllTime !== 'undefined') renderPanel(countAllTime);
  }

  // Listen for postMessage from casino iframe
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'casino:close') closeCasino();
    if (e.data && e.data.type === 'casino:balance') _setBalance(e.data.balance);
  });

  window.NutKens = {
    getBalance, getConvertible, getTotalConverted, convert,
    renderPanel, openCasino, closeCasino, RATE,
    _adjustInput, _inputMax, _previewConvert, _doConvert,
  };

})();
