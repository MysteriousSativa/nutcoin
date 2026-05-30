/**
 * $NUT Chaos Engine — live events, community pump, earn multipliers
 */
(function () {
  const KEY_HISTORY = 'nut_chaos_history_v1';
  const KEY_CRASH   = 'nut_chaos_crash_v1';
  const KEY_LIQ     = 'nut_chaos_liq_display_v1';
  const KEY_PUMP_WIN = 'nut_chaos_pump_window_v1';

  const EVENTS = {
    nut_pump:      { label: 'NUT PUMP',       color: '#4EC97A', ms: 30 * 60000, earn: 2, roulette: 1, cls: 'evt-green' },
    golden_hour:   { label: 'GOLDEN HOUR',    color: '#FFD97D', ms: 15 * 60000, earn: 1, roulette: 2, cls: 'evt-green' },
    whale:         { label: 'WHALE ARRIVAL',  color: '#4E9AC9', ms: 20 * 60000, earn: 1, roulette: 1, cls: 'evt-green', whale: true },
    crew_wars:     { label: 'CREW WARS',      color: '#C8A96E', ms: 60 * 60000, earn: 1, roulette: 1, cls: 'evt-green', crew: true },
    bear_trap:     { label: 'BEAR TRAP',      color: '#C94E4E', ms: 20 * 60000, earn: 0.5, roulette: 1, cls: 'evt-red', invertLb: true },
    liquidation:   { label: 'LIQUIDATION HOUR', color: '#C94E4E', ms: 10 * 60000, earn: 1, roulette: 1, cls: 'evt-red', liq: true },
    nut_crash:     { label: 'NUT CRASH',      color: '#C94E4E', ms: 30 * 60000, earn: 1, roulette: 1, cls: 'evt-red', crash: true },
  };

  let current = null;
  let pollTimer = null;
  let communityIds = new Set();

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(KEY_HISTORY) || '[]') || []; } catch { return []; }
  }
  function saveHistory(h) {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(h.slice(0, 20)));
  }

  function startEvent(type, source) {
    const cfg = EVENTS[type];
    if (!cfg) return;
    const now = Date.now();
    current = { type, started: now, ends: now + cfg.ms, source: source || 'auto' };
    document.body.classList.add('chaos-active', cfg.cls);
    if (cfg.invertLb) document.body.classList.add('chaos-invert-lb');
    if (type === 'nut_pump') document.getElementById('tokenFloat')?.classList.add('evt-shimmer');
    if (cfg.liq) applyLiquidationDisplay();
    if (cfg.crash) applyCrash();
    renderBanner();
    playBlip();
    maybeNotify(cfg.label + ' is live');
    const hist = loadHistory();
    hist.unshift({ type, at: new Date(now).toISOString(), source: source || 'auto' });
    saveHistory(hist);
    renderHistory();
  }

  function endEvent() {
    if (!current) return;
    const cfg = EVENTS[current.type];
    if (cfg?.liq) clearLiquidationDisplay();
    if (cfg?.crash) maybeRecoverCrash();
    document.getElementById('tokenFloat')?.classList.remove('evt-shimmer');
    document.body.classList.remove('chaos-active', 'evt-green', 'evt-red', 'chaos-invert-lb');
    current = null;
    renderBanner();
  }

  function tickEvent() {
    if (!current) return;
    if (Date.now() >= current.ends) endEvent();
    else renderBanner();
  }

  function applyLiquidationDisplay() {
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    const pct = 0.1 + Math.random() * 0.2;
    const fake = Math.floor(bal * (1 - pct));
    localStorage.setItem(KEY_LIQ, JSON.stringify({ real: bal, fake, until: Date.now() + EVENTS.liquidation.ms }));
    if (typeof pmSetBalance === 'function') {
      const el = document.getElementById('pmBalFloat');
      if (el) el.textContent = fake.toLocaleString();
      el?.classList.add('liq-flash');
    }
  }

  function clearLiquidationDisplay() {
    const raw = localStorage.getItem(KEY_LIQ);
    if (!raw) return;
    localStorage.removeItem(KEY_LIQ);
    if (typeof pmSetBalance === 'function') pmSetBalance(typeof pmGetBalance === 'function' ? pmGetBalance() : 0);
    document.getElementById('pmBalFloat')?.classList.remove('liq-flash');
    if (typeof showToast === 'function') showToast('RECOVERED ✦');
  }

  function applyCrash() {
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    const half = Math.floor(bal / 2);
    localStorage.setItem(KEY_CRASH, JSON.stringify({ before: bal, after: half, at: Date.now() }));
    if (typeof pmSetBalance === 'function') pmSetBalance(half);
    if (typeof showToast === 'function') showToast('NUT CRASH: -50%. Log within 30m for recovery airdrop');
  }

  function maybeRecoverCrash() {
    const raw = localStorage.getItem(KEY_CRASH);
    if (!raw) return;
    localStorage.removeItem(KEY_CRASH);
  }

  function onNutLogged() {
    const crash = localStorage.getItem(KEY_CRASH);
    if (crash) {
      try {
        const c = JSON.parse(crash);
        if (Date.now() - c.at < 30 * 60000 && typeof pmSetBalance === 'function') {
          const bal = pmGetBalance();
          const bonus = Math.floor(c.before * 0.75);
          pmSetBalance(bal + bonus);
          localStorage.removeItem(KEY_CRASH);
          if (typeof showToast === 'function') showToast('Recovery airdrop: +' + bonus + ' NUTS');
        }
      } catch (_) {}
    }
    trackCommunityPump();
  }

  function trackCommunityPump() {
    const sid = typeof sessionId !== 'undefined' ? sessionId : 'local';
    communityIds.add(sid);
    const win = JSON.parse(localStorage.getItem(KEY_PUMP_WIN) || '[]');
    const now = Date.now();
    const recent = win.filter(t => now - t < 5 * 60000);
    recent.push(now);
    localStorage.setItem(KEY_PUMP_WIN, JSON.stringify(recent.slice(-30)));
    // count = recent log events + unique session IDs seen this page load
    const count = recent.length + communityIds.size;
    updatePumpBar(count);
    if (count >= 20 && !current) startEvent('nut_pump', 'community');
  }

  function updatePumpBar(n) {
    const el = document.getElementById('chaosPumpBar');
    if (!el) return;
    const capped = Math.min(Math.max(0, n), 20);
    const pct = (capped / 20) * 100;
    el.innerHTML = `<span class="pump-label">COMMUNITY PUMP</span>
      <div class="pump-track"><div class="pump-fill" style="width:${pct}%"></div></div>
      <span class="pump-count">${capped}/20</span>
      <span class="pump-hint">logs in 5 min fill the bar · triggers NUT PUMP</span>`;
    if (typeof updatePageHeaderHeight === 'function') updatePageHeaderHeight();
  }

  function initPumpBar() {
    try {
      const win = JSON.parse(localStorage.getItem(KEY_PUMP_WIN) || '[]');
      const now = Date.now();
      const recent = win.filter(t => now - t < 5 * 60000);
      updatePumpBar(recent.length + communityIds.size);
    } catch (_) {
      updatePumpBar(communityIds.size);
    }
  }

  function getEarnMultiplier() {
    if (!current) return 1;
    const cfg = EVENTS[current.type];
    return cfg?.earn || 1;
  }

  function getRouletteMultiplier() {
    if (!current) return 1;
    const cfg = EVENTS[current.type];
    return cfg?.roulette || 1;
  }

  function renderBanner() {
    const el = document.getElementById('chaosBanner');
    if (!el) return;
    if (!current) {
      el.classList.remove('show');
      el.innerHTML = '';
      return;
    }
    const cfg = EVENTS[current.type];
    const left = Math.max(0, current.ends - Date.now());
    const pct = 100 - (left / cfg.ms) * 100;
    const mins = Math.ceil(left / 60000);
    el.className = 'chaos-banner show ' + (cfg.cls || '');
    el.innerHTML = `
      <div class="chaos-inner">
        <span class="chaos-tag">${cfg.label}</span>
        <span class="chaos-msg">${esc(eventMessage(current.type))}</span>
        <span class="chaos-time">${mins}m left</span>
        <div class="chaos-bar"><div class="chaos-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
  }

  function eventMessage(type) {
    const map = {
      nut_pump: 'All NUTS earned doubled',
      golden_hour: 'Roulette payouts 2×',
      whale: 'Top method earns 3×',
      crew_wars: 'Crew totals decide the hour',
      bear_trap: 'Earn 0.5× · leaderboard inverted',
      liquidation: 'Display liquidation (cosmetic)',
      nut_crash: 'Log within 30m for recovery',
    };
    return map[type] || 'Chaos active';
  }

  function renderHistory() {
    const el = document.getElementById('lbEventHistory');
    if (!el) return;
    const hist = loadHistory();
    el.innerHTML = hist.length ? `
      <div class="evt-history-title">Event archive</div>
      ${hist.slice(0, 8).map(h => {
        const cfg = EVENTS[h.type] || { label: h.type };
        const d = new Date(h.at);
        return `<div class="evt-history-row"><span>${cfg.label}</span><span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>`;
      }).join('')}` : '';
  }

  function playBlip() {
    if (localStorage.getItem('nut_chaos_sound') === '0') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 440;
      g.gain.value = 0.04;
      o.start(); o.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  }

  function maybeNotify(title) {
    if (Notification.permission !== 'granted') return;
    try { new Notification('$NUT ' + title, { body: 'Open the site to play the event', icon: '/img/favicon.ico' }); } catch (_) {}
  }

  function askPush() {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    if (localStorage.getItem('nut_push_asked')) return;
    localStorage.setItem('nut_push_asked', '1');
    if (typeof showToast === 'function') showToast('Enable alerts for NUT PUMP? Check browser prompt');
    Notification.requestPermission();
  }

  async function pollSupabase() {
    if (typeof db === 'undefined' || !db) return;
    try {
      const { data, error } = await db.rpc('get_current_event');
      if (error || !data) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row || !row.event_type) return;
      if (current && current.type === row.event_type) return;
      startEvent(row.event_type, 'supabase');
    } catch (_) {}
  }

  function scheduleRandom() {
    if (current) return;
    // Checked every 10 minutes. Target cadence: ~2 events/day on average.
    // nut_pump: ~1/day, golden_hour: ~0.6/day, bear_trap: ~0.3/day, crash: ~0.1/day
    const roll = Math.random();
    if (roll < 0.0007) startEvent('nut_crash', 'random');       // ~1 per week
    else if (roll < 0.003) startEvent('nut_pump', 'random');    // ~1 per day
    else if (roll < 0.005) startEvent('golden_hour', 'random'); // ~0.7 per day
    else if (roll < 0.007) startEvent('bear_trap', 'random');   // ~0.5 per day
  }

  function onGlobalActivity(rows) {
    const now = Date.now();
    const recent = (rows || []).filter(r => now - new Date(r.created_at).getTime() < 5 * 60000);
    const unique = new Set(recent.map(r => r.session_id).filter(Boolean));
    updatePumpBar(unique.size);
    if (unique.size >= 20 && !current) startEvent('nut_pump', 'community');
  }

  function init() {
    renderBanner();
    renderHistory();
    initPumpBar();
    askPush();
    tickEvent();
    setInterval(tickEvent, 5000);
    setInterval(scheduleRandom, 600000);
    setInterval(pollSupabase, 30000);
    pollSupabase();
  }

  window.NutChaos = {
    init, onNutLogged, onGlobalActivity, getEarnMultiplier, getRouletteMultiplier,
    startEvent, renderHistory, isInvertLb: () => document.body.classList.contains('chaos-invert-lb'),
  };
})();
