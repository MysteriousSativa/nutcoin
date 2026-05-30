/**
 * nutkens.js — NUTTOKEN conversion layer
 *
 * 1 logged nut = 1,000 NUTTOKENS (10 nuts = 10,000 NUTTOKENS)
 * Reverse: burn NUTTOKENS to free nuts back for the available pool.
 * Tracks how many nuts you've converted so you can't double-dip.
 */
(function () {

  const KEY_CONVERTED = 'nut_kens_converted_v1'; // total nuts ever converted → tokens
  const KEY_BAL       = 'nut_pm_bal_v1';          // shared with casino games
  const RATE          = 1000;                      // 1 nut ↔ 1,000 NUTTOKENS
  const REV_BATCH     = { nuts: 10, tokens: 10000 }; // display bundle

  // ── Read / write balance ──────────────────────────────────────────
  function getBalance() {
    return Math.max(0, parseInt(localStorage.getItem(KEY_BAL) || '0', 10) || 0);
  }

  function _setBalance(n) {
    localStorage.setItem(KEY_BAL, String(Math.max(0, Math.floor(n))));
    const bal = getBalance();
    const chipsReady = window.StatLoad ? StatLoad.isChipsReady() : true;
    ['pmBal','ntBal','casinoHdrBal'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'casinoHdrBal') {
        if (bal === 0) el.textContent = '0 NUTTOKENS';
        else if (!chipsReady && window.StatLoad) el.innerHTML = StatLoad.SPIN;
        else el.textContent = bal.toLocaleString() + ' NUTTOKENS';
      } else if (window.StatLoad) {
        StatLoad.paintChipsFull(el, bal, chipsReady);
      } else {
        el.textContent = bal.toLocaleString();
      }
    });
    if (typeof updateNTFloat === 'function') updateNTFloat();
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

  /** Max nuts you can cash out (limited by chip balance + prior forward converts). */
  function getRedeemableNuts() {
    const byTokens    = Math.floor(getBalance() / RATE);
    const byConverted = getTotalConverted();
    return Math.max(0, Math.min(byTokens, byConverted));
  }

  /** Burn NUTTOKENS → free nuts back into the available pool. */
  function convertBack(nutCount) {
    const max    = getRedeemableNuts();
    const actual = Math.min(Math.floor(nutCount), max);
    if (actual <= 0) return 0;

    const cost = actual * RATE;
    localStorage.setItem(KEY_CONVERTED, String(getTotalConverted() - actual));
    _setBalance(getBalance() - cost);
    return actual;
  }

  function _reverseSection(allTimeNuts, redeemable, balance) {
    if (redeemable <= 0) {
      return `
      <div class="ntk-divider"></div>
      <div class="ntk-reverse">
        <div class="ntk-reverse-title">🥜 CASH OUT NUTS</div>
        <div class="ntk-empty">${balance < RATE
          ? `Need at least ${RATE.toLocaleString()} NUTTOKENS to redeem a nut.`
          : 'No converted nuts left to cash out.'}</div>
      </div>`;
    }
    const def = Math.min(redeemable, REV_BATCH.nuts);
    return `
      <div class="ntk-divider"></div>
      <div class="ntk-reverse">
        <div class="ntk-reverse-title">🥜 CASH OUT NUTS</div>
        <div class="ntk-meta">
          <span>${redeemable.toLocaleString()} nuts redeemable</span>
          <span class="ntk-rate">${REV_BATCH.tokens.toLocaleString()} = ${REV_BATCH.nuts} nuts</span>
        </div>
        <div class="ntk-convert-row">
          <div class="ntk-input-wrap">
            <button class="ntk-adj" onclick="NutKens._adjustRevInput(-1)">−</button>
            <input class="ntk-input" id="ntkRevInput" type="number" min="1" max="${redeemable}"
              value="${def}" oninput="NutKens._previewRevConvert()">
            <button class="ntk-adj" onclick="NutKens._adjustRevInput(1)">+</button>
          </div>
          <button class="ntk-max-btn" onclick="NutKens._inputRevMax(${redeemable})">ALL</button>
        </div>
        <div class="ntk-preview ntk-preview-rev" id="ntkRevPreview">= ${(def * RATE).toLocaleString()} NUTTOKENS</div>
        <button class="ntk-redeem-btn" onclick="NutKens._doRevConvert(${allTimeNuts})">
          REDEEM NUTS
        </button>
      </div>`;
  }

  // ── Render the conversion panel UI ───────────────────────────────
  function renderPanel(allTimeNuts) {
    const el = document.getElementById('ntkConvertPanel');
    if (!el) return;
    const available  = getConvertible(allTimeNuts);
    const balance    = getBalance();
    const converted  = getTotalConverted();
    const redeemable = getRedeemableNuts();
    const chipsReady = window.StatLoad ? StatLoad.isChipsReady() : true;
    const balLabel   = chipsReady
      ? `${balance.toLocaleString()} NUTTOKENS`
      : (balance > 0 ? StatLoad.SPIN : '0 NUTTOKENS');

    el.innerHTML = `
      <div class="ntk-header">
        <span class="ntk-title">💎 NUTTOKENS</span>
        <span class="ntk-bal-pill">${balLabel}</span>
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
      ${_reverseSection(allTimeNuts, redeemable, balance)}
    `;
    if (typeof refreshNutFloat === 'function') refreshNutFloat();
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
    if (typeof refreshNutFloat === 'function') refreshNutFloat();
  }

  function _adjustRevInput(delta) {
    const el = document.getElementById('ntkRevInput');
    if (!el) return;
    el.value = Math.max(1, Math.min(parseInt(el.max, 10), (parseInt(el.value, 10) || 0) + delta));
    _previewRevConvert();
  }

  function _inputRevMax(max) {
    const el = document.getElementById('ntkRevInput');
    if (el) { el.value = max; _previewRevConvert(); }
  }

  function _previewRevConvert() {
    const inp  = document.getElementById('ntkRevInput');
    const prev = document.getElementById('ntkRevPreview');
    if (!inp || !prev) return;
    const n = Math.max(0, parseInt(inp.value, 10) || 0);
    prev.textContent = `= ${(n * RATE).toLocaleString()} NUTTOKENS`;
  }

  function _doRevConvert(allTimeNuts) {
    const inp = document.getElementById('ntkRevInput');
    const n   = inp ? Math.max(0, parseInt(inp.value, 10) || 0) : 0;
    const actual = convertBack(n);
    if (actual <= 0) { _showToast('Nothing to redeem'); return; }
    _showToast(`✅ Redeemed ${actual} nut${actual > 1 ? 's' : ''} ← ${(actual * RATE).toLocaleString()} NUTTOKENS`);
    renderPanel(allTimeNuts);
    if (typeof refreshNutFloat === 'function') refreshNutFloat();
  }

  function _showToast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  // ── Open casino ───────────────────────────────────────────────────
  function _casinoFrameUrl(tab) {
    return './casino-app.html' + (tab ? '#' + tab : '');
  }

  function _iframeHasCasino(frame) {
    try {
      const src = frame.getAttribute('src') || frame.src || '';
      return /casino-app\.html/i.test(src);
    } catch (_) {
      return false;
    }
  }

  function openCasino(tab) {
    const overlay = document.getElementById('casinoAppOverlay');
    const frame = document.getElementById('casinoAppFrame');
    if (!overlay || !frame) {
      if (typeof showToast === 'function') showToast('Casino unavailable');
      return;
    }

    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';

    const url = _casinoFrameUrl(tab);
    if (!_iframeHasCasino(frame)) {
      frame.src = url;
      return;
    }
    if (tab && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'casino:goto', tab }, '*');
    }
  }

  function closeCasino() {
    if (window.NutTutorial && NutTutorial.blockCasinoClose()) {
      if (typeof showToast === 'function') showToast('Spin once to finish the tutorial');
      return;
    }
    const overlay = document.getElementById('casinoAppOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
    // Refresh balance display after casino session
    if (typeof pmSetBalance === 'function') pmSetBalance(getBalance());
    if (typeof countAllTime !== 'undefined') renderPanel(countAllTime);
    if (typeof refreshNutFloat === 'function') refreshNutFloat();
  }

  // Listen for postMessage from casino iframe
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'casino:close') closeCasino();
    if (e.data && e.data.type === 'casino:balance') _setBalance(e.data.balance);
  });

  window.NutKens = {
    getBalance, getConvertible, getTotalConverted, getRedeemableNuts,
    convert, convertBack, renderPanel, openCasino, closeCasino, RATE, REV_BATCH,
    _adjustInput, _inputMax, _previewConvert, _doConvert,
    _adjustRevInput, _inputRevMax, _previewRevConvert, _doRevConvert,
  };

})();
