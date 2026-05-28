/**
 * Live casino + community feed via Supabase (real ticker, watchlist, big wins)
 * Merges: Supabase feed, local NutAnnounce, NPC activity
 */
(function () {
  let watchCache = [];
  let feedCache  = [];
  let pollTimer  = null;
  const shownBigKeys = new Set();

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
    const big = row.kind === 'casino' && (profit >= 25 || mult >= 5);
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

  async function recordNPCCasinoEvent(npc, ev) {
    if (!npc || !ev || !ev.game) return;
    if (typeof db === 'undefined' || !db) return;
    const profit = ev.profit || 0;
    if (profit <= 0) return;
    try {
      await db.rpc('record_casino_event', {
        p_session_id: npc.sessionId,
        p_nickname: npc.name,
        p_game: ev.game,
        p_bet: ev.bet || 0,
        p_profit: profit,
        p_mult: ev.mult || null,
      });
    } catch (e) {
      console.warn('record_casino_event npc', e);
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

  function getNPCFeed() {
    if (!window.NutNPCs || typeof NutNPCs.getAnnouncements !== 'function') return [];
    return NutNPCs.getAnnouncements(Date.now());
  }

  function mergeFeeds(remote, local) {
    const seen = new Set();
    const out = [];
    function push(item) {
      const key = (item.text || '') + '|' + (item.ts || 0);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    }
    (local || []).forEach(push);
    (remote || []).forEach(push);
    out.sort((a, b) => {
      const bigDiff = (b.big ? 1 : 0) - (a.big ? 1 : 0);
      if (bigDiff !== 0) return bigDiff;
      return (b.ts || 0) - (a.ts || 0);
    });
    return out.slice(0, 28);
  }

  function renderAnnBigPin(items) {
    const el = document.getElementById('annBigPin');
    if (!el) return;
    const win = (items || []).find(x => x.big);
    if (!win) {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    const amt = win.mult >= 2
      ? `${typeof win.mult === 'number' ? win.mult.toFixed(1) : win.mult}× · +${win.profit} NUTS`
      : `+${win.profit} NUTS`;
    el.style.display = 'block';
    el.innerHTML = `<span class="abp-kicker">🏆 BIG WIN</span>
      <span class="abp-user">${esc(win.user || 'Player')}</span>
      <span class="abp-amt">${amt}</span>`;
  }

  function maybeShowBigFromFeed(items) {
    for (const it of items || []) {
      if (!it.big) continue;
      const key = (it.text || '') + '|' + (it.ts || 0);
      if (shownBigKeys.has(key)) continue;
      shownBigKeys.add(key);
      if (shownBigKeys.size > 40) {
        shownBigKeys.delete(shownBigKeys.values().next().value);
      }
      if (typeof showBigWin === 'function') showBigWin(it);
      break;
    }
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
    ).filter(x => x.big || (x.profit || 0) >= 25 || (x.mult || 0) >= 3).slice(0, 6);
    if (!wins.length) {
      el.innerHTML = '<div class="win-empty">Big wins show here — players & NPCs.</div>';
      return;
    }
    el.innerHTML = wins.map(w => `
      <div class="win-card">
        <span class="win-user">${esc(w.user || 'Player')}${w.npc ? ' · NPC' : ''}</span>
        <span class="win-amt">${w.mult >= 2 ? (typeof w.mult === 'number' ? w.mult.toFixed(1) : w.mult) + '× · ' : ''}+${w.profit} NUTS</span>
        <span class="win-txt">${esc(w.text)}</span>
      </div>`).join('');
  }

  async function refresh() {
    const remote = await fetchFeed();
    feedCache = remote;
    const local = window.NutAnnounce ? NutAnnounce.getRecent(16) : [];
    const npc = getNPCFeed();
    const merged = mergeFeeds(remote, local.concat(npc));
    if (typeof renderAnnTicker === 'function') renderAnnTicker(merged);
    if (typeof buildTicker === 'function') buildTicker(merged);
    renderAnnBigPin(merged);
    maybeShowBigFromFeed(merged);
    renderBigWins(merged);
    watchCache = await fetchWatchlist();
    renderWatchlist(watchCache);
  }

  function init() {
    if (window.NutAnnounce) {
      NutAnnounce.subscribe((ev) => {
        if (ev.npc && ev.game && (ev.profit > 0 || ev.mult >= 2)) {
          recordNPCCasinoEvent(
            { sessionId: ev.sessionId, name: ev.user },
            ev
          );
        } else if (ev.game && (ev.profit > 0 || ev.mult >= 2)) {
          recordCasinoEvent(ev);
        }
        setTimeout(refresh, 300);
      });
    }
    refresh();
    pollTimer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 20000);
    setInterval(() => {
      if (!document.hidden && window.NutNPCs) refresh();
    }, 45000);
  }

  window.NutCasinoLive = {
    init,
    refresh,
    getWatchlist: () => watchCache,
    getFeed: () => feedCache,
    recordCasinoEvent,
    recordNPCCasinoEvent,
  };
})();
