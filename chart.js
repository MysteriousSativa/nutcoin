/**
 * $NUT Index Chart — 12-Year Global Orgasm Activity Index
 * All activities · Solo + Partnered blended · 2014-2026 · 149 monthly data points
 *
 * YEAR_TREND narrative:
 *   2014-2016 : Slow organic adoption — smartphone self-report methodology emerges
 *   2017      : First pump — mainstream awareness
 *   2018      : Correction
 *   2019      : Recovery and re-accumulation
 *   2020      : COVID spike — +87% vs 2019 (lockdowns, all activities)
 *   2021-2022 : Post-COVID bear — deep correction to cycle lows
 *   2023-2026 : Global adoption expansion (population growth + developing-market smartphones)
 *               breaks the 2020 ATH — Genesis Snapshot launches AT all-time highs
 *
 * Per-point ±22% seeded noise makes the line realistically jagged.
 */
(function () {

  // ─────────────────────────────────────────────────────────────────
  // DATA LAYER  — all-activities blended index with market noise
  // ─────────────────────────────────────────────────────────────────
  const MONTH_PROFILE = [
    1.07, 1.13, 1.04, 1.01, 0.98, 0.97,
    0.95, 0.93, 0.98, 1.03, 0.61, 1.15,
  ];
  // 2026 ATH: the coin launches as underlying breaks all-time highs
  // COVID was a spike; the real structural peak is RIGHT NOW
  const YEAR_TREND = {
    2014:1.00, 2015:1.35, 2016:1.75, 2017:2.55,
    2018:1.68, 2019:2.25, 2020:4.20,
    2021:2.82, 2022:1.95, 2023:2.72, 2024:3.88,
    2025:5.05, 2026:5.55,
  };
  const BASE     = 80;
  const MON_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Deterministic per-point noise — same result every render, every device
  function rand01(s) {
    let h = (s + 1) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function buildData() {
    const pts = [];
    for (let y = 2014; y <= 2026; y++) {
      const maxM = (y === 2026) ? 4 : 11;
      for (let m = 0; m <= maxM; m++) {
        const base  = MONTH_PROFILE[m] * (YEAR_TREND[y] || 3.22) * BASE;
        const noise = 1 + (rand01(y * 100 + m + 7919) - 0.5) * 0.44; // ±22%
        pts.push({
          y, m,
          v: parseFloat((base * noise).toFixed(1)),
          isNNN:     m === 10,
          isDec:     m === 11,
          isCovid:   y === 2020,
          isGenesis: y === 2026 && m === 4,
          lbl: MON_ABBR[m] + ' ' + y,
        });
      }
    }
    return pts;
  }

  const ALL_DATA = buildData();
  const ATH_VAL  = Math.max(...ALL_DATA.map(p => p.v));
  const ATH_IDX  = ALL_DATA.findIndex(p => p.v === ATH_VAL);
  const LATEST   = ALL_DATA[ALL_DATA.length - 1].v;

  // Period definitions: label → how many months back from end (0 = all)
  const PERIODS = [
    { id: 'ALL', label: 'ALL',  months: 0  },
    { id: '5Y',  label: '5Y',   months: 60 },
    { id: '3Y',  label: '3Y',   months: 36 },
    { id: '1Y',  label: '1Y',   months: 12 },
  ];

  function sliceData(months) {
    if (!months) return ALL_DATA;
    return ALL_DATA.slice(Math.max(0, ALL_DATA.length - months));
  }

  // ─────────────────────────────────────────────────────────────────
  // CHART STATE
  // ─────────────────────────────────────────────────────────────────
  let canvas, ctx;
  let W = 0, H = 430;
  let hoverIdx    = -1;
  let activePeriod = 'ALL';
  let DATA        = ALL_DATA;

  // Key annotations (indices into ALL_DATA)
  const ANNS = [
    {
      aidx: ALL_DATA.findIndex(p => p.y === 2020 && p.m === 0),
      label: ['COVID', 'SPIKE'],
      side: 'top', type: 'bull',
    },
    {
      aidx: ALL_DATA.findIndex(p => p.y === 2020 && p.m === 10),
      label: ['NNN 2020', '▼ CRASH'],
      side: 'bot', type: 'bear',
    },
    {
      aidx: ALL_DATA.findIndex(p => p.y === 2022 && p.m === 6),
      label: ['CYCLE', 'LOW'],
      side: 'bot', type: 'bear',
    },
    {
      aidx: ATH_IDX, // dynamic — the ATH is now at Genesis (2025/2026)
      label: ['ALL TIME', 'HIGH'],
      side: 'top', type: 'ath',
    },
    {
      aidx: ALL_DATA.length - 1,
      label: ['YOU', 'ARE HERE'],
      side: 'top', type: 'genesis',
    },
  ];

  // ─────────────────────────────────────────────────────────────────
  // LAYOUT
  // ─────────────────────────────────────────────────────────────────
  const PAD = { t: 20, r: 56, b: 36, l: 52 };

  function cH()  { return Math.round((H - PAD.t - PAD.b) * 0.70); }
  function cW()  { return W - PAD.l - PAD.r; }
  function vTop(){ return PAD.t + cH() + 10; }
  function vH()  { return Math.round((H - PAD.t - PAD.b) * 0.18); }

  function xAt(i, data) {
    const d = data || DATA;
    return PAD.l + (i / Math.max(d.length - 1, 1)) * cW();
  }
  function yAt(v, vMin, vMax, top, height) {
    return top + height - ((v - vMin) / (vMax - vMin)) * height;
  }

  // ─────────────────────────────────────────────────────────────────
  // DRAW
  // ─────────────────────────────────────────────────────────────────
  function draw() {
    if (!canvas || !ctx || W === 0) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CH   = cH();
    const CW   = cW();
    const VT   = vTop();
    const VH   = vH();
    const dMin = Math.min(...DATA.map(p => p.v));
    const dMax = Math.max(...DATA.map(p => p.v));
    const vMin = dMin * 0.86;
    const vMax = dMax * 1.06;
    const maxV = dMax;
    const barW = Math.max(1.5, (CW / DATA.length) * 0.62);

    // ── Background
    ctx.fillStyle = '#050301';
    ctx.fillRect(0, 0, W, H);

    // ── Horizontal grid + y-axis labels
    const gridSteps = 5;
    for (let g = 0; g <= gridSteps; g++) {
      const v = vMin + (vMax - vMin) * (g / gridSteps);
      const y = yAt(v, vMin, vMax, PAD.t, CH);
      ctx.strokeStyle = 'rgba(200,169,110,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + CW, y); ctx.stroke();
      ctx.fillStyle = 'rgba(200,169,110,0.36)';
      ctx.font = '10px ui-monospace,monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(v), PAD.l - 6, y + 3.5);
    }

    // ── NNN (November) shading
    DATA.forEach((p, i) => {
      if (!p.isNNN) return;
      const x0 = i > 0 ? (xAt(i - 1) + xAt(i)) / 2 : xAt(i);
      const x1 = i < DATA.length - 1 ? (xAt(i) + xAt(i + 1)) / 2 : xAt(i);
      ctx.fillStyle = 'rgba(201,78,78,0.11)';
      ctx.fillRect(x0, PAD.t, x1 - x0, CH + 10 + VH);
      // Small "NNN" label at top of column
      ctx.fillStyle = 'rgba(201,78,78,0.45)';
      ctx.font = '700 7px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NNN', (x0 + x1) / 2, PAD.t + 9);
    });

    // ── December rebound shading
    DATA.forEach((p, i) => {
      if (!p.isDec) return;
      const x0 = i > 0 ? (xAt(i - 1) + xAt(i)) / 2 : xAt(i);
      const x1 = i < DATA.length - 1 ? (xAt(i) + xAt(i + 1)) / 2 : xAt(i);
      ctx.fillStyle = 'rgba(78,201,122,0.07)';
      ctx.fillRect(x0, PAD.t, x1 - x0, CH + 10 + VH);
    });

    // ── Year / period grid verticals + x-axis labels
    const usedYears = new Set(DATA.map(p => p.y));
    usedYears.forEach(y => {
      const fi = DATA.findIndex(p => p.y === y);
      if (fi < 0) return;
      const x = xAt(fi);
      ctx.strokeStyle = 'rgba(200,169,110,0.09)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + CH + 10 + VH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(200,169,110,0.38)';
      ctx.font = '500 9px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(y), x, H - 6);
    });

    // In 1Y view, show month labels instead
    if (DATA.length <= 14) {
      DATA.forEach((p, i) => {
        const x = xAt(i);
        ctx.fillStyle = 'rgba(200,169,110,0.45)';
        ctx.font = '500 9px ui-monospace,monospace';
        ctx.textAlign = 'center';
        ctx.fillText(MON_ABBR[p.m], x, H - 6);
      });
    }

    // ── Volume bars
    DATA.forEach((p, i) => {
      const bH = Math.max(2, (p.v / maxV) * VH);
      const bY = VT + VH - bH;
      const bX = xAt(i) - barW / 2;
      const isUp = i === 0 || p.v >= DATA[i - 1].v;
      ctx.fillStyle = isUp ? 'rgba(78,201,122,0.30)' : 'rgba(201,78,78,0.30)';
      ctx.fillRect(bX, bY, barW, bH);
    });

    // ── Gradient fill under line
    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + CH);
    grad.addColorStop(0, 'rgba(255,217,125,0.18)');
    grad.addColorStop(0.5, 'rgba(200,169,110,0.06)');
    grad.addColorStop(1, 'rgba(200,169,110,0.00)');

    function tracePath() {
      ctx.beginPath();
      ctx.moveTo(xAt(0), yAt(DATA[0].v, vMin, vMax, PAD.t, CH));
      for (let i = 1; i < DATA.length; i++) {
        const x0 = xAt(i - 1), y0 = yAt(DATA[i - 1].v, vMin, vMax, PAD.t, CH);
        const x1 = xAt(i),     y1 = yAt(DATA[i].v,     vMin, vMax, PAD.t, CH);
        const cp = (x0 + x1) / 2;
        ctx.bezierCurveTo(cp, y0, cp, y1, x1, y1);
      }
    }

    tracePath();
    ctx.lineTo(xAt(DATA.length - 1), PAD.t + CH);
    ctx.lineTo(xAt(0), PAD.t + CH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    tracePath();
    ctx.strokeStyle = '#C8A96E';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // ── Annotations (only those in current view range)
    const viewStart = DATA[0];
    const viewEnd   = DATA[DATA.length - 1];

    ANNS.forEach(a => {
      const aidx = a.aidx;
      const pt   = ALL_DATA[aidx];
      if (!pt) return;
      // Is this point within the current view?
      const di = DATA.findIndex(p => p.y === pt.y && p.m === pt.m);
      if (di < 0) return;

      const x = xAt(di);
      const y = yAt(pt.v, vMin, vMax, PAD.t, CH);
      const color = { bull:'#4EC97A', bear:'#ff8080', ath:'#FFD97D', genesis:'#FFD97D' }[a.type];

      // Vertical rule
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + CH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Dot on line
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();

      // Label box
      const lh = 13, lw = 80, padding = 7;
      const labH = a.label.length * lh + padding * 2 - 2;
      let lx = Math.min(Math.max(x, PAD.l + lw / 2 + 4), PAD.l + CW - lw / 2 - 4);
      let ly = a.side === 'top'
        ? y - 12 - labH
        : y + 12;
      if (ly < PAD.t + 4) ly = y + 12;
      if (ly + labH > PAD.t + CH - 4) ly = y - 12 - labH;

      ctx.fillStyle = 'rgba(5,3,1,0.88)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      rr(ctx, lx - lw / 2, ly, lw, labH, 4);
      ctx.fill(); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '700 8.5px ui-monospace,monospace';
      a.label.forEach((ln, li) => {
        ctx.fillStyle = color;
        ctx.fillText(ln, lx, ly + padding + (li + 1) * lh - 2);
      });
    });

    // ── Hover crosshair
    if (hoverIdx >= 0 && hoverIdx < DATA.length) {
      const p = DATA[hoverIdx];
      const x = xAt(hoverIdx);
      const y = yAt(p.v, vMin, vMax, PAD.t, CH);

      ctx.strokeStyle = 'rgba(200,169,110,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, PAD.t + CH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + CW, y); ctx.stroke();
      ctx.setLineDash([]);

      // Crosshair dot
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD97D'; ctx.fill();

      // Right y-axis label
      ctx.fillStyle = 'rgba(5,3,1,0.95)';
      ctx.strokeStyle = '#FFD97D';
      ctx.lineWidth = 1;
      rr(ctx, PAD.l + CW + 3, y - 9, 50, 18, 3);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFD97D';
      ctx.font = '700 10px ui-monospace,monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.v.toFixed(1), PAD.l + CW + 28, y + 3.5);

      // Tooltip
      const pctATH  = ((p.v - ATH_VAL) / ATH_VAL * 100);
      const tag = p.isNNN     ? '▼ NNN SUPPRESSION'
                : p.isDec     ? '▲ DECEMBER REBOUND'
                : p.isCovid   ? '▲ COVID SPIKE'
                : p.isGenesis ? '▲ GENESIS · ATH TERRITORY'
                : (p.y >= 2025 && pctATH >= -5) ? '▲ ALL TIME HIGH ZONE'
                : '';
      const tipLines = [
        p.lbl,
        'NUTIDX  ' + p.v.toFixed(1),
        (pctATH >= 0 ? '+' : '') + pctATH.toFixed(1) + '% vs ATH',
        ...(tag ? [tag] : []),
      ];

      const TW = 168, TH = tipLines.length * 16 + 16;
      let tx = x + 12, ty = y - TH - 8;
      if (tx + TW > PAD.l + CW - 4) tx = x - TW - 12;
      if (ty < PAD.t) ty = y + 10;

      ctx.fillStyle = 'rgba(5,3,1,0.97)';
      ctx.strokeStyle = 'rgba(200,169,110,0.5)';
      ctx.lineWidth = 1;
      rr(ctx, tx, ty, TW, TH, 6);
      ctx.fill(); ctx.stroke();

      ctx.textAlign = 'left';
      tipLines.forEach((ln, li) => {
        let clr = 'rgba(237,232,223,0.85)';
        if (li === 0) clr = '#FFD97D';
        else if (ln.startsWith('▼')) clr = '#ff8080';
        else if (ln.startsWith('▲') || ln.startsWith('●')) clr = '#4EC97A';
        else if (ln.includes('%')) clr = parseFloat(ln) >= 0 ? '#4EC97A' : '#ff8080';
        ctx.fillStyle = clr;
        ctx.font = li === 0
          ? '700 10px ui-monospace,monospace'
          : '500 10px ui-monospace,monospace';
        ctx.fillText(ln, tx + 10, ty + 18 + li * 16);
      });
    }

    // ── Live value line (rightmost point → right edge)
    const cvY = yAt(DATA[DATA.length - 1].v, vMin, vMax, PAD.t, CH);
    ctx.strokeStyle = 'rgba(78,201,122,0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(xAt(DATA.length - 1), cvY);
    ctx.lineTo(PAD.l + CW, cvY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live dot
    ctx.beginPath(); ctx.arc(xAt(DATA.length - 1), cvY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#4EC97A'; ctx.fill();

    // Right live value label
    ctx.fillStyle = 'rgba(5,3,1,0.95)';
    ctx.strokeStyle = 'rgba(78,201,122,0.65)';
    ctx.lineWidth = 1;
    rr(ctx, PAD.l + CW + 3, cvY - 9, 50, 18, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4EC97A';
    ctx.font = '700 10px ui-monospace,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(LATEST.toFixed(1), PAD.l + CW + 28, cvY + 3.5);

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function nearestIdx(mx) {
    let best = -1, bestD = Infinity;
    DATA.forEach((_, i) => {
      const d = Math.abs(xAt(i) - mx);
      if (d < bestD && mx >= PAD.l && mx <= PAD.l + cW()) {
        bestD = d; best = i;
      }
    });
    return best;
  }

  // ─────────────────────────────────────────────────────────────────
  // PERIOD SELECTOR
  // ─────────────────────────────────────────────────────────────────
  function selectPeriod(id) {
    activePeriod = id;
    const p = PERIODS.find(p => p.id === id) || PERIODS[0];
    DATA = sliceData(p.months);
    hoverIdx = -1;

    // Update button states
    document.querySelectorAll('.nidx-period-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === id);
    });

    draw();
  }

  // ─────────────────────────────────────────────────────────────────
  // RESIZE
  // ─────────────────────────────────────────────────────────────────
  function resize() {
    const wrap = document.getElementById('nutChartWrap');
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    W = wrap.offsetWidth || 640;
    H = Math.max(300, Math.min(460, Math.round(W * 0.55)));
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    draw();
  }

  // ─────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────
  function init() {
    const wrap = document.getElementById('nutChartWrap');
    if (!wrap) return;

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.cursor  = 'crosshair';
    wrap.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Mouse
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      const ni = nearestIdx((e.clientX - r.left) * (W / r.width));
      if (ni !== hoverIdx) { hoverIdx = ni; draw(); }
    });
    canvas.addEventListener('mouseleave', () => { hoverIdx = -1; draw(); });

    // Touch
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      const ni = nearestIdx((t.clientX - r.left) * (W / r.width));
      if (ni !== hoverIdx) { hoverIdx = ni; draw(); }
    }, { passive: false });
    canvas.addEventListener('touchend', () => { hoverIdx = -1; draw(); });

    // Period buttons
    document.querySelectorAll('.nidx-period-btn').forEach(btn => {
      btn.addEventListener('click', () => selectPeriod(btn.dataset.period));
    });

    window.addEventListener('resize', resize);

    // Header stats
    const pctATH = ((LATEST - ATH_VAL) / ATH_VAL * 100).toFixed(1);
    const el = {
      val: document.getElementById('nidxVal'),
      chg: document.getElementById('nidxChg'),
      ath: document.getElementById('nidxATH'),
      pts: document.getElementById('nidxPts'),
    };
    if (el.val) el.val.textContent = LATEST.toFixed(1);
    if (el.chg) {
      el.chg.textContent = parseFloat(pctATH) >= -5
        ? '▲ ATH TERRITORY'
        : pctATH + '% FROM ATH';
      el.chg.style.color = parseFloat(pctATH) >= -5 ? '#4EC97A' : '';
    }
    if (el.ath) {
      el.ath.textContent = 'ATH ' + ATH_VAL.toFixed(1) + '  ·  ' + ALL_DATA[ATH_IDX].lbl.toUpperCase();
    }
    if (el.pts) el.pts.textContent = ALL_DATA.length;

    selectPeriod('ALL');
    resize();
  }

  window.NutChart = { init, draw, selectPeriod };
})();
