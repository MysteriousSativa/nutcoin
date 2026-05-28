/**
 * $NUT Buy CTA — bridge logging to pump.fun buy pressure (no fake charts)
 */
(function () {
  const KEY_NUDGE_DAY = 'nut_buy_nudge_day_v1';
  const KEY_NUDGE_COUNT = 'nut_buy_nudge_count_v1';

  function hasCA() {
    return !!(typeof CONTRACT_ADDR !== 'undefined' && CONTRACT_ADDR);
  }

  function buyUrl() {
    return typeof PUMP_FUN_URL !== 'undefined' ? PUMP_FUN_URL : 'https://pump.fun';
  }

  function appendBuyToShare(text) {
    const url = buyUrl();
    const tag = hasCA()
      ? `\n\nBUY $NUT ↗ ${url}`
      : `\n\n$NUT launches on pump.fun · log nuts now ↗ ${typeof SITE_URL !== 'undefined' ? SITE_URL : url}`;
    if (text.includes('pump.fun') || text.includes('BUY $NUT')) return text;
    return text + tag;
  }

  function renderTicker() {
    const el = document.getElementById('buyPriceTicker');
    if (!el) return;
    if (!hasCA()) {
      el.innerHTML = '<span class="bpt-pre">Pre-launch · log nuts · be early</span>';
      return;
    }
    const px = typeof NUT_PRICE_USD !== 'undefined' && NUT_PRICE_USD ? NUT_PRICE_USD : null;
    if (px === null) {
      el.innerHTML = '<span class="bpt-loading">$NUT price loading…</span>';
      return;
    }
    const chg = px > 0 ? 'live' : 'flat';
    el.innerHTML = `<span class="bpt-live">$NUT <strong>$${px < 0.0001 ? px.toExponential(2) : px.toFixed(px < 1 ? 6 : 4)}</strong></span>
      <button type="button" class="bpt-buy" onclick="NutBuyCta.goBuy()">Buy ↗</button>`;
    el.className = 'buy-price-ticker ' + chg;
  }

  function showBuyNudge(points) {
    const day = typeof dateStr !== 'undefined' ? dateStr : new Date().toISOString().slice(0, 10);
    const lastDay = localStorage.getItem(KEY_NUDGE_DAY) || '';
    let count = parseInt(localStorage.getItem(KEY_NUDGE_COUNT) || '0', 10);
    if (lastDay !== day) { count = 0; localStorage.setItem(KEY_NUDGE_DAY, day); }
    if (count >= 3) return;
    count++;
    localStorage.setItem(KEY_NUDGE_COUNT, String(count));

    const bar = document.getElementById('buyNudge');
    if (!bar) return;

    const nuts = typeof countAllTime !== 'undefined' ? countAllTime : 0;
    const msg = hasCA()
      ? `+${points} logged. ${nuts.toLocaleString()} nuts on record. Stack $NUT while it runs.`
      : `+${points} logged. Genesis window open. Set name + share before launch.`;

    bar.innerHTML = `
      <div class="buy-nudge-inner">
        <span class="buy-nudge-msg">${msg}</span>
        <button type="button" class="buy-nudge-btn" onclick="NutBuyCta.goBuy(true)">${hasCA() ? 'Buy $NUT' : 'pump.fun ↗'}</button>
        <button type="button" class="buy-nudge-x" onclick="NutBuyCta.dismissNudge()" aria-label="Dismiss">✕</button>
      </div>`;
    bar.classList.add('show');
    clearTimeout(window._buyNudgeTimer);
    window._buyNudgeTimer = setTimeout(() => bar.classList.remove('show'), 12000);
  }

  function dismissNudge() {
    document.getElementById('buyNudge')?.classList.remove('show');
    localStorage.setItem(KEY_NUDGE_COUNT, '99');
  }

  function goBuy(fromNudge) {
    if (hasCA() && typeof window.openBuy === 'function') {
      window.openBuy();
      return;
    }
    window.open(buyUrl(), '_blank', 'noopener,noreferrer');
    if (typeof showToast === 'function') showToast(fromNudge ? 'pump.fun ↗' : 'Join before launch');
  }

  function onNutLogged(points) {
    showBuyNudge(points);
    renderTicker();
  }

  function patchShare() {
    if (window._nutBuySharePatched) return;
    window._nutBuySharePatched = true;

    const origStir = window.pickStirTweet;
    if (typeof origStir === 'function') {
      window.pickStirTweet = function () {
        return appendBuyToShare(origStir());
      };
    }

    const origCert = window.pickCertStirTweet;
    if (typeof origCert === 'function') {
      window.pickCertStirTweet = function () {
        return appendBuyToShare(origCert());
      };
    }
  }

  function injectUI() {
    if (document.getElementById('buyPriceTicker')) return;

    const top = document.querySelector('.buy-banner-top');
    const banner = top || document.getElementById('buyBanner');
    if (banner) {
      const ticker = document.createElement('div');
      ticker.id = 'buyPriceTicker';
      ticker.className = 'buy-price-ticker';
      banner.appendChild(ticker);
    }

    if (!document.getElementById('buyNudge')) {
      const nudge = document.createElement('div');
      nudge.id = 'buyNudge';
      nudge.className = 'buy-nudge';
      document.body.appendChild(nudge);
    }
  }

  function init() {
    injectUI();
    patchShare();
    renderTicker();
    setInterval(renderTicker, 45000);
  }

  window.NutBuyCta = {
    init,
    onNutLogged,
    goBuy,
    dismissNudge,
    appendBuyToShare,
    renderTicker,
  };
})();
