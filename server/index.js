'use strict'
/**
 * NUT CASINO SERVER
 * GET /       → NUT Crash live multiplayer
 * GET /poker  → Texas Hold'em multiplayer
 */
const WebSocket = require('ws')
const PORT = Number(process.env.PORT) || 3001
const wss  = new WebSocket.Server({ port: PORT }, () =>
  console.log(`[NUT-SERVER] live on port ${PORT}`)
)

// ════════════════════════════════════════════════
//  SHARED HELPERS
// ════════════════════════════════════════════════
const sleep = ms => new Promise(r => setTimeout(r, ms))
function bcastTo(set, msg) {
  const s = JSON.stringify(msg)
  for (const c of set) if (c.readyState === WebSocket.OPEN) c.send(s)
}
function emit(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

// ════════════════════════════════════════════════
//  CRASH GAME
// ════════════════════════════════════════════════
const crashClients = new Set()
let cPhase     = 'waiting'
let cMult      = 1.00
let cCrashAt   = 2.00
let cCountdown = 10
let cRoundId   = 0
let cStartTime = 0
let cBets      = {}
let cHistory   = []

function cBcast(msg)         { bcastTo(crashClients, msg) }
function cPublicBets()       { return Object.entries(cBets).map(([sid,b])=>({sid,name:b.name,amount:b.amount,cashedOut:b.cashedOut,cashoutMult:b.cashoutMult})) }
function cHistColor(m)       { return m<1.5?'red':m<3.0?'gold':'green' }
function genCrashPt()        { const r=Math.random(); if(r<0.04) return 1.00; return Math.max(1.01,parseFloat((0.96/(1-r)).toFixed(2))) }

async function crashLoop() {
  while (true) {
    cPhase='waiting'; cBets={}; cCrashAt=genCrashPt(); cMult=1.00; cRoundId++
    for (let i=10; i>=1; i--) {
      cCountdown=i
      cBcast({ type:'waiting', countdown:i, history:cHistory, roundId:cRoundId })
      await sleep(1000)
    }
    cPhase='flying'; cStartTime=Date.now()
    for (;;) {
      const s=(Date.now()-cStartTime)/1000
      cMult=parseFloat(Math.pow(Math.E,0.097*s).toFixed(2))
      if (cMult>=cCrashAt) { cMult=parseFloat(cCrashAt.toFixed(2)); break }
      cBcast({ type:'flying', mult:cMult, elapsed:parseFloat(s.toFixed(2)), bets:cPublicBets() })
      await sleep(75)
    }
    cPhase='crashed'
    cBcast({ type:'crashed', mult:cMult, bets:cPublicBets(), roundId:cRoundId })
    cHistory.unshift({ m:cMult, color:cHistColor(cMult) })
    if (cHistory.length>25) cHistory.pop()
    console.log(`[crash ${cRoundId}] @${cMult}×  players:${Object.keys(cBets).length}`)
    await sleep(3500)
  }
}

function handleCrash(ws, req) {
  const ip = req.headers['x-forwarded-for']||req.socket.remoteAddress||'?'
  console.log(`[crash +] ${ip}  total:${crashClients.size+1}`)
  crashClients.add(ws)
  emit(ws, { type:'sync', phase:cPhase, mult:cMult, countdown:cCountdown,
    elapsed:cStartTime?parseFloat(((Date.now()-cStartTime)/1000).toFixed(2)):0,
    history:cHistory, bets:cPublicBets(), roundId:cRoundId })
  ws.on('message', raw => {
    let msg; try { msg=JSON.parse(raw) } catch { return }
    const sid    = String(msg.sid  ||'').slice(0,40)
    const name   = String(msg.name ||'Anon').slice(0,28)
    const amount = Math.max(1,Math.floor(Number(msg.amount)||0))
    if (msg.type==='bet' && cPhase==='waiting' && amount>0 && sid) {
      cBets[sid]={ name,amount,cashedOut:false,cashoutMult:null }
      cBcast({ type:'bet_placed', sid, name, amount })
    }
    if (msg.type==='cashout' && cPhase==='flying' && sid) {
      const bet=cBets[sid]; if(!bet||bet.cashedOut) return
      bet.cashedOut=true; bet.cashoutMult=cMult
      const payout=Math.floor(bet.amount*cMult)
      emit(ws,{type:'cashout_ok',payout,mult:cMult,amount:bet.amount})
      cBcast({type:'cashout',sid,name:bet.name,mult:cMult})
    }
  })
  ws.on('close', ()=>{ crashClients.delete(ws); console.log(`[crash -] total:${crashClients.size}`) })
  ws.on('error', err=>console.log(`[crash err] ${err.message}`))
}

// ════════════════════════════════════════════════
//  POKER — Texas Hold'em
// ════════════════════════════════════════════════
const PRANKS   = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']
const PSUITS   = ['S','H','D','C']
const RVAL     = Object.fromEntries(PRANKS.map((r,i)=>[r,i+2]))  // 2→2 … A→14

const P_SB=10, P_BB=20, P_START=2000, P_MAXSEATS=6, P_ACT_MS=30000

const pokerClients = new Set()
const pokerPlayers = {}  // sid → player

let pPhase      = 'lobby'   // lobby|preflop|flop|turn|river|showdown
let pDeck       = []
let pComm       = []         // community cards
let pPot        = 0
let pDealerIdx  = 0          // index into seated() array
let pActSid     = null       // sid of player whose turn it is
let pCurBet     = 0
let pRound      = 0
let pActTimer   = null
let pAutoStartT = null

// ─ deck ─────────────────────────────────────────
function makeDeck()  { const d=[]; for(const r of PRANKS) for(const s of PSUITS) d.push(r+s); return d }
function shuffle(d)  { for(let i=d.length-1;i>0;i--){const j=0|Math.random()*(i+1);[d[i],d[j]]=[d[j],d[i]]} return d }

// ─ player sets ──────────────────────────────────
function pSeated()  { return Object.values(pokerPlayers).filter(p=>p.sitting).sort((a,b)=>a.seat-b.seat) }
function pActive()  { return pSeated().filter(p=>!p.folded&&!p.allIn) }
function pInHand()  { return pSeated().filter(p=>!p.folded) }

// ─ broadcast ────────────────────────────────────
function pBcast(msg)  { bcastTo(pokerClients, msg) }
function pBcastState() {
  for (const [sid,p] of Object.entries(pokerPlayers)) {
    if (p.ws&&p.ws.readyState===WebSocket.OPEN) emit(p.ws, pStateFor(sid))
  }
}
function pStateFor(viewSid) {
  return {
    type:'poker:state', phase:pPhase, community:pComm, pot:pPot,
    actSid:pActSid, curBet:pCurBet, round:pRound,
    players: pSeated().map(p=>({
      sid:p.sid, name:p.name, chips:p.chips, seat:p.seat,
      folded:p.folded, allIn:p.allIn, bet:p.bet,
      isDealer:p.isDealer||false, isSB:p.isSB||false, isBB:p.isBB||false,
      holeCards: (p.sid===viewSid || (pPhase==='showdown'&&!p.folded))
        ? p.holeCards : ['back','back'],
    })),
  }
}

// ─ hand evaluator ───────────────────────────────
function evalBest(cards) {
  if (cards.length<5) return { rank:-1, tb:0, desc:'N/A' }
  let best=null
  for (let a=0;a<cards.length-4;a++)
  for (let b=a+1;b<cards.length-3;b++)
  for (let c=b+1;c<cards.length-2;c++)
  for (let d=c+1;d<cards.length-1;d++)
  for (let e=d+1;e<cards.length;e++) {
    const s=score5([cards[a],cards[b],cards[c],cards[d],cards[e]])
    if (!best||s.rank>best.rank||(s.rank===best.rank&&s.tb>best.tb)) best=s
  }
  return best
}

function score5(cs) {
  const vs=cs.map(c=>RVAL[c[0]]).sort((a,b)=>b-a)
  const ss=cs.map(c=>c[1])
  const flush=ss.every(s=>s===ss[0])
  let straight=false,straightHi=0
  if (vs[0]-vs[4]===4&&new Set(vs).size===5) { straight=true; straightHi=vs[0] }
  if (vs[0]===14&&vs[1]===5&&vs[2]===4&&vs[3]===3&&vs[4]===2) { straight=true; straightHi=5 }
  const cnt={}; for(const v of vs) cnt[v]=(cnt[v]||0)+1
  const grp=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||b[0]-a[0])
  const g0=Number(grp[0][0]),g0c=grp[0][1]
  const g1=grp[1]?Number(grp[1][0]):0,g1c=grp[1]?grp[1][1]:0
  const g2=grp[2]?Number(grp[2][0]):0, g3=grp[3]?Number(grp[3][0]):0
  let rank,tb,desc
  if      (straight&&flush)    { rank=8;tb=straightHi;                              desc=straightHi===14?'Royal Flush':'Straight Flush' }
  else if (g0c===4)            { rank=7;tb=g0*100+g1;                               desc='Four of a Kind' }
  else if (g0c===3&&g1c===2)   { rank=6;tb=g0*100+g1;                               desc='Full House' }
  else if (flush)              { rank=5;tb=vs.reduce((a,v,i)=>a+v*Math.pow(15,4-i),0); desc='Flush' }
  else if (straight)           { rank=4;tb=straightHi;                              desc='Straight' }
  else if (g0c===3)            { rank=3;tb=g0*10000+g1*100+g2;                      desc='Three of a Kind' }
  else if (g0c===2&&g1c===2)   { const h=Math.max(g0,g1),l=Math.min(g0,g1); rank=2;tb=h*10000+l*100+g2; desc='Two Pair' }
  else if (g0c===2)            { rank=1;tb=g0*1e6+g1*10000+g2*100+g3;              desc='One Pair' }
  else                         { rank=0;tb=vs.reduce((a,v,i)=>a+v*Math.pow(15,4-i),0); desc='High Card' }
  return { rank,tb,desc }
}

