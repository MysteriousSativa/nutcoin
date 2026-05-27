/**
 * $NUT Community Engine — 300 NPC Profiles, Live Activity, Duels
 * Fully client-side, deterministic. No server needed.
 */
(function () {

  // ── SEEDED HASH ─────────────────────────────────────────────────
  function h32(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++)
      h = (Math.imul(h ^ s.charCodeAt(i), 16777619)) >>> 0;
    return h;
  }
  function frac(s) { return (h32(s) >>> 0) / 4294967296; }

  // ── NAME GENERATION ─────────────────────────────────────────────
  const ADJ  = ['Big','Huge','Based','Cursed','Famous','Legendary','Actual','Real',
    'Certified','Dedicated','Veteran','Smooth','Galaxy','Night','Secret','Absolute',
    'Midnight','Daily','Chronic','Frequent','Prolific','Committed','Serious',
    'Turbo','Ultra','Giga','Mega','Local','Global'];
  const NOUN = ['Nut','Chad','Degen','Lurker','Brain','Lord','King','Sigma',
    'Wizard','Warrior','Hunter','Counter','Logger','Tracker','Enjoyer','Bro',
    'Operator','Participant','Contributor','Researcher','Analyst','Poster',
    'Commenter','Lurker','Observer','Verifier'];
  const THROW = ['throwaway','temp','burner','anon','notme','rando','lurker',
    'nobody','passerby','justhere','account','realaccount','actuallyreal',
    'notarobot','definitelynotme','totallynotburner'];
  const FIRST = ['Mike','Jake','Tyler','Ryan','Matt','Chris','Alex','Kevin',
    'Justin','Brandon','Kyle','Derek','Connor','Zach','Nick','Dan','Tom','Jay',
    'Ben','Sam','Joe','Luke','Evan','Cole','Drew'];
  const NUMS  = [69,420,1337,99,88,42,777,404,666,1234,9001,2468,47,83,156,
    271,384,512,629,741,858,963,1024,31337,2600,4221,8888,7777,3333,
    1111,9999,6969,23,37,51,64,78,92,107,123,138,152,167,181,196,213,
    227,241,256,268,289,304,318,327,341,356,369,384,397,411,428,443];

  function genName(i) {
    const s1 = h32('n1_' + i), s2 = h32('n2_' + i), s3 = h32('n3_' + i);
    const num = NUMS[s2 % NUMS.length];
    const p = i % 10;
    if (p === 0) return THROW[s1 % THROW.length] + (s2 % 90000 + 10000);
    if (p === 1) return ADJ[s1 % ADJ.length] + NOUN[s2 % NOUN.length] + num;
    if (p === 2) return FIRST[s1 % FIRST.length] + '_' + (s2 % 9000 + 1000);
    if (p === 3) return ADJ[s1 % ADJ.length].toLowerCase() + '_' + NOUN[s2 % NOUN.length].toLowerCase() + '_' + (s3 % 999 + 1);
    if (p === 4) return 'u_' + NOUN[s1 % NOUN.length].toLowerCase() + (s2 % 9999 + 1000);
    if (p === 5) return NOUN[s1 % NOUN.length].toLowerCase() + 'dude' + (s2 % 999 + 100);
    if (p === 6) return FIRST[s1 % FIRST.length] + ADJ[s2 % ADJ.length] + num;
    if (p === 7) return ADJ[s1 % ADJ.length] + '_' + ADJ[s2 % ADJ.length] + '_' + NOUN[s3 % NOUN.length];
    if (p === 8) return 'counting_nuts_' + (s1 % 9000 + 1000);
    return THROW[s1 % THROW.length] + '_' + NOUN[s2 % NOUN.length].toLowerCase();
  }

  // ── BUILD 300 PROFILES ──────────────────────────────────────────
  function buildNPCs() {
    const list = [];
    for (let i = 0; i < 300; i++) {
      const s    = h32('profile_' + i);
      const fRol = s % 100;
      list.push({
        id:       i,
        name:     genName(i),
        // 1-4 nuts/day, weighted toward 1-2
        freq:     fRol < 40 ? 1 : fRol < 72 ? 2 : fRol < 90 ? 3 : 4,
        // peak activity hour 8am-10pm
        peakH:    (h32('peak_' + i) % 14) + 8,
        // days since joined: 5-150
        joinDays: (h32('join_' + i) % 146) + 5,
        seed:     s,
      });
    }
    return list;
  }

  const NPCS = buildNPCs();

  // ── ALL-TIME COUNT (LAZY) ───────────────────────────────────────
  const _ct = {};
  function allTime(npc) {
    if (_ct[npc.id] !== undefined) return _ct[npc.id];
    let total = 0;
    for (let d = 0; d < npc.joinDays; d++) {
      const ds = h32('day_' + npc.id + '_' + d) % 100;
      const df = ds < 20 ? 0 : ds < 55 ? npc.freq - 1 : ds < 88 ? npc.freq : npc.freq + 1;
      total += Math.max(0, df);
    }
    _ct[npc.id] = total;
    return total;
  }

  // ── ACTIVITY SIMULATION ─────────────────────────────────────────
  const QUIPS = [
    'not financial advice', 'wagmi', 'LFG', 'doing my part for the dataset',
    'the oracle called it', 'supply is fixed, demand is not',
    'wen token', 'sunday 12am LETS GOOO', 'set my alarm already',
    'nutmaxxing responsibly', 'this is the way', 'fundamentals looking bullish',
    'based and nutpilled', 'every log is a vote', 'hodling my logs',
    "can't stop won't stop", 'paperhands stay mad', 'degen hours activated',
    'logged the morning one already', 'research confirms gm',
    'airdrop qualification secured', 'wave 2 secured lets ride',
    'the spreadsheet does not lie', 'consistent. daily. documented.',
    'touched grass then came back', 'science demands sacrifice',
    'my portfolio is mostly $NUT rn ngl', 'diamond hands on my logs',
    'first of the day early bird', 'NNN is a psyop btw',
    'statistically significant behavior', 'Oracle said peak hour, obliged',
  ];

  // Events in last `windowMs` ms for up to `count` NPCs
  function getRecentEvents(count, now) {
    const windowMs = 6 * 60000; // 6-min rolling window
    const events   = [];

    NPCS.forEach(npc => {
      const intervalMs = 86400000 / npc.freq;
      // deterministic offset so each NPC has consistent log times
      const tick    = Math.floor(now / intervalMs);
      const baseTs  = tick * intervalMs;
      const offset  = frac('ev_off_' + npc.id) * intervalMs;
      const logTs   = baseTs + offset;

      if (logTs >= now - windowMs && logTs <= now) {
        const qs = h32('quip_' + npc.id + '_' + tick) % 100;
        events.push({
          npc,
          ts:   logTs,
          quip: qs < 35 ? QUIPS[h32('q2_' + npc.id + '_' + tick) % QUIPS.length] : null,
        });
      }
    });

    events.sort((a, b) => b.ts - a.ts);
    return events.slice(0, count);
  }

  // ── DUEL SYSTEM ─────────────────────────────────────────────────
  const TAUNT_A = [
    'you\'re already done, son',
    'not even warming up yet',
    'I trained for this',
    'your frequency is embarrassing',
    'get rekt bestie',
  ];
  const TAUNT_B = [
    'I\'m just getting started',
    'lmao watch this comeback',
    'you peaked too early, classic',
    'I have more tabs open',
    'this isn\'t over',
  ];

  function getActiveDuels(now) {
    const slot  = Math.floor(now / 900000); // new bracket every 15 min
    const duels = [];

    for (let d = 0; d < 4; d++) {
      const i1 = h32('da_' + d + '_' + slot) % 300;
      let   i2 = h32('db_' + d + '_' + slot) % 300;
      if (i1 === i2) i2 = (i2 + 7) % 300;

      const npc1   = NPCS[i1];
      const npc2   = NPCS[i2];
      const dur    = 1200000; // 20-min duel
      const startTs = slot * 900000 + d * 280000;
      const endTs   = startTs + dur;
      const elapsed = Math.max(0, now - startTs);
      const pct     = Math.min(1, elapsed / dur);

      // Deterministic score accumulation
      const v1 = 1 + frac('dv1_' + d + '_' + slot) * 0.35;
      const v2 = 1 + frac('dv2_' + d + '_' + slot) * 0.35;
      const c1  = Math.round(npc1.freq * pct * v1 * 1.3);
      const c2  = Math.round(npc2.freq * pct * v2 * 1.3);

      // Trash talk (changes every quarter of duel)
      const tSlot   = Math.floor(pct * 4);
      const tSeed   = h32('taunt_' + d + '_' + slot + '_' + tSlot);
      const taunt   = pct > 0.05 && pct < 0.9
        ? (tSeed % 2 === 0
            ? `u/${npc1.name}: "${TAUNT_A[tSeed % TAUNT_A.length]}"`
            : `u/${npc2.name}: "${TAUNT_B[tSeed % TAUNT_B.length]}"`)
        : null;

      const lead1 = c1 >= c2;
      const total = c1 + c2;
      const pct1  = total > 0 ? Math.round(c1 / total * 100) : 50;
      const done  = pct >= 1;

      duels.push({ id: `${d}_${slot}`, npc1, npc2, c1, c2, startTs, endTs, pct, pct1, lead1, done, taunt, dur });
    }
    return duels;
  }

  // ── UTIL ────────────────────────────────────────────────────────
  function timeAgo(ts, now) {
    const d = now - ts;
    if (d < 10000) return 'just now';
    if (d < 60000) return Math.floor(d / 1000) + 's ago';
    if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
    return Math.floor(d / 3600000) + 'h ago';
  }

  const COLORS = ['#4EC97A','#4E9AC9','#C8A96E','#9A4EC9','#C94E78','#C9904E','#4EC9B5','#C9C24E'];
  function npcColor(id) { return COLORS[id % COLORS.length]; }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  // ── RENDER: NPC FEED ────────────────────────────────────────────
  function renderFeed() {
    const el = document.getElementById('npcFeed');
    if (!el) return;
    const now    = Date.now();
    const events = getRecentEvents(18, now);

    if (!events.length) {
      el.innerHTML = '<div class="npc-quiet">Activity loading…</div>';
      return;
    }

    el.innerHTML = events.map(ev => {
      const ago    = timeAgo(ev.ts, now);
      const color  = npcColor(ev.npc.id);
      const init2  = ev.npc.name.slice(0, 2).toUpperCase();
      return `<div class="npc-ev">
        <div class="npc-av" style="background:${color}">${esc(init2)}</div>
        <div class="npc-ev-body">
          <span class="npc-ev-name">u/${esc(ev.npc.name)}</span>
          <span class="npc-ev-act"> logged a nut</span>
          ${ev.quip ? `<div class="npc-ev-quip">"${esc(ev.quip)}"</div>` : ''}
        </div>
        <div class="npc-ev-ago">${ago}</div>
      </div>`;
    }).join('');
  }

  // ── RENDER: DUELS ───────────────────────────────────────────────
  function renderDuels() {
    const el = document.getElementById('npcDuels');
    if (!el) return;
    const now   = Date.now();
    const duels = getActiveDuels(now);

    el.innerHTML = duels.map(d => {
      if (d.done) {
        const w = d.c1 >= d.c2 ? d.npc1 : d.npc2;
        return `<div class="duel-card done">
          <span class="duel-badge done">✓ DUEL OVER</span>
          <span class="duel-winner">🏆 u/${esc(w.name)} wins</span>
        </div>`;
      }

      const timeLeft = Math.max(0, d.endTs - now);
      const mins = Math.floor(timeLeft / 60000);
      const secs = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0');

      return `<div class="duel-card">
        <div class="duel-top">
          <span class="duel-badge live">⚔ LIVE DUEL</span>
          <span class="duel-timer">${mins}:${secs}</span>
        </div>
        ${d.taunt ? `<div class="duel-taunt">${esc(d.taunt)}</div>` : ''}
        <div class="duel-match">
          <div class="duel-side ${d.lead1 ? 'lead' : ''}">
            <div class="duel-pn">u/${esc(d.npc1.name)}</div>
            <div class="duel-score">${d.c1}</div>
          </div>
          <div class="duel-vs-chip">VS</div>
          <div class="duel-side ${!d.lead1 ? 'lead' : ''}">
            <div class="duel-pn">u/${esc(d.npc2.name)}</div>
            <div class="duel-score">${d.c2}</div>
          </div>
        </div>
        <div class="duel-progress">
          <div class="duel-prog-fill" style="width:${d.pct1}%"></div>
        </div>
        <div class="duel-pct-labels">
          <span>${d.pct1}%</span>
          <span>${100 - d.pct1}%</span>
        </div>
      </div>`;
    }).join('');
  }

  // ── INJECT INTO GLOBAL ACTIVITY LOG ────────────────────────────
  let _lastInjectedTs = 0;

  function injectToLog() {
    const logList  = document.getElementById('logList');
    const logEmpty = document.getElementById('logEmpty');
    if (!logList) return;

    const now    = Date.now();
    const events = getRecentEvents(3, now);
    if (!events.length) return;

    const ev = events[0];
    if (ev.ts === _lastInjectedTs) return;
    _lastInjectedTs = ev.ts;

    if (logEmpty) logEmpty.style.display = 'none';

    const color = npcColor(ev.npc.id);
    const div   = document.createElement('div');
    div.className = 'log-item npc-log';
    div.innerHTML = `
      <span class="log-user" style="color:${color}">u/${esc(ev.npc.name)}</span>
      <span class="log-verb"> logged a nut</span>
      ${ev.quip ? `<span class="log-msg"> · "${esc(ev.quip)}"</span>` : ''}
      <span class="log-time">&nbsp;${timeAgo(ev.ts, now)}</span>
    `;

    logList.insertBefore(div, logList.firstChild);
    // Keep last 35 entries
    while (logList.children.length > 35) logList.removeChild(logList.lastChild);
  }

  // ── INIT ────────────────────────────────────────────────────────
  function init() {
    renderFeed();
    renderDuels();
    injectToLog();

    setInterval(() => { renderFeed(); renderDuels(); }, 12000);
    // Stagger inject to feel organic (7-15 sec interval)
    function scheduleInject() {
      setTimeout(() => { injectToLog(); scheduleInject(); }, 7000 + Math.random() * 8000);
    }
    scheduleInject();
  }

  window.NutNPCs = { init, getActiveDuels, allTime, NPCS, getRecentEvents };
})();
