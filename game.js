/* ====================================================
   CARD FLIP PARTY GAME
   ==================================================== */

// ---------- DOM REFS ----------
const splash       = document.getElementById('splash');
const gameScreen   = document.getElementById('game');
const startBtn     = document.getElementById('startBtn');
const homeBtn      = document.getElementById('homeBtn');
const soundBtn     = document.getElementById('soundBtn');
const soundOnIcon  = document.getElementById('soundOnIcon');
const soundOffIcon = document.getElementById('soundOffIcon');
const arena        = document.getElementById('arena');
const remainingEl  = document.getElementById('remaining');
const resetBtn     = document.getElementById('resetBtn');
const speedRange   = document.getElementById('speedRange');
const revealOverlay= document.getElementById('revealOverlay');
const flipper      = document.getElementById('flipper');
const flipFront    = document.getElementById('flipFront');
const okBtn        = document.getElementById('okBtn');

// ---------- CONFIG ----------
const SUITS = [
  { key: 'hearts',   symbol: '♥', color: 'red'   },
  { key: 'diamonds', symbol: '♦', color: 'red'   },
  { key: 'spades',   symbol: '♠', color: 'black' },
  { key: 'clubs',    symbol: '♣', color: 'black' }
];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// Per-rank message data (per spec)
// action: short instruction (top in pink)
// message: contextual line (smaller below)
// img: per-rank reaction image (2-A)
const RANK_DATA = {
  '2':  { action: 'ລອດ',                              message: 'ເຈົ້າໄດ້ໃຊ້ດວງໄປແລ້ວ 50%',          img: 'images/card_2.jpeg'  },
  '3':  { action: 'ດື່ມ 1 ຈອກ',                        message: '',                                     img: 'images/card_3.jpeg'  },
  '4':  { action: 'ລອດ',                              message: 'ຍັງຖືວ່າໂຊດີເນາະ',                     img: 'images/card_4.jpeg'  },
  '5':  { action: 'ລອດ',                              message: 'ຄວາມຊວຍອາດແມ່ນຄົນຕໍ່ໄປ',           img: 'images/card_5.jpeg'  },
  '6':  { action: 'ດື່ມ 1 ຈອກ',                        message: '',                                     img: 'images/card_6.jpeg'  },
  '7':  { action: 'ລອດ',                              message: 'ດວງດີ ລອງຊື້ເລກເບິ່ງເດີ',              img: 'images/card_7.jpeg'  },
  '8':  { action: 'ລອດ',                              message: 'ລູກເທວະດາມາເກີດບໍ່ນິ',                img: 'images/card_8.jpeg'  },
  '9':  { action: 'ດື່ມ 1 ຈອກ',                        message: '',                                     img: 'images/card_9.jpeg'  },
  '10': { action: 'ລອດ',                              message: 'ເສຍດາຍບໍ່ໄດ້ກິນຊ້ຳ',                  img: 'images/card_10.jpeg' },
  'J':  { action: 'ຄົນທາງຊ້າຍດື່ມ 1 ຈອກ',              message: '',                                     img: 'images/card_J.jpeg'  },
  'Q':  { action: 'ຄົນທາງຂວາດື່ມ 1 ຈອກ',               message: '',                                     img: 'images/card_Q.jpeg'  },
  'K':  { action: 'ຊວນຄົນທາງຊ້າຍ ແລະ ຂວາດື່ມ 1 ຈອກ',  message: '',                                     img: 'images/card_K.jpeg'  },
  'A':  { action: 'ສັ່ງໃຜກໍ່ໄດ້ດື່ມ 1 ຈອກ',              message: 'ຫຼື ສັ່ງທັງໝົດດື່ມກໍ່ໄດ້',                  img: 'images/card_A.jpeg'  }
};

// Card back image (used on the back of all floating cards and the reveal flipper)
const CARD_BACK = 'images/001.jpeg';

// Visible cards in arena = up to 5 simultaneously
const MAX_VISIBLE = 5;

