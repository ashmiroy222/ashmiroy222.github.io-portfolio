/* ---------------- Nav: center target section instead of top-aligning ---------------- */
document.querySelectorAll('nav a[href^="#"]').forEach(link=>{
  link.addEventListener('click', (e)=>{
    const target = document.querySelector(link.getAttribute('href'));
    if(!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior:'smooth', block:'center' });
  });
});

/* ---------------- Confetti particle burst (shared) ---------------- */
function burstConfetti(el, opts={}){
  const rect = el.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const count = opts.count || 8;
  const colors = opts.colors || ['var(--accent)','var(--c1)','var(--c2)','var(--c3)','var(--c4)'];
  const spread = opts.spread || 46;
  for(let i = 0; i < count; i++){
    const p = document.createElement('span');
    p.className = 'confetti-particle';
    const size = 3 + Math.random() * 4;
    const roundness = Math.random() > 0.5 ? '50%' : '2px';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.borderRadius = roundness;
    p.style.background = colors[i % colors.length];
    p.style.left = originX + 'px';
    p.style.top = originY + 'px';
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const dist = spread * (0.6 + Math.random() * 0.7);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 8;
    const rot = Math.floor(Math.random() * 360);
    const anim = p.animate([
      { transform:'translate(-50%,-50%) translate(0,0) rotate(0deg) scale(1)', opacity:1 },
      { transform:`translate(-50%,-50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(.4)`, opacity:0 }
    ], { duration: 500 + Math.random() * 250, easing:'cubic-bezier(.2,.8,.3,1)' });
    anim.onfinish = ()=> p.remove();
  }
}

/* ---------------- Scribble microinteraction: pop + confetti, only on the tagged sparkles ---------------- */
document.querySelectorAll('.scribble-confetti').forEach(el=>{
  el.addEventListener('mouseenter', ()=>{
    el.classList.remove('pop');
    void el.offsetWidth; // restart animation on re-hover
    el.classList.add('pop');
    burstConfetti(el, { count:7, spread:38 });
  });
  el.addEventListener('animationend', ()=> el.classList.remove('pop'));
});

/* ---------------- Scribble microinteraction: shape-specific animations ---------------- */
function retriggerAnim(el, className){
  el.classList.remove(className);
  void el.offsetWidth; // restart animation on re-hover
  el.classList.add(className);
}
const scribbleShapeMap = [
  ['.scribble-wave', 'wiggle'],
  ['.scribble-circle', 'spiral'],
  ['.scribble-heart', 'heartbeat'],
  ['.scribble-arrow', 'dart'],
  ['.scribble-plus', 'flash'],
];
scribbleShapeMap.forEach(([selector, className])=>{
  document.querySelectorAll(selector).forEach(el=>{
    el.addEventListener('mouseenter', ()=> retriggerAnim(el, className));
    el.addEventListener('animationend', ()=> el.classList.remove(className));
  });
});

/* ---------------- Hero accent words: pop the whole headline block + confetti ---------------- */
document.querySelectorAll('h1 em').forEach(em=>{
  em.addEventListener('mouseenter', ()=>{
    const h1 = em.closest('h1');
    if(h1) h1.classList.add('pop-block');
    burstConfetti(em, { count:10, spread:55, colors:['var(--accent)','var(--c1)','var(--c2)','var(--c3)','var(--c4)'] });
  });
  em.addEventListener('mouseleave', ()=>{
    const h1 = em.closest('h1');
    if(h1) h1.classList.remove('pop-block');
  });
});

/* ---------------- Theme ---------------- */
const body = document.body;
const themeSwitch = document.getElementById('themeSwitch');
themeSwitch.addEventListener('click', () => {
  const dark = body.getAttribute('data-theme') === 'dark';
  const next = dark ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  try{ localStorage.setItem('theme', next); }catch(e){}
  playSwitch();
});

/* ---------------- Sound engine (Web Audio, synthesized — no files) ---------------- */
let audioCtx = null;
let soundOn = false;
let fxReady = false;
let shimmerDelay, shimmerFeedback, shimmerWet;
const soundToggle = document.getElementById('soundToggle');
const iconOn = document.getElementById('soundIconOn');
const iconOff = document.getElementById('soundIconOff');

