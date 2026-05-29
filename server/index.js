'use strict'
/**
 * NUT CRASH — Live multiplayer crash game server
 * Hosted on Render.com (free tier, stays warm via WebSocket connections)
 *
 * House edge: ~4%
 * Multiplier formula: e^(0.097 * seconds)
 *   → 2× at ~7.2s, 5× at ~16.6s, 10× at ~23.7s
 */
const WebSocket = require('ws')

const PORT = Number(process.env.PORT) || 3001
const wss  = new WebSocket.Server({ port: PORT }, () =>
  console.log(`[NUT-CRASH] live on port ${PORT}`)
)

// ═══════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════
let phase      = 'waiting'
let mult       = 1.00
let crashAt    = 2.00
let countdown  = 10
let roundId    = 0
let startTime  = 0
let bets       = {}    // sid → { name, amount, cashedOut, cashoutMult }
let history    = []    // [{ m, color }] newest first, max 25

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
const sleep = ms => new Promise(r => setTimeout(r, ms))

function bcast(msg) {
  const s = JSON.stringify(msg)
  for (const c of wss.clients)
    if (c.readyState === WebSocket.OPEN) c.send(s)
}

function emit(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

function publicBets() {
  return Object.entries(bets).map(([sid, b]) => ({
    sid, name: b.name, amount: b.amount,
    cashedOut: b.cashedOut, cashoutMult: b.cashoutMult,
  }))
}

function histColor(m) {
  if (m < 1.5)  return 'red'
  if (m < 3.0)  return 'gold'
  return 'green'
}

// ═══════════════════════════════════════════════
// CRASH POINT GENERATOR
// P(crash > x) ≈ 0.96 / x  (4% house edge)
// ═══════════════════════════════════════════════
function genCrash() {
  const r = Math.random()
  if (r < 0.04) return 1.00                          // 4% insta-crash
  return Math.max(1.01, parseFloat((0.96 / (1 - r)).toFixed(2)))
}

// ═══════════════════════════════════════════════
// MAIN GAME LOOP
// ═══════════════════════════════════════════════
async function gameLoop() {
  while (true) {

    // ── WAITING (10 second bet window) ────────────
    phase     = 'waiting'
    bets      = {}
    crashAt   = genCrash()
    mult      = 1.00
    roundId  += 1

    for (let i = 10; i >= 1; i--) {
      countdown = i
      bcast({ type: 'waiting', countdown, history, roundId })
      await sleep(1000)
    }

    // ── FLYING ────────────────────────────────────
    phase     = 'flying'
    startTime = Date.now()

    for (;;) {
      const s = (Date.now() - startTime) / 1000
      mult    = parseFloat(Math.pow(Math.E, 0.097 * s).toFixed(2))

      if (mult >= crashAt) {
        mult = parseFloat(crashAt.toFixed(2))
        break
      }
      bcast({ type: 'flying', mult, elapsed: parseFloat(s.toFixed(2)), bets: publicBets() })
      await sleep(75)   // ~13 updates/sec
    }

    // ── CRASHED ───────────────────────────────────
    phase = 'crashed'
    const final = mult
    bcast({ type: 'crashed', mult: final, bets: publicBets(), roundId })
    history.unshift({ m: final, color: histColor(final) })
    if (history.length > 25) history.pop()
    console.log(`[round ${roundId}] crashed @ ${final}×  players:${Object.keys(bets).length}`)

    await sleep(3500)
  }
}

// ═══════════════════════════════════════════════
// CONNECTION HANDLER
// ═══════════════════════════════════════════════
wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?'
  console.log(`[+] ${ip}  total:${wss.clients.size}`)

  // Sync new client to current state
  emit(ws, {
    type:      'sync',
    phase,
    mult,
    countdown,
    elapsed:   startTime ? parseFloat(((Date.now() - startTime) / 1000).toFixed(2)) : 0,
    history,
    bets:      publicBets(),
    roundId,
  })

  ws.on('message', raw => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    const sid    = String(msg.sid   || '').slice(0, 40)
    const name   = String(msg.name  || 'Anon').slice(0, 28)
    const amount = Math.max(1, Math.floor(Number(msg.amount) || 0))

    // Place bet — only during waiting phase
    if (msg.type === 'bet' && phase === 'waiting' && amount > 0 && sid) {
      bets[sid] = { name, amount, cashedOut: false, cashoutMult: null }
      bcast({ type: 'bet_placed', sid, name, amount })
    }

    // Cash out — only during flying phase
    if (msg.type === 'cashout' && phase === 'flying' && sid) {
      const bet = bets[sid]
      if (!bet || bet.cashedOut) return
      bet.cashedOut   = true
      bet.cashoutMult = mult
      const payout    = Math.floor(bet.amount * mult)
      emit(ws, { type: 'cashout_ok', payout, mult, amount: bet.amount })
      bcast({ type: 'cashout', sid, name: bet.name, mult })
      console.log(`  cashout: ${name}  ${bet.amount} → ${payout} @ ${mult}×`)
    }
  })

  ws.on('close',   () => console.log(`[-] gone  total:${wss.clients.size}`))
  ws.on('error',   err => console.log(`[err] ${err.message}`))
})

gameLoop().catch(err => { console.error('[FATAL]', err); process.exit(1) })
