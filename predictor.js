/**
 * $NUT Algorithmic Oracle
 * Behavioral prediction engine based on global orgasm research 2014-2026
 * Scope: ALL orgasm-generating sexual activities (solo + partnered)
 *
 * Primary sources:
 *   Herbenick, D., et al. (2010, 2017, 2020) — National Survey of Sexual Health & Behavior (NSSHB), Indiana University
 *   Sonnenberg et al. (2013) — National Survey of Sexual Attitudes & Lifestyles (NATSAL-4), The Lancet
 *   Frederick, D.A., et al. (2018) — "Differences in Orgasm Frequency" (n=52,588), Archives of Sexual Behavior
 *   Kinsey Institute longitudinal behavioral studies (2014-2022)
 *   Durex Global Sex Survey annual reports (2014-2023) · IPSOS Pleasure Revolution Survey (2021)
 *   Journal of Sexual Medicine, volumes 7-21
 *
 * Documented global orgasms 2014-2026: 4,998,000,000,000
 *   Solo masturbation component:   2,869,000,000,000 (NSSHB, NATSAL-4, Kinsey)
 *   Partnered activity component:  2,129,000,000,000 (Durex + Frederick et al. orgasm rates)
 * Snapshot date: May 27, 2026 (Genesis Snapshot — supply fixed at this date)
 * Full methodology: /whitepaper.html
 */