// ─ game flow ────────────────────────────────────
function pStart() {
  clearTimeout(pAutoStartT); pAutoStartT=null
  const s=pSeated()
  if (s.length<2) { pPhase='lobby'; pBcast({type:'poker:waiting',seats:s.length}); return }
  pRound++; pPhase='preflop'; pDeck=shuffle(makeDeck()); pComm=[]; pPot=0; pCurBet=P_BB

  for (const p of s) {
    p.holeCards=[pDeck.pop(),pDeck.pop()]
    p.folded=false; p.allIn=false; p.bet=0; p.totalBet=0; p.acted=false
    p.isDealer=false; p.isSB=false; p.isBB=false
  }

  pDealerIdx=pDealerIdx%s.length
  s[pDealerIdx].isDealer=true
  const sbIdx=(pDealerIdx+1)%s.length, bbIdx=(pDealerIdx+2)%s.length
  pBlind(s[sbIdx],P_SB); s[sbIdx].isSB=true; s[sbIdx].acted=false
  pBlind(s[bbIdx],P_BB); s[bbIdx].isBB=true; s[bbIdx].acted=false
  const utgIdx=(bbIdx+1)%s.length
  pActSid=s[utgIdx].sid
  pDealerIdx++
  pBcastState()
  pBcast({type:'poker:dealt',round:pRound})
  pPrompt()
}

