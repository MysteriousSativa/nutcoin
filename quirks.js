/**
 * $NUT quirks — method gates, bonuses, social hooks, receipt extras.
 * Loaded after core state in index.html; uses shared globals.
 */
(function () {
  const KEY_HOME_TZ = 'nut_home_tz_v1';
  const KEY_SERIAL = 'nut_receipt_serial_v1';
  if (!localStorage.getItem(KEY_HOME_TZ)) {
    localStorage.setItem(KEY_HOME_TZ, Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  let globalTodayPrev = null;
  let globalUsersToday = 0;
  let globalSurgeUntil = 0;
  let lastActivityRows = [];
  let sessionMethodStreak = 0;
  let lastSessionMethod = null;

  function getHomeTimezone() {
    return localStorage.getItem(KEY_HOME_TZ) || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function getLocalTzParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      weekday: 'short',
      hour12: false,
    }).formatToParts(date);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const hour = parseInt(get('hour') || '0', 10);
    const wd = get('weekday') || 'Sun';
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { hour, day: dayMap[wd] ?? 0, weekday: wd };
  }

  function minutesSinceLastNut() {
    if (!lastClick) return Infinity;
    return (Date.now() - lastClick) / 60000;
  }

  function lastLogTodayEntry() {
    return todayLog.length ? todayLog[todayLog.length - 1] : null;
  }

  function globalSurgeActive() {
    return Date.now() < globalSurgeUntil;
  }

  function checkMethodGate(id, now = new Date()) {
    const tz = selectedTimezone;
    const { hour, day } = getLocalTzParts(now, tz);
    const mins = minutesSinceLastNut();
    const last = lastLogTodayEntry();

    switch (id) {
      case 'morning':
        if (hour >= 12) return { ok: false, reason: `Before 12pm in ${tzDisplayName(tz)}` };
        break;
      case 'hotel':
        if (tz === getHomeTimezone()) return { ok: false, reason: 'Pick a timezone away from home' };
        break;
      case 'sneaky':
        if (day >= 1 && day <= 5 && hour >= 9 && hour < 17) return { ok: false, reason: 'Not during 9–5 weekdays' };
        break;
      case 'round2':
        if (!todayLog.length) return { ok: false, reason: 'Log a first nut today' };
        if (mins < 30) return { ok: false, reason: `Round 2 in ${Math.ceil(30 - mins)}m` };
        break;
      case 'quickie':
        if (!lastClick || mins > 15) return { ok: false, reason: 'Within 15m of last nut' };
        break;
      case 'revenge':
        if (!last || logType(last) !== 'partner') return { ok: false, reason: 'Log Partnered first today' };
        break;
      case 'celebration':
        if (countToday < 2) return { ok: false, reason: 'Need 2+ nuts today first' };
        break;
      case 'partner':
        if (countAllTime < 3) return { ok: false, reason: 'Unlocks at 3 all-time nuts' };
        break;
      default:
        break;
    }
    return { ok: true, reason: '' };
  }

  function isMethodLocked(id) {
    return !checkMethodGate(id).ok;
  }

  function enforceValidSelection() {
    if (isMethodLocked(selectedNutType)) {
      selectedNutType = 'solo';
      localStorage.setItem('nut_method_selected_v1', selectedNutType);
    }
  }

  function calcNutPoints(typeId) {
    let pts = is2xNutType(typeId) ? 2 : 1;
    const last = lastLogTodayEntry();
    if (last && logType(last) !== typeId) pts += 1;
    if (typeId === 'stress' && globalSurgeActive()) pts += 1;
    const { hour } = getLocalTzParts(new Date(), selectedTimezone);
    if (typeId === 'solo' && hour >= 0 && hour < 5) pts += 1;
    return pts;
  }

  function nextReceiptSerial() {
    let n = parseInt(localStorage.getItem(KEY_SERIAL) || '4812', 10);
    n += 1;
    localStorage.setItem(KEY_SERIAL, String(n));
    return n;
  }

  function receiptVerifyHash(serial, date) {
    let h = 0;
    const s = `${serial}-${date}-${sessionId || 'x'}`;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return ('000000' + h.toString(16)).slice(-6).toUpperCase();
  }

  function getCouncilVerdict(typeId, pts) {
    const m = NUT_TYPES[typeId] || NUT_TYPES.solo;
    const { hour } = getLocalTzParts(new Date(), selectedTimezone);
    const surge = globalSurgeActive() ? ' Global surge active.' : '';
    if (typeId === 'morning') return `${m.em} Morning log sealed before noon.${surge}`;
    if (typeId === 'hotel') return `${m.em} Road nut logged off-home timezone.`;
    if (typeId === 'quickie') return `${m.em} Speed run. ${pts} pt${pts > 1 ? 's' : ''} on the board.`;
    if (typeId === 'round2') return `${m.em} Encore approved by the council.`;
    if (typeId === 'stress' && globalSurgeActive()) return `${m.em} Stress nut during global spike. +bonus.`;
    if (hour >= 0 && hour < 5) return `${m.em} Night shift nut at ${formatClockTime(new Date(), selectedTimezone)}.`;
    return `${m.em} ${m.label} · ${pts} pt${pts > 1 ? 's' : ''} · receipt #${localStorage.getItem(KEY_SERIAL) || '----'}`;
  }

  function getShareCopyByTime() {
    const { hour } = getLocalTzParts(new Date(), selectedTimezone);
    if (hour < 6) return 'confession hour nut receipt attached';
    if (hour < 12) return 'morning nut logged with paperwork';
    if (hour < 17) return 'afternoon nut disclosure';
    if (hour < 22) return 'evening nut receipt drop';
    return 'late night nut audit trail';
  }

  function detectActivitySurges(rows) {
    const now = Date.now();
    const recent = rows.filter((r) => now - new Date(r.created_at).getTime() < 5 * 60000);
    const byType = {};
    recent.forEach((r) => {
      const t = r.nut_type || 'solo';
      byType[t] = (byType[t] || 0) + 1;
    });
    return Object.entries(byType)
      .filter(([, c]) => c >= 3)
      .map(([t, c]) => ({ type: t, count: c }));
  }

  function usersTodayFromActivity(rows) {
    const day = typeof dateStr === 'string' ? dateStr : '';
    const ids = new Set();
    (rows || []).forEach((r) => {
      if (!r?.session_id || !r?.created_at) return;
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!day || key === day) ids.add(r.session_id);
    });
    return ids.size;
  }

  function renderQuirksStrip(globalToday, usersToday) {
    const compare = document.getElementById('quirksCompare');
    const live = document.getElementById('quirksLive');
    if (compare) {
      const gt = globalToday == null ? null : Number(globalToday) || 0;
      let users = usersToday != null ? Number(usersToday) || 0 : globalUsersToday;
      if (!users && gt > 0) users = usersTodayFromActivity(lastActivityRows);
      let globalSpan;
      if (gt === null) {
        globalSpan = 'Global <strong>…</strong> pts · loading';
      } else if (gt === 0) {
        globalSpan = 'Global <strong>0</strong> pts today';
      } else {
        const denom = Math.max(1, users);
        const avg = (gt / denom).toFixed(1);
        globalSpan = `Global <strong>${gt.toLocaleString()}</strong> pts · <strong>${avg}</strong> avg/user`;
      }
      compare.innerHTML = `<span class="qc-you">You <strong>${countToday}</strong> today</span><span class="qc-sep">·</span><span class="qc-global">${globalSpan}</span><span class="qc-sep">·</span><span class="qc-methods">Methods <strong>${uniqueMethodsToday()}</strong></span>`;
    }
    if (!live) return;
    const bits = [];
    if (globalSurgeActive()) bits.push('📉 Stress bonus hour — global spike');
    const surges = detectActivitySurges(lastActivityRows);
    surges.forEach((s) => {
      const m = NUT_TYPES[s.type] || { em: '🥜', label: s.type };
      bits.push(`${m.em} ${s.count} ${m.label} logs in 5m`);
    });
    const { hour } = getLocalTzParts(new Date(), selectedTimezone);
    if (currentStreak > 0 && hour >= 22 && countToday === 0) {
      bits.push(`🔥 Streak ${currentStreak} — log before midnight`);
    }
    if (sessionMethodStreak >= 3 && lastSessionMethod) {
      const m = NUT_TYPES[lastSessionMethod];
      bits.push(`${m?.em || '🥜'} ${sessionMethodStreak}× ${m?.label || lastSessionMethod} this session`);
    }
    live.innerHTML = bits.length
      ? bits.map((b) => `<span class="quirks-live-pill">${b}</span>`).join('')
      : '<span class="quirks-live-pill muted">Live rules active · pick a method</span>';
  }

  function renderLbGhost(rows) {
    const el = document.getElementById('lbGhost');
    if (!el || !rows?.length) return;
    const you = rows.find((r) => r.isYou || r.session_id === sessionId);
    if (!you) {
      el.textContent = 'Set a nickname to climb the board';
      return;
    }
    const idx = rows.findIndex((r) => r.session_id === you.session_id);
    if (idx <= 0) {
      el.textContent = idx === 0 ? 'You are #1 on the board' : '';
      return;
    }
    const above = rows[idx - 1];
    const need = Math.max(1, above.deeds - you.deeds + 1);
    el.textContent = `${need} pt${need > 1 ? 's' : ''} to pass ${above.nickname}`;
  }

  function onGlobalCounts(today, usersToday) {
    if (globalTodayPrev !== null && today - globalTodayPrev >= 5) {
      globalSurgeUntil = Date.now() + 10 * 60 * 1000;
    }
    globalTodayPrev = today;
    if (usersToday != null) globalUsersToday = Number(usersToday) || 0;
    renderQuirksStrip(today, globalUsersToday);
  }

  function onGlobalActivity(data) {
    lastActivityRows = data || [];
    const fromFeed = usersTodayFromActivity(lastActivityRows);
    if (fromFeed > globalUsersToday) globalUsersToday = fromFeed;
    renderQuirksStrip(globalTodayPrev, globalUsersToday);
  }

  function onNutLogged(method, pts) {
    if (method === lastSessionMethod) sessionMethodStreak += 1;
    else {
      lastSessionMethod = method;
      sessionMethodStreak = 1;
    }
    nextReceiptSerial();
    renderQuirksStrip(globalTodayPrev);
  }

  function patchMethodUI() {
    enforceValidSelection();
    const grid = document.getElementById('nutMethodGrid');
    if (!grid) return;
    grid.innerHTML = Object.entries(NUT_TYPES)
      .map(([id, m]) => {
        const locked = isMethodLocked(id);
        const pulse = is2xNutType(id) ? ' is-2x pulse-2x' : '';
        return `<button type="button" class="nut-method-chip${id === selectedNutType ? ' active' : ''}${pulse}${locked ? ' is-locked' : ''}" data-type="${id}" title="${locked ? checkMethodGate(id).reason : ''}" onclick="selectNutType('${id}')"${locked ? ' disabled' : ''}><span class="em">${m.em}</span>${m.label}</button>`;
      })
      .join('');
    renderBonusHour();
    updateMethodAttachPreview(selectedNutType);
  }

  function patchSelectNutType(id) {
    if (!NUT_TYPES[id]) return false;
    const gate = checkMethodGate(id);
    if (!gate.ok) {
      showToast(`${NUT_TYPES[id].em} ${gate.reason}`);
      return false;
    }
    selectedNutType = id;
    localStorage.setItem('nut_method_selected_v1', id);
    patchMethodUI();
    return true;
  }

  function patchNutGate(method) {
    const gate = checkMethodGate(method);
    if (!gate.ok) {
      showToast(`${NUT_TYPES[method].em} ${gate.reason}`);
      patchMethodUI();
      return false;
    }
    return true;
  }

  function patchAttachPreview(id) {
    const el = document.getElementById('methodAttachPreview');
    const m = NUT_TYPES[id] || NUT_TYPES.solo;
    const gate = checkMethodGate(id);
    const pts = calcNutPoints(id);
    if (!gate.ok) {
      if (el) el.innerHTML = `${m.em} <strong>Locked</strong> · ${gate.reason}`;
      return;
    }
    const tags = [];
    if (is2xNutType(id)) tags.push('<strong>2× hour</strong>');
    if (globalSurgeActive() && id === 'stress') tags.push('<strong>surge +1</strong>');
    if (lastLogTodayEntry() && logType(lastLogTodayEntry()) !== id) tags.push('<strong>variety +1</strong>');
    const { hour } = getLocalTzParts(new Date(), selectedTimezone);
    if (id === 'solo' && hour < 5) tags.push('<strong>night +1</strong>');
    if (el) {
      el.innerHTML = `${m.em} ${m.label} · ${pts} pt${pts > 1 ? 's' : ''}${tags.length ? ' · ' + tags.join(' · ') : ''}`;
    }
  }

  function extraReceiptFields() {
    const serial = parseInt(localStorage.getItem(KEY_SERIAL) || '4812', 10);
    const tzTime = formatClockTime(new Date(), selectedTimezone);
    return {
      serial,
      verifyHash: receiptVerifyHash(serial, dateStr),
      tzStamp: `Verified ${tzTime} ${tzDisplayName(selectedTimezone)}`,
      shareMood: getShareCopyByTime(),
    };
  }

  function patchProphecy() {
    if (countAllTime === 0) return;
    const ct = countTypesToday();
    const topKey = Object.keys(ct).sort((a, b) => ct[b] - ct[a])[0] || 'solo';
    const top = NUT_TYPES[topKey];
    const el = document.getElementById('prophecyText');
    const omen = document.getElementById('prophecyOmen');
    if (el) {
      el.textContent = `"Top method today: ${top.em} ${top.label}. The council sees ${countToday} pts and ${uniqueMethodsToday()} styles."`;
    }
    if (omen) {
      omen.textContent = globalSurgeActive() ? '📉 omen: stress bonus live' : getShareCopyByTime();
    }
  }

  function patchFlameDim(cfg, streak) {
    if (streak <= 0) return cfg;
    const { hour } = getLocalTzParts(new Date(), selectedTimezone);
    if (hour >= 0 && hour < 6 && countToday === 0) {
      return { ...cfg, c: '#5a5040', tier: 'Streak at risk — log today to keep the flame.', sub: 'You only get credit for nuts you log' };
    }
    return cfg;
  }

  window.NutQuirks = {
    calcNutPoints,
    checkMethodGate,
    isMethodLocked,
    enforceValidSelection,
    patchMethodUI,
    patchSelectNutType,
    patchNutGate,
    patchAttachPreview,
    getCouncilVerdict,
    extraReceiptFields,
    getShareCopyByTime,
    onGlobalCounts,
    onGlobalActivity,
    onNutLogged,
    renderQuirksStrip,
    renderLbGhost,
    patchProphecy,
    patchFlameDim,
  };
})();
