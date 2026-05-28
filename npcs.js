/**
 * $NUT Community Engine — 1500 NPC Profiles v5
 * 3-tier names. Real cooldowns. Supabase impact.
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

  // ── TIER 1: ~100 curated hand-crafted personality names ─────────
  const CURATED = [
    'PapaDaNuts','the_nutfather','xX_NutGod_Xx','wagmi_messiah','LoneWankRanger',
    'logging_for_science','wife_doesnt_know','StrokeMaster3000','NutLegend','throwaway_but_real',
    'definitely_not_a_bot','log_everyday_joe','CryptoWanker','just_one_more','nocap_nutter',
    'TrueNutPatriot','anonNutter','DailyDevotion','GhostLogger','PeakHourPete',
    'NightOwlNutter','EarlyBirdBaller','MorningWoodWatcher','SundayFunday69','the_algorithm',
    'LordOfTheLogs','KingNutsworth','CapitanCojones','ProfessorStroke','DocHolliNut',
    'CoachNuts','SirNutsalot','UncleBalls','DukeDegenerino','BaronVonBalls',
    'nut_at_work_lol','on_the_clock','boss_doesnt_know','company_wifi','HR_doesnt_know',
    'phone_in_the_bathroom','logged_from_church','NutOnAPlane','airport_bathroom_log','hotel_wifi_nut',
    'anon_but_logging','ghost_in_the_data','shadow_on_the_chain','phantom_logger','void_enjoyer',
    'xXx_DarkNutter_xXx','420NutLogger','69everyday','eight_times_a_week','twice_before_noon',
    'based_department','wagmi_or_ngmi','diamond_sack','weak_hands_never_log','HODL_deez',
    'pump_dot_nuts','on_chain_oracle','receipt_enjoyer','timestamp_is_proof','immutable_logs',
    'NutNarrativeArc','the_comeback_kid','sandbagger_irl','tactical_nutter','clutch_or_nothing',
    'no_days_off_ever','consistent_king','streak_god','milestone_chaser','top_of_the_board',
    'Goblin_Mode_On','gremlin_hours','rat_in_the_walls','feral_and_logging','unhinged_but_daily',
    'retired_but_active','WFH_Logger','remote_work_perks','zoom_is_muted','on_mute_rn',
    'nutted_before_standup','logged_at_3am','cant_sleep_logging','insomnia_log','sleep_is_overrated',
    'NutDocumentarian','archiving_forever','data_preservation','permanent_record','for_posterity',
    'first_one_of_the_day','last_one_tonight','between_meetings','lunch_break_log','coffee_then_log',
    'gm_logged_gn','rise_and_log','wake_n_nut','pre_coffee_dedication','post_gym_log',
    'NutBelieveInMiracles','the_chosen_nutter','destiny_is_logging','fate_said_log','universe_aligned',
    'just_here_to_nut','no_context_needed','vibes_only','no_questions_please','dont_look_at_me',
  ];

  // ── TIER 2: lowercase_underscore formula (50 adj × 20 noun = 1000) ──
  const T2_ADJ = [
    'based','silent','midnight','degen','wagmi','anon','ghost','chronic','cursed','feral',
    'local','global','digital','cosmic','ancient','daily','nightly','serial','rogue','shadow',
    'secret','sketchy','sticky','soggy','sleepy','grumpy','hungry','rusty','dusty','fuzzy',
    'turbo','hyper','ultra','mega','giga','sigma','alpha','omega','hollow','stealthy',
    'casual','retired','active','lurking','dedicated','prolific','veteran','notorious','famous','rare',
  ];
  const T2_NOUN = [
    'logger','nutter','wizard','goblin','archivist','oracle','chad','baller','degen','enjoyer',
    'witness','analyst','operator','researcher','observer','curator','tracker','stacker','watcher','keeper',
  ];

  // ── TIER 3: CamelCase title+noun (25 title × 16 noun = 400) ────
  const T3_TITLE = [
    'Papa','Lord','King','Duke','Sir','Uncle','Captain','Professor','Doctor','Chief',
    'Master','Baron','Count','Bishop','General','Major','Colonel','Admiral','Sergeant','Officer',
    'Coach','Judge','Dean','Agent','Ranger',
  ];
  const T3_NOUN = [
    'Nut','Logger','Wanker','Stroker','Wizard','Goblin','Chad','Degen',
    'Legend','Oracle','Nutter','Baller','Archivist','Tracker','Stacker','Enjoyer',
  ];

  function buildNPCNames() {
    // Tier 1: exactly as-is (100 names)
    const t1 = [...CURATED];

    // Tier 2: underscore names
    const t2 = [];
    for (const a of T2_ADJ)
      for (const n of T2_NOUN)
        t2.push(a + '_' + n);          // 1000 names

    // Tier 3: CamelCase names
    const t3 = [];
    for (const ti of T3_TITLE)
      for (const n of T3_NOUN)
        t3.push(ti + n);               // 400 names

    const all = [...t1, ...t2, ...t3]; // 1500 total

    // Deterministic Fisher-Yates so order stays consistent cross-session
    for (let i = all.length - 1; i > 0; i--) {
      const j = h32('shuf5_' + i) % (i + 1);
      const tmp = all[i]; all[i] = all[j]; all[j] = tmp;
    }
    return all;
  }
  const NPC_NAMES = buildNPCNames();

  // ── AVATAR EMOJIS ────────────────────────────────────────────────
  const NPC_EMOJIS = [
    '🥜','🔥','💎','👑','⚡','💀','🐸','🌙','🦊','🗡️',
    '⚔️','🔮','💣','🎯','🃏','🎭','🕹️','👾','🤑','💰',
    '🌊','🍆','💦','🍑','🌰','🎲','🦴','🐲','🌋','🎪',
  ];

  // ── BIOS ──────────────────────────────────────────────────────────
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

  // ── NUT TYPES ────────────────────────────────────────────────────
  const NPC_NUT_TYPES = ['solo','solo','solo','solo','solo','partner','quickie','solo','partner','solo'];
  function genNutType(npcId, dateStr) {
    return NPC_NUT_TYPES[h32('ntype_' + npcId + '_' + dateStr) % NPC_NUT_TYPES.length];
  }

  // ── BUILD 1500 PROFILES ──────────────────────────────────────────
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

  // ── LOOKUP MAPS ──────────────────────────────────────────────────
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
  function npcSessionId(npc) { return 'npcbot' + String(npc.id).padStart(4, '0'); }

  // ── ALL-TIME COUNT ────────────────────────────────────────────────
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

  function todayCount(npc, dateStr) {
    const ds = h32('today_' + npc.id + '_' + dateStr) % 100;
    const df = ds < 20 ? 0 : ds < 55 ? Math.max(0, npc.freq - 1) : ds < 88 ? npc.freq : npc.freq + 1;
    return Math.max(0, df);
  }

  // ── AVATAR ────────────────────────────────────────────────────────
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

  // ── BADGES ────────────────────────────────────────────────────────
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

  // ── ACTIVITY SIMULATION ───────────────────────────────────────────
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

  // ── ANNOUNCEMENTS ─────────────────────────────────────────────────
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
    now = now || Date.now();
    const out = [];
    getRecentEvents(4, now).forEach(ev => {
      out.push({
        type: 'npc',
        user: ev.npc.name,
        text: `🥜 ${ev.npc.name} just logged a nut`,
        ts: ev.ts,
        npc: true,
        sessionId: ev.npc.sessionId,
      });
    });
    const slot = Math.floor(now / 42000);
    const npc = NPCS[h32('ann_' + slot) % NPCS.length];
    const tpl = ANN_TEMPLATES[h32('annt_' + slot) % ANN_TEMPLATES.length];
    out.push({
      type: 'npc',
      user: npc.name,
      text: tpl(npc),
      ts: now - 1000,
      npc: true,
      sessionId: npc.sessionId,
    });
    return out;
  }

  function emitNPC(ev) {
    if (!window.NutAnnounce) return;
    const item = Object.assign({ ts: Date.now(), npc: true }, ev);
    NutAnnounce.emit(item);
  }

  // ── DUEL TAUNTS ───────────────────────────────────────────────────
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

  // ── DUEL SYSTEM ───────────────────────────────────────────────────
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

  // ── SPEED ROUNDS ──────────────────────────────────────────────────
  function getSpeedRounds(now) {
    const slot   = Math.floor(now / 180000);
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

  // ── UTIL ──────────────────────────────────────────────────────────
  function timeAgo(ts, now) {
    const d = now - ts;
    if (d < 10000)   return 'just now';
    if (d < 60000)   return Math.floor(d / 1000) + 's ago';
    if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
    return Math.floor(d / 3600000) + 'h ago';
  }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  // ── RENDER: COMMUNITY FEED ────────────────────────────────────────
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

  // ── DUEL ANNOUNCEMENT TRACKER ─────────────────────────────────────
  const _announcedDuels = new Set();

  function renderDuels() {
    const el = document.getElementById('npcDuels');
    if (!el) return;
    const now    = Date.now();
    const duels  = getActiveDuels(now);
    const speeds = getSpeedRounds(now);
    const all    = [...speeds, ...duels];

    all.forEach(d => {
      if (d.done && !_announcedDuels.has(d.id)) {
        _announcedDuels.add(d.id);
        if (_announcedDuels.size > 80) _announcedDuels.delete(_announcedDuels.values().next().value);
        // Duel resolved — tracked internally only, never surfaces in ticker
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

  let _dbRef = null;

  function casinoProfitToPoints(profit) {
    return Math.min(10, Math.max(1, Math.ceil((profit || 0) / 10)));
  }

  function buildNPCCasinoWin(npc, slot) {
    const game = ['spin', 'flip', 'crash'][h32('npc_cg_' + slot) % 3];
    const bet  = 10 + (h32('npc_cb_' + slot) % 50);
    let mult = 2;
    let profit = bet;
    let text = '';

    if (game === 'crash') {
      mult = parseFloat((1.6 + (h32('npc_cm_' + slot) % 80) / 10).toFixed(1));
      profit = Math.max(1, Math.floor(bet * mult) - bet);
      text = `🚀 ${npc.name} cashed crash at ${mult}× for +${profit} NUTS`;
    } else if (game === 'flip') {
      mult = 2;
      profit = bet;
      text = `🪙 ${npc.name} won flip — +${profit} NUTS`;
    } else {
      const mults = [2, 3, 5, 8, 10, 15];
      mult = mults[h32('npc_cw_' + slot) % mults.length];
      profit = Math.max(1, Math.floor(bet * mult) - bet);
      text = `🎰 ${npc.name} hit ${mult}× wheel for +${profit} NUTS`;
    }

    return {
      type: game === 'crash' ? 'crash' : game === 'flip' ? 'flip' : 'spin',
      game,
      user: npc.name,
      text,
      profit,
      bet,
      mult,
      big: profit >= 25 || mult >= 5,
      sessionId: npc.sessionId,
    };
  }

  async function playNPCCasinoRound(_db, npc, slot) {
    const roll = h32('npc_pl_' + slot) % 100;
    if (roll < 38) return false;
    // NPC casino round computed internally — not emitted to ticker
    return true;
  }

  // ── SUPABASE: log one nut for one NPC ────────────────────────────
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
    } catch (_) { /* dedup ok:false lands here — silent */ }
  }

  function _dayActive(npc, d) {
    return (h32('day_' + npc.id + '_' + d) % 100) >= 20;
  }

  // ── BOOTSTRAP: inject historical data for one NPC ────────────────
  const _WRITE_BATCH = 15;
  const _MAX_HIST    = 120;

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

  // ── LIVE ACTIVITY: same cooldown as real players ─────────────────
  // One log per NPC per 10 minutes max. 4 NPCs fire per 2-minute tick.
  const _INJECT_CAP  = 300;
  const _TEN_MIN     = 10 * 60 * 1000;
  const _LIVE_TICK   = 2  * 60 * 1000;
  const _lastRealLog = Object.create(null); // npc.id -> timestamp

  async function runLiveNPCActivity(db) {
    if (!db) return;
    const now      = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    // Pick 4 NPCs for this tick via hash-based slot
    const slot = Math.floor(now / _LIVE_TICK);
    for (let i = 0; i < 4; i++) {
      const idx = h32('live_' + slot + '_' + i) % _INJECT_CAP;
      const npc = NPCS[idx];
      const last = _lastRealLog[npc.id] || 0;
      if (now - last < _TEN_MIN) continue;
      _lastRealLog[npc.id] = now;

      const playCasino = h32('live_cas_' + slot + '_' + i) % 3 === 0;
      if (playCasino) {
        const played = await playNPCCasinoRound(db, npc, slot * 10 + i);
        if (played) {
          await new Promise(r => setTimeout(r, 400));
          continue;
        }
      }

      await _logNPC(db, npc, todayStr);
      // NPC live log — real Supabase write, no ticker emission
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // ── BOOT: progressive leaderboard seeding ────────────────────────
  const _BOOT_KEY   = 'npc_boot_n_v5';
  const _DAILY_KEY  = 'npc_daily_ts_v4';
  const _DAILY_CD   = 20 * 60 * 1000;
  const _BOOT_BATCH = 15; // up from 5 for faster leaderboard fill

  async function injectToSupabase(db) {
    if (!db) return;

    // Priority bootstrap: top 20 NPCs by allTime() on first-ever load
    const priorityKey = 'npc_priority_v5';
    if (!localStorage.getItem(priorityKey)) {
      const sorted = NPCS.slice(0, _INJECT_CAP)
        .map(n => ({ n, at: allTime(n) }))
        .sort((a, b) => b.at - a.at)
        .slice(0, 20)
        .map(x => x.n);
      for (const npc of sorted) {
        await _bootstrapNPCById(db, npc);
      }
      localStorage.setItem(priorityKey, '1');
    }

    // Progressive bootstrap: 15 more NPCs per page visit
    const bootN = parseInt(localStorage.getItem(_BOOT_KEY) || '0');
    if (bootN < _INJECT_CAP) {
      const endN = Math.min(bootN + _BOOT_BATCH, _INJECT_CAP);
      for (let i = bootN; i < endN; i++) {
        await _bootstrapNPCById(db, NPCS[i]);
      }
      localStorage.setItem(_BOOT_KEY, String(endN));
    }

    // Daily pass: 30 random NPCs log today's date (bulk, 20-min cooldown)
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
    // Stagger: one every 800ms so they look like real humans logging throughout the day
    for (const npc of picks) {
      const last = _lastRealLog[npc.id] || 0;
      if (Date.now() - last < _TEN_MIN) continue;  // respect 10-min cooldown
      _lastRealLog[npc.id] = Date.now();
      await _logNPC(db, npc, todayStr);
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // ── INIT ──────────────────────────────────────────────────────────
  function init(db) {
    _dbRef = db;
    renderDuels();

    if (db) {
      injectToSupabase(db).catch(() => {});

      // Live activity loop: fires every 2 min, one NPC per call with 10-min cooldown
      runLiveNPCActivity(db).catch(() => {});
      setInterval(() => runLiveNPCActivity(db).catch(() => {}), _LIVE_TICK);

      // Re-run daily batch after cooldown
      setInterval(() => injectToSupabase(db).catch(() => {}), _DAILY_CD + 2 * 60 * 1000);
    }

    setInterval(() => { renderDuels(); }, 15000);
    setInterval(() => tickNPCCasinoHighlights(), 45000);
    setTimeout(() => tickNPCCasinoHighlights(), 8000);
  }

  // Background casino rounds → ticker, casino_events, leaderboard points
  async function tickNPCCasinoHighlights() {
    const now  = Date.now();
    const slot = Math.floor(now / 45000);
    if (h32('npc_casino_' + slot) % 5 === 0) return;
    const npc  = NPCS[h32('npc_cas_' + slot) % Math.min(350, NPCS.length)];
    await playNPCCasinoRound(_dbRef, npc, slot);
  }

  // ── PUBLIC API ────────────────────────────────────────────────────
  window.NutNPCs = {
    init,
    getActiveDuels,
    getSpeedRounds,
    getAnnouncements,
    emitNPC,
    tickNPCCasinoHighlights,
    playNPCCasinoRound,
    casinoProfitToPoints,
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
    runLiveNPCActivity,
  };

})();
