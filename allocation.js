/**
 * $NUT Airdrop Allocation Machine
 */
(function () {
  const KEY_GENESIS_JOIN = 'nut_genesis_join_v1';
  const KEY_REF_BY       = 'nut_ref_by_v1';
  const KEY_REF_COUNT    = 'nut_ref_count_v1';
  const KEY_REF_CLAIMED  = 'nut_ref_claimed_v1';
  const KEY_WAVE1        = 'nut_snapshot_wave1_v1';

  const WAVE1_LOCKED = true;
  const WAVE2_END    = new Date('2026-06-10T23:59:59Z').getTime();

  const TIERS = [
    { id: 'genesis', label: 'GENESIS NUT', badge: '🥜✦', mult: 3, pct: -1 },
    { id: 'diamond', label: 'DIAMOND NUT', badge: '💎', mult: 2, pct: 1 },
    { id: 'gold',    label: 'GOLD NUT',    badge: '🌟', mult: 1.5, pct: 5 },
    { id: 'silver',  label: 'SILVER NUT',  badge: '⚡', mult: 1, pct: 25 },
    { id: 'paper',   label: 'PAPER NUT',   badge: '📜', mult: 0.5, pct: 100 },
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hasGenesisBonus() {
    if (localStorage.getItem(KEY_GENESIS_JOIN)) return true;
    if (typeof CONTRACT_ADDR !== 'undefined' && !CONTRACT_ADDR && (countAllTime || 0) >= 1) {
      markGenesisJoin();
      return true;
    }
    return false;
  }

  function markGenesisJoin() {
    if (localStorage.getItem(KEY_GENESIS_JOIN)) return;
    localStorage.setItem(KEY_GENESIS_JOIN, new Date().toISOString());
    if (window.NutAddons && NutAddons.addStamp) NutAddons.addStamp('genesis', 'Genesis Era');
  }

  function parseReferral() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref || ref.length < 8) return;
    if (ref === (typeof sessionId !== 'undefined' ? sessionId : '')) return;
    if (localStorage.getItem(KEY_REF_BY)) return;
    localStorage.setItem(KEY_REF_BY, ref);
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', clean);
  }

  function claimReferralOnFirstLog() {
    const ref = localStorage.getItem(KEY_REF_BY);
    if (!ref || localStorage.getItem(KEY_REF_CLAIMED)) return;
    localStorage.setItem(KEY_REF_CLAIMED, '1');
    if (typeof pmEarnTokens === 'function') pmEarnTokens(50);
    if (window.NutAddons && NutAddons.addStamp) NutAddons.addStamp('invited', 'Invited');
    if (typeof showToast === 'function') showToast('Invited bonus: +50 NUTS ✦');
    // Referrer count is local-only until Supabase referral RPC exists
    try {
      const key = 'nut_ref_incoming_' + ref;
      const pending = JSON.parse(localStorage.getItem(key) || '[]');
      pending.push(typeof sessionId !== 'undefined' ? sessionId : 'anon');
      localStorage.setItem(key, JSON.stringify(pending.slice(-50)));
    } catch (_) {}
  }

  function getReferralCount() {
    return Math.max(0, parseInt(localStorage.getItem(KEY_REF_COUNT) || '0', 10));
  }

  function getReferralLink() {
    const sid = typeof sessionId !== 'undefined' ? sessionId : '';
    return `${typeof SITE_URL !== 'undefined' ? SITE_URL : window.location.origin}/?ref=${encodeURIComponent(sid)}`;
  }

  function crewRankBonus() {
    const crew = (localStorage.getItem('nut_crew_v1') || '').trim();
    if (!crew) return 0;
    const active = (countAllTime || 0) >= 5 ? 1 : 0;
    return active * 12;
  }

  function crewMultiplier() {
    const crew = (localStorage.getItem('nut_crew_v1') || '').trim();
    if (!crew) return 1;
    const members = Math.min(5, Math.max(1, Math.floor((countAllTime || 0) / 3)));
    return members >= 5 ? 1.1 : 1;
  }

  function computeBaseScore() {
    const all = countAllTime || 0;
    const streak = typeof currentStreak !== 'undefined' ? currentStreak : 0;
    const methods = typeof uniqueMethodsToday === 'function' ? uniqueMethodsToday() : 0;
    const uniqueAll = Object.keys(typeof typeStatsAll !== 'undefined' ? typeStatsAll : {}).length;
    const genesis = hasGenesisBonus() ? 200 : 0;
    const refs = getReferralCount() * 25;
    const crew = crewRankBonus();
    return Math.floor(
      all * 1.0 +
      streak * 15 +
      Math.max(methods, Math.min(uniqueAll, 10)) * 8 +
      genesis +
      refs +
      crew
    );
  }

  function rankPercentile(lbCache) {
    const sid = typeof sessionId !== 'undefined' ? sessionId : '';
    const idx = (lbCache || []).findIndex(r => r.session_id === sid || r.isYou);
    if (idx < 0) return 100;
    const total = Math.max((lbCache || []).length, 1);
    return ((idx + 1) / total) * 100;
  }

  function pickTier(pct, genesis) {
    if (genesis && (typeof CONTRACT_ADDR === 'undefined' || !CONTRACT_ADDR)) return TIERS[0];
    if (pct <= 1) return TIERS[1];
    if (pct <= 5) return TIERS[2];
    if (pct <= 25) return TIERS[3];
    return TIERS[4];
  }

  function computeAllocation(lbCache) {
    const base = computeBaseScore();
    const pct = rankPercentile(lbCache);
    const tier = pickTier(pct, hasGenesisBonus());
    const alloc = Math.floor(base * tier.mult * crewMultiplier());
    return { base, alloc, tier, pct, genesis: hasGenesisBonus(), refs: getReferralCount() };
  }

  function snapshotHtml() {
    const now = Date.now();
    const w2left = Math.max(0, WAVE2_END - now);
    const d = Math.floor(w2left / 86400000);
    const h = Math.floor((w2left % 86400000) / 3600000);
    const m = Math.floor((w2left % 3600000) / 60000);
    const w2 = w2left <= 0 ? 'LOCKED' : `${d}d ${h}h ${m}m`;
    return `
      <div class="snap-row">
        <div class="snap-pill ${WAVE1_LOCKED ? 'locked' : ''}"><span>Wave 1</span><strong>${WAVE1_LOCKED ? 'LOCKED ✓' : 'OPEN'}</strong></div>
        <div class="snap-pill active"><span>Wave 2 snapshot</span><strong>${w2}</strong></div>
      </div>`;
  }

  function render(lbCache) {
    const box = document.getElementById('lbAllocation');
    if (!box) return;
    const a = computeAllocation(lbCache || []);
    box.innerHTML = `
      <div class="alloc-card">
        <div class="alloc-hdr">
          <div>
            <div class="alloc-kicker">Airdrop allocation</div>
            <div class="alloc-amt">${a.alloc.toLocaleString()} <span>pts</span></div>
          </div>
          <div class="alloc-tier">${a.tier.badge}<br><span>${esc(a.tier.label)}</span></div>
        </div>
        ${snapshotHtml()}
        <div class="alloc-breakdown">
          <span>base ${a.base.toLocaleString()}</span>
          <span>×${a.tier.mult} tier</span>
          ${a.genesis ? '<span>+200 genesis</span>' : ''}
          <span>${a.refs} refs</span>
          <span>top ${a.pct.toFixed(1)}%</span>
        </div>
        <div class="alloc-actions">
          <button type="button" class="alloc-btn" onclick="NutAllocation.copyRefLink()">Copy ref link</button>
          <button type="button" class="alloc-btn ghost" onclick="NutAllocation.shareCard()">Share allocation</button>
        </div>
      </div>`;
  }

  function copyRefLink() {
    navigator.clipboard?.writeText(getReferralLink()).catch(() => {});
    if (typeof showToast === 'function') showToast('Referral link copied ✦');
  }

  async function shareCard() {
    const lb = typeof lbCache !== 'undefined' ? lbCache : [];
    const a = computeAllocation(lb);
    const name = typeof nickname !== 'undefined' && nickname ? nickname : 'Anon';
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050301';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.strokeStyle = '#FFD97D';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1270);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD97D';
    ctx.font = '900 72px Inter,system-ui,sans-serif';
    ctx.fillText('$NUT ALLOCATION', 540, 160);
    ctx.font = '700 48px Inter,system-ui,sans-serif';
    ctx.fillStyle = '#EDE8DF';
    ctx.fillText(name, 540, 280);
    ctx.font = '900 120px "Space Mono",monospace';
    ctx.fillStyle = '#FFD97D';
    ctx.fillText(a.alloc.toLocaleString(), 540, 450);
    ctx.font = '600 32px Inter,system-ui,sans-serif';
    ctx.fillStyle = '#8A7868';
    ctx.fillText('ALLOCATION POINTS', 540, 510);
    ctx.font = '700 56px Inter,system-ui,sans-serif';
    ctx.fillText(`${a.tier.badge} ${a.tier.label}`, 540, 620);
    ctx.font = '500 28px Inter,system-ui,sans-serif';
    ctx.fillText(`Wave 2 snapshot · top ${a.pct.toFixed(1)}%`, 540, 700);
    ctx.fillText(typeof SITE_URL !== 'undefined' ? SITE_URL.replace('https://', '') : 'nutcoin-alpha.vercel.app', 540, 1200);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const text = `sitting on ${a.alloc.toLocaleString()} $NUT allocation · tier: ${a.tier.label} · get in before snapshot ${typeof SITE_URL !== 'undefined' ? SITE_URL : ''}`;
    if (navigator.share && blob) {
      try {
        await navigator.share({ text, files: [new File([blob], 'nut-allocation.png', { type: 'image/png' })] });
        return;
      } catch (_) {}
    }
    navigator.clipboard?.writeText(text).catch(() => {});
    if (typeof showToast === 'function') showToast('Allocation text copied ✦');
  }

  function onNutLogged() {
    if (!CONTRACT_ADDR && (countAllTime || 0) >= 1) markGenesisJoin();
    if ((countAllTime || 0) === 1 && localStorage.getItem(KEY_REF_BY)) claimReferralOnFirstLog();
    render(typeof lbCache !== 'undefined' ? lbCache : []);
  }

  function onLeaderboard(rows) {
    render(rows || []);
  }

  function init() {
    parseReferral();
    if ((countAllTime || 0) >= 1) markGenesisJoin();
    render(typeof lbCache !== 'undefined' ? lbCache : []);
    setInterval(() => render(typeof lbCache !== 'undefined' ? lbCache : []), 60000);
  }

  window.NutAllocation = {
    init, onNutLogged, onLeaderboard, computeAllocation,
    copyRefLink, shareCard, getReferralLink, hasGenesisBonus,
  };
})();
