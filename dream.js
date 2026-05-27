/**
 * $NUT Dream Machine — mcap calculator, bag flex, milestone unlocks
 */
(function () {
  // Research-derived supply: 2,528,000,000,000 documented global instances 2014-2024
  // Sources: NSSHB, NATSAL-4, Kinsey Institute — see /whitepaper.html
  const NUT_TOTAL_SUPPLY = 2_528_000_000_000;
  const PROJECTED_SUPPLY = NUT_TOTAL_SUPPLY;
  const MCAP_RUNGS = [
    { label: '$500K launch', cap: 500_000 },
    { label: '$1M penny', cap: 1_000_000 },
    { label: '$5M trending', cap: 5_000_000 },
    { label: '$10M top 100', cap: 10_000_000 },
    { label: '$50M blue chip', cap: 50_000_000 },
    { label: '$100M moon', cap: 100_000_000 },
    { label: '$1B generational', cap: 1_000_000_000 },
  ];
  const REF_COINS = [
    { sym: 'BONK', peak100: 4200 },
    { sym: 'WIF', peak100: 2800 },
    { sym: 'PEPE', peak100: 3500 },
    { sym: 'FLOKI', peak100: 1200 },
  ];
  const KEY_UNLOCKS = 'nut_dream_unlocks_v1';
  const KEY_TARGET  = 'nut_dream_target_v1';

  let open = false;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function myNuts() {
    return typeof pmGetBalance === 'function' ? pmGetBalance() : (countAllTime || 0);
  }

  function holderPct(nuts) {
    return (nuts / PROJECTED_SUPPLY) * 100;
  }

  function valueAtMcap(nuts, mcap) {
    const share = nuts / PROJECTED_SUPPLY;
    return share * mcap;
  }

  function fmtUsd(n) {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1) return '$' + n.toFixed(2);
    if (n >= 0.01) return '$' + n.toFixed(4);
    return '$' + n.toFixed(6);
  }

  function getUnlocks() {
    try { return JSON.parse(localStorage.getItem(KEY_UNLOCKS) || '{}') || {}; } catch { return {}; }
  }
  function setUnlock(id) {
    const u = getUnlocks(); u[id] = true;
    localStorage.setItem(KEY_UNLOCKS, JSON.stringify(u));
    applyUnlocks();
  }

  function checkMcapUnlocks(mcap) {
    if (mcap >= 500_000) setUnlock('500k');
    if (mcap >= 1_000_000) setUnlock('1m');
    if (mcap >= 5_000_000) setUnlock('5m');
    if (mcap >= 10_000_000) setUnlock('10m');
    if (mcap >= 100_000_000) setUnlock('100m');
  }

  function applyUnlocks() {
    const u = getUnlocks();
    document.getElementById('tokenFloat')?.classList.toggle('unlock-live', !!u['500k']);
    document.body.classList.toggle('dream-1m', !!u['1m']);
    document.body.classList.toggle('dream-5m', !!u['5m']);
    document.body.classList.toggle('dream-10m', !!u['10m']);
    document.body.classList.toggle('dream-hof', !!u['100m']);
  }

  function liveMcap() {
    if (typeof NUT_PRICE_USD !== 'undefined' && NUT_PRICE_USD && typeof CONTRACT_ADDR !== 'undefined' && CONTRACT_ADDR) {
      return NUT_PRICE_USD * PROJECTED_SUPPLY;
    }
    return 0;
  }

  function render() {
    const panel = document.getElementById('dreamPanel');
    if (!panel) return;
    const nuts = myNuts();
    const pct = holderPct(nuts);
    const rank = Math.max(1, Math.floor((pct / 100) * 10000));
    const target = parseFloat(localStorage.getItem(KEY_TARGET) || '10000') || 10000;
    const mcap = liveMcap();
    checkMcapUnlocks(mcap);

    const earnRate = Math.max(1, countToday || 1);
    let needMcap = 5_000_000;
    for (const r of MCAP_RUNGS) {
      if (valueAtMcap(nuts, r.cap) >= target) { needMcap = r.cap; break; }
      needMcap = r.cap;
    }
    const daysToTarget = nuts > 0 && earnRate > 0
      ? Math.ceil(((target / valueAtMcap(Math.max(1, nuts), needMcap)) * nuts - nuts) / earnRate)
      : '∞';

    panel.innerHTML = `
      <div class="dream-hdr">
        <strong>Dream Machine</strong>
        <button type="button" class="dream-x" onclick="NutDream.toggle()">✕</button>
      </div>
      <div class="dream-bal">${nuts.toLocaleString()} <span>NUTS</span></div>
      <div class="dream-tabs">
        <button type="button" class="dream-tab active" data-dm="mcap">Mcap ladder</button>
        <button type="button" class="dream-tab" data-dm="hist">What if</button>
        <button type="button" class="dream-tab" data-dm="rank">Rank</button>
      </div>
      <div class="dream-body" id="dreamBody">
        ${renderMcap(nuts)}
      </div>
      <div class="dream-wallet">
        <label>Target exit USD</label>
        <div class="dream-wallet-row">
          <input id="dreamTargetInput" type="number" value="${target}" min="100" step="100"/>
          <button type="button" onclick="NutDream.saveTarget()">Calc</button>
        </div>
        <div class="dream-wallet-out">Need ~${fmtUsd(needMcap)} mcap · ~${daysToTarget} days at today pace</div>
      </div>
      <button type="button" class="dream-share" onclick="NutDream.shareBags()">SHARE MY BAGS</button>
      <div class="dream-rank-line">You hold <strong>${pct.toFixed(8)}%</strong> of the documented decade · equiv rank <strong>#${rank}</strong> if 10,000 holders</div>`;

    panel.querySelectorAll('.dream-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.dream-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.dm;
        const body = document.getElementById('dreamBody');
        if (mode === 'mcap') body.innerHTML = renderMcap(nuts);
        else if (mode === 'hist') body.innerHTML = renderHist();
        else body.innerHTML = renderRank(nuts, pct, rank);
      });
    });
  }

  function renderMcap(nuts) {
    return `<div class="dream-ladder">${MCAP_RUNGS.map(r => {
      const v = valueAtMcap(nuts, r.cap);
      const h = Math.min(100, (r.cap / 1_000_000_000) * 100);
      return `<div class="dream-rung"><div class="dream-rung-bar" style="height:${Math.max(8, h)}px"></div><span class="dream-rung-cap">${esc(r.label)}</span><strong>${fmtUsd(v)}</strong></div>`;
    }).join('')}</div>`;
  }

  function renderHist() {
    return `<div class="dream-hist">${REF_COINS.map(c =>
      `<div class="dream-hist-card"><span>${c.sym}</span><strong>$100 → ${fmtUsd(c.peak100)}</strong><small>at peak (reference)</small></div>`
    ).join('')}<p class="dream-note">$NUT is pre-launch. You are early. Not financial advice.</p></div>`;
  }

  function renderRank(nuts, pct, rank) {
    return `<div class="dream-rank-box">
      <div class="dream-rank-big">${pct.toFixed(5)}%</div>
      <div>of total $NUT supply</div>
      <div class="dream-rank-sub">Equivalent holder rank if supply were 10,000 wallets: <strong>#${rank}</strong></div>
      <div class="dream-rank-sub">${nuts.toLocaleString()} NUTS logged</div>
    </div>`;
  }

  function toggle() {
    open = !open;
    const panel = document.getElementById('dreamPanel');
    if (!panel) return;
    panel.classList.toggle('open', open);
    if (open) render();
  }

  function saveTarget() {
    const inp = document.getElementById('dreamTargetInput');
    const v = parseFloat(inp?.value || '10000') || 10000;
    localStorage.setItem(KEY_TARGET, String(v));
    render();
  }

  async function shareBags() {
    const nuts = myNuts();
    const name = typeof nickname !== 'undefined' && nickname ? nickname : 'Anon';
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050301'; ctx.fillRect(0, 0, 1080, 1350);
    ctx.strokeStyle = '#FFD97D'; ctx.lineWidth = 4; ctx.strokeRect(40, 40, 1000, 1270);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD97D'; ctx.font = '900 64px Inter,sans-serif';
    ctx.fillText('🥜 $NUT BAGS', 540, 140);
    ctx.fillStyle = '#EDE8DF'; ctx.font = '700 44px Inter,sans-serif';
    ctx.fillText(name, 540, 230);
    ctx.font = '900 100px "Space Mono",monospace'; ctx.fillStyle = '#FFD97D';
    ctx.fillText(nuts.toLocaleString(), 540, 380);
    ctx.font = '600 28px Inter,sans-serif'; ctx.fillStyle = '#8A7868';
    ctx.fillText('NUTS', 540, 430);
    const lines = [
      ['$1M mcap', valueAtMcap(nuts, 1_000_000)],
      ['$10M mcap', valueAtMcap(nuts, 10_000_000)],
      ['$100M mcap', valueAtMcap(nuts, 100_000_000)],
    ];
    lines.forEach((l, i) => {
      ctx.font = '500 26px Inter,sans-serif'; ctx.fillStyle = '#8A7868';
      ctx.fillText('Worth ' + fmtUsd(l[1]) + ' at ' + l[0], 540, 520 + i * 70);
    });
    ctx.font = '500 24px Inter,sans-serif';
    ctx.fillText('GET IN → ' + (typeof SITE_URL !== 'undefined' ? SITE_URL.replace('https://', '') : 'nutcoin-alpha.vercel.app'), 540, 1180);
    const text = `my $NUT bags 🥜 ${nuts.toLocaleString()} NUTS · not financial advice ${typeof SITE_URL !== 'undefined' ? SITE_URL : ''}`;
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (navigator.share && blob) {
      try {
        await navigator.share({ text, files: [new File([blob], 'nut-bags.png', { type: 'image/png' })] });
        return;
      } catch (_) {}
    }
    navigator.clipboard?.writeText(text).catch(() => {});
    if (typeof showToast === 'function') showToast('Bag flex copied ✦');
  }

  function init() {
    applyUnlocks();
    const usd = document.getElementById('pmBalFloatUSD');
    if (usd) {
      usd.style.cursor = 'pointer';
      usd.title = 'Open Dream Machine';
      usd.addEventListener('click', toggle);
    }
    document.getElementById('tokenFloat')?.addEventListener('dblclick', toggle);
  }

  window.NutDream = { init, toggle, render, saveTarget, shareBags };
})();
