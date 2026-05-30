/**
 * tutorial.js — onboarding + returning-player guide
 * New players: forced log → spin once
 * Returning players: skippable welcome-back recap
 */
(function () {

  const KEY_DONE   = 'nut_onboard_v1_done';
  const KEY_RETURN = 'nut_return_guide_v1_done';
  const KEY_ALL    = 'nut_alltime_v1';
  const KEY_SESSION = 'nut_onboard_just_finished';

  let phase = null; // 'log' | 'spin'
  let els = {};
  let returnEl = null;
  let onResize = null;
  let onMsg = null;
  let onClickCapture = null;

  function allTime() {
    if (typeof countAllTime !== 'undefined') return Math.max(0, Number(countAllTime) || 0);
    return Math.max(0, parseInt(localStorage.getItem(KEY_ALL) || '0', 10) || 0);
  }

  function isOnboardDone() {
    return localStorage.getItem(KEY_DONE) === '1';
  }

  function isReturnGuideDone() {
    return localStorage.getItem(KEY_RETURN) === '1';
  }

  function markOnboardDone() {
    localStorage.setItem(KEY_DONE, '1');
    try { sessionStorage.setItem(KEY_SESSION, '1'); } catch (_) {}
    phase = null;
    teardownForced();
  }

  function dismissReturnGuide() {
    localStorage.setItem(KEY_RETURN, '1');
    hideReturnGuide();
  }

  function isActive() {
    return phase !== null;
  }

  function deferOverlays() {
    return phase === 'log' || phase === 'spin';
  }

  function blockCasinoClose() {
    return phase === 'spin';
  }

  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function injectStyles() {
    if (document.getElementById('nutTutorialStyles')) return;
    const s = document.createElement('style');
    s.id = 'nutTutorialStyles';
    s.textContent = `
      .nut-tut-backdrop{
        position:fixed;inset:0;z-index:9600;
        background:rgba(2,1,0,0.82);
        backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);
      }
      .nut-tut-ring{
        position:fixed;z-index:9602;pointer-events:none;
        border:2px solid rgba(255,217,125,0.95);
        border-radius:999px;
        box-shadow:0 0 0 4px rgba(255,217,125,0.18),0 0 32px rgba(255,160,40,0.45);
        animation:nut-tut-pulse 1.4s ease-in-out infinite;
      }
      @keyframes nut-tut-pulse{
        0%,100%{transform:scale(1);opacity:1;}
        50%{transform:scale(1.04);opacity:.88;}
      }
      .nut-tut-card{
        position:fixed;left:50%;bottom:max(20px,env(safe-area-inset-bottom));
        transform:translateX(-50%);
        z-index:9603;width:min(92vw,380px);
        background:rgba(8,5,2,0.97);
        border:1px solid rgba(200,169,110,0.45);
        border-radius:16px;padding:16px 18px;
        box-shadow:0 16px 48px rgba(0,0,0,0.65);
      }
      .nut-tut-kicker{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
      .nut-tut-title{font-family:'Cinzel',serif;font-size:16px;font-weight:800;color:var(--gold-bright);margin-bottom:6px;}
      .nut-tut-body{font-size:13px;line-height:1.45;color:var(--cream);margin-bottom:10px;}
      .nut-tut-progress{font-size:10px;color:var(--muted);letter-spacing:.08em;}
      .nut-tut-highlight{position:relative;z-index:9601 !important;}
      .nut-tut-casino-bar{
        position:fixed;left:0;right:0;bottom:0;z-index:9200;
        padding:14px 16px max(14px,env(safe-area-inset-bottom));
        background:linear-gradient(180deg,rgba(4,2,0,0) 0%,rgba(4,2,0,0.92) 35%,rgba(4,2,0,0.98) 100%);
        pointer-events:none;text-align:center;
      }
      .nut-tut-casino-bar strong{
        display:block;font-family:'Cinzel',serif;font-size:14px;color:var(--gold-bright);
        letter-spacing:.06em;margin-bottom:4px;
      }
      .nut-tut-casino-bar span{font-size:12px;color:var(--cream);}
      .nut-tut-return{
        position:fixed;inset:0;z-index:9550;
        display:flex;align-items:center;justify-content:center;
        padding:16px;
      }
      .nut-tut-return-backdrop{
        position:absolute;inset:0;
        background:rgba(2,1,0,0.78);
        backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
      }
      .nut-tut-return-box{
        position:relative;z-index:1;width:min(92vw,420px);max-height:min(88vh,560px);overflow:auto;
        background:rgba(8,5,2,0.98);
        border:1px solid rgba(200,169,110,0.45);
        border-radius:18px;padding:20px 20px 16px;
        box-shadow:0 20px 56px rgba(0,0,0,0.7);
        animation:nut-tut-pop .32s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes nut-tut-pop{from{transform:scale(.92);opacity:0;}to{transform:scale(1);opacity:1;}}
      .nut-tut-return-x{
        position:absolute;top:10px;right:10px;
        background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
        color:var(--muted);width:30px;height:30px;border-radius:8px;
        cursor:pointer;font-size:14px;line-height:1;
      }
      .nut-tut-return-x:hover{color:var(--cream);}
      .nut-tut-steps{margin:12px 0 16px;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;}
      .nut-tut-steps li{
        font-size:13px;line-height:1.45;color:var(--cream);
        padding-left:14px;border-left:2px solid rgba(200,169,110,0.35);
      }
      .nut-tut-steps li strong{color:var(--gold-bright);font-weight:800;}
      .nut-tut-return-note{font-size:11px;color:var(--muted);line-height:1.4;margin-bottom:14px;}
      .nut-tut-return-actions{display:flex;gap:10px;}
      .nut-tut-skip,.nut-tut-got,.nut-tut-wheel{
        flex:1;padding:11px 10px;border-radius:10px;font-family:'Cinzel',serif;
        font-size:10px;font-weight:800;letter-spacing:.1em;cursor:pointer;
      }
      .nut-tut-skip{
        background:transparent;border:1px solid rgba(200,169,110,0.28);color:var(--muted);
      }
      .nut-tut-skip:hover{color:var(--cream);border-color:rgba(200,169,110,0.45);}
      .nut-tut-got{
        background:var(--btn-ember);border:1px solid rgba(255,160,40,0.45);color:#1a0a00;
      }
      .nut-tut-wheel{
        margin-top:8px;width:100%;flex:none;
        background:rgba(20,12,4,0.9);border:1px solid rgba(200,169,110,0.35);color:var(--gold-bright);
      }
    `;
    document.head.appendChild(s);
  }

  function buildShell() {
    injectStyles();
    const root = document.createElement('div');
    root.id = 'nutTutorialRoot';
    root.style.display = 'none';
    root.innerHTML = `
      <div class="nut-tut-backdrop" id="nutTutBackdrop"></div>
      <div class="nut-tut-ring" id="nutTutRing"></div>
      <div class="nut-tut-card" id="nutTutCard">
        <div class="nut-tut-kicker" id="nutTutKicker">Welcome</div>
        <div class="nut-tut-title" id="nutTutTitle"></div>
        <div class="nut-tut-body" id="nutTutBody"></div>
        <div class="nut-tut-progress" id="nutTutProgress"></div>
      </div>`;
    document.body.appendChild(root);
    els.root = root;
    els.ring = root.querySelector('#nutTutRing');
    els.kicker = root.querySelector('#nutTutKicker');
    els.title = root.querySelector('#nutTutTitle');
    els.body = root.querySelector('#nutTutBody');
    els.progress = root.querySelector('#nutTutProgress');
  }

  function buildReturnGuide() {
    injectStyles();
    if (returnEl) return returnEl;
    const root = document.createElement('div');
    root.id = 'nutReturnGuide';
    root.className = 'nut-tut-return';
    root.style.display = 'none';
    root.innerHTML = `
      <div class="nut-tut-return-backdrop" data-tut-dismiss></div>
      <div class="nut-tut-return-box">
        <button type="button" class="nut-tut-return-x" aria-label="Skip guide" data-tut-dismiss>✕</button>
        <div class="nut-tut-kicker">Welcome back</div>
        <div class="nut-tut-title">Quick $NUT refresher</div>
        <p class="nut-tut-return-note">Already on the board? Skip anytime. New here? You’ll get the full walkthrough instead.</p>
        <ul class="nut-tut-steps">
          <li><strong>LOG NUT</strong> — pick a method, tap the button. 2× methods rotate every hour.</li>
          <li><strong>Spendable nuts</strong> — bottom-left wallet shows nuts you haven’t converted yet (not lifetime total).</li>
          <li><strong>NUTTOKENS</strong> — convert nuts in the 💎 panel (1 nut = 1,000 tokens). Cash out nuts there too.</li>
          <li><strong>Chart P&amp;L</strong> — play-money portfolio on the index chart. Not real USD.</li>
          <li><strong>🎰 Casino</strong> — spin the wheel with NUTTOKENS. Wallet casino button or WHEEL tile in the lobby.</li>
          <li><strong>Receipt + board</strong> — download or post your nut receipt; climb the global leaderboard.</li>
        </ul>
        <div class="nut-tut-return-actions">
          <button type="button" class="nut-tut-skip" data-tut-dismiss>Skip</button>
          <button type="button" class="nut-tut-got" data-tut-dismiss>Got it</button>
        </div>
        <button type="button" class="nut-tut-wheel" id="nutTutOpenWheel">Open wheel 🎰</button>
      </div>`;
    document.body.appendChild(root);
    root.querySelectorAll('[data-tut-dismiss]').forEach(btn => {
      btn.addEventListener('click', dismissReturnGuide);
    });
    root.querySelector('#nutTutOpenWheel')?.addEventListener('click', () => {
      dismissReturnGuide();
      if (typeof openNutWheel === 'function') openNutWheel();
      else if (window.NutKens) NutKens.openCasino('wheel');
    });
    returnEl = root;
    return root;
  }

  function showReturnGuide() {
    if (isReturnGuideDone() || phase) return;
    try { if (sessionStorage.getItem(KEY_SESSION)) return; } catch (_) {}
    const el = buildReturnGuide();
    el.style.display = 'flex';
  }

  function hideReturnGuide() {
    if (returnEl) returnEl.style.display = 'none';
  }

  function setCard(kicker, title, body, progress) {
    if (!els.kicker) return;
    els.kicker.textContent = kicker;
    els.title.textContent = title;
    els.body.textContent = body;
    els.progress.textContent = progress;
  }

  function positionRing(target) {
    if (!target || !els.ring) return;
    const r = target.getBoundingClientRect();
    els.ring.style.display = 'block';
    els.ring.style.top = Math.max(4, r.top - 10) + 'px';
    els.ring.style.left = Math.max(4, r.left - 10) + 'px';
    els.ring.style.width = Math.max(40, r.width + 20) + 'px';
    els.ring.style.height = Math.max(40, r.height + 20) + 'px';
    els.ring.style.borderRadius = target.classList.contains('nut-btn') ? '999px' : '14px';
  }

  function clearHighlight() {
    document.querySelectorAll('.nut-tut-highlight').forEach(el => el.classList.remove('nut-tut-highlight'));
    if (els.ring) els.ring.style.display = 'none';
  }

  function blockClicks(step) {
    if (onClickCapture) document.removeEventListener('click', onClickCapture, true);
    onClickCapture = (e) => {
      if (phase !== step) return;
      const nutBtn = document.querySelector('.nut-btn');
      if (step === 'log' && nutBtn && (nutBtn === e.target || nutBtn.contains(e.target))) return;
      e.preventDefault();
      e.stopPropagation();
      if (step === 'log') toast('Tap LOG NUT to continue');
    };
    document.addEventListener('click', onClickCapture, true);
  }

  function ensureTutorialChips() {
    const all = allTime();
    if (window.NutKens) {
      if (NutKens.getBalance() < 10 && NutKens.getConvertible(all) > 0) {
        NutKens.convert(1, all);
      }
      if (NutKens.getBalance() < 10 && typeof pmSetBalance === 'function') {
        pmSetBalance(Math.max(NutKens.getBalance(), 1000));
      }
    } else if (typeof pmSetBalance === 'function') {
      pmSetBalance(Math.max(typeof pmGetBalance === 'function' ? pmGetBalance() : 0, 1000));
    }
  }

  function showCasinoBar() {
    let bar = document.getElementById('nutTutCasinoBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'nutTutCasinoBar';
      bar.className = 'nut-tut-casino-bar';
      bar.innerHTML = '<strong>Step 2 · Spin the wheel</strong><span>Tap SPIN THE WHEEL once to finish onboarding</span>';
      document.body.appendChild(bar);
    }
    bar.style.display = 'block';
    const closeBtn = document.getElementById('casinoOverlayClose');
    if (closeBtn) closeBtn.style.display = 'none';
  }

  function hideCasinoBar() {
    const bar = document.getElementById('nutTutCasinoBar');
    if (bar) bar.style.display = 'none';
    const closeBtn = document.getElementById('casinoOverlayClose');
    if (closeBtn) closeBtn.style.display = '';
  }

  function openTutorialCasino() {
    const overlay = document.getElementById('casinoAppOverlay');
    const frame = document.getElementById('casinoAppFrame');
    if (!overlay || !frame) {
      toast('Casino unavailable');
      markOnboardDone();
      return;
    }
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    frame.src = './casino-app.html?tutorial=1';
    showCasinoBar();
  }

  function sendIframe(msg) {
    const frame = document.getElementById('casinoAppFrame');
    if (!frame || !frame.contentWindow) return;
    try { frame.contentWindow.postMessage(msg, '*'); } catch (_) {}
  }

  function startLogStep() {
    hideReturnGuide();
    phase = 'log';
    if (!els.root) buildShell();
    els.root.style.display = 'block';
    setCard(
      'Welcome to $NUT',
      'Log your first nut',
      'Pick a method if you want, then tap LOG NUT. Every nut counts on the ledger.',
      'Step 1 of 2 · new player tutorial'
    );

    const nutBtn = document.querySelector('.nut-btn');
    const card = document.getElementById('nutCard');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (nutBtn) {
      nutBtn.classList.add('nut-tut-highlight');
      positionRing(nutBtn);
      onResize = () => positionRing(nutBtn);
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onResize, true);
    }
    blockClicks('log');
  }

  function startSpinStep() {
    phase = 'spin';
    clearHighlight();
    if (onClickCapture) document.removeEventListener('click', onClickCapture, true);
    onClickCapture = null;
    if (onResize) {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      onResize = null;
    }
    if (els.root) els.root.style.display = 'none';

    toast('Nice. Opening the wheel…');
    ensureTutorialChips();
    setTimeout(openTutorialCasino, 600);

    if (!onMsg) {
      onMsg = (e) => {
        if (!e.data || e.data.type !== 'casino:spinDone') return;
        if (phase !== 'spin') return;
        finishForced();
      };
      window.addEventListener('message', onMsg);
    }
  }

  function finishForced() {
    sendIframe({ type: 'tutorial:mode', on: false });
    hideCasinoBar();
    localStorage.setItem(KEY_RETURN, '1');
    markOnboardDone();
    toast('Tutorial complete — welcome to $NUT 🥜');
  }

  function teardownForced() {
    clearHighlight();
    if (onClickCapture) document.removeEventListener('click', onClickCapture, true);
    onClickCapture = null;
    if (onResize) {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      onResize = null;
    }
    if (onMsg) {
      window.removeEventListener('message', onMsg);
      onMsg = null;
    }
    if (els.root) els.root.style.display = 'none';
    hideCasinoBar();
    sendIframe({ type: 'tutorial:mode', on: false });
  }

  function onNutLogged() {
    if (phase !== 'log') return;
    startSpinStep();
  }

  function init() {
    injectStyles();
    const all = allTime();

    if (all === 0 && !isOnboardDone()) {
      setTimeout(startLogStep, 1400);
      return;
    }

    if (all > 0 && !isReturnGuideDone()) {
      try { if (sessionStorage.getItem(KEY_SESSION)) return; } catch (_) {}
      setTimeout(showReturnGuide, 1800);
    }
  }

  window.NutTutorial = {
    init, onNutLogged, isActive, deferOverlays, blockCasinoClose,
    showReturnGuide, dismissReturnGuide,
  };
})();