function pBlind(p,amount) {
  const a=Math.min(amount,p.chips); p.chips-=a; p.bet=a; p.totalBet=a; pPot+=a
  if (p.chips===0) p.allIn=true
}

function pPrompt() {
  clearTimeout(pActTimer)
  if (!pActSid) { pNextStreet(); return }
  const p=pokerPlayers[pActSid]
  const canCheck = p && p.bet>=pCurBet
  pBcast({type:'poker:prompt',sid:pActSid,curBet:pCurBet,canCheck,timeout:30})
  pActTimer=setTimeout(()=>{ if(pActSid) pAct(pActSid,'fold') }, P_ACT_MS)
}

function pAct(sid,action,raiseAmt=0) {
  const p=pokerPlayers[sid]
  if (!p||p.sid!==pActSid||p.folded||p.allIn) return
  clearTimeout(pActTimer); p.acted=true

  if (action==='fold') {
    p.folded=true
    pBcast({type:'poker:fold',sid,name:p.name,seat:p.seat})
  } else if (action==='call') {
    const toCall=Math.min(pCurBet-p.bet,p.chips)
    p.chips-=toCall; p.bet+=toCall; p.totalBet+=toCall; pPot+=toCall
    if (p.chips===0) p.allIn=true
    pBcast({type:'poker:call',sid,name:p.name,amount:toCall,seat:p.seat})
  } else if (action==='check') {
    if (p.bet<pCurBet) { pAct(sid,'call'); return }
    pBcast({type:'poker:check',sid,name:p.name,seat:p.seat})
  } else if (action==='raise') {
    const minRaise=pCurBet+Math.max(P_BB,pCurBet-p.bet)
    const target=Math.max(minRaise,Math.min(raiseAmt,p.chips+p.bet))
    const extra=target-p.bet; p.chips-=extra; p.bet=target; p.totalBet+=extra; pPot+=extra
    pCurBet=target
    if (p.chips===0) p.allIn=true
    for (const op of pActive()) if(op.sid!==sid) op.acted=false
    pBcast({type:'poker:raise',sid,name:p.name,amount:target,seat:p.seat})
  }
  pAdvance()
}