// ---------- STATE ----------
let deck = [];          // remaining cards (not yet drawn)
let visibleCards = [];  // array of { id, suit, rank, el, angle }
let isRevealing = false;
let soundEnabled = true;
let speed = 5;          // 1-10
let nextId = 0;

// Track shape rotation across frames for smooth circular flow
let baseAngle = 0;
let lastTs = 0;
let rafId = null;

// ---------- AUDIO (WebAudio synth — no external files) ----------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { /* unsupported */ }
  }
}
function playTone({freq=440, dur=0.15, type='sine', vol=0.3, sweepTo=null, delay=0}) {
  if (!soundEnabled || !audioCtx) return;
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== null) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}
function sfxButton() {
  ensureAudio();
  playTone({ freq: 660, sweepTo: 880, dur: 0.1, type: 'triangle', vol: 0.25 });
}
function sfxFlip() {
  ensureAudio();
  // whoosh
  playTone({ freq: 200, sweepTo: 700, dur: 0.25, type: 'sawtooth', vol: 0.15 });
  // click on land
  playTone({ freq: 1000, sweepTo: 600, dur: 0.12, type: 'square', vol: 0.18, delay: 0.6 });
  // sparkle
  playTone({ freq: 1400, sweepTo: 2100, dur: 0.18, type: 'triangle', vol: 0.18, delay: 0.7 });
}
function sfxReset() {
  ensureAudio();
  playTone({ freq: 880, sweepTo: 440, dur: 0.18, type: 'triangle', vol: 0.22 });
  playTone({ freq: 660, sweepTo: 330, dur: 0.18, type: 'triangle', vol: 0.18, delay: 0.1 });
}

// ---------- BUILD DECK ----------
function buildDeck() {
  const arr = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      arr.push({ id: ++nextId, suit: s, rank: r });
    }
  }
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- ARENA LAYOUT ----------
function getArenaSize() {
  const r = arena.getBoundingClientRect();
  return { w: r.width, h: r.height };
}
function getOrbitRadii() {
  const { w, h } = getArenaSize();
  // wide horizontal circle — much wider than tall, like a tilted ring
  const rx = Math.min(w * 0.42, 280);
  const ry = Math.min(h * 0.13, 95);
  return { rx, ry };
}