function ensureCtx(){
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
  return audioCtx;
}

/* a light shimmer bus: a short, soft echo that gives chimes a little more
   "pull" and air without turning them into a wash of noise */
function ensureFX(){
  if(fxReady) return;
  const ctx = ensureCtx();
  shimmerDelay = ctx.createDelay();
  shimmerDelay.delayTime.value = 0.16;
  shimmerFeedback = ctx.createGain();
  shimmerFeedback.gain.value = 0.24;
  shimmerWet = ctx.createGain();
  shimmerWet.gain.value = 0.5;
  shimmerDelay.connect(shimmerFeedback).connect(shimmerDelay);
  shimmerDelay.connect(shimmerWet).connect(ctx.destination);
  fxReady = true;
}

function envGain(ctx, t0, peak, dur){
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
}

/* tone() now layers a soft, quiet overtone under the fundamental so notes
   feel warmer and rounder instead of a flat single-frequency beep, and can
   optionally send into the shimmer bus for a little extra sparkle */
function tone(freq, dur, type='sine', peak=0.06, delay=0, opts={}){
  if(!soundOn) return;
  const ctx = ensureCtx();
  if(opts.fx) ensureFX();
  const t0 = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  osc.type = type;
  if(opts.glide){
    osc.frequency.setValueAtTime(freq * 1.05, t0);
    osc.frequency.exponentialRampToValueAtTime(freq, t0 + 0.07);
  } else {
    osc.frequency.setValueAtTime(freq, t0);
  }
  const g = envGain(ctx, t0, peak, dur);
  osc.connect(g).connect(ctx.destination);
  if(opts.fx) g.connect(shimmerDelay);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);

  if(opts.overtone !== false){
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t0);
    const g2 = envGain(ctx, t0, peak * 0.26, dur * 0.75);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t0 + dur * 0.75 + 0.05);
  }
}

/* hover: a soft two-note dyad (root + fifth) rather than a single beep,
   so grazing across the cards feels like a little musical shimmer */
function playHoverTick(note){
  const scale = [261.63, 293.66, 329.63, 349.23, 392.00]; // C4 major-ish, mapped per card
  const f = scale[note % scale.length];
  tone(f, 0.24, 'sine', 0.05, 0, { glide:true });
  tone(f * 1.5, 0.22, 'sine', 0.022, 0.02, { overtone:false });
}
/* open: a gentle rising triad with shimmer, so bringing a card forward
   feels like a small reward rather than a system beep */
function playOpenChime(note){
  const scale = [261.63, 329.63, 392.00, 493.88];
  const base = scale[note % scale.length];
  tone(base, 0.28, 'triangle', 0.055, 0, { fx:true });
  tone(base * 1.26, 0.28, 'triangle', 0.045, 0.06, { fx:true });
  tone(base * 1.5, 0.34, 'triangle', 0.04, 0.12, { fx:true });
}
function playSwitch(){
  if(!soundOn) return;
  const ctx = ensureCtx();
  const t0 = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.03;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){ data[i] = (Math.random()*2-1) * (1 - i/bufferSize); }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 1800;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.16, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  noise.connect(filter).connect(g).connect(ctx.destination);
  noise.start(t0);
  tone(196, 0.1, 'sine', 0.045, 0.005, { overtone:false }); // soft thump under the click
}
function playConfirm(){
  tone(440, 0.16, 'sine', 0.055, 0, { fx:true });
  tone(587.33, 0.22, 'sine', 0.05, 0.06, { fx:true });
  tone(659.25, 0.26, 'sine', 0.035, 0.12, { fx:true });
}

soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  iconOn.style.display = soundOn ? 'block' : 'none';
  iconOff.style.display = soundOn ? 'none' : 'block';
  if(soundOn){ ensureCtx(); playConfirm(); }
  const popup = document.getElementById('soundPopup');
  if(popup) popup.classList.remove('show');
});

/* ---------------- Sound discovery popup: shows briefly on every page load ---------------- */
(function(){
  const popup = document.getElementById('soundPopup');
  const closeBtn = document.getElementById('soundPopupClose');
  if(!popup) return;
  const showTimer = setTimeout(()=> popup.classList.add('show'), 900);
  if(closeBtn){
    closeBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      clearTimeout(showTimer);
      popup.classList.remove('show');
    });
  }
})();

