/**
 * nutrank.js — NUT Level and Rank System
 *
 * Player level is determined by all-time nut count (localStorage: nut_alltime_v1).
 * Levels control the wheel segment set (harder odds, bigger jackpots at high levels).
 * Badges appear on the leaderboard and profile page.
 */
(function () {

// ── Rank table ────────────────────────────────────────────────
const RANKS = [
  { level:0, min:0,    max:0,         name:'Seedling',  badge:'🌱', short:'LV0', color:'#4ade80', bg:'rgba(4,40,14,0.9)',  desc:'Just planted.' },
  { level:1, min:1,    max:9,         name:'Sprout',    badge:'🌿', short:'LV1', color:'#22c55e', bg:'rgba(4,40,14,0.9)',  desc:'Something is growing.' },
  { level:2, min:10,   max:49,        name:'Acorn',     badge:'🌰', short:'LV2', color:'#d97706', bg:'rgba(28,14,2,0.9)',  desc:'Potential energy.' },
  { level:3, min:50,   max:99,        name:'Nutling',   badge:'🥜', short:'LV3', color:'#ca8a04', bg:'rgba(28,16,2,0.9)',  desc:'A proper nutter.' },
  { level:4, min:100,  max:249,       name:'Squirrel',  badge:'🐿', short:'LV4', color:'#b45309', bg:'rgba(28,10,2,0.9)',  desc:'Storing up.' },
  { level:5, min:250,  max:499,       name:'NUT Scout', badge:'⚡', short:'LV5', color:'#7c3aed', bg:'rgba(13,4,33,0.9)',  desc:'On the grind.' },
  { level:6, min:500,  max:999,       name:'Veteran',   badge:'🏆', short:'LV6', color:'#dc2626', bg:'rgba(28,2,2,0.9)',   desc:'Survived it all.' },
  { level:7, min:1000, max:2499,      name:'Diamond',   badge:'💎', short:'LV7', color:'#38bdf8', bg:'rgba(2,12,28,0.9)',  desc:'Crystallized conviction.' },
  { level:8, min:2500, max:4999,      name:'NUT King',  badge:'👑', short:'LV8', color:'#f59e0b', bg:'rgba(28,16,2,0.9)',  desc:'Royalty of the logs.' },
  { level:9, min:5000, max:Infinity,  name:'GOAT',      badge:'🌟', short:'LV9', color:'#fbbf24', bg:'rgba(28,20,0,0.9)',  desc:'Greatest of all time.' },
]

// ── Core helpers ──────────────────────────────────────────────
function getRank(nutCount) {
  const n = Math.max(0, Math.floor(nutCount || 0))
  return RANKS.find(r => n >= r.min && n <= r.max) || RANKS[0]
}

function getBadgeHTML(nutCount, compact) {
  const r = getRank(nutCount)
  if (compact) {
    return `<span class="nr-badge nr-compact" style="color:${r.color};border-color:${r.color};" title="Level ${r.level} ${r.name} (${Math.floor(nutCount)} nuts)">${r.badge} ${r.short}</span>`
  }
  return `<span class="nr-badge" style="color:${r.color};border-color:${r.color};" title="${r.desc}">${r.badge} ${r.name}</span>`
}

function getLevelProgressHTML(nutCount) {
  const n = Math.max(0, Math.floor(nutCount || 0))
  const r = getRank(n)
  if (r.max === Infinity) return `<span class="nr-max" style="color:${r.color}">MAX RANK ${r.badge}</span>`
  const pct = Math.round(((n - r.min) / (r.max - r.min + 1)) * 100)
  const next = RANKS[r.level + 1]
  return `
    <div class="nr-progress-wrap">
      <div class="nr-progress-bar" style="width:${pct}%;background:${r.color}"></div>
    </div>
    <span class="nr-progress-label">${n.toLocaleString()} / ${(r.max + 1).toLocaleString()} nuts${next ? ' → ' + next.badge + ' ' + next.name : ''}</span>
  `
}

// ── Adaptive wheel segment sets ───────────────────────────────
// Weighted segments: lower weight = rarer. Higher levels get worse base odds
// but unlock bigger jackpots. Segment count is always 12 for visual consistency.
function getWheelSegments(level) {
  const l = Math.max(0, Math.floor(level || 0))

  if (l <= 1) {
    // Beginner: generous training wheels. 8/12 pay, max 25x
    return [
      { label:'BUST',    mult:0,    color:'#5a0000', textColor:'#ff6060', weight:6  },
      { label:'1.5×',    mult:1.5,  color:'#0a2a14', textColor:'#4ade80', weight:10 },
      { label:'2×',      mult:2,    color:'#0a3020', textColor:'#22c55e', weight:9  },
      { label:'BUST',    mult:0,    color:'#450000', textColor:'#ff4444', weight:6  },
      { label:'1.5×',    mult:1.5,  color:'#0a2a14', textColor:'#4ade80', weight:10 },
      { label:'3×',      mult:3,    color:'#2a1a00', textColor:'#f59e0b', weight:7  },
      { label:'BUST',    mult:0,    color:'#5a0000', textColor:'#ff6060', weight:6  },
      { label:'2×',      mult:2,    color:'#0a3020', textColor:'#22c55e', weight:9  },
      { label:'5×',      mult:5,    color:'#1a0a00', textColor:'#f97316', weight:5  },
      { label:'BUST',    mult:0,    color:'#450000', textColor:'#ff4444', weight:6  },
      { label:'3×',      mult:3,    color:'#2a1a00', textColor:'#f59e0b', weight:7  },
      { label:'🌱 25×',  mult:25,   color:'#1a0048', textColor:'#c084fc', weight:2  },
    ]
  }
  if (l <= 3) {
    // Intermediate: 48% house edge, max 50x
    return [
      { label:'BUST',    mult:0,    color:'#5a0000', textColor:'#ff6060', weight:10 },
      { label:'1.5×',    mult:1.5,  color:'#0a2a14', textColor:'#4ade80', weight:8  },
      { label:'2×',      mult:2,    color:'#0a3020', textColor:'#22c55e', weight:7  },
      { label:'BUST',    mult:0,    color:'#450000', textColor:'#ff4444', weight:10 },
      { label:'1.5×',    mult:1.5,  color:'#0a2a14', textColor:'#4ade80', weight:8  },
      { label:'5×',      mult:5,    color:'#1a0a00', textColor:'#f97316', weight:5  },
      { label:'BUST',    mult:0,    color:'#5a0000', textColor:'#ff6060', weight:10 },
      { label:'2×',      mult:2,    color:'#0a3020', textColor:'#22c55e', weight:7  },
      { label:'3×',      mult:3,    color:'#2a1a00', textColor:'#f59e0b', weight:6  },
      { label:'BUST',    mult:0,    color:'#450000', textColor:'#ff4444', weight:10 },
      { label:'10×',     mult:10,   color:'#001a3a', textColor:'#60a5fa', weight:3  },
      { label:'🌰 50×',  mult:50,   color:'#1a0048', textColor:'#c084fc', weight:1  },
    ]
  }
  if (l <= 5) {
    // Advanced: 62% house edge, max 100x jackpot
    return [
      { label:'BUST',    mult:0,    color:'#5a0000', textColor:'#ff6060', weight:13 },
      { label:'BUST',    mult:0,    color:'#450000', textColor:'#ff4444', weight:13 },
      { label:'1.5×',    mult:1.5,  color:'#0a2a14', textColor:'#4ade80', weight:7  },
      { label:'BUST',    mult:0,    color:'#3a0000', textColor:'#ff3333', weight:13 },
      { label:'2×',      mult:2,    color:'#0a3020', textColor:'#22c55e', weight:6  },
      { label:'5×',      mult:5,    color:'#1a0a00', textColor:'#f97316', weight:5  },
      { label:'BUST',    mult:0,    color:'#5a0000', textColor:'#ff6060', weight:13 },
      { label:'3×',      mult:3,    color:'#2a1a00', textColor:'#f59e0b', weight:5  },
      { label:'10×',     mult:10,   color:'#001a3a', textColor:'#60a5fa', weight:4  },
      { label:'BUST',    mult:0,    color:'#450000', textColor:'#ff4444', weight:13 },
      { label:'20×',     mult:20,   color:'#001a4a', textColor:'#93c5fd', weight:2  },
      { label:'⚡ 100×', mult:100,  color:'#1a0048', textColor:'#c084fc', weight:1  },
    ]
  }
  // Veteran/Legend (6-9): brutal 72% house edge, max 250x jackpot
  return [
    { label:'BUST',      mult:0,    color:'#5a0000', textColor:'#ff6060', weight:15 },
    { label:'BUST',      mult:0,    color:'#450000', textColor:'#ff4444', weight:15 },
    { label:'BUST',      mult:0,    color:'#3a0000', textColor:'#ff3333', weight:15 },
    { label:'2×',        mult:2,    color:'#0a3020', textColor:'#22c55e', weight:6  },
    { label:'BUST',      mult:0,    color:'#2a0000', textColor:'#ff2222', weight:15 },
    { label:'5×',        mult:5,    color:'#1a0a00', textColor:'#f97316', weight:5  },
    { label:'10×',       mult:10,   color:'#001a3a', textColor:'#60a5fa', weight:4  },
    { label:'BUST',      mult:0,    color:'#5a0000', textColor:'#ff6060', weight:15 },
    { label:'20×',       mult:20,   color:'#001a4a', textColor:'#93c5fd', weight:3  },
    { label:'50×',       mult:50,   color:'#001060', textColor:'#bfdbfe', weight:2  },
    { label:'1.5×',      mult:1.5,  color:'#0a2a14', textColor:'#4ade80', weight:6  },
    { label:'🌟 250×',   mult:250,  color:'#1a0048', textColor:'#e9d5ff', weight:1  },
  ]
}

// ── Weighted random pick ──────────────────────────────────────
function pickWeighted(segments) {
  const total = segments.reduce((s, x) => s + x.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < segments.length; i++) {
    r -= segments[i].weight
    if (r <= 0) return i
  }
  return segments.length - 1
}

// ── NPC level flavour ─────────────────────────────────────────
// Assign a nut count to an NPC based on a seed string so it's consistent
function npcNuts(seedStr) {
  let h = 0
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0
  const bands = [0,2,6,25,80,200,400,800,1800,4000]
  return bands[h % bands.length] + (h % 40)
}

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
.nr-badge {
  display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:800;
  letter-spacing:.05em;padding:2px 6px;border-radius:5px;
  border:1px solid currentColor;font-family:'Space Mono',monospace;
  vertical-align:middle;white-space:nowrap;opacity:0.95;
}
.nr-badge.nr-compact { font-size:8.5px;padding:1px 5px; }
.nr-max { font-size:11px;font-weight:800;font-family:'Space Mono',monospace; }
.nr-progress-wrap {
  height:3px;background:rgba(255,255,255,0.08);border-radius:2px;
  overflow:hidden;margin:3px 0 2px;
}
.nr-progress-bar { height:100%;border-radius:2px;transition:width .5s ease; }
.nr-progress-label { font-size:9px;color:#5f7281;font-family:'Space Mono',monospace; }
`

function injectCSS() {
  if (document.getElementById('nutrank-css')) return
  const s = document.createElement('style')
  s.id = 'nutrank-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCSS)
} else {
  injectCSS()
}

// ── Public API ────────────────────────────────────────────────
window.NutRank = {
  RANKS, getRank, getBadgeHTML, getLevelProgressHTML,
  getWheelSegments, pickWeighted, npcNuts, injectCSS,
}

})()
