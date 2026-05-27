/**
 * $NUT Community Engine — 300 NPC Profiles
 *
 * NPCs are real users as far as Supabase is concerned.
 * Each NPC has a stable session_id, logs actual nuts via log_nut RPC,
 * appears in the global activity feed, leaderboard, and has a searchable profile.
 * No quips. No messages. Twitter brainrot bios only. Indistinguishable from real users.
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
    'Commenter','Observer','Verifier'];
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

  // ── TWITTER BRAINROT BIOS ────────────────────────────────────────
  const BIOS = [
    'not financial advice | this app was my first blockchain interaction',
    'on the ledger forever | logged every day since launch | cannot be stopped',
    'i am the data. the data is me. the coin is me.',
    'wife knows about the app. husband does not.',
    'bear witness or say nothing | on-chain documentation enjoyer',
    'if the oracle said peak hour i am not arguing with it',
    'certified degen | logging since wave 1 | receipt game immaculate',
    'NNN survivor 2023 | barely made it | never again | i will not elaborate',
    'tracking for science | the dataset needs every single data point',
    'my daily streak is more consistent than my rent payment',
    'solana was built for this specific use case and i know it',
    'adding to the permanent record | future historians will understand',
    'logged 300+ and counting | supply is fixed but my count is not',
    'born to nut forced to work | schedule has been optimized accordingly',
    'doing this for the tokenomics and that is my final answer',
    'i have never missed a day | i take this more seriously than my job',
    'my emergency contact also has this app installed',
    'the receipt goes incredibly hard and i am telling everyone',
    'nnn is a coordinated psyop | have receipts | logged anyway',
    'just vibes and data points | mostly data points | some vibes',
    'consistency is a virtue | i am virtuous | oracle confirms daily',
    'peaked during lockdowns like the rest of the dataset',
    'not a financial advisor but the supply logic is genuinely immaculate',
    'WAGMI when you log on-chain | this is the way',
    'airdrop bag secured | still logging | the grind does not stop',
    'the spreadsheet does not lie | neither do i | both publicly verifiable',
    'sunday night logged at 11:42pm | oracle called it | i obliged',
    'coffee then log or log then coffee | i have not decided | both happen',
    'paperhands never log | diamond hands log daily | i log daily',
    'certified data point | part of the 4.998 trillion | permanently documented',
    'told my doctor about this app | she was confused | i am still logging',
    'oracle was bullish | i matched energy | timestamp immortalized',
    'imagine not logging | could not be me | it literally cannot be me',
    'building in public | building consistently | building every single morning',
    'gm | logged | back to work | no further questions',
    'the oracle predicted 9pm | the oracle was correct | praise the oracle',
    'streak is going | not stopping | do not ask me to stop',
    'pump.fun launch is going to be historic and i have the receipts to prove it',
    'first nut logged before 8am | schedule secured | gm to the blockchain',
    'i log therefore i am | descartes didnt have wifi but he would have',
    'found this through a cursed tweet and have been logging ever since',
    'sent the receipt to my group chat | two of them downloaded the app',
    'my nutcoin bag and my logging streak are the only things im consistent with',
    'this is what financial freedom looks like | at least something is documented',
    'if you arent logging youre just guessing | i am not guessing',
  ];

  function genBio(i) {
    return BIOS[h32('bio_' + i) % BIOS.length];
  }

  // ── NUT TYPES FOR NPCS ───────────────────────────────────────────
  // Weighted: mostly solo, some partner/quickie for realism
  const NPC_NUT_TYPES = ['solo','solo','solo','solo','solo','partner','quickie','solo','partner','solo'];

  function genNutType(npcId, dateStr) {
    return NPC_NUT_TYPES[h32('ntype_' + npcId + '_' + dateStr) % NPC_NUT_TYPES.length];
  }

  // ── STABLE SESSION ID PER NPC ────────────────────────────────────
  // Each NPC has a fixed session ID so their profile is linkable and their
  // Supabase rows deduplicate correctly across page loads and devices.
  function npcSessionId(npc) {
    return 'npcbot' + String(npc.id).padStart(4, '0');
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
        bio:      genBio(i),
        sessionId: 'npcbot' + String(i).padStart(4, '0'),
        // 1-3 nuts/day, weighted toward 1-2 (realistic)
        freq:     fRol < 45 ? 1 : fRol < 78 ? 2 : 3,
        // peak activity hour 8am-11pm
        peakH:    (h32('peak_' + i) % 15) + 8,
        // days since joined: 10-180
        joinDays: (h32('join_' + i) % 171) + 10,
        seed:     s,
      });
    }
    return list;
  }

  const NPCS = buildNPCs();

  // ── NPC LOOKUP BY NAME ──────────────────────────────────────────
  const _byName = Object.create(null);
  const _bySid  = Object.create(null);
  NPCS.forEach(n => {
    _byName[n.name.toLowerCase()] = n;
    _bySid[n.sessionId]           = n;
  });

  function getNPC(name)   { return _byName[(name || '').toLowerCase()] || null; }
  function getNPCBySid(sid){ return _bySid[sid || ''] || null; }
  function getBio(name)   { const n = getNPC(name); return n ? n.bio : null; }
  function isNPCSid(sid)  { return typeof sid === 'string' && sid.startsWith('npcbot') && sid.length === 10; }

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

  // ── TODAY'S COUNT (for a given date string) ─────────────────────
  function todayCount(npc, dateStr) {
    const ds = h32('today_' + npc.id + '_' + dateStr) % 100;
    const df = ds < 20 ? 0 : ds < 55 ? Math.max(0, npc.freq - 1) : ds < 88 ? npc.freq : npc.freq + 1;
    return Math.max(0, df);
  }

  // ── ACTIVITY SIMULATION: 6-HOUR ROLLING WINDOW ─────────────────
  // Each NPC contributes at most one event (their most recent within the window).
  // At avg 2 nuts/day × 300 NPCs, ~75 events exist per 6-hour window.
  function getRecentEvents(count, now) {
    const windowMs = 6 * 3600000;
    const events   = [];

    NPCS.forEach(npc => {
      const intervalMs = 86400000 / npc.freq;
      // Check up to 3 past ticks to find an event in the window
      const tick0 = Math.floor(now / intervalMs);
      for (let t = 0; t <= 3; t++) {
        const tick  = tick0 - t;
        const baseTs = tick * intervalMs;
        const offset = frac('ev_off_' + npc.id) * intervalMs;
        const logTs  = baseTs + offset;
        if (logTs > now) continue;
        if (logTs < now - windowMs) break; // Too old
        events.push({ npc, ts: logTs });
        break; // Only most-recent event per NPC
      }
    });

    events.sort((a, b) => b.ts - a.ts);
    return events.slice(0, count);
  }

  // ── DUEL SYSTEM ─────────────────────────────────────────────────
  const TAUNT_A = [
    "you're already done, son",
    'not even warming up yet',
    'I trained for this',
    'your frequency is embarrassing',
    'get rekt bestie',
  ];
  const TAUNT_B = [
    "I'm just getting started",
    'lmao watch this comeback',
    'you peaked too early, classic',
    'I have more tabs open',
    "this isn't over",
  ];

  function getActiveDuels(now) {
    const slot  = Math.floor(now / 900000);
    const duels = [];
    for (let d = 0; d < 4; d++) {
      const i1 = h32('da_' + d + '_' + slot) % 300;
      let   i2 = h32('db_' + d + '_' + slot) % 300;
      if (i1 === i2) i2 = (i2 + 7) % 300;
      const npc1    = NPCS[i1], npc2 = NPCS[i2];
      const dur     = 1200000;
      const startTs = slot * 900000 + d * 280000;
      const endTs   = startTs + dur;
      const elapsed = Math.max(0, now - startTs);
      const pct     = Math.min(1, elapsed / dur);
      const v1      = 1 + frac('dv1_' + d + '_' + slot) * 0.35;
      const v2      = 1 + frac('dv2_' + d + '_' + slot) * 0.35;
      const c1      = Math.round(npc1.freq * pct * v1 * 1.3);
      const c2      = Math.round(npc2.freq * pct * v2 * 1.3);
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

  // ── RENDER: COMMUNITY FEED ──────────────────────────────────────
  // Shows NPCs who logged in the last 6 hours. No messages, no quips.
  function renderFeed() {
    const el = document.getElementById('npcFeed');
    if (!el) return;
    const now    = Date.now();
    const events = getRecentEvents(20, now);
    if (!events.length) {
      el.innerHTML = '<div class="npc-quiet">Loading community activity…</div>';
      return;
    }
    el.innerHTML = events.map(ev => {
      const ago   = timeAgo(ev.ts, now);
      const color = npcColor(ev.npc.id);
      const init2 = ev.npc.name.slice(0, 2).toUpperCase();
      return `<div class="npc-ev">
        <div class="npc-av" style="background:${color}">${esc(init2)}</div>
        <div class="npc-ev-body">
          <span class="npc-ev-name">u/${esc(ev.npc.name)}</span>
          <span class="npc-ev-act"> logged a nut</span>
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

  // ── SUPABASE INJECTION ──────────────────────────────────────────
  // Strategy: full history bootstrap so NPCs rank competitively on the
  // leaderboard. Each visit bootstraps 3 NPCs (all their historical days).
  // Supabase deduplicates via (session_id, deed_date) — re-injecting is
  // always safe, just returns ok:false for existing rows.
  //
  // Progress tracked in localStorage so each device picks up where it left
  // off across visits. Typically done in 100 page visits (300 NPCs / 3).

  const _BOOT_KEY    = 'npc_boot_n_v2';  // index of next NPC to bootstrap
  const _DAILY_KEY   = 'npc_daily_ts_v2'; // timestamp of last daily run
  const _DAILY_CD    = 20 * 60 * 1000;    // 20-min cooldown for daily pass
  const _MAX_HIST    = 120;               // inject at most 120 days of history
  const _BOOT_BATCH  = 3;                 // NPCs bootstrapped per page visit
  const _WRITE_BATCH = 15;               // concurrent writes per Promise.allSettled

  async function _logNPC(db, npc, dateStr) {
    const nutType = genNutType(npc.id, dateStr);
    try {
      const { error } = await db.rpc('log_nut', {
        p_session_id: npc.sessionId,
        p_nickname:   npc.name,
        p_deed_date:  dateStr,
        p_nut_type:   nutType,
        p_points:     1,
      });
      if (error) {
        await db.rpc('log_nut', {
          p_session_id: npc.sessionId,
          p_nickname:   npc.name,
          p_deed_date:  dateStr,
        });
      }
    } catch (_) { /* silent — dedup ok:false also lands here sometimes */ }
  }

  // Is NPC active on day index d (0 = oldest, joinDays-1 = most recent)?
  // Must match the allTime() loop exactly so Supabase count ≈ UI count.
  function _dayActive(npc, d) {
    return (h32('day_' + npc.id + '_' + d) % 100) >= 20;
  }

  // Inject full history for one NPC (up to _MAX_HIST days back).
  async function _bootstrapNPC(db, npc) {
    const today   = new Date();
    const dStart  = Math.max(0, npc.joinDays - _MAX_HIST);
    const dates   = [];

    for (let d = dStart; d < npc.joinDays; d++) {
      if (!_dayActive(npc, d)) continue;
      const daysAgo = npc.joinDays - 1 - d;
      const dt      = new Date(today.getTime() - daysAgo * 86400000);
      dates.push(dt.toISOString().split('T')[0]);
    }

    for (let i = 0; i < dates.length; i += _WRITE_BATCH) {
      await Promise.allSettled(
        dates.slice(i, i + _WRITE_BATCH).map(ds => _logNPC(db, npc, ds))
      );
      if (i + _WRITE_BATCH < dates.length) {
        await new Promise(r => setTimeout(r, 120)); // breathe between batches
      }
    }
  }

  async function injectToSupabase(db) {
    if (!db) return;

    // ── PHASE 1: bootstrap full history, 3 NPCs per page visit ──────
    const bootN = parseInt(localStorage.getItem(_BOOT_KEY) || '0');
    if (bootN < NPCS.length) {
      const endN = Math.min(bootN + _BOOT_BATCH, NPCS.length);
      for (let i = bootN; i < endN; i++) {
        await _bootstrapNPC(db, NPCS[i]);
      }
      localStorage.setItem(_BOOT_KEY, String(endN));
    }

    // ── PHASE 2: daily pass — log today for a fresh set of NPCs ─────
    const now       = Date.now();
    const lastDaily = parseInt(localStorage.getItem(_DAILY_KEY) || '0');
    if (now - lastDaily < _DAILY_CD) return;
    localStorage.setItem(_DAILY_KEY, String(now));

    const todayStr = new Date().toISOString().split('T')[0];
    const picks    = [];
    for (let i = 0; i < 25; i++) {
      picks.push(NPCS[h32('dt_' + todayStr + '_' + i) % NPCS.length]);
    }
    await Promise.allSettled(picks.map(npc => _logNPC(db, npc, todayStr)));
  }

  // ── INIT ────────────────────────────────────────────────────────
  function init(db) {
    renderFeed();
    renderDuels();

    // Non-blocking Supabase injection
    if (db) {
      injectToSupabase(db).catch(() => {});
      // Re-run periodically — picks up bootstrap progress and logs today's nuts
      setInterval(() => injectToSupabase(db).catch(() => {}), _DAILY_CD + 2 * 60 * 1000);
    }

    // Refresh display every 15 seconds
    setInterval(() => { renderFeed(); renderDuels(); }, 15000);
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  window.NutNPCs = {
    init,
    getActiveDuels,
    allTime,
    todayCount,
    NPCS,
    getRecentEvents,
    getNPC,
    getNPCBySid,
    getBio,
    isNPCSid,
    npcSessionId,
    npcColor,
  };

})();