/* nav / link hover ticks — a warm single note with its soft overtone */
document.querySelectorAll('[data-hover]').forEach(el=>{
  el.addEventListener('mouseenter', ()=> tone(523.25, 0.18, 'sine', 0.035, 0, { glide:true }));
});

/* ---------------- Project cards: pop-out interaction ---------------- */
const grid = document.getElementById('grid');
document.querySelectorAll('.card').forEach(card=>{
  const note = parseInt(card.dataset.note, 10) || 0;
  card.addEventListener('mouseenter', ()=> playHoverTick(note));
  card.addEventListener('click', (e)=>{
    e.stopPropagation();
    const wasActive = card.classList.contains('active');
    document.querySelectorAll('.card.active').forEach(c=> c.classList.remove('active'));
    if(!wasActive){
      card.classList.add('active');
      grid.classList.add('has-active');
      playOpenChime(note);
    } else {
      grid.classList.remove('has-active');
    }
  });
});
function closeActiveCard(){
  document.querySelectorAll('.card.active').forEach(c=> c.classList.remove('active'));
  if(grid) grid.classList.remove('has-active');
}
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.card')) closeActiveCard();
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') closeActiveCard();
});

/* ---------------- Cursor trust-pulse ---------------- */
const pulse = document.getElementById('pulse');
let px=0, py=0, tx=0, ty=0;
window.addEventListener('mousemove', e=>{
  tx = e.clientX; ty = e.clientY;
  pulse.classList.add('show');
});
document.addEventListener('mouseleave', ()=> pulse.classList.remove('show'));
function loop(){
  px += (tx-px)*0.2; py += (ty-py)*0.2;
  pulse.style.transform = `translate(${px}px, ${py}px) translate(-50%,-50%)`;
  requestAnimationFrame(loop);
}
loop();
document.querySelectorAll('.card, [data-hover]').forEach(el=>{
  el.addEventListener('mouseenter', ()=> pulse.classList.add('big'));
  el.addEventListener('mouseleave', ()=> pulse.classList.remove('big'));
});

/* ---------------- Animated signal waves ---------------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const waveConfigs = Array.from(document.querySelectorAll('.wave')).map((svg, i)=>{
  const path = svg.querySelector('path');
  const vb = svg.getAttribute('viewBox').split(' ').map(Number);
  const freqs  = [0.03, 0.075, 0.11, 0.16];
  const speeds = [0.0010, 0.0024, 0.0016, 0.0030];
  const amps   = [0.30, 0.20, 0.34, 0.16];
  return {
    path,
    width: vb[2],
    height: vb[3],
    amp: vb[3] * amps[i % amps.length],
    freq: freqs[i % freqs.length],
    speed: speeds[i % speeds.length],
    phase: i * 2.1,
    card: svg.closest('.card')
  };
});

function buildWaveD(width, height, phase, amp, freq){
  const mid = height / 2;
  const step = Math.max(6, width / 70);
  let d = `M0,${mid.toFixed(1)}`;
  for(let x = step; x <= width; x += step){
    const y = mid + Math.sin(phase + x * freq) * amp;
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

let waveT = 0;
function animateWaves(){
  waveConfigs.forEach(cfg=>{
    const active = cfg.card && (cfg.card.matches(':hover') || cfg.card.classList.contains('active'));
    const amp = active ? cfg.amp * 1.5 : cfg.amp * 0.7;
    const localSpeed = cfg.speed * (active ? 1.8 : 1);
    cfg.path.setAttribute('d', buildWaveD(cfg.width, cfg.height, cfg.phase + waveT * localSpeed, amp, cfg.freq));
  });
  waveT += 16;
  requestAnimationFrame(animateWaves);
}
if(!reduceMotion){ requestAnimationFrame(animateWaves); }

/* ---------------- footer clock (small ambient detail) ---------------- */
function tick(){
  const clockEl = document.getElementById('clock');
  if(!clockEl) return;
  const d = new Date();
  clockEl.textContent =
    d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' · West Lafayette';
}
tick(); setInterval(tick, 15000);
