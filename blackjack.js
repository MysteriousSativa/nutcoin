/**
 * $NUT Blackjack — play-money 21 (Stake-style panel)
 */
(function () {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [];
  let player = [];
  let dealer = [];
  let bet = 10;
  let phase = 'idle';
  let balAtHand = 0;

  function freshDeck() {
    const d = [];
    for (let s = 0; s < SUITS.length; s++) {
      for (let r = 0; r < RANKS.length; r++) {
        d.push({ rank: RANKS[r], suit: SUITS[s] });
      }
    }
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function cardVal(rank) {
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return parseInt(rank, 10);
  }

  function handTotal(hand) {
    let t = 0;
    let aces = 0;
    hand.forEach(c => {
      t += cardVal(c.rank);
      if (c.rank === 'A') aces++;
    });
    while (t > 21 && aces > 0) { t -= 10; aces--; }
    return t;
  }

  function draw() {
    return deck.pop();
  }

  function cardHtml(c, hide) {
    if (hide) return '<div class="bj-card bj-back">?</div>';
    const red = c.suit === '♥' || c.suit === '♦';
    return `<div class="bj-card ${red ? 'bj-red' : ''}"><span class="bj-r">${c.rank}</span><span class="bj-s">${c.suit}</span></div>`;
  }

  function renderHands(hideDealer) {
    const ph = document.getElementById('bjPlayerHand');
    const dh = document.getElementById('bjDealerHand');
    const ps = document.getElementById('bjPlayerScore');
    const ds = document.getElementById('bjDealerScore');
    if (!ph || !dh) return;
    ph.innerHTML = player.map(c => cardHtml(c)).join('');
    if (hideDealer && dealer.length) {
      dh.innerHTML = cardHtml(dealer[0]) + cardHtml(dealer[1], true);
      ds.textContent = '?';
    } else {
      dh.innerHTML = dealer.map(c => cardHtml(c)).join('');
      ds.textContent = String(handTotal(dealer));
    }
    ps.textContent = String(handTotal(player));
  }

  function setResult(msg, color) {
    const el = document.getElementById('bjResult');
    if (el) { el.textContent = msg; el.style.color = color || ''; }
  }

  function announceWin(profit, mult, label) {
    if (profit <= 0) return;
    const _u = (typeof nickname !== 'undefined' && nickname) ||
      (typeof genUserName === 'function' && typeof sessionId !== 'undefined' ? genUserName(sessionId) : 'Player');
    if (window.NutAnnounce) {
      NutAnnounce.emit({
        type: 'blackjack',
        game: 'blackjack',
        user: _u,
        profit,
        bet,
        mult: mult || 2,
        big: profit >= 50,
        text: `🃏 ${_u} ${label} +${profit} NUTS`,
      });
    }
    if (window.NutCasinoLive) NutCasinoLive.recordCasinoEvent({
      game: 'blackjack', profit, bet, mult: mult || 2,
    });
  }

  function settle(outcome) {
    phase = 'done';
    let payout = 0;
    let msg = '';
    let color = '#ff6060';
    if (outcome === 'blackjack') {
      payout = Math.floor(bet * 2.5);
      msg = `BLACKJACK! +${payout - bet} profit`;
      color = '#FFD97D';
      announceWin(payout - bet, 2.5, 'blackjack');
    } else if (outcome === 'win') {
      payout = bet * 2;
      msg = `WIN +${bet} profit`;
      color = '#44ff88';
      announceWin(bet, 2, 'won 21');
    } else if (outcome === 'push') {
      payout = bet;
      msg = 'PUSH — bet returned';
      color = '#C8A96E';
    } else {
      msg = `LOSE −${bet} NUTS`;
    }
    if (typeof pmSetBalance === 'function') {
      pmSetBalance(balAtHand - bet + payout);
    }
    setResult(msg, color);
    if (typeof showToast === 'function') showToast(msg);
    renderHands(false);
    updateBetUI();
  }

  function dealerPlay() {
    renderHands(false);
    while (handTotal(dealer) < 17) dealer.push(draw());
    renderHands(false);
    const p = handTotal(player);
    const d = handTotal(dealer);
    if (d > 21 || p > d) settle('win');
    else if (p === d) settle('push');
    else settle('lose');
  }

  function startHand() {
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    if (bal < bet) {
      if (typeof showToast === 'function') showToast('Not enough NUTS');
      return;
    }
    balAtHand = bal;
    if (typeof pmSetBalance === 'function') pmSetBalance(bal - bet);
    deck = freshDeck();
    player = [draw(), draw()];
    dealer = [draw(), draw()];
    phase = 'playing';
    setResult('', '');
    renderHands(true);
    if (handTotal(player) === 21) {
      renderHands(false);
      settle('blackjack');
      return;
    }
    updateBetUI();
  }

  function hit() {
    if (phase !== 'playing') return;
    player.push(draw());
    renderHands(true);
    if (handTotal(player) > 21) {
      renderHands(false);
      settle('lose');
    }
  }

  function stand() {
    if (phase !== 'playing') return;
    phase = 'dealer';
    dealerPlay();
  }

  function adjBet(d) {
    const bal = typeof pmGetBalance === 'function' ? pmGetBalance() : 0;
    bet = Math.max(1, Math.min(bal, bet + d));
    updateBetUI();
  }

  function maxBet() {
    bet = Math.max(1, typeof pmGetBalance === 'function' ? pmGetBalance() : 1);
    updateBetUI();
  }

  function updateBetUI() {
    const el = document.getElementById('bjBetDisplay');
    if (el) el.textContent = bet.toLocaleString();
    const bal = document.getElementById('bjBal');
    if (bal && typeof pmGetBalance === 'function') bal.textContent = pmGetBalance().toLocaleString();
  }

  function render() {
    const el = document.getElementById('blackjackPanel');
    if (!el) return;
    el.innerHTML = `
      <div class="bj-table">
        <div class="bj-label">DEALER <span id="bjDealerScore">0</span></div>
        <div class="bj-hand" id="bjDealerHand"></div>
        <div class="bj-divider"></div>
        <div class="bj-label">YOU <span id="bjPlayerScore">0</span></div>
        <div class="bj-hand" id="bjPlayerHand"></div>
      </div>
      <div class="bet-row">
        <button class="bet-adj" type="button" onclick="NutBlackjack.adjBet(-10)">−</button>
        <span class="bet-display">Bet: <strong id="bjBetDisplay">${bet}</strong> NUTS</span>
        <button class="bet-adj" type="button" onclick="NutBlackjack.adjBet(10)">+</button>
        <button class="bet-max" type="button" onclick="NutBlackjack.maxBet()">MAX</button>
      </div>
      <div class="bj-actions">
        <button type="button" class="roulette-spin-btn bj-deal" onclick="NutBlackjack.startHand()">DEAL</button>
        <button type="button" class="bj-act" onclick="NutBlackjack.hit()">HIT</button>
        <button type="button" class="bj-act" onclick="NutBlackjack.stand()">STAND</button>
      </div>
      <div class="spin-result-line" id="bjResult"></div>
      <div class="roulette-bal-line">Balance: <strong id="bjBal">0</strong> NUTS</div>`;
    updateBetUI();
    renderHands(true);
  }

  window.NutBlackjack = {
    render, startHand, hit, stand, adjBet, maxBet,
  };
})();