function pAllActed() {
  return pActive().every(p=>p.acted&&p.bet===pCurBet)
}

function pAdvance() {
  const alive=pInHand()
  if (alive.length===1) { pAwardPot([alive[0]]); return }
  const canAct=pActive().filter(p=>!p.acted||p.bet<pCurBet)
  if (!canAct.length) { pNextStreet(); return }
  const arr=pActive()
  if (!arr.length) { pNextStreet(); return }
  const idx=arr.findIndex(p=>p.sid===pActSid)
  pActSid=arr[(idx+1)%arr.length].sid
  pBcastState(); pPrompt()
}

function pNextStreet() {
  clearTimeout(pActTimer)
  for (const p of pSeated()) { p.bet=0; p.acted=false }
  pCurBet=0

  if      (pPhase==='preflop') { pPhase='flop';  pDeck.pop(); pComm.push(pDeck.pop(),pDeck.pop(),pDeck.pop()); }
  else if (pPhase==='flop')    { pPhase='turn';  pDeck.pop(); pComm.push(pDeck.pop()); }
  else if (pPhase==='turn')    { pPhase='river'; pDeck.pop(); pComm.push(pDeck.pop()); }
  else                         { pShowdown(); return }

  pBcast({type:'poker:street',street:pPhase,community:pComm})

  const s=pSeated(); const dIdx=s.findIndex(p=>p.isDealer)
  pActSid=null
  for (let i=1;i<=s.length;i++) {
    const candidate=s[(dIdx+i)%s.length]
    if (!candidate.folded&&!candidate.allIn) { pActSid=candidate.sid; break }
  }
  if (!pActSid) { pShowdown(); return }
  pBcastState(); pPrompt()
}

function pShowdown() {
  pPhase='showdown'; clearTimeout(pActTimer)
  const contestants=pInHand()
  const scored=contestants.map(p=>{
    const all=[...p.holeCards,...pComm]
    return {...p, score:evalBest(all)}
  }).sort((a,b)=>b.score.rank-a.score.rank||b.score.tb-a.score.tb)
  const winners=scored.filter(p=>p.score.rank===scored[0].score.rank&&p.score.tb===scored[0].score.tb)
  pBcastState()
  pAwardPot(winners,scored)
}

