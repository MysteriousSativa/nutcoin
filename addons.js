/**
 * $NUT Addons — Passport, Duels, Pulse, Bounties, Radio, Crew, Oracle, Genesis, Debrief
 * Uses globals from index.html (localStorage-first, Supabase optional)
 */
(function () {
  const KEY_PASSPORT = 'nut_passport_v1';
  const KEY_DUEL     = 'nut_duel_v1';
  const KEY_BOUNTIES = 'nut_bounties_v1';
  const KEY_CREW     = 'nut_crew_v1';
  const KEY_ORACLE   = 'nut_oracle_v1';
  const KEY_STAMPS   = 'nut_stamps_v1';
  const KEY_GENESIS  = 'nut_genesis_seen_v1';
  const KEY_BIO      = 'nut_bio_v1';
  const KEY_AVATAR   = 'nut_avatar_v1';

  // 32 avatar images via DiceBear (pixel-art · bottts · adventurer)
  const AV_URLS = [
    // pixel-art characters (0–11)
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutDegen&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutChad&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutWagmi&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutMoon&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutDiamond&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutApe&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutBull&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutBear&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutWhale&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutFren&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutAlpha&size=64',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=NutSigma&size=64',
    // bottts robots (12–23)
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot1&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot2&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot3&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot4&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot5&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot6&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot7&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot8&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot9&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot10&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot11&size=64',
    'https://api.dicebear.com/9.x/bottts/svg?seed=NutBot12&size=64',
    // adventurer characters (24–31)
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv1&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv2&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv3&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv4&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv5&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv6&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv7&size=64',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=NutAdv8&size=64',
  ];

  function avHash(sid) {
    let h = 5381;
    for (let i = 0; i < (sid||'').length; i++) h = ((h * 33) ^ sid.charCodeAt(i)) & 0x7fffffff;
    return h;
  }
  function avIdxForSid(sid) { return avHash(sid) % AV_URLS.length; }

  function getAvatarFor(sid) {
    const mySid = typeof sessionId !== 'undefined' ? sessionId : null;
    if (sid && sid === mySid) {
      const s = loadJson(KEY_AVATAR, null);
      if (s && typeof s.idx === 'number') return { idx: s.idx, url: AV_URLS[s.idx] };
    }
    const idx = avIdxForSid(sid);
    return { idx, url: AV_URLS[idx] };
  }
  function getMyAvatar() {
    const s = loadJson(KEY_AVATAR, null);
    if (s && typeof s.idx === 'number') return { idx: s.idx, url: AV_URLS[s.idx] };
    const sid = typeof sessionId !== 'undefined' ? sessionId : 'anon';
    const idx = avIdxForSid(sid);
    return { idx, url: AV_URLS[idx] };
  }

  let hubTab = 'passport';
  let lastActivity = [];
  let globalToday = 0;
  let pulseHours = 24;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  }
  function saveJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // ── Receipt tier ─────────────────────────────────────────────
  function getReceiptTier() {
    const streak = typeof currentStreak !== 'undefined' ? currentStreak : 0;
    const all = typeof countAllTime !== 'undefined' ? countAllTime : 0;
    const variety = typeof uniqueMethodsToday === 'function' ? uniqueMethodsToday() : 0;
    const genesis = isGenesisActive();
    if (genesis) return { id: 'genesis', label: 'GENESIS', border: '#FFD97D', glow: 'rgba(255,217,125,0.45)' };
    if (all >= 100 || streak >= 14) return { id: 'void', label: 'VOID BLACK', border: '#888', glow: 'rgba(120,120,140,0.35)' };
    if (all >= 50 || streak >= 7) return { id: 'holo', label: 'HOLOGRAPHIC', border: '#aabbff', glow: 'rgba(170,187,255,0.35)' };
    if (all >= 10 || variety >= 4) return { id: 'foil', label: 'FOIL', border: '#C8A96E', glow: 'rgba(200,169,110,0.35)' };
    return { id: 'paper', label: 'PAPER', border: 'rgba(200,169,110,0.35)', glow: 'transparent' };
  }

  function isGenesisActive() {
    return !!(typeof CONTRACT_ADDR !== 'undefined' && CONTRACT_ADDR);
  }

  function applyGenesisMode() {
    if (!isGenesisActive()) return;
    document.body.classList.add('genesis-mode');
    const badge = document.getElementById('launchBadge');
    if (badge) { badge.textContent = 'GENESIS ERA · LIVE'; badge.classList.add('live'); }
    if (!localStorage.getItem(KEY_GENESIS)) {
      localStorage.setItem(KEY_GENESIS, String(Date.now()));
      addStamp('genesis', 'Genesis Era');
      if (typeof showToast === 'function') showToast('Genesis Era activated ✦');
    }
  }

  // ── Stamps ─────────────────────────────────────────────────
  function getStamps() {
    return loadJson(KEY_STAMPS, []);
  }
  function addStamp(id, label) {
    const stamps = getStamps();
    if (stamps.some(s => s.id === id)) return;
    stamps.push({ id, label, at: new Date().toISOString().slice(0, 10) });
    saveJson(KEY_STAMPS, stamps);
  }

  // ── Passport ───────────────────────────────────────────────
  function getPassportData() {
    const ct = typeof countTypesToday === 'function' ? countTypesToday() : {};
    const top = Object.keys(ct).sort((a, b) => ct[b] - ct[a]).slice(0, 3);
    const methods = top.map(k => {
      const m = (typeof NUT_TYPES !== 'undefined' && NUT_TYPES[k]) || { em: '🥜', label: k };
      return `${m.em} ${m.label} (${ct[k]})`;
    });
    const serial = parseInt(localStorage.getItem('nut_receipt_serial_v1') || '4812', 10);
    return {
      name: typeof nickname !== 'undefined' && nickname ? nickname : 'Anonymous',
      since: loadJson(KEY_PASSPORT, {}).since || (typeof dateStr !== 'undefined' ? dateStr : '—'),
      tz: typeof selectedTimezone !== 'undefined' ? selectedTimezone : 'UTC',
      today: typeof countToday !== 'undefined' ? countToday : 0,
      allTime: typeof countAllTime !== 'undefined' ? countAllTime : 0,
      streak: typeof currentStreak !== 'undefined' ? currentStreak : 0,
      crew: localStorage.getItem(KEY_CREW) || '—',
      tier: getReceiptTier().label,
      serial,
      methods: methods.length ? methods : ['—'],
      stamps: getStamps(),
    };
  }

  function renderPassport() {
    const el = document.getElementById('hubPassport');
    if (!el) return;
    const p = getPassportData();
    if (!loadJson(KEY_PASSPORT, {}).since) saveJson(KEY_PASSPORT, { since: typeof dateStr !== 'undefined' ? dateStr : '' });
    const bio = localStorage.getItem(KEY_BIO) || '';
    const av  = getMyAvatar();
    const mrzName = (p.name.toUpperCase().replace(/\s+/g, '<') + '<<<<<<<<<<<<<<<<<<<<').slice(0, 22);
    const mrzLine1 = `P<NUT${mrzName}`;
    const mrzLine2 = `${String(p.serial).padStart(9,'0')}NUT${(p.since || '000000').replace(/-/g,'').slice(2,8)}<${String(p.allTime).padStart(9,'0')}`;
    el.innerHTML = `
      <div class="pv2">
        <div class="pv2-hdr">
          <div>
            <div class="pv2-country">REPUBLIC OF NUT</div>
            <div class="pv2-doc">NUT PASSPORT</div>
          </div>
          <div class="pv2-serial">#${String(p.serial).padStart(6,'0')}</div>
        </div>
        <div class="pv2-mid">
          <div class="pv2-photo-col">
            <div class="pv2-avatar"><img src="${av.url}" alt="avatar" /></div>
            <div class="pv2-tier">${esc(p.tier)}</div>
            <button class="pv2-av-btn" onclick="NutAddons.openAvatarPicker()">edit</button>
          </div>
          <div class="pv2-fields">
            <div class="pv2-field"><span class="pv2-lbl">NAME</span><span class="pv2-val">${esc(p.name)}</span></div>
            <div class="pv2-field"><span class="pv2-lbl">SINCE</span><span class="pv2-val">${esc(p.since)}</span></div>
            <div class="pv2-field"><span class="pv2-lbl">CREW</span><span class="pv2-val">${esc(p.crew)}</span></div>
            <div class="pv2-field"><span class="pv2-lbl">TZ</span><span class="pv2-val">${esc(tzDisplayName(p.tz))}</span></div>
          </div>
        </div>
        <div class="pv2-bio-wrap">
          <div class="pv2-bio-text" id="pv2BioDisplay">${bio ? `&ldquo;${esc(bio)}&rdquo;` : '<span class="pv2-bio-empty">no bio · tell the world who you are</span>'}</div>
          <button class="pv2-bio-edit" id="pv2BioBtn" onclick="NutAddons.editBio()">edit bio</button>
        </div>
        <div class="pv2-stats">
          <div class="pv2-stat"><div class="pv2-stat-n">${p.today}</div><div class="pv2-stat-l">TODAY</div></div>
          <div class="pv2-divider"></div>
          <div class="pv2-stat"><div class="pv2-stat-n">${p.allTime}</div><div class="pv2-stat-l">ALL TIME</div></div>
          <div class="pv2-divider"></div>
          <div class="pv2-stat"><div class="pv2-stat-n">${p.streak}</div><div class="pv2-stat-l">STREAK</div></div>
        </div>
        <div class="passport-methods" style="padding:10px 14px 0">${p.methods.map(m => `<span class="passport-chip">${esc(m)}</span>`).join('')}</div>
        <div class="passport-stamps" style="padding:8px 14px">${p.stamps.length ? p.stamps.map(s => `<span class="stamp" title="${esc(s.at)}">${esc(s.label)}</span>`).join('') : '<span class="passport-muted">no stamps yet · keep logging</span>'}</div>
        <div class="pv2-mrz">${esc(mrzLine1)}<br>${esc(mrzLine2)}</div>
        <div class="hub-actions" style="padding:10px 14px">
          <button type="button" class="hub-btn" onclick="NutAddons.copyPassport()">Copy flex</button>
          <button type="button" class="hub-btn ghost" onclick="openCertificate()">Receipt</button>
        </div>
      </div>
      <div class="avatar-picker" id="avatarPicker" style="display:none">
        <div class="avatar-picker-title">CHOOSE YOUR AVATAR</div>
        <div class="avatar-img-grid" id="avatarImgGrid"></div>
        <div style="text-align:center;margin-top:10px">
          <button class="hub-btn" onclick="NutAddons.closeAvatarPicker()">Done</button>
        </div>
      </div>`;
  }

  function openAvatarPicker() {
    const picker = document.getElementById('avatarPicker');
    if (!picker) return;
    picker.style.display = 'block';
    const av   = getMyAvatar();
    const grid = document.getElementById('avatarImgGrid');
    if (grid) grid.innerHTML = AV_URLS.map((url, i) =>
      `<button class="av-item${av.idx===i?' selected':''}" onclick="NutAddons.pickAvatar(${i})" title="Avatar ${i+1}">
        <img src="${url}" alt="avatar ${i+1}" />
      </button>`
    ).join('');
  }

  function closeAvatarPicker() {
    const picker = document.getElementById('avatarPicker');
    if (picker) picker.style.display = 'none';
  }

  function pickAvatar(idx) {
    saveJson(KEY_AVATAR, { idx });
    renderPassport();
    openAvatarPicker();
  }

  function editBio() {
    const bioDisplay = document.getElementById('pv2BioDisplay');
    const bioBtn     = document.getElementById('pv2BioBtn');
    if (!bioDisplay || !bioBtn) return;
    const bio = localStorage.getItem(KEY_BIO) || '';
    bioDisplay.innerHTML = `<input class="pv2-bio-input" id="pv2BioInput" maxlength="100" value="${esc(bio)}" placeholder="tell the world who you are..." />`;
    bioBtn.textContent = 'save';
    bioBtn.onclick = () => NutAddons.saveBio();
    const inp = document.getElementById('pv2BioInput');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }

  function saveBio() {
    const inp = document.getElementById('pv2BioInput');
    if (!inp) return;
    localStorage.setItem(KEY_BIO, inp.value.trim().slice(0, 100));
    renderPassport();
    if (typeof showToast === 'function') showToast('Bio saved ✦');
  }

  function copyPassport() {
    const p   = getPassportData();
    const bio = localStorage.getItem(KEY_BIO) || '';
    const text = `$NUT Passport · ${p.name}${bio ? `\n"${bio}"` : ''}\nToday: ${p.today} · All-time: ${p.allTime} · Streak: ${p.streak}\nTier: ${p.tier} · Crew: ${p.crew}\n${typeof SITE_URL !== 'undefined' ? SITE_URL : ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    if (typeof showToast === 'function') showToast('Passport copied ✦');
  }

  // ── Duels ──────────────────────────────────────────────────
  function parseDuelFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const rival = params.get('duel') || params.get('rival');
    if (!rival) return null;
    return { rival: decodeURIComponent(rival), target: parseInt(params.get('pts') || '0', 10) || 0 };
  }

  function createDuelLink() {
    const name = (typeof nickname !== 'undefined' && nickname) ? nickname : `Anon`;
    const url = `${window.location.origin}${window.location.pathname}?duel=${encodeURIComponent(name)}&pts=${countToday || 0}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    if (typeof showToast === 'function') showToast('Duel link copied ✦');
  }

  function renderDuel() {
    const el = document.getElementById('hubDuel');
    if (!el) return;
    const incoming = parseDuelFromUrl();
    const st = loadJson(KEY_DUEL, { active: null, wins: 0, losses: 0 });
    if (incoming && !st.active) {
      st.active = { rival: incoming.rival, target: incoming.target, started: dateStr, myStart: countToday || 0 };
      saveJson(KEY_DUEL, st);
    }
    const active = st.active;
    let html = `<div class="duel-box">`;
    if (active && active.started === dateStr) {
      const myGain = (countToday || 0) - (active.myStart || 0);
      const need = Math.max(1, (active.target || 0) - (active.myStart || 0) + 1);
      const winning = myGain >= need;
      html += `<div class="duel-title">Duel vs <strong>${esc(active.rival)}</strong></div>
        <div class="duel-scores"><span>You +${myGain}</span><span>Need +${need} to win</span></div>
        <div class="duel-status ${winning ? 'win' : ''}">${winning ? 'Winning' : 'Losing'} (24h window)</div>`;
    } else {
      html += `<div class="duel-title">Start a duel</div>
        <div class="passport-muted">Share a link. They open it and try to beat your today score.</div>`;
    }
    html += `<div class="hub-actions">
      <button type="button" class="hub-btn" onclick="NutAddons.createDuelLink()">Copy duel link</button>
      <button type="button" class="hub-btn ghost" onclick="NutAddons.clearDuel()">Clear duel</button>
    </div>
    <div class="passport-muted">Record: ${st.wins}W · ${st.losses}L</div></div>`;
    el.innerHTML = html;
  }

  function clearDuel() {
    saveJson(KEY_DUEL, { active: null, wins: 0, losses: 0 });
    renderDuel();
  }

  function checkDuelEndOfDay() {
    const st = loadJson(KEY_DUEL, {});
    if (!st.active || st.active.started !== dateStr) return;
    const myGain = (countToday || 0) - (st.active.myStart || 0);
    const need = Math.max(1, (st.active.target || 0) - (st.active.myStart || 0) + 1);
    if (myGain >= need) { st.wins = (st.wins || 0) + 1; addStamp('duel_win', 'Duel Win'); }
    else { st.losses = (st.losses || 0) + 1; }
    st.active = null;
    saveJson(KEY_DUEL, st);
  }

  // ── Pulse ──────────────────────────────────────────────────
  const PULSE_REGIONS = [
    { id: 'asia', label: 'Asia', hours: [0, 1, 2, 3, 4, 5] },
    { id: 'europe', label: 'Europe', hours: [6, 7, 8, 9, 10, 11] },
    { id: 'americas', label: 'Americas', hours: [12, 13, 14, 15, 16, 17] },
    { id: 'oceania', label: 'Oceania', hours: [18, 19, 20, 21, 22, 23] },
  ];

  function activityRowsForPulse() {
    if (lastActivity.length) return lastActivity;
    if (typeof todayLog === 'undefined' || !todayLog.length) return [];
    const base = new Date();
    return todayLog.map((e, i) => {
      const [hh, mm, ss] = (e.t || '12:00:00').split(':').map(Number);
      const d = new Date(base);
      d.setHours(hh || 0, mm || 0, ss || 0, 0);
      return { created_at: d.toISOString(), nut_type: e.type, nickname: typeof nickname !== 'undefined' ? nickname : null, session_id: typeof sessionId !== 'undefined' ? sessionId : 'local' };
    });
  }

  function renderPulse() {
    const el = document.getElementById('hubPulse');
    if (!el) return;
    const now = Date.now();
    const rows = activityRowsForPulse();
    const recent = rows.filter(r => now - new Date(r.created_at).getTime() < pulseHours * 3600000);
    const byRegion = PULSE_REGIONS.map(reg => {
      let count = 0;
      const typeCounts = {};
      recent.forEach(r => {
        const h = new Date(r.created_at).getUTCHours();
        if (!reg.hours.includes(h)) return;
        count++;
        const ty = r.nut_type || 'solo';
        typeCounts[ty] = (typeCounts[ty] || 0) + 1;
      });
      const topType = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])[0] || 'solo';
      const m = (typeof NUT_TYPES !== 'undefined' && NUT_TYPES[topType]) || { em: '🥜' };
      const intensity = Math.min(100, count * 15);
      return { ...reg, count, intensity, em: m.em };
    });
    el.innerHTML = `
      <div class="pulse-grid">${byRegion.map(r => `
        <div class="pulse-cell" style="--pulse:${r.intensity}%">
          <div class="pulse-glow"></div>
          <div class="pulse-label">${esc(r.label)}</div>
          <div class="pulse-count">${r.count} / 24h</div>
          <div class="pulse-type">${r.em} leading</div>
        </div>`).join('')}
      </div>
      <div class="passport-muted" style="margin:10px 0 6px;">Window: <strong>${pulseHours}h</strong></div>
      <input type="range" min="1" max="24" value="${pulseHours}" style="width:100%;accent-color:#C8A96E" oninput="NutAddons.setPulseHours(this.value)" />
      <div class="passport-muted">Global today: <strong>${globalToday.toLocaleString()}</strong> pts · your TZ: ${esc(tzDisplayName(selectedTimezone))}</div>`;
  }

  function setPulseHours(h) {
    pulseHours = Math.max(1, Math.min(24, parseInt(h, 10) || 24));
    renderPulse();
  }

  // ── Bounties ───────────────────────────────────────────────
  function loggedBeforeTenAm() {
    if (typeof todayLog === 'undefined' || !todayLog.length) return false;
    return todayLog.some(e => {
      const h = parseInt((e.t || '23:59:59').split(':')[0], 10);
      return h < 10;
    });
  }

  function getDailyBounties() {
    return [
      { id: 'b_am', label: 'Log before 10am', check: () => loggedBeforeTenAm() },
      { id: 'b_variety', label: '3 methods today', check: () => uniqueMethodsToday() >= 3 },
      { id: 'b_2x', label: 'Log a 2× method', check: () => typeof todayLog !== 'undefined' && todayLog.some(e => (typeof logPts === 'function' ? logPts(e) : e.pts || 1) > 1) },
    ];
  }

  function renderBounties() {
    const el = document.getElementById('hubBounties');
    if (!el) return;
    const st = loadJson(KEY_BOUNTIES, { claimed: {}, day: '' });
    if (st.day !== dateStr) { st.claimed = {}; st.day = dateStr; saveJson(KEY_BOUNTIES, st); }
    const bounties = getDailyBounties();
    el.innerHTML = bounties.map(b => {
      const done = b.check();
      const claimed = !!st.claimed[b.id];
      return `<div class="bounty-row ${done ? 'done' : ''}">
        <span>${esc(b.label)}</span>
        <button type="button" class="hub-btn small" ${done && !claimed ? '' : 'disabled'} onclick="NutAddons.claimBounty('${b.id}')">${claimed ? 'Claimed' : done ? 'Claim +5' : 'Locked'}</button>
      </div>`;
    }).join('') + `<div class="passport-muted">Complete all for bounty receipt stamp.</div>`;
  }

  function claimBounty(id) {
    const st = loadJson(KEY_BOUNTIES, { claimed: {}, day: dateStr });
    if (st.claimed[id]) return;
    st.claimed[id] = true;
    saveJson(KEY_BOUNTIES, st);
    if (typeof pmEarnTokens === 'function') pmEarnTokens(5);
    const st2 = loadJson(KEY_BOUNTIES, { claimed: {}, day: dateStr });
    if (getDailyBounties().every(b => b.check()) && Object.keys(st2.claimed).length >= 3) addStamp('bounty', 'Bounty Board');
    renderBounties();
    if (typeof showToast === 'function') showToast('+5 tokens ✦');
  }

  // ── Crew ───────────────────────────────────────────────────
  function renderCrew() {
    const el = document.getElementById('hubCrew');
    if (!el) return;
    const crew = (localStorage.getItem(KEY_CREW) || '').toUpperCase().slice(0, 4);
    el.innerHTML = `
      <div class="crew-box">
        <label class="passport-muted">Crew tag (4 chars)</label>
        <div class="crew-row">
          <input id="crewInput" maxlength="4" value="${esc(crew)}" placeholder="NUTS" class="crew-input"/>
          <button type="button" class="hub-btn" onclick="NutAddons.saveCrew()">Save</button>
        </div>
        <div class="passport-muted">Crew pts today: <strong>${countToday || 0}</strong> (local only until Supabase crew RPC)</div>
      </div>`;
  }

  function saveCrew() {
    const inp = document.getElementById('crewInput');
    const tag = (inp?.value || '').trim().toUpperCase().slice(0, 4);
    if (!tag) return;
    localStorage.setItem(KEY_CREW, tag);
    addStamp('crew', `Crew ${tag}`);
    renderCrew();
    renderPassport();
    if (typeof showToast === 'function') showToast(`Crew ${tag} saved ✦`);
  }

  // ── Oracle game (daily 3 picks) ────────────────────────────
  function getOraclePicks() {
    const day = dateStr;
    const st = loadJson(KEY_ORACLE, { day, picks: {}, scored: false });
    if (st.day !== day) return { day, picks: {}, scored: false };
    return st;
  }

  function renderOracle() {
    const el = document.getElementById('hubOracle');
    if (!el) return;
    const questions = [
      { id: 'o_log', q: 'You will log before noon', resolve: () => getLocalHourInTimezone(new Date(), selectedTimezone) < 12 ? countToday >= 1 : null },
      { id: 'o_var', q: 'You will use 2+ methods today', resolve: () => uniqueMethodsToday() >= 2 },
      { id: 'o_pts', q: 'You will hit 5+ pts today', resolve: () => countToday >= 5 },
    ];
    const st = getOraclePicks();
    el.innerHTML = questions.map(q => {
      const pick = st.picks[q.id];
      return `<div class="oracle-row">
        <div class="oracle-q">${esc(q.q)}</div>
        <div class="hub-actions">
          <button type="button" class="hub-btn small ${pick === 'yes' ? 'active' : ''}" onclick="NutAddons.oraclePick('${q.id}','yes')">Yes</button>
          <button type="button" class="hub-btn small ghost ${pick === 'no' ? 'active' : ''}" onclick="NutAddons.oraclePick('${q.id}','no')">No</button>
        </div>
      </div>`;
    }).join('') + `<button type="button" class="hub-btn" style="margin-top:10px;width:100%" onclick="NutAddons.scoreOracle()">Score oracle (end of day)</button>`;
  }

  function oraclePick(id, val) {
    const st = getOraclePicks();
    st.picks[id] = val;
    saveJson(KEY_ORACLE, st);
    renderOracle();
  }

  function scoreOracle() {
    const questions = [
      { id: 'o_log', resolve: () => countToday >= 1 },
      { id: 'o_var', resolve: () => uniqueMethodsToday() >= 2 },
      { id: 'o_pts', resolve: () => countToday >= 5 },
    ];
    const st = getOraclePicks();
    let score = 0;
    questions.forEach(q => {
      const actual = q.resolve() ? 'yes' : 'no';
      if (st.picks[q.id] === actual) score++;
    });
    if (score === 3) {
      addStamp('oracle', 'Oracle Slayer');
      if (typeof pmEarnTokens === 'function') pmEarnTokens(10);
    }
    st.scored = true;
    saveJson(KEY_ORACLE, st);
    if (typeof showToast === 'function') showToast(`Oracle score: ${score}/3`);
    renderOracle();
  }

  // ── Hub tabs ───────────────────────────────────────────────
  function switchHubTab(tab) {
    hubTab = tab;
    document.querySelectorAll('.hub-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.hub-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
    renderAll();
  }

  function renderAll() {
    renderPassport();
    renderDuel();
    renderPulse();
    renderBounties();
    renderCrew();
    renderOracle();
  }

  function onNutLogged(method, pts) {
    if (countToday === pts) addStamp('first', 'First Log');
    if (countToday >= 10) addStamp('ten', '10 Pt Day');
    if (countToday >= 69) addStamp('nice', 'Nice.');
    renderAll();
  }

  function onGlobalActivity(rows) {
    lastActivity = rows || [];
    renderPulse();
  }

  function onGlobalCounts(today) {
    globalToday = today || 0;
    renderPulse();
  }

  function init() {
    applyGenesisMode();
    parseDuelFromUrl();
    document.querySelectorAll('.hub-tab').forEach(btn => {
      btn.addEventListener('click', () => switchHubTab(btn.dataset.tab));
    });
    renderAll();
  }

  window.NutAddons = {
    init,
    onNutLogged,
    onGlobalActivity,
    onGlobalCounts,
    getReceiptTier,
    getPassportData,
    copyPassport,
    createDuelLink,
    clearDuel,
    claimBounty,
    saveCrew,
    oraclePick,
    scoreOracle,
    switchHubTab,
    renderAll,
    setPulseHours,
    openAvatarPicker,
    closeAvatarPicker,
    pickAvatar,
    editBio,
    saveBio,
    getAvatarFor,
  };
})();