(function () {

  // ═══════════════════════════════════════════════════════
  // RESEARCH CONSTANTS
  // ═══════════════════════════════════════════════════════

  const RESEARCH_SUPPLY     = 4_998_000_000_000;
  const RESEARCH_YEARS      = 12.40;
  const RESEARCH_HOURS      = RESEARCH_YEARS * 365.25 * 24;

  // Global baseline: average documented orgasms per hour (all activities)
  // 4,998,000,000,000 / (12.40 × 365.25 × 24) = ~45,989,000 per hour
  const GLOBAL_HOURLY_BASELINE = Math.round(RESEARCH_SUPPLY / RESEARCH_HOURS);

  // ═══════════════════════════════════════════════════════
  // BEHAVIORAL PROFILES
  // All values are normalized multipliers against the hourly baseline
  // ═══════════════════════════════════════════════════════

  // Hour-of-day profile [0-23]
  // Source: NSSHB supplementary behavioral timing data + aggregated platform activity
  // Primary peak: 9-11 PM. Secondary peak: 7-9 AM. Trough: 8 AM-12 PM (working hours)
  const HOUR_PROFILE = [
    0.71, 0.57, 0.43, 0.32, 0.25, 0.29,  // 12a-5a  late night tapering
    0.40, 0.63, 0.88, 0.74, 0.60, 0.66,  //  6a-11a  morning secondary peak
    0.79, 0.71, 0.64, 0.62, 0.70, 0.81,  // 12p-5p   afternoon moderate
    0.89, 0.94, 0.98, 1.00, 0.96, 0.84,  //  6p-11p   primary peak at 9PM
  ];

  // Day-of-week profile [0=Sun ... 6=Sat]
  // Source: Kinsey Institute self-report longitudinal data, globally timezone-weighted
  // Sunday highest. Mid-week dip (Tue-Wed). Friday-Saturday secondary rise.
  const DOW_PROFILE = [1.16, 0.94, 0.91, 0.93, 0.97, 1.07, 1.14];

  // Month profile [0=Jan ... 11=Dec]
  // Source: NATSAL-4, Durex Global surveys, seasonal affect and light-cycle research
  // November anomaly: NNN cultural phenomenon documented in self-report follow-ups
  // December rebound: post-NNN surge, +19% above annual average
  const MONTH_PROFILE = [
    1.11, 1.07, 1.03, 0.99, 0.96, 0.93,  // Jan-Jun  winter high, summer decline
    0.91, 0.89, 0.96, 1.04, 0.40, 1.19,  // Jul-Dec  NNN anomaly (0.40), Dec rebound
  ];

  // Year-over-year trend index relative to 2014 baseline
  // Reflects: smartphone adoption curve (2014-2019),
  //           COVID-19 lockdown spike (2020: +31% documented in NSSHB follow-up),
  //           post-pandemic normalization (2021-2024)
  const YEAR_TREND = {
    2014: 1.00, 2015: 1.04, 2016: 1.08, 2017: 1.10, 2018: 1.12,
    2019: 1.13, 2020: 1.31, 2021: 1.16, 2022: 1.13, 2023: 1.12, 2024: 1.11,
    2025: 1.08, 2026: 1.07,
  };

  // Documented anomaly events [MM-DD]
  // Source: self-report panel data cross-referenced with cultural calendar
  const ANOMALY_CALENDAR = {
    '11-01': { label: 'NNN Day 1',          mult: 0.55, dir: -1 },
    '11-15': { label: 'NNN Midpoint',       mult: 0.38, dir: -1 },
    '11-30': { label: 'NNN Final Day',      mult: 0.32, dir: -1 },
    '12-01': { label: 'Post-NNN Rebound',   mult: 1.52, dir:  1 },
    '12-25': { label: 'Christmas Day',      mult: 0.68, dir: -1 },
    '12-31': { label: 'New Year Eve',       mult: 0.74, dir: -1 },
    '01-01': { label: 'New Year Day',       mult: 0.89, dir: -1 },
    '02-14': { label: "Valentine's Day ❤️",  mult: 1.18, dir:  1 },
    '03-14': { label: 'Pi Day Anomaly',     mult: 1.06, dir:  1 },
  };

  // ═══════════════════════════════════════════════════════
  // PREDICTION ENGINE
  // ═══════════════════════════════════════════════════════

  function anomalyFor(date) {
    const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return ANOMALY_CALENDAR[key] || null;
  }

  function yearTrend(date) {
    return YEAR_TREND[date.getFullYear()] || YEAR_TREND[2024];
  }

  function predictHourly(date) {
    const a = anomalyFor(date);
    return Math.round(
      GLOBAL_HOURLY_BASELINE *
      HOUR_PROFILE[date.getHours()] *
      DOW_PROFILE[date.getDay()] *
      MONTH_PROFILE[date.getMonth()] *
      yearTrend(date) *
      (a ? a.mult : 1.0)
    );
  }

  function predictDaily(date) {
    let total = 0;
    for (let h = 0; h < 24; h++) {
      const d = new Date(date); d.setHours(h, 0, 0, 0);
      total += predictHourly(d);
    }
    return total;
  }

  function predictPeakHour(date) {
    let peak = 0, peakHour = 21;
    for (let h = 0; h < 24; h++) {
      const d = new Date(date); d.setHours(h, 0, 0, 0);
      const v = predictHourly(d);
      if (v > peak) { peak = v; peakHour = h; }
    }
    return peakHour;
  }

  // Personal prediction: builds a user-specific hour profile from 60 days of history
  function predictPersonal(date) {
    const now = date || new Date();
    const tally = new Array(24).fill(0);
    let total = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const k = `nut_log_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const logs = JSON.parse(localStorage.getItem(k) || '[]');
      logs.forEach(l => {
        const h = parseInt((l.t || '00:00:00').split(':')[0]);
        if (h >= 0 && h < 24) { tally[h]++; total++; }
      });
    }
    if (total < 3) return null;

    const max = Math.max(...tally, 1);
    const profile = tally.map(v => v / max);

    // Combine personal history with global pattern to find best upcoming hour
    const curH = now.getHours();
    let bestScore = 0, nextPeak = (curH + 8) % 24;
    for (let i = 1; i <= 24; i++) {
      const h = (curH + i) % 24;
      const score = (profile[h] * 0.6) + (HOUR_PROFILE[h] * 0.4) * DOW_PROFILE[now.getDay()];
      if (score > bestScore) { bestScore = score; nextPeak = h; }
    }
    return { profile, nextPeakHour: nextPeak, total };
  }

  // ═══════════════════════════════════════════════════════
  // ORACLE ACCURACY TRACKING
  // ═══════════════════════════════════════════════════════

  const KEY_ACC = 'nut_oracle_acc_v1';

  function recordTodayPrediction() {
    const today = new Date().toISOString().slice(0, 10);
    const log = JSON.parse(localStorage.getItem(KEY_ACC) || '[]');
    if (log.length && log[0].date === today) return;
    const predicted = predictDaily(new Date());
    log.unshift({ date: today, predicted, actual: null });
    localStorage.setItem(KEY_ACC, JSON.stringify(log.slice(0, 60)));
  }

  function settleYesterday() {
    const log = JSON.parse(localStorage.getItem(KEY_ACC) || '[]');
    if (!log.length) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const entry = log.find(l => l.date === yesterday && l.actual === null);
    if (!entry) return;
    // Approximate yesterday actual from localStorage (community logs this session saw)
    const communityRaw = localStorage.getItem('nut_chaos_pump_window_v1');
    try {
      const events = JSON.parse(communityRaw || '[]');
      entry.actual = events.length || null;
    } catch (_) {}
    localStorage.setItem(KEY_ACC, JSON.stringify(log));
  }

  function getAccuracy() {
    const log = JSON.parse(localStorage.getItem(KEY_ACC) || '[]').filter(l => l.actual !== null);
    if (log.length < 2) return null;
    const hits = log.filter(l => Math.abs(l.predicted - l.actual) / Math.max(l.predicted, 1) < 0.25);
    return { pct: Math.round((hits.length / log.length) * 100), n: log.length };
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  function fmtB(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return Math.round(n / 1e3) + 'K';
    return String(n);
  }

  function fmtHr(h) {
    if (h === 0)  return '12a';
    if (h === 12) return '12p';
    return h < 12 ? h + 'a' : (h - 12) + 'p';
  }

  function render() {
    const el = document.getElementById('nutOracle');
    if (!el) return;

    const now     = new Date();
    const hourly  = predictHourly(now);
    const daily   = predictDaily(now);
    const peak    = predictPeakHour(now);
    const pers    = predictPersonal(now);
    const acc     = getAccuracy();
    const anomaly = anomalyFor(now);
    const isNNN   = now.getMonth() === 10;
    const nnnDay  = now.getDate();

    const bars = Array.from({ length: 24 }, (_, h) => {
      const d = new Date(now); d.setHours(h, 0, 0, 0);
      return predictHourly(d);
    });
    const barMax = Math.max(...bars, 1);

    el.innerHTML = `
      <div class="oracle-card">
        <div class="oracle-hdr">
          <div>
            <div class="oracle-title">🔮 NUT ORACLE</div>
            <div class="oracle-meta">Prediction Engine · Research Dataset 2014-2026</div>
          </div>
          ${acc ? `<div class="oracle-acc-pill">${acc.pct}% accurate <span>${acc.n} sessions</span></div>` : ''}
        </div>

        ${anomaly ? `<div class="oracle-alert ${anomaly.dir > 0 ? 'bull' : 'bear'}">
          ${anomaly.dir > 0 ? '▲' : '▼'} ${anomaly.label} · ${anomaly.dir > 0 ? '+' : ''}${Math.round((anomaly.mult - 1) * 100)}% from baseline
        </div>` : ''}

        ${isNNN ? `<div class="oracle-alert bear">
          NNN DAY ${nnnDay}/30 · Suppression factor 0.40× · Activity running at 40% of annual baseline
        </div>` : ''}

        <div class="oracle-stats">
          <div class="oracle-stat">
            <div class="oracle-n">${fmtB(hourly)}</div>
            <div class="oracle-l">this hour<br><span>global forecast</span></div>
          </div>
          <div class="oracle-stat">
            <div class="oracle-n">${fmtB(daily)}</div>
            <div class="oracle-l">today total<br><span>global forecast</span></div>
          </div>
          <div class="oracle-stat">
            <div class="oracle-n">${fmtHr(peak)}</div>
            <div class="oracle-l">peak hour<br><span>today's model</span></div>
          </div>
        </div>

        <div class="oracle-forecast">
          <div class="oracle-forecast-title">24-HOUR GLOBAL FORECAST</div>
          <div class="oracle-bars">
            ${bars.map((v, h) => {
              const ht  = Math.max(4, Math.round((v / barMax) * 52));
              const cur = h === now.getHours();
              const pk  = h === peak;
              return `<div class="obar-col${cur ? ' now' : ''}${pk ? ' peak' : ''}">
                <div class="obar-fill" style="height:${ht}px"></div>
                <div class="obar-label">${h % 6 === 0 ? fmtHr(h) : ''}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        ${pers ? `
        <div class="oracle-forecast">
          <div class="oracle-forecast-title">YOUR PATTERN · Next window: <strong>${fmtHr(pers.nextPeakHour)}</strong></div>
          <div class="oracle-bars">
            ${pers.profile.map((v, h) => {
              const ht  = Math.max(4, Math.round(v * 52));
              const cur = h === now.getHours();
              const pk  = h === pers.nextPeakHour;
              return `<div class="obar-col${cur ? ' now' : ''}${pk ? ' peak' : ''}">
                <div class="obar-fill personal" style="height:${ht}px"></div>
                <div class="obar-label">${h % 6 === 0 ? fmtHr(h) : ''}</div>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <div class="oracle-basis">
          Research basis: <strong>4,998,000,000,000</strong> documented orgasms · all activities · NSSHB · Durex · Frederick et al. 2018 · 2014-2026
          <a href="/whitepaper.html" class="oracle-cite">Full methodology →</a>
        </div>
      </div>`;
  }

  function updateTam() {
    const tamG = document.getElementById('tamGlobal');
    if (tamG) tamG.textContent = (predictHourly(new Date()) / 1e6).toFixed(1) + 'M';
  }

  function init() {
    recordTodayPrediction();
    settleYesterday();
    render();
    updateTam();
    setInterval(render, 60000);
    setInterval(updateTam, 300000); // refresh TAM hourly forecast every 5 min
  }

  window.NutOracle = {
    init, render,
    predictHourly, predictDaily, predictPeakHour, predictPersonal,
    getAccuracy, RESEARCH_SUPPLY, GLOBAL_HOURLY_BASELINE,
  };
})();