// position a single card based on its slot index, slot count, and base angle
function placeCard(card, slotIndex, slotCount, time) {
  if (!card.el) return;
  const { rx, ry } = getOrbitRadii();
  const angle = (slotIndex / slotCount) * Math.PI * 2 + baseAngle;
  // horizontal-plane orbit: x = cos*rx (left-right), y = sin*ry (depth shown as small vertical shift)
  const x = Math.cos(angle) * rx;
  const y = Math.sin(angle) * ry;
  // depth scale: cards in the "back" (top, sin negative) appear smaller, "front" (bottom, sin positive) appear larger
  // sin(angle) ranges -1..1; map to scale 0.75..1.05
  const depth = Math.sin(angle); // -1 (back) .. 1 (front)
  const scale = 0.85 + depth * 0.15;
  // z-index based on depth so front cards are above back cards
  card.el.style.zIndex = String(Math.round((depth + 1) * 50));
  // opacity dims slightly when in the back for depth feel
  const opacity = 0.65 + (depth + 1) * 0.175; // 0.65 (back) .. 1.0 (front)
  card.el.style.opacity = opacity.toFixed(2);
  // gentle bobbing & wobble
  const bob = Math.sin(time / 700 + slotIndex * 1.3) * 5;
  const rot = Math.sin(time / 900 + slotIndex * 0.7) * 4;
  card.el.style.transform =
    `translate3d(${x.toFixed(2)}px, ${(y + bob).toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
  card.angle = angle;
}

// ---------- VISIBLE CARDS MGMT ----------
function spawnVisibleCards() {
  // we want up to MAX_VISIBLE visible, capped by what's left total
  const total = visibleCards.length + deck.length;
  const target = Math.min(MAX_VISIBLE, total);
  while (visibleCards.length < target) {
    const card = deck.shift();
    if (!card) break;
    card.el = createCardEl(card);
    arena.appendChild(card.el);
    // slide-in subtle animation
    card.el.animate(
      [
        { opacity: 0, transform: 'translate3d(0,0,0) scale(0.6)' },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
      ],
      { duration: 400, easing: 'cubic-bezier(.34,1.56,.64,1)' }
    );
    visibleCards.push(card);
  }
  updateCounter();
}

function createCardEl(card) {
  const el = document.createElement('div');
  el.className = 'float-card';
  el.dataset.id = card.id;
  el.innerHTML = `
    <div class="card-inner">
      <div class="back-art">
        <img src="${CARD_BACK}" alt="back" draggable="false" />
      </div>
    </div>
  `;
  el.addEventListener('click', () => onCardTap(card));
  return el;
}

function updateCounter() {
  // remaining = visible + deck
  remainingEl.textContent = visibleCards.length + deck.length;
}

// ---------- ANIMATION LOOP ----------
function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(64, ts - lastTs);
  lastTs = ts;
  // speed: 1 (slow) -> 10 (fast). Convert to angular velocity rad/ms
  // baseline at speed 5: full revolution in 18s
  const baseAngVel = (Math.PI * 2) / 18000;
  const angVel = baseAngVel * (speed / 5);
  baseAngle += angVel * dt;

  const count = Math.max(visibleCards.length, 1);
  visibleCards.forEach((c, i) => placeCard(c, i, Math.max(count, 3), ts));

  rafId = requestAnimationFrame(loop);
}
function startLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTs = 0;
  rafId = requestAnimationFrame(loop);
}
function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

// ---------- CARD INTERACTION ----------
function onCardTap(card) {
  if (isRevealing) return;
  isRevealing = true;

  // hide all visible cards (they "go away" while reveal happens)
  visibleCards.forEach(c => {
    if (c.id === card.id) return;
    c.el.classList.add('gone');
  });

  // hide the tapped card immediately
  const cardEl = card.el;
  cardEl.style.opacity = '0';
  cardEl.style.transition = 'opacity 0.2s';

  // play sound
  sfxFlip();

  // build the front face content for the reveal flipper
  buildRevealFront(card);

  // open overlay
  revealOverlay.classList.add('active');
  flipper.classList.remove('flipped', 'entering');

  // reset transform with no transition (instant)
  flipper.style.transition = 'none';
  flipper.style.transform = 'translateY(-100vh) scale(0.4) rotateY(0deg)';
  // force reflow so the next change animates
  void flipper.offsetWidth;

  // animate to center
  requestAnimationFrame(() => {
    flipper.style.transition = 'transform 0.7s cubic-bezier(.34,1.56,.64,1)';
    flipper.style.transform = 'translateY(0) scale(1) rotateY(0deg)';

    // after entering arrives, flip
    setTimeout(() => {
      flipper.style.transition = 'transform 0.7s cubic-bezier(.4,.0,.2,1)';
      flipper.style.transform = 'translateY(0) scale(1) rotateY(180deg)';
      flipper.classList.add('flipped');
      // confetti burst
      spawnConfetti();
      // show OK button after the flip
      setTimeout(() => {
        okBtn.classList.add('visible');
      }, 600);
    }, 720);
  });

  // hide the original floating card (it transitioned to the overlay)
  setTimeout(() => {
    cardEl.style.display = 'none';
  }, 250);

  // remove from visibleCards array
  visibleCards = visibleCards.filter(c => c.id !== card.id);
}

function buildRevealFront(card) {
  const data = RANK_DATA[card.rank];
  const colorClass = card.suit.color === 'red' ? 'red' : 'black';
  const messageHtml = data.message
    ? `<div class="card-message">${data.message}</div>`
    : '';
  flipFront.innerHTML = `
    <div class="card-corner tl ${colorClass}">
      <span class="rank">${card.rank}</span>
      <span class="suit">${card.suit.symbol}</span>
    </div>
    <div class="card-center">
      <img class="card-character" src="${data.img}" alt="character" draggable="false" />
      <div class="card-action">${data.action}</div>
      ${messageHtml}
    </div>
    <div class="card-corner br ${colorClass}">
      <span class="rank">${card.rank}</span>
      <span class="suit">${card.suit.symbol}</span>
    </div>
  `;
}

function spawnConfetti() {
  const colors = ['#ff3b8b', '#8b5cf6', '#4ec3ff', '#fff176', '#7afcff', '#ff7eb9'];
  const stage = revealOverlay.querySelector('.reveal-stage');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.left = '50%';
    piece.style.top = '50%';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    const cx = (Math.random() - 0.5) * 400 + 'px';
    const cy = (Math.random() * 300 + 100) * (Math.random() > 0.5 ? 1 : -1) + 'px';
    const cr = (Math.random() * 720 - 360) + 'deg';
    piece.style.setProperty('--cx', cx);
    piece.style.setProperty('--cy', cy);
    piece.style.setProperty('--cr', cr);
    stage.appendChild(piece);
    setTimeout(() => piece.remove(), 1600);
  }
}

// ---------- OK BUTTON ----------
okBtn.addEventListener('click', () => {
  sfxButton();
  okBtn.classList.remove('visible');
  // close overlay
  revealOverlay.classList.remove('active');
  flipper.classList.remove('entering');
  flipper.classList.remove('flipped');
  // animate flipper out — fade & shrink
  flipper.style.transition = 'transform 0.4s ease-in, opacity 0.3s';
  flipper.style.transform = 'translateY(-30vh) scale(0.5) rotateY(180deg)';
  flipper.style.opacity = '0';
  setTimeout(() => {
    flipper.style.opacity = '';
  }, 350);

  // remove any consumed card elements (those hidden via display:none)
  arena.querySelectorAll('.float-card').forEach(el => {
    if (el.style.display === 'none') el.remove();
  });

  // bring back remaining floating cards
  visibleCards.forEach(c => c.el.classList.remove('gone'));

  // spawn replacements (up to MAX_VISIBLE) — but never beyond what's left
  spawnVisibleCards();

  // if nothing left and deck empty, show subtle "all done" feedback (counter will be 0)
  isRevealing = false;
});

// ---------- RESET ----------
function resetGame() {
  sfxReset();
  // fade out & clear arena
  arena.querySelectorAll('.float-card').forEach(el => {
    el.style.transition = 'opacity 0.25s, transform 0.25s';
    el.style.opacity = '0';
    el.style.transform += ' scale(0.6)';
  });
  setTimeout(() => {
    arena.innerHTML = '';
    visibleCards = [];
    deck = buildDeck();
    spawnVisibleCards();
  }, 260);
}

resetBtn.addEventListener('click', resetGame);

// ---------- START GAME ----------
function startGame() {
  ensureAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  sfxButton();
  splash.classList.remove('active');
  gameScreen.classList.add('active');
  deck = buildDeck();
  arena.innerHTML = '';
  visibleCards = [];
  spawnVisibleCards();
  startLoop();
}
startBtn.addEventListener('click', startGame);

// ---------- HOME ----------
homeBtn.addEventListener('click', () => {
  sfxButton();
  // confirm & go home
  gameScreen.classList.remove('active');
  splash.classList.add('active');
  stopLoop();
  arena.innerHTML = '';
  visibleCards = [];
  deck = [];
});

// ---------- SOUND TOGGLE ----------
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundOnIcon.style.display  = soundEnabled ? '' : 'none';
  soundOffIcon.style.display = soundEnabled ? 'none' : '';
  if (soundEnabled) sfxButton();
});

// ---------- SPEED ----------
speedRange.addEventListener('input', e => {
  speed = parseInt(e.target.value, 10);
});

// ---------- VIEWPORT FIX ----------
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setVH);
setVH();

// Also unlock audio context on first user interaction (mobile)
['touchstart','click'].forEach(evt => {
  window.addEventListener(evt, () => {
    ensureAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });
});
