/**
 * $NUT Casino — Oracle-Enhanced Wheel + Coin Flip + Crash Game
 */
(function () {

  // ── ORACLE STATE ────────────────────────────────────────────────
  const HP = [0.71,0.57,0.43,0.32,0.25,0.29,0.40,0.63,0.88,0.74,0.60,0.66,
              0.79,0.71,0.64,0.62,0.70,0.81,0.89,0.94,0.98,1.00,0.96,0.84];
  const DP = [1.16,0.94,0.91,0.93,0.97,1.07,1.14];
  const MP = [1.11,1.07,1.03,0.99,0.96,0.93,0.91,0.89,0.96,1.04,0.40,1.19];

  function oracleMod() {
    const n = new Date();
    return HP[n.getHours()] * DP[n.getDay()] * MP[n.getMonth()];
  }

  function oracleState() {
    const mod = oracleMod();
    const n   = new Date();
    const nnn = n.getMonth() === 10;
    const sun = n.getDay() === 0;
    const peak = n.getHours() >= 21 && n.getHours() <= 22;
    if (nnn)             return { label:'🚫 NNN SUPPRESSION', cls:'oracle-supp',  mod, bad: true  };
    if (peak && sun)     return { label:'🌟 COSMIC HOUR',     cls:'oracle-cosmic', mod, boost: true };
    if (mod >= 1.05)     return { label:'🔥 ORACLE BOOSTED',  cls:'oracle-hot',    mod, boost: true };
    if (mod >= 0.90)     return { label:'⚡ ORACLE ACTIVE',   cls:'oracle-warm',   mod              };
    return               { label:'🌙 ORACLE IDLE',    cls:'oracle-cold',   mod              };
  }

  // ── DYNAMIC WHEEL SEGMENTS ──────────────────────────────────────
  const BASE_SEGS = [
    { label:'BUST', mult:0,   bg:'#3a0000', fg:'#ff6060' },
    { label:'2×',   mult:2,   bg:'#003300', fg:'#44ff88' },
    { label:'BUST', mult:0,   bg:'#2d0000', fg:'#ff5050' },
    { label:'1.5×', mult:1.5, bg:'#000830', fg:'#6699ff' },
    { label:'BUST', mult:0,   bg:'#3a0000', fg:'#ff6060' },
    { label:'3×',   mult:3,   bg:'#221000', fg:'#ffbb44' },
    { label:'BUST', mult:0,   bg:'#2d0000', fg:'#ff5050' },
    { label:'1.5×', mult:1.5, bg:'#000830', fg:'#6699ff' },
    { label:'BUST', mult:0,   bg:'#3a0000', fg:'#ff6060' },
    { label:'5×',   mult:5,   bg:'#221a00', fg:'#FFD97D' },
    { label:'BUST', mult:0,   bg:'#2d0000', fg:'#ff5050' },
    { label:'10×',  mult:10,  bg:'#130020', fg:'#cc88ff' },
  ];

  function getActiveSegs() {
    const s     = oracleState();
    const segs  = BASE_SEGS.map(x => ({ ...x }));
    const now   = new Date();
    const sun   = now.getDay() === 0;
    const peak  = now.getHours() >= 21 && now.getHours() <= 22;

    if (s.bad) {
      // NNN: the 5× and 10× become extra BUSTs
      segs[9]  = { label:'NNN',   mult:0, bg:'#1a0000', fg:'#ff4040' };
      segs[11] = { label:'PAIN',  mult:0, bg:'#0d0000', fg:'#ff2020' };
    } else if (peak && sun) {
      segs[11] = { label:'🌟20×', mult:20, bg:'#0d0030', fg:'#FFD97D' };
    } else if (s.boost) {
      segs[11] = { label:'15×',   mult:15, bg:'#130028', fg:'#cc88ff' };
    }
    return segs;
  }

  function getDynamicWeights() {
    const s = oracleState();
    const n = new Date();
    if (s.bad) {
      // NNN: ~87% bust
      return [0.155,0.040,0.155,0.030,0.155,0.022,0.155,0.030,0.155,0.008,0.087,0.008];
    }
    if (s.boost) {
      // Oracle boost: ~58% bust
      return [0.10,0.085,0.10,0.072,0.10,0.058,0.10,0.072,0.10,0.038,0.10,0.025];
    }
    // Default: ~75% bust
    return [0.125,0.070,0.125,0.055,0.125,0.038,0.125,0.055,0.125,0.022,0.125,0.010];
  }

  function pickSeg() {
    const w = getDynamicWeights();
    let r = Math.random() * w.reduce((a,b) => a+b, 0);
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return w.length - 1;
  }

  function wheelTargetAngle(segIdx, n) {
    const arc = (2 * Math.PI) / n;
    const segCenter = segIdx * arc + arc / 2;
    return ((2 * Math.PI - segCenter) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  }

  function resolveWheelSegIdx(rotation, n) {
    const arc = (2 * Math.PI) / n;
    const rot = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const rel = (2 * Math.PI - rot) % (2 * Math.PI);
    return Math.min(n - 1, Math.floor(rel / arc + 1e-9));
  }

  // ── RECENT WHEEL RESULTS ───────────────────────────────────────
  const KEY_WR = 'nut_wheel_results_v1';

  function saveWheelResult(seg) {
    try {
      const r = JSON.parse(localStorage.getItem(KEY_WR) || '[]');
      r.unshift({ m: seg.mult, t: Date.now() });
      localStorage.setItem(KEY_WR, JSON.stringify(r.slice(0, 8)));
    } catch (_) {}
  }

  function renderWheelStatus() {
    const stEl = document.getElementById('wheelOracleStatus');
    const rrEl = document.getElementById('wheelRecentResults');
    const s = oracleState();

    if (stEl) {
      stEl.textContent = s.label + '  (' + s.mod.toFixed(2) + '×)';
      stEl.className   = 'wheel-oracle-status ' + s.cls;
    }

    if (rrEl) {
      try {
        const results = JSON.parse(localStorage.getItem(KEY_WR) || '[]');
        rrEl.innerHTML = results.length
          ? results.map(r => `<span class="wr-pill ${r.m === 0 ? 'bust' : r.m >= 10 ? 'jackpot' : 'win'}">${r.m === 0 ? 'BUST' : r.m + '×'}</span>`).join('')
          : '<span class="wr-pill empty">–</span>';
      } catch (_) {}
    }
  }

  // ── COIN FLIP ───────────────────────────────────────────────────
  let flipBet = 10, flipSide = null, flipAnim = false;

  function chooseSide(side) {
    flipSide = side;
    renderFlip();
  }

  function adjFlipBet(d) {
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    flipBet = Math.max(1, Math.min(bal, flipBet + d));
    const el = document.getElementById('flipBetDisplay');
    if (el) el.textContent = flipBet.toLocaleString();
  }

  function maxFlipBet() {
    flipBet = Math.max(1, typeof pmGetBalance === 'function' ? pmGetBalance() : 1);
    const el = document.getElementById('flipBetDisplay');
    if (el) el.textContent = flipBet.toLocaleString();
  }

  function renderFlip() {
    const el = document.getElementById('coinFlipPanel');
    if (!el) return;
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    el.innerHTML = `
      <div class="flip-bal">Balance: <strong>${bal.toLocaleString()}</strong> NUTS</div>
      <div class="flip-choose">
        <button class="flip-side-btn ${flipSide==='heads'?'active':''}" onclick="NutCasino.chooseSide('heads')">🟡 HEADS</button>
        <button class="flip-side-btn ${flipSide==='tails'?'active':''}" onclick="NutCasino.chooseSide('tails')">⚪ TAILS</button>
      </div>
      <div class="flip-coin-wrap"><div class="flip-coin" id="flipCoin">${flipSide==='heads'?'🟡':flipSide==='tails'?'⚪':'🥜'}</div></div>
      <div class="bet-row">
        <button class="bet-adj" onclick="NutCasino.adjFlipBet(-10)">−</button>
        <span class="bet-display">Bet: <strong id="flipBetDisplay">${flipBet.toLocaleString()}</strong> NUTS</span>
        <button class="bet-adj" onclick="NutCasino.adjFlipBet(10)">+</button>
        <button class="bet-max" onclick="NutCasino.maxFlipBet()">MAX</button>
      </div>
      <button class="roulette-spin-btn" id="flipGoBtn" onclick="NutCasino.doFlip()" ${!flipSide||flipAnim?'disabled':''}>FLIP</button>
      <div class="spin-result-line" id="flipResult"></div>
      <div class="flip-odds-note">Win: 47.5% · House edge: 5% · Double or nothing</div>
    `;
  }

  function doFlip() {
    if (flipAnim || !flipSide) return;
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    if (bal < flipBet || flipBet < 1) { if (typeof showToast === 'function') showToast('Not enough NUTS'); return; }

    flipAnim = true;
    if (typeof pmSetBalance === 'function') pmSetBalance(bal - flipBet);

    const coin = document.getElementById('flipCoin');
    const res  = document.getElementById('flipResult');
    if (coin) coin.style.animation = 'coinSpin 0.9s ease-in-out';
    if (res)  { res.textContent = ''; res.style.color = ''; }

    const win = Math.random() < 0.475;
    const result = win ? flipSide : (flipSide === 'heads' ? 'tails' : 'heads');

    setTimeout(() => {
      if (coin) { coin.style.animation = ''; coin.textContent = result === 'heads' ? '🟡' : '⚪'; }
      if (win) {
        if (typeof pmSetBalance === 'function') pmSetBalance(pmGetBalance() + flipBet * 2);
        if (res) { res.textContent = `${result.toUpperCase()}! +${flipBet} NUTS profit`; res.style.color = '#44ff88'; }
        if (typeof showToast === 'function') showToast(`🟡 ${result.toUpperCase()}! +${flipBet} NUTS`);
        // Real announcement
        const _u = (typeof nickname !== 'undefined' && nickname) || (typeof genUserName === 'function' && typeof sessionId !== 'undefined' ? genUserName(sessionId) : 'Someone');
        if (window.NutAnnounce) NutAnnounce.emit({ type:'flip', game:'flip', user:_u, profit:flipBet, bet: flipBet, mult:2, big: flipBet >= 50,
          text:`🪙 ${_u} flipped ${result.toUpperCase()} — +${flipBet} NUTS` });
      } else {
        if (res) { res.textContent = `${result.toUpperCase()} — lost ${flipBet} NUTS`; res.style.color = '#ff6060'; }
        if (typeof showToast === 'function') showToast(`⚪ ${result.toUpperCase()}. −${flipBet} NUTS`);
      }
      flipAnim = false;
      renderFlip();
    }, 950);
  }

  // ── CRASH GAME ──────────────────────────────────────────────────
  let crashState = 'idle', crashMult = 1.00, crashTarget = 2.00;
  let crashBet   = 10, crashId = null, crashT0 = 0, crashLastStep = 0;
  let crashBalAtStart = 0;
  let crashHist  = [], crashNPCs = [];
  let crashCanvas, crashCtx;

  function genCrash() {
    const r = Math.random();
    if (r < 0.40) return 1.0 + Math.random() * 0.48;
    if (r < 0.68) return 1.5 + Math.random() * 1.50;
    if (r < 0.82) return 3.0 + Math.random() * 3.00;
    if (r < 0.91) return 6.0 + Math.random() * 9.00;
    if (r < 0.96) return 15.0 + Math.random() * 25.0;
    return 40 + Math.random() * 60;
  }

  function crashStepMs() {
    if (crashMult < 2) return 110;
    if (crashMult < 5) return 95;
    if (crashMult < 15) return 72;
    return 48;
  }

  function tickCrashMult() {
    const next = parseFloat((crashMult + 0.1).toFixed(1));
    if (next >= crashTarget) return crashTarget;
    return next;
  }

  function startCrash() {
    if (crashState !== 'idle') return;
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    if (bal < crashBet || crashBet < 1) { if (typeof showToast === 'function') showToast('Not enough NUTS'); return; }

    crashBalAtStart = bal;
    if (typeof pmSetBalance === 'function') pmSetBalance(bal - crashBet);
    crashTarget = parseFloat(genCrash().toFixed(1));
    crashMult   = 1.0;
    crashState  = 'running';
    crashT0     = performance.now();
    crashLastStep = crashT0;

    // NPC co-players
    const pool = window.NutNPCs ? NutNPCs.NPCS : [];
    crashNPCs  = [];
    const n    = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const npc = pool[Math.floor(Math.random() * pool.length)];
      if (!npc) continue;
      crashNPCs.push({
        npc,
        bet:      5 + Math.floor(Math.random() * 45),
        targetX:  1.15 + Math.random() * 5.5,
        cashedOut: false,
        finalX:   null,
      });
    }

    drawCrash();
    updateCrashUI();
    animCrash();
  }

  function cashOut() {
    if (crashState !== 'running') return;
    crashState = 'cashout';
    cancelAnimationFrame(crashId);
    const payout = Math.floor(crashBet * crashMult);
    const profit = payout - crashBet;
    if (typeof pmSetBalance === 'function') {
      pmSetBalance(crashBalAtStart - crashBet + payout);
    }
    if (typeof showToast === 'function') showToast(`✅ Cashed out ${crashMult.toFixed(1)}× · +${profit} NUTS`);
    // Real announcement
    const _u = (typeof nickname !== 'undefined' && nickname) || (typeof genUserName === 'function' && typeof sessionId !== 'undefined' ? genUserName(sessionId) : 'Someone');
    if (window.NutAnnounce) NutAnnounce.emit({ type:'crash', game:'crash', user:_u, profit, bet: crashBet, mult:crashMult, big: crashMult >= 5,
      text:`🚀 ${_u} cashed out at ${crashMult.toFixed(1)}× for +${profit} NUTS` });
    updateCrashUI();
    drawCrash();
    setTimeout(crashReset, 2800);
  }

  function crashReset() {
    crashHist.unshift(parseFloat(crashTarget.toFixed(2)));
    crashHist = crashHist.slice(0, 8);
    crashState = 'idle';
    crashMult  = 1.00;
    updateCrashUI();
    drawCrash();
  }

  function animCrash(now) {
    if (crashState !== 'running') return;
    const t = now || performance.now();
    if (t - crashLastStep >= crashStepMs()) {
      crashLastStep = t;
      crashMult = tickCrashMult();
    }

    crashNPCs.forEach(nb => {
      if (!nb.cashedOut && crashMult >= nb.targetX) {
        nb.cashedOut = true;
        nb.finalX    = parseFloat(crashMult.toFixed(1));
        // NPC cashout — update visual state only, never surfaces in the ticker
      }
    });

    if (crashMult >= crashTarget) {
      crashMult  = crashTarget;
      crashState = 'crashed';
      cancelAnimationFrame(crashId);
      if (typeof showToast === 'function') showToast('💥 CRASHED at ' + crashMult.toFixed(1) + '×');
      updateCrashUI();
      drawCrash();
      setTimeout(crashReset, 3000);
      return;
    }

    drawCrash();
    updateCrashUI();
    crashId = requestAnimationFrame(animCrash);
  }

  function drawCrash() {
    if (!crashCanvas || !crashCtx) return;
    const ctx = crashCtx;
    const W   = crashCanvas.width, H = crashCanvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050301';
    ctx.fillRect(0, 0, W, H);

    const color = crashState === 'crashed' ? '#ff6060'
                : crashState === 'cashout' ? '#FFD97D'
                : '#4EC97A';

    if (crashState === 'idle') {
      ctx.fillStyle = 'rgba(200,169,110,0.25)';
      ctx.font = '500 12px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLACE BET AND HIT START', W / 2, H / 2);
      return;
    }

    // Curve
    if (crashState === 'running') {
      const PAD  = 14;
      const steps = Math.max(2, Math.round((crashMult - 1) * 10));
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      for (let p = 0; p <= steps; p++) {
        const m = 1 + p * 0.1;
        const x = PAD + (p / steps) * (W - PAD * 2);
        const y = H - PAD - Math.min((m - 1) / Math.max(crashTarget * 1.1 - 1, 1), 1) * (H - PAD * 2 - 10);
        p === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineTo(W - PAD, H - PAD);
      ctx.lineTo(PAD, H - PAD);
      ctx.closePath();
      ctx.fillStyle = 'rgba(78,201,122,0.08)';
      ctx.fill();
    }

    // Big multiplier
    ctx.fillStyle   = color;
    ctx.font        = '900 36px Space\ Mono,ui-monospace,monospace';
    ctx.textAlign   = 'center';
    ctx.fillText(crashMult.toFixed(1) + '×', W / 2, H / 2 + 10);

    if (crashState === 'crashed') {
      ctx.fillStyle = '#ff6060';
      ctx.font      = '700 13px ui-monospace,monospace';
      ctx.fillText('💥 BUSTED', W / 2, H / 2 + 32);
    } else if (crashState === 'cashout') {
      ctx.fillStyle = '#FFD97D';
      ctx.font      = '700 13px ui-monospace,monospace';
      ctx.fillText('✅ CASHED OUT', W / 2, H / 2 + 32);
    }
  }

  function updateCrashUI() {
    const btn  = document.getElementById('crashBtn');
    const nb   = document.getElementById('crashNPCBets');
    const hist = document.getElementById('crashHistory');
    const bal  = document.getElementById('crashBal');

    if (bal) bal.textContent = (typeof pmGetBalance === 'function' ? pmGetBalance() : 0).toLocaleString();

    if (btn) {
      if (crashState === 'idle') {
        btn.textContent = '▶ START';
        btn.className   = 'roulette-spin-btn crash-start-btn';
        btn.disabled    = false;
        btn.onclick     = startCrash;
      } else if (crashState === 'running') {
        btn.textContent = '💰 CASH OUT ' + crashMult.toFixed(1) + '×';
        btn.className   = 'roulette-spin-btn crash-cashout-btn';
        btn.disabled    = false;
        btn.onclick     = cashOut;
      } else {
        btn.textContent = crashState === 'crashed' ? '💥 CRASHED' : '✅ CASHED OUT';
        btn.className   = 'roulette-spin-btn';
        btn.disabled    = true;
      }
    }

    if (nb) {
      nb.innerHTML = crashNPCs.map(c => {
        const tag = c.cashedOut
          ? `<span class="cnb-out">✓ ${c.finalX?.toFixed(1)}×</span>`
          : (crashState === 'crashed' ? '<span class="cnb-bust">BUST</span>' : '<span class="cnb-in">🟢</span>');
        return `<div class="cnb-row"><span class="cnb-name">u/${c.npc.name.slice(0,12)}</span><span class="cnb-bet">${c.bet}🥜</span>${tag}</div>`;
      }).join('') || '';
    }

    if (hist) {
      hist.innerHTML = crashHist.length
        ? crashHist.map(v => `<span class="ch-pill ${v < 1.5 ? 'lo' : v < 4 ? 'md' : 'hi'}">${v.toFixed(1)}×</span>`).join('')
        : '<span class="ch-pill lo">–</span>';
    }
  }

  function adjCrashBet(d) {
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    crashBet  = Math.max(1, Math.min(bal, crashBet + d));
    const el  = document.getElementById('crashBetDisplay');
    if (el) el.textContent = crashBet.toLocaleString();
  }

  function maxCrashBet() {
    crashBet = Math.max(1, typeof pmGetBalance === 'function' ? pmGetBalance() : 1);
    const el = document.getElementById('crashBetDisplay');
    if (el) el.textContent = crashBet.toLocaleString();
  }

  function initCrashCanvas() {
    crashCanvas = document.getElementById('crashCanvas');
    if (!crashCanvas) return;
    crashCtx    = crashCanvas.getContext('2d');
    const wrap  = document.getElementById('crashCanvasWrap');
    const W     = (wrap ? wrap.offsetWidth : 300) || 300;
    const H     = Math.round(W * 0.48);
    crashCanvas.width        = W;
    crashCanvas.height       = H;
    crashCanvas.style.width  = W + 'px';
    crashCanvas.style.height = H + 'px';
    drawCrash();
    updateCrashUI();
  }

  // ── TAB SWITCHER ────────────────────────────────────────────────
  let tabsBound = false;

  function switchTab(tab) {
    document.querySelectorAll('.casino-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.casino-panel').forEach(p => {
      p.style.display = p.id === 'casinoPanel_' + tab ? 'block' : 'none';
    });
    if (tab === 'flip')  { setTimeout(renderFlip, 20); }
    if (tab === 'crash') { setTimeout(initCrashCanvas, 30); }
    if (tab === 'blackjack' && window.NutBlackjack) { setTimeout(() => NutBlackjack.render(), 20); }
    if (tab === 'wheel') {
      renderWheelStatus();
      requestAnimationFrame(() => { if (typeof drawWheel === 'function') drawWheel(typeof wheelAngle !== 'undefined' ? wheelAngle : 0); });
    }
  }

  function bindTabs() {
    if (tabsBound) return;
    const tabs = document.querySelectorAll('.casino-tab');
    if (!tabs.length) return;
    tabs.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    tabsBound = true;
    renderFlip();
    initCrashCanvas();
  }

  // ── INIT ────────────────────────────────────────────────────────
  function init() {
    bindTabs();
    renderWheelStatus();
    if (!window._nutCasinoOracleTick) {
      window._nutCasinoOracleTick = setInterval(renderWheelStatus, 60000);
    }
  }

  function onOpen(tab) {
    bindTabs();
    renderWheelStatus();
    switchTab(tab || 'wheel');
    if (typeof updateRouletteBal === 'function') updateRouletteBal();
  }

  window.NutCasino = {
    init, onOpen, switchTab, bindTabs,
    // wheel
    pickSeg, getActiveSegs, saveWheelResult, renderWheelStatus, wheelTargetAngle, resolveWheelSegIdx,
    // flip
    chooseSide, doFlip, adjFlipBet, maxFlipBet,
    // crash
    startCrash, cashOut, adjCrashBet, maxCrashBet,
  };
})();
