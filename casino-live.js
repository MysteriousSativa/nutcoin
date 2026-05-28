/**
 * Live casino + community feed via Supabase (real ticker, watchlist, big wins)
 */
(function () {
  let watchCache = [];
  let feedCache  = [];
  let pollTimer  = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function displayName(row) {
    if (row.nickname && String(row.nickname).trim()) return String(row.nickname).trim();
    if (typeof anonName === 'function' && row.session_id) return anonName(row.session_id);
    return 'NutTracker';
  }

  function rowToAnn(row) {
    const type = row.kind === 'casino'
      ? (row.game === 'crash' ? 'crash' : row.game === 'flip' ? 'flip' : row.game === 'blackjack' ? 'blackjack' : 'spin')
      : 'nut';
    const profit = row.profit || 0;
    const mult = row.mult ? parseFloat(row.mult) : 0;
    const big = row.kind === 'casino' && (profit >= 50 || mult >= 5);
    return {
      type,
      game: row.game,
      user: displayName(row),
      text: row.message,
      profit,
      mult,
      big,
      ts: new Date(row.created_at).getTime(),
      remote: true,
    };
  }

  async function recordCasinoEvent(ev) {
    if (!ev || !ev.game) return;
    if (typeof db === 'undefined' || !db) return;
    if (typeof sessionId === 'undefined' || !sessionId) return;
    const profit = ev.profit || 0;
    if (profit <= 0 && !(ev.mult >= 2)) return;
    try {
      const name = (typeof nickname !== 'undefined' && nickname) ||
        (typeof genUserName === 'function' ? genUserName(sessionId) : null);
      await db.rpc('record_casino_event', {
        p_session_id: sessionId,
        p_nickname: name,
        p_game: ev.game,
        p_bet: ev.bet || 0,
        p_profit: profit,
        p_mult: ev.mult || null,
      });
    } catch (e) {
      console.warn('record_casino_event', e);
    }
  }

  async function fetchFeed() {
    if (typeof db === 'undefined' || !db) return [];
    try {
      const { data, error } = await db.rpc('live_community_feed', { p_limit: 28 });
      if (error) {
        console.warn('live_community_feed', error);
        return [];
      }
      return (data || []).map(rowToAnn);
    } catch (e) {
      console.warn('fetchFeed', e);
      return [];
    }
  }

  async function fetchWatchlist() {
    if (typeof db === 'undefined' || !db) return [];
    try {
      const { data, error } = await db.rpc('casino_watchlist', { p_limit: 8 });
      if (error) {
        console.warn('casino_watchlist', error);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  }

  function mergeFeeds(remote, local) {
    const seen = new Set();
    const out = [];
    function push(item) {
      const key = item.text + '|' + (item.ts || 0);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    }
    (local || []).forEach(push);
    (remote || []).forEach(push);
    out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return out.slice(0, 24);
  }

  function renderWatchlist(rows) {
    const el = document.getElementById('casinoWatchlist');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = '<div class="watch-empty">No casino sharks yet. Win a round and claim the board.</div>';
      return;
    }
    el.innerHTML = rows.map((r, i) => {
      const name = esc(r.nickname || (typeof anonName === 'function' ? anonName(r.session_id) : 'Player'));
      const mult = r.best_mult ? parseFloat(r.best_mult).toFixed(1) : '—';
      return `<div class="watch-row ${i < 3 ? 'watch-hot' : ''}">
        <span class="watch-rank">#${i + 1}</span>
        <span class="watch-name">${name}</span>
        <span class="watch-stat">+${Number(r.total_profit).toLocaleString()} NUTS</span>
        <span class="watch-meta">${r.win_count}W · best ${r.best_win} · ${mult}×</span>
      </div>`;
    }).join('');
  }

  function renderBigWins(items) {
    const el = document.getElementById('lobbyBigWins');
    if (!el) return;
    const wins = (items || []).filter(x =>
      ['spin', 'crash', 'flip', 'blackjack'].includes(x.type)
    ).filter(x => (x.profit || 0) >= 25 || (x.mult || 0) >= 3).slice(0, 6);
    if (!wins.length) {
      el.innerHTML = '<div class="win-empty">Big wins show here live from Supabase.</div>';
      return;
    }
    el.innerHTML = wins.map(w => `
      <div class="win-card">
        <span class="win-user">${esc(w.user || 'Player')}</span>
        <span class="win-amt">${w.mult >= 2 ? w.mult.toFixed(1) + '× · ' : ''}+${w.profit} NUTS</span>
        <span class="win-txt">${esc(w.text)}</span>
      </div>`).join('');
  }

  async function refresh() {
    const remote = await fetchFeed();
    feedCache = remote;
    const local = window.NutAnnounce ? NutAnnounce.getRecent(12) : [];
    const merged = mergeFeeds(remote, local);
    if (typeof renderAnnTicker === 'function') renderAnnTicker(merged);
    if (typeof buildTicker === 'function') buildTicker(merged);
    renderBigWins(merged);
    watchCache = await fetchWatchlist();
    renderWatchlist(watchCache);
  }

  function init() {
    if (window.NutAnnounce) {
      NutAnnounce.subscribe((ev) => {
        if (ev.game && (ev.profit > 0 || ev.mult >= 2)) {
          recordCasinoEvent(ev);
          setTimeout(refresh, 400);
        }
      });
    }
    refresh();
    pollTimer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 20000);
  }

  window.NutCasinoLive = {
    init,
    refresh,
    getWatchlist: () => watchCache,
    getFeed: () => feedCache,
    recordCasinoEvent,
  };
})();
