/**
 * $NUT Community Engine — 1500 NPC Profiles
 *
 * 1500 unique characters. Emoji avatars that rotate every 15 min.
 * Badges based on stats. Live duels + speed rounds. Announcement feed.
 * Supabase injection capped at first 300 NPCs so leaderboard fills fast.
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

  // ── NAMES: 60 × 25 = 1500 unique combinations ───────────────────
  const NPC_PFXS = [
    // Scale/intensity
    'Big','Mega','Ultra','Turbo','Hyper','Giga','Maximum','Supreme',
    // Timing
    'Daily','Nightly','Midnight','Morning','Sunday','Friday','Seasonal','Annual',
    // Vibe
    'Based','Cursed','Silent','Shadow','Secret','Sketchy','Sticky','Soggy',
    // Crypto culture
    'Diamond','Degen','Alpha','Sigma','Omega','Ape','Rekt','Wagmi',
    // Legitimacy
    'Real','Actual','Certified','Veteran','Prolific','Legendary','Famous','Notorious',
    // Adult/crude (some inappropriate as requested)
    'Chronic','Nasty','Filthy','Sloppy','Juicy','Creamy','Drippy','Wet',
    // Place/dimension
    'Local','Global','Digital','Virtual','Cosmic','Ancient','Future','Astral',
    // Anonymity
    'Ghost','Anon','Phantom','Nuclear',
  ];
  const NPC_SFXS = [
    // Data activity
    'Logger','Counter','Tracker','Stacker','Archivist',
    // Professional
    'Analyst','Operator','Curator','Researcher','Observer',
    // Character
    'Wizard','Goblin','Chad','Enjoyer','Oracle',
    // Status
    'Patriarch','Sovereign','Legend','Baller','Degen',
    // Adult/crude (some inappropriate as requested)
    'Stroker','Wanker','Milker','Nutter','Pumper',
  ];

  function buildNPCNames() {
    const all = [];
    for (const p of NPC_PFXS)
      for (const s of NPC_SFXS)
        all.push(p + s);
    // Deterministic Fisher-Yates so order is consistent across all sessions
    for (let i = all.length - 1; i > 0; i--) {
      const j = h32('shuf4_' + i) % (i + 1);
      const tmp = all[i]; all[i] = all[j]; all[j] = tmp;
    }
    return all; // exactly 1500
  }
  const NPC_NAMES = buildNPCNames();

  // ── AVATAR EMOJIS (rotate per 15-min slot) ──────────────────────
  const NPC_EMOJIS = [
    '🥜','🔥','💎','👑','⚡','💀','🐸','🌙','🦊','🗡️',
    '⚔️','🔮','💣','🎯','🃏','🎭','🕹️','👾','🤑','💰',
    '🌊','🍆','💦','🍑','🌰','🎲','🦴','🐲','🌋','🎪',
  ];

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
    'doctor said to reduce stress. i log. same thing.',
    'three devices. one mission. zero regrets.',
    'i have logged in 14 countries. the data follows me.',
    'my streaks outlast my relationships and my internet plans',
    'every morning before coffee. this is the law i live by.',
    'logged from the car. logged from the office bathroom. no excuses.',
    'my wrist is officially a verified on-chain instrument',
    'anonymous to everyone except the blockchain and my therapist',
    'i dont post. i dont talk. i just log and let the numbers speak.',
    'nutcoin is the most honest financial product on earth and i stand by that',
    'been through rug pulls. been through heartbreak. still logging.',
    'the pump.fun contract hasnt launched yet and im already in line',
    'told my boss i needed a mental health day. spent it logging.',
    'i cried at the milestones screen. it was beautiful.',
    'i log for myself. the leaderboard is just a side effect.',
  ];

  function genBio(i) { return BIOS[h32('bio_' + i) % BIOS.length]; }

  // ── NUT TYPES ───────────────────────────────────────────────────
  const NPC_NUT_TYPES = ['solo','solo','solo','solo','solo','partner','quickie','solo','partner','solo'];
  function genNutType(npcId, dateStr) {
    return NPC_NUT_TYPES[h32('ntype_' + npcId + '_' + dateStr) % NPC_NUT_TYPES.length];
  }

  // ── SESSION ID ──────────────────────────────────────────────────
  function npcSessionId(npc) {
    return 'npcbot' + String(npc.id).padStart(4, '0');
  }

  // ── BUILD 1500 PROFILES ─────────────────────────────────────────
  function buildNPCs() {
    const list = [];
    for (let i = 0; i < 1500; i++) {
      const s    = h32('profile_' + i);
      const fRol = s % 100;
      list.push({
        id:        i,
        name:      NPC_NAMES[i],
        bio:       genBio(i),
        sessionId: 'npcbot' + String(i).padStart(4, '0'),
        freq:      fRol < 45 ? 1 : fRol < 78 ? 2 : 3,
        peakH:     (h32('peak_' + i) % 15) + 8,
        joinDays:  (h32('join_' + i) % 171) + 10,
        seed:      s,
      });
    }
    return list;
  }
  const NPCS = buildNPCs();

  // ── LOOKUP MAPS ─────────────────────────────────────────────────
  const _byName = Object.create(null);
  const _bySid  = Object.create(null);
  NPCS.forEach(n => {
    _byName[n.name.toLowerCase()] = n;
    _bySid[n.sessionId]           = n;
  });

  function getNPC(name)    { return _byName[(name || '').toLowerCase()] || null; }
  function getNPCBySid(sid){ return _bySid[sid || ''] || null; }
  function getBio(name)    { const n = getNPC(name); return n ? n.bio : null; }
  function isNPCSid(sid)   { return typeof sid === 'string' && sid.startsWith('npcbot') && sid.length === 10; }

  // ── ALL-TIME COUNT (lazy, cached) ───────────────────────────────
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

  let _totalNuts;
  function getTotalNuts() {
    if (_totalNuts !== undefined) return _totalNuts;
    _totalNuts = NPCS.reduce((s, n) => s + allTime(n), 0);
    return _totalNuts;
  }

  // ── TODAY'S COUNT ───────────────────────────────────────────────
  function todayCount(npc, dateStr) {
    const ds = h32('today_' + npc.id + '_' + dateStr) % 100;
    const df = ds < 20 ? 0 : ds < 55 ? Math.max(0, npc.freq - 1) : ds < 88 ? npc.freq : npc.freq + 1;
    return Math.max(0, df);
  }

  // ── AVATAR HTML ─────────────────────────────────────────────────
  const COLORS = ['#4EC97A','#4E9AC9','#C8A96E','#9A4EC9','#C94E78','#C9904E','#4EC9B5','#C9C24E',
                  '#4EC9A0','#C94E4E','#7A9AC9','#C9B24E','#884EC9','#C96E4E','#4E78C9','#A0C94E'];
  function npcColor(id) { return COLORS[id % COLORS.length]; }

  function npcAvatarHtml(npc, now) {
    const color = npcColor(npc.id);
    const slot  = Math.floor((now || Date.now()) / 900000);
    const em    = NPC_EMOJIS[h32('av_' + npc.id + '_' + slot) % NPC_EMOJIS.length];
    const total = allTime(npc);
    const cls   = total >= 200 ? 'npc-av av-king' : total >= 100 ? 'npc-av av-gold' : 'npc-av';
    return `<div class="${cls}" style="background:${color}">${em}</div>`;
  }

  // ── BADGE SYSTEM ────────────────────────────────────────────────
  function npcBadges(npc) {
    const total  = allTime(npc);
    const badges = [];
    if      (total >= 500) badges.push({ em:'👑', tip:'King' });
    else if (total >= 200) badges.push({ em:'💎', tip:'Diamond' });
    else if (total >= 100) badges.push({ em:'🏅', tip:'Century' });
    else if (total >= 50)  badges.push({ em:'⭐', tip:'Active' });
    if (npc.freq >= 3)     badges.push({ em:'🔥', tip:'High Freq' });
    if (npc.peakH <= 8)    badges.push({ em:'🌅', tip:'Early Bird' });
    if (npc.peakH >= 22)   badges.push({ em:'🌙', tip:'Night Owl' });
    return badges;
  }

  function badgeHtml(npc) {
    return npcBadges(npc).map(b => `<span class="npc-badge" title="${b.tip}">${b.em}</span>`).join('');
  }

  // ── ACTIVITY SIMULATION: 6-HOUR WINDOW ─────────────────────────
  function getRecentEvents(count, now) {
    const windowMs = 6 * 3600000;
    const events   = [];
    NPCS.forEach(npc => {
      const intervalMs = 86400000 / npc.freq;
      const tick0      = Math.floor(now / intervalMs);
      for (let t = 0; t <= 3; t++) {
        const tick   = tick0 - t;
        const baseTs = tick * intervalMs;
        const offset = frac('ev_off_' + npc.id) * intervalMs;
        const logTs  = baseTs + offset;
        if (logTs > now) continue;
        if (logTs < now - windowMs) break;
        events.push({ npc, ts: logTs });
        break;
      }
    });
    events.sort((a, b) => b.ts - a.ts);
    return events.slice(0, count);
  }

  // ── ANNOUNCEMENTS ───────────────────────────────────────────────
  const ANN_TEMPLATES = [
    n => `🔥 ${n.name} is on a 7-day streak`,
    n => `💎 ${n.name} just passed ${Math.floor(allTime(n)/50)*50} total`,
    n => `🚀 ${n.name} is absolutely sending it`,
    n => `⚡ ${n.name} logged 3x before noon`,
    n => `🎯 ${n.name} hit their daily target again`,
    n => `🏆 ${n.name} is climbing the leaderboard`,
    n => `😤 ${n.name} refuses to take a day off`,
    n => `📈 ${n.name} just hit a personal best`,
    n => `👑 ${n.name} is the most dedicated nutlogger alive`,
    n => `🌙 ${n.name} logged at 3am. commitment is unmatched.`,
  ];

  function getAnnouncements(now) {
    const slot = Math.floor(now / 120000);
    const out  = [];

    // Recent duel results
    for (let d = 0; d < 4; d++) {
      const dSlot = Math.floor(now / 1200000) - d;
      const i1    = h32('da_' + (d % 6) + '_' + dSlot) % NPCS.length;
      let   i2    = h32('db_' + (d % 6) + '_' + dSlot) % NPCS.length;
      if (i1 === i2) i2 = (i2 + 7) % NPCS.length;
      const wi = h32('dv1_' + d + '_' + dSlot) > h32('dv2_' + d + '_' + dSlot) ? i1 : i2;
      out.push({ type: 'duel', text: `⚔ ${NPCS[wi].name} won a duel` });
    }

    // Activity announcements
    for (let k = 0; k < 6; k++) {
      const ni  = h32('ann_' + slot + '_' + k) % NPCS.length;
      const npc = NPCS[ni];
      const fn  = ANN_TEMPLATES[h32('at_' + slot + '_' + k) % ANN_TEMPLATES.length];
      out.push({ type: 'activity', text: fn(npc) });
    }

    // Community stats
    const tn = getTotalNuts();
    out.push({ type: 'stat', text: `📊 ${tn.toLocaleString()} community nuts logged` });
    out.push({ type: 'stat', text: `👥 1,500 active nutloggers on the platform` });

    return out;
  }

  // ── DUEL TAUNTS (expanded) ───────────────────────────────────────
  const TAUNT_A = [
    "you're already done, son",
    "not even warming up yet",
    "I trained for this specifically",
    "touch grass before trying me",
    "your frequency is embarrassing bro",
    "I do this before breakfast",
    "logged three before you woke up",
    "absolutely clown numbers on your end",
    "my wrist game is certified immaculate",
    "you peaked last tuesday and we both know it",
    "I have no life and it shows on the leaderboard",
    "doctor said to slow down. I did not.",
    "my streak is older than your account",
    "I've been logging since before pump.fun existed",
    "you call that a session? I call that a warmup",
  ];
  const TAUNT_B = [
    "I'm just getting started",
    "lmao watch this comeback arc",
    "you peaked too early, classic mistake",
    "one hand tied behind my back still",
    "this isn't even my final form",
    "I was sandbagging the whole time",
    "comeback story of the century incoming",
    "I log at 3am you absolutely cannot stop me",
    "my other hand hasn't even joined yet",
    "you'll deeply regret underestimating me",
    "I let you think you were winning. tactical.",
    "second wind? no this is my third wind.",
    "I've been holding back for the right moment",
    "the real numbers are about to drop",
    "my peak hour hasn't even started yet",
  ];

  // ── DUEL SYSTEM ─────────────────────────────────────────────────
  function getActiveDuels(now) {
    const slot  = Math.floor(now / 900000);
    const duels = [];
    for (let d = 0; d < 6; d++) {
      const i1 = h32('da_' + d + '_' + slot) % NPCS.length;
      let   i2 = h32('db_' + d + '_' + slot) % NPCS.length;
      if (i1 === i2) i2 = (i2 + 11) % NPCS.length;
      const npc1 = NPCS[i1], npc2 = NPCS[i2];
      const dur  = 1200000;
      const startTs = slot * 900000 + d * 180000;
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
            ? `${npc1.name}: "${TAUNT_A[tSeed % TAUNT_A.length]}"`
            : `${npc2.name}: "${TAUNT_B[tSeed % TAUNT_B.length]}"`)
        : null;
      const lead1 = c1 >= c2;
      const total = c1 + c2;
      const pct1  = total > 0 ? Math.round(c1 / total * 100) : 50;
      const done  = pct >= 1;
      duels.push({ id: `${d}_${slot}`, npc1, npc2, c1, c2, startTs, endTs, pct, pct1, lead1, done, taunt, dur, type: 'duel' });
    }
    return duels;
  }

  // ── SPEED ROUNDS (3-minute micro-duels) ─────────────────────────
  function getSpeedRounds(now) {
    const slot   = Math.floor(now / 180000); // 3-min slots
    const rounds = [];
    for (let r = 0; r < 3; r++) {
      const i1 = h32('sra_' + r + '_' + slot) % NPCS.length;
      let   i2 = h32('srb_' + r + '_' + slot) % NPCS.length;
      if (i1 === i2) i2 = (i2 + 13) % NPCS.length;
      const npc1 = NPCS[i1], npc2 = NPCS[i2];
      const dur  = 180000;
      const startTs = slot * 180000 + r * 55000;
      const endTs   = startTs + dur;
      const elapsed = Math.max(0, now - startTs);
      const pct     = Math.min(1, elapsed / dur);
      const s1      = Math.round(frac('sv1_' + r + '_' + slot) * 5 * pct + pct * 2);
      const s2      = Math.round(frac('sv2_' + r + '_' + slot) * 5 * pct + pct * 2);
      const lead1   = s1 >= s2;
      const done    = pct >= 1;
      rounds.push({ id: `sr_${r}_${slot}`, npc1, npc2, c1: s1, c2: s2, pct, lead1, done, endTs, type: 'speed' });
    }
    return rounds;
  }

  // ── UTIL ────────────────────────────────────────────────────────
  function timeAgo(ts, now) {
    const d = now - ts;
    if (d < 10000)   return 'just now';
    if (d < 60000)   return Math.floor(d / 1000) + 's ago';
    if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
    return Math.floor(d / 3600000) + 'h ago';
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  // ── RENDER: COMMUNITY FEED ──────────────────────────────────────
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
      const ago = timeAgo(ev.ts, now);
      return `<div class="npc-ev">
        ${npcAvatarHtml(ev.npc, now)}
        <div class="npc-ev-body">
          <span class="npc-ev-name">${esc(ev.npc.name)}</span>
          ${badgeHtml(ev.npc)}
          <span class="npc-ev-act"> logged a nut</span>
        </div>
        <div class="npc-ev-ago">${ago}</div>
      </div>`;
    }).join('');
  }

  // ── DUEL ANNOUNCEMENT TRACKER ──────────────────────────────────
  // Fires into NutAnnounce when a duel completes. Set so each duel only announces once.
  const _announcedDuels = new Set();

  // ── RENDER: DUELS + SPEED ROUNDS ───────────────────────────────
  function renderDuels() {
    const el = document.getElementById('npcDuels');
    if (!el) return;
    const now    = Date.now();
    const duels  = getActiveDuels(now);
    const speeds = getSpeedRounds(now);
    const all    = [...speeds, ...duels];

    // Fire real events for freshly-completed duels
    all.forEach(d => {
      if (d.done && !_announcedDuels.has(d.id)) {
        _announcedDuels.add(d.id);
        if (_announcedDuels.size > 80) _announcedDuels.delete(_announcedDuels.values().next().value);
        const w = d.c1 >= d.c2 ? d.npc1 : d.npc2;
        const l = d.c1 >= d.c2 ? d.npc2 : d.npc1;
        if (window.NutAnnounce) NutAnnounce.emit({
          type: 'duel', npc: true,
          text: `⚔ ${w.name} destroyed ${l.name} ${d.c1}-${d.c2}`,
        });
      }
    });

    el.innerHTML = all.map(d => {
      const isSpeed = d.type === 'speed';

      if (d.done) {
        const w = d.c1 >= d.c2 ? d.npc1 : d.npc2;
        return `<div class="duel-card done">
          <span class="duel-badge done">✓ ${isSpeed ? 'SPEED' : 'DUEL'} OVER</span>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            ${npcAvatarHtml(w, now)}
            <span class="duel-winner">🏆 ${esc(w.name)} wins</span>
            <span style="margin-left:4px">${badgeHtml(w)}</span>
          </div>
        </div>`;
      }

      const timeLeft = Math.max(0, d.endTs - now);
      const mins = Math.floor(timeLeft / 60000);
      const secs = String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0');

      return `<div class="duel-card${isSpeed ? ' speed-card' : ''}">
        <div class="duel-top">
          <span class="duel-badge ${isSpeed ? 'speed' : 'live'}">${isSpeed ? '⚡ SPEED ROUND' : '⚔ LIVE DUEL'}</span>
          <span class="duel-timer">${mins}:${secs}</span>
        </div>
        ${d.taunt ? `<div class="duel-taunt">${esc(d.taunt)}</div>` : ''}
        <div class="duel-match">
          <div class="duel-side ${d.lead1 ? 'lead' : ''}">
            ${npcAvatarHtml(d.npc1, now)}
            <div>
              <div class="duel-pn">${esc(d.npc1.name)}</div>
              <div class="duel-badges">${badgeHtml(d.npc1)}</div>
            </div>
            <div class="duel-score">${d.c1}</div>
          </div>
          <div class="duel-vs-chip">VS</div>
          <div class="duel-side ${!d.lead1 ? 'lead' : ''}">
            ${npcAvatarHtml(d.npc2, now)}
            <div>
              <div class="duel-pn">${esc(d.npc2.name)}</div>
              <div class="duel-badges">${badgeHtml(d.npc2)}</div>
            </div>
            <div class="duel-score">${d.c2}</div>
          </div>
        </div>
        <div class="duel-progress">
          <div class="duel-prog-fill" style="width:${d.pct1 !== undefined ? d.pct1 : 50}%"></div>
        </div>
        <div class="duel-pct-labels">
          <span>${d.pct1 !== undefined ? d.pct1 : 50}%</span>
          <span>${d.pct1 !== undefined ? 100 - d.pct1 : 50}%</span>
        </div>
      </div>`;
    }).join('');
  }

  // ── SUPABASE INJECTION ──────────────────────────────────────────
  // Only inject first 300 NPCs to Supabase — enough to fill the leaderboard.
  // Remaining 1200 NPCs are local-only (duels, feed, announcements).
  const _INJECT_CAP  = 300;
  const _BOOT_KEY    = 'npc_boot_n_v4';
  const _DAILY_KEY   = 'npc_daily_ts_v3';
  const _DAILY_CD    = 20 * 60 * 1000;
  const _MAX_HIST    = 120;
  const _BOOT_BATCH  = 5;
  const _WRITE_BATCH = 15;

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
    } catch (_) { /* silent — dedup ok:false lands here too */ }
  }

  function _dayActive(npc, d) {
    return (h32('day_' + npc.id + '_' + d) % 100) >= 20;
  }

  async function _bootstrapNPCById(db, npc) {
    const today  = new Date();
    const dStart = Math.max(0, npc.joinDays - _MAX_HIST);
    const dates  = [];
    for (let d = dStart; d < npc.joinDays; d++) {
      if (!_dayActive(npc, d)) continue;
      const daysAgo = npc.joinDays - 1 - d;
      const dt = new Date(today.getTime() - daysAgo * 86400000);
      dates.push(dt.toISOString().split('T')[0]);
    }
    for (let i = 0; i < dates.length; i += _WRITE_BATCH) {
      await Promise.allSettled(
        dates.slice(i, i + _WRITE_BATCH).map(ds => _logNPC(db, npc, ds))
      );
      if (i + _WRITE_BATCH < dates.length)
        await new Promise(r => setTimeout(r, 120));
    }
  }

  async function injectToSupabase(db) {
    if (!db) return;

    const bootN = parseInt(localStorage.getItem(_BOOT_KEY) || '0');
    if (bootN < _INJECT_CAP) {
      const endN = Math.min(bootN + _BOOT_BATCH, _INJECT_CAP);
      for (let i = bootN; i < endN; i++) {
        await _bootstrapNPCById(db, NPCS[i]);
      }
      localStorage.setItem(_BOOT_KEY, String(endN));
    }

    const now       = Date.now();
    const lastDaily = parseInt(localStorage.getItem(_DAILY_KEY) || '0');
    if (now - lastDaily < _DAILY_CD) return;
    localStorage.setItem(_DAILY_KEY, String(now));

    const todayStr = new Date().toISOString().split('T')[0];
    const picks    = [];
    for (let i = 0; i < 30; i++) {
      const idx = h32('dt_' + todayStr + '_' + i) % _INJECT_CAP;
      picks.push(NPCS[idx]);
    }
    await Promise.allSettled(picks.map(npc => _logNPC(db, npc, todayStr)));
  }

  // ── INIT ────────────────────────────────────────────────────────
  function init(db) {
    renderDuels();

    if (db) {
      injectToSupabase(db).catch(() => {});
      setInterval(() => injectToSupabase(db).catch(() => {}), _DAILY_CD + 2 * 60 * 1000);
    }

    setInterval(() => { renderDuels(); }, 15000);
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  window.NutNPCs = {
    init,
    getActiveDuels,
    getSpeedRounds,
    getAnnouncements,
    allTime,
    todayCount,
    getTotalNuts,
    NPCS,
    getRecentEvents,
    getNPC,
    getNPCBySid,
    getBio,
    isNPCSid,
    npcSessionId,
    npcColor,
    npcAvatarHtml,
    npcBadges,
  };

})();