function pAwardPot(winners,scored=[]) {
  clearTimeout(pActTimer)
  const share=Math.floor(pPot/winners.length)
  for (const w of winners) { const p=pokerPlayers[w.sid]; if(p) p.chips+=share }
  pBcast({
    type:'poker:result',
    winners:winners.map(w=>({
      sid:w.sid, name:w.name, chips:pokerPlayers[w.sid]?.chips||0,
      desc:w.score?.desc||'Best hand', holeCards:w.holeCards, amount:share,
    })),
    scored:scored.map(p=>({sid:p.sid,name:p.name,holeCards:p.holeCards,desc:p.score?.desc||''})),
    pot:pPot, community:pComm,
  })
  pPot=0; pBcastState()
  setTimeout(()=>{
    for (const p of Object.values(pokerPlayers)) if(p.chips<=0) p.chips=P_START
    pStart()
  },7000)
}

function handlePoker(ws, req) {
  const ip=req.headers['x-forwarded-for']||req.socket.remoteAddress||'?'
  console.log(`[poker +] ${ip}`)
  pokerClients.add(ws)
  emit(ws,{type:'poker:welcome',phase:pPhase,seats:pSeated().length,round:pRound})

  ws.on('message', raw=>{
    let msg; try { msg=JSON.parse(raw) } catch { return }
    const sid  = String(msg.sid  ||'').slice(0,40)
    const name = String(msg.name ||'Player').slice(0,20)

    if (msg.type==='poker:join') {
      if (!sid) return
      if (!pokerPlayers[sid]) {
        const taken=new Set(Object.values(pokerPlayers).filter(p=>p.sitting).map(p=>p.seat))
        let seat=-1; for(let i=0;i<P_MAXSEATS;i++) if(!taken.has(i)){seat=i;break}
        if (seat===-1) { emit(ws,{type:'poker:error',message:'Table full (6/6)'}); return }
        pokerPlayers[sid]={ws,sid,name,chips:P_START,seat,holeCards:[],folded:true,allIn:false,bet:0,totalBet:0,acted:false,sitting:true,isDealer:false,isSB:false,isBB:false}
      } else {
        pokerPlayers[sid].ws=ws; pokerPlayers[sid].name=name; pokerPlayers[sid].sitting=true
      }
      emit(ws,pStateFor(sid))
      pBcast({type:'poker:joined',sid,name,seat:pokerPlayers[sid].seat,chips:pokerPlayers[sid].chips})
      const sc=pSeated().length
      if (pPhase==='lobby'&&sc>=2&&!pAutoStartT) {
        pBcast({type:'poker:starting_soon',countdown:5})
        pAutoStartT=setTimeout(pStart,5000)
      }
    }

    const p=pokerPlayers[sid]
    if (!p||p.ws!==ws) return
    if (msg.type==='poker:fold')      pAct(sid,'fold')
    if (msg.type==='poker:call')      pAct(sid,'call')
    if (msg.type==='poker:check')     pAct(sid,'check')
    if (msg.type==='poker:raise')     pAct(sid,'raise',Number(msg.amount)||P_BB*3)
    if (msg.type==='poker:state_req') emit(ws,pStateFor(sid))
    if (msg.type==='poker:leave') {
      p.sitting=false
      if (pActSid===sid&&pPhase!=='lobby'&&pPhase!=='showdown') pAct(sid,'fold')
      pBcast({type:'poker:left',sid,name:p.name})
    }
  })

  ws.on('close',()=>{
    pokerClients.delete(ws)
    for (const [sid,p] of Object.entries(pokerPlayers)) {
      if (p.ws===ws) {
        p.sitting=false
        if (pActSid===sid&&pPhase!=='lobby'&&pPhase!=='showdown') pAct(sid,'fold')
      }
    }
    console.log(`[poker -] total:${pokerClients.size}`)
  })
  ws.on('error',err=>console.log(`[poker err] ${err.message}`))
}

// ════════════════════════════════════════════════
//  ROUTE INCOMING CONNECTIONS
// ════════════════════════════════════════════════
wss.on('connection', (ws, req) => {
  const url = (req.url||'/').split('?')[0]
  if (url.startsWith('/poker')) handlePoker(ws, req)
  else                          handleCrash(ws, req)
})

crashLoop().catch(err => { console.error('[FATAL crash]', err); process.exit(1) })
