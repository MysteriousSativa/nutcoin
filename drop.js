/**
 * $NUT Drop Countdown — AIRDROP WAVE 2 · SUNDAY MAY 31 12:00 AM
 */
(function () {
  // Sunday May 31, 2026 at 00:00:00 local time
  const DROP_TS  = new Date(2026, 4, 31, 0, 0, 0).getTime();
  const KEY_NOTE = 'nut_drop_notify_v1';
  const KEY_SEEN = 'nut_drop_seen_v1';

  function getLeft() {
    const d = DROP_TS - Date.now();
    if (d <= 0) return null;
    return {
      days:  Math.floor(d / 86400000),
      hours: Math.floor((d % 86400000) / 3600000),
      mins:  Math.floor((d % 3600000) / 60000),
      secs:  Math.floor((d % 60000) / 1000),
      total: d,
    };
  }

  function p2(n) { return String(n).padStart(2, '0'); }

  function render() {
    const el = document.getElementById('dropCountdown');
    if (!el) return;
    const t = getLeft();
    if (!t) {
      el.innerHTML = '<span class="drop-live-badge">🟢 WAVE 2 SNAPSHOT CLOSED</span>';
      document.getElementById('dropBanner')?.classList.add('drop-past');
      return;
    }
    el.innerHTML = `
      <div class="drop-unit"><div class="drop-n" id="dn-d">${t.days}</div><div class="drop-l">DAYS</div></div>
      <div class="drop-col">:</div>
      <div class="drop-unit"><div class="drop-n" id="dn-h">${p2(t.hours)}</div><div class="drop-l">HRS</div></div>
      <div class="drop-col">:</div>
      <div class="drop-unit"><div class="drop-n" id="dn-m">${p2(t.mins)}</div><div class="drop-l">MIN</div></div>
      <div class="drop-col">:</div>
      <div class="drop-unit"><div class="drop-n" id="dn-s">${p2(t.secs)}</div><div class="drop-l">SEC</div></div>
    `;
    // Flash urgency when < 1 day
    const banner = document.getElementById('dropBanner');
    if (banner) banner.classList.toggle('drop-urgent', t.days === 0 && t.hours < 12);
  }

  function updateNotifyBtn() {
    const btn = document.getElementById('dropNotifyBtn');
    if (!btn) return;
    const on = !!localStorage.getItem(KEY_NOTE);
    btn.textContent = on ? '🔔 REMINDER SET' : '🔔 REMIND ME';
    btn.classList.toggle('active', on);
  }

  function toggleNotify() {
    if (localStorage.getItem(KEY_NOTE)) {
      localStorage.removeItem(KEY_NOTE);
      if (typeof showToast === 'function') showToast('Reminder removed');
    } else {
      localStorage.setItem(KEY_NOTE, Date.now());
      if (typeof showToast === 'function') showToast('Reminder set — check back Sunday 🔔');
    }
    updateNotifyBtn();
  }

  function init() {
    render();
    updateNotifyBtn();
    setInterval(render, 1000);
  }

  window.NutDrop = { init, toggleNotify };
})();
