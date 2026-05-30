/**
 * portfolio.js — Nut positions as live chart orders
 * Each logged nut = an order on the index chart; NutOracle drives P&L.
 */
(function () {

  const KEY_ORDERS = 'nut_portfolio_orders_v1';
  const NUT_USD    = 1;
  const ORACLE_AVG = 0.86;

  let orders = [];

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY_ORDERS) || '[]');
      orders = Array.isArray(raw) ? raw : [];
    } catch (_) {
      orders = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY_ORDERS, JSON.stringify(orders.slice(-500)));
    } catch (_) {}
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function oracleDrift(ts) {
    if (!window.NutOracle || !NutOracle.predictHourly) return 1;
    const entry = NutOracle.predictHourly(new Date(ts));
    const now   = NutOracle.predictHourly(new Date());
    const eNorm = entry / (NutOracle.GLOBAL_HOURLY_BASELINE || 1);
    const nNorm = now / (NutOracle.GLOBAL_HOURLY_BASELINE || 1);
    return Math.max(0.82, Math.min(1.18, nNorm / Math.max(eNorm, 0.01)));
  }

  function chartSlotForId(id, pointCount) {
    const spread = Math.min(48, Math.max(12, pointCount));
    const h = hashStr(id);
    return Math.max(0, pointCount - 1 - (h % spread));
  }

  function pointMeta(idx) {
    if (window.NutChart && NutChart.getPointMeta) return NutChart.getPointMeta(idx);
    return { y: 2026, m: 0, v: 100 };
  }

  function addOrders(qty, method, ts) {
    const pts = window.NutChart && NutChart.getPointCount ? NutChart.getPointCount() : 120;
    const t0  = ts || Date.now();
    for (let i = 0; i < qty; i++) {
      const id = `o_${t0}_${i}_${hashStr(method + i)}`;
      const slot = chartSlotForId(id, pts);
      const meta = pointMeta(slot);
      orders.push({
        id,
        kind: 'nut',
        method: method || 'solo',
        ts: t0 + i,
        chartY: meta.y,
        chartM: meta.m,
        entryVal: meta.v,
        qty: 1,
      });
    }
    save();
    tick(true);
  }

  function valuate(order) {
    const liveVal = window.NutChart && NutChart.getLiveValue
      ? NutChart.getLiveValue()
      : order.entryVal;
    const idxRatio = liveVal / Math.max(order.entryVal, 0.01);
    const oracle   = oracleDrift(order.ts);
    const cost     = order.qty * NUT_USD;
    const current  = cost * idxRatio * oracle;
    const pnl      = current - cost;
    const pnlPct   = cost > 0 ? (pnl / cost) * 100 : 0;
    return { current, cost, pnl, pnlPct };
  }

  function portfolioTotals() {
    return orders.reduce((acc, o) => {
      const v = valuate(o);
      acc.value += v.current;
      acc.cost  += v.cost;
      acc.count += 1;
      return acc;
    }, { value: 0, cost: 0, count: 0 });
  }

  function spendableNuts() {
    if (typeof getAvailableNutCount === 'function') return getAvailableNutCount();
    const all = parseInt(localStorage.getItem('nut_alltime_v1') || '0', 10) || 0;
    const conv = parseInt(localStorage.getItem('nut_kens_converted_v1') || '0', 10) || 0;
    return Math.max(0, all - conv);
  }

  function spendableChips() {
    return window.NutKens ? NutKens.getBalance() : parseInt(localStorage.getItem('nut_pm_bal_v1') || '0', 10) || 0;
  }

  function fmtChips(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'K';
    return n.toLocaleString();
  }

  function refreshWallet() {
    const nuts  = spendableNuts();
    const chips = spendableChips();
    const tot   = portfolioTotals();
    const pnlPct = tot.cost > 0 ? ((tot.value - tot.cost) / tot.cost) * 100 : 0;

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    set('nwNuts', nuts.toLocaleString());
    set('nwChips', fmtChips(chips));
    set('nwPortVal', '$' + tot.value.toFixed(2));
    set('nwOrderCount', String(tot.count));

    const pnlEl = document.getElementById('nwPnl');
    if (pnlEl) {
      pnlEl.textContent = (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(1) + '%';
      pnlEl.className = 'nw-pnl ' + (pnlPct >= 0 ? 'up' : 'down');
    }

    const stripPnl = document.getElementById('nwStripPnl');
    if (stripPnl) {
      stripPnl.textContent = tot.count
        ? `${tot.count} orders · ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}%`
        : 'Log nuts to open positions';
      stripPnl.className = 'nidx-portfolio-pnl ' + (pnlPct >= 0 ? 'up' : 'down');
    }
  }

  function renderOrdersPanel() {
    const el = document.getElementById('nutPortfolioOrders');
    if (!el) return;

    if (!orders.length) {
      el.innerHTML = '<div class="nidx-portfolio-empty">Each nut you log becomes a live order on the chart above — the Oracle model moves your P&amp;L.</div>';
      return;
    }

    const recent = [...orders].reverse().slice(0, 24);
    el.innerHTML = recent.map(o => {
      const v = valuate(o);
      const lbl = (o.method || 'solo').replace(/^\w/, c => c.toUpperCase());
      const up = v.pnlPct >= 0;
      return `<div class="nidx-order-row${up ? '' : ' down'}">
        <span class="nidx-order-dot" style="left:${hashStr(o.id) % 92 + 4}%"></span>
        <span class="nidx-order-lbl">${lbl} · ${o.chartY}-${String(o.chartM + 1).padStart(2, '0')}</span>
        <span class="nidx-order-val">${up ? '+' : ''}${v.pnlPct.toFixed(1)}%</span>
        <span class="nidx-order-usd">$${v.current.toFixed(2)}</span>
      </div>`;
    }).join('');
  }

  function getOrdersForChart() {
    return orders.map(o => {
      const v = valuate(o);
      return Object.assign({}, o, { pnlPct: v.pnlPct, liveVal: v.current });
    });
  }

  function backfillFromHistory() {
    if (orders.length) return;
    const all = parseInt(localStorage.getItem('nut_alltime_v1') || '0', 10) || 0;
    if (all <= 0) return;
    addOrders(Math.min(all, 120), 'legacy', Date.now() - 86400000);
  }

  function onNutLogged(method, points) {
    addOrders(Math.max(1, points || 1), method, Date.now());
    refreshWallet();
  }

  function tick(redrawChart) {
    refreshWallet();
    renderOrdersPanel();
    if (redrawChart && window.NutChart && NutChart.draw) NutChart.draw();
  }

  function init() {
    load();
    backfillFromHistory();
    refreshWallet();
    renderOrdersPanel();
    setInterval(() => tick(true), 5000);
  }

  window.refreshNutFloat = refreshWallet;
  window.NutPortfolio = {
    init, tick, refreshWallet, onNutLogged,
    getOrdersForChart, spendableNuts, spendableChips,
    valuate, portfolioTotals,
  };
})();
