// ===== EFFECTS ENGINE (optimized): sprite-cached emoji, 1x canvases, adaptive quality =====
function makeCanvas(id, z) {
  const c = document.createElement("canvas"); c.id = id;
  c.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:${z}`;
  document.body.prepend(c); return c;
}
const bgC = makeCanvas("bg", -1), fxC = makeCanvas("fx", 300);
const bg = bgC.getContext("2d"), fx = fxC.getContext("2d");
let W, H;
function resize() { W = bgC.width = fxC.width = innerWidth; H = bgC.height = fxC.height = innerHeight; }
resize(); addEventListener("resize", resize);
const rnd = (a, b) => a + Math.random() * (b - a);
let wind = 0, quality = 1;          // quality drops automatically if the PC is slow

// Emoji are drawn ONCE onto tiny canvases, then copied (much faster than fillText every frame)
const sprites = {};
function sprite(e) {
  if (sprites[e]) return sprites[e];
  const c = document.createElement("canvas"); c.width = c.height = 48;
  const x = c.getContext("2d"); x.font = "36px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(e, 24, 26);
  return sprites[e] = c;
}
function draw(ctx, e, x, y, size, rot, alpha) {
  const k = size / 48, c = Math.cos(rot) * k, s = Math.sin(rot) * k;
  ctx.globalAlpha = alpha; ctx.setTransform(c, s, -s, c, x, y); ctx.drawImage(sprite(e), -24, -24);
}

// ===== 1. BACKGROUND LEAVES =====
const LEAF = ["🍃","🍂","🌿","🍀"];
const mkLeaf = init => ({x:rnd(0,W), y:init ? rnd(0,H) : -30, s:rnd(16,34), vy:rnd(.3,.8), ph:rnd(0,6.28), sw:rnd(.4,1.1), rot:rnd(0,6.28), vr:rnd(-.025,.025), e:LEAF[Math.floor(rnd(0,4))], a:rnd(.2,.4)});
const leaves = Array.from({length:14}, () => mkLeaf(true));

// ===== 2. PHYSICS PARTICLES (trail + explosion) =====
const P = []; let fxDirty = false;
function spawn(o) { if (P.length > 110*quality) return; P.push(Object.assign({age:0, rot:rnd(0,6.28), vr:rnd(-.2,.2), ph:rnd(0,6.28), flut:0, g:0, drag:1}, o)); }
function leafTrail(x, y, mvx, mvy) {   // floats, flutters, drifts with the wind, fades
  spawn({x, y, vx:rnd(-.8,.8) + mvx*.1, vy:rnd(-1.1,.2) + mvy*.1, s:rnd(18,28), e:LEAF[Math.floor(rnd(0,4))], life:rnd(80,120), g:.025, drag:.985, flut:1, vr:rnd(-.08,.08)});
}
window.burst = function (x, y) {       // explosion: fast outward, gravity pulls down, spins
  if (!settings.click) return;
  const E = ["🍃","♻️","✨","🌸","🌱","🍂","💚"], n = Math.round(8 + 10*quality);
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.28), sp = rnd(3, 9);
    spawn({x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 2, s:rnd(18,30), e:E[Math.floor(rnd(0,E.length))], life:rnd(50,85), g:.3, drag:.975, vr:rnd(-.3,.3)});
  }
  spawn({x, y, ring:true, r:4, life:22});
};
let lx = 0, ly = 0, lt = 0;
document.addEventListener("pointermove", e => {
  if (!settings.trail) return;
  const now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly;
  if (now - lt < 45 || Math.hypot(dx, dy) < 26) return;     // time + distance throttle
  lt = now; lx = e.clientX; ly = e.clientY; leafTrail(lx, ly, dx, dy);
});
document.addEventListener("click", e => { if (!window.justDragged) burst(e.clientX, e.clientY); });

// ===== 3. ANIMATION LOOP =====
let last = performance.now(), frames = 0, total = 0;
function frame(now) {
  const raw = (now - last) / 16.67, dt = Math.min(2.5, raw); last = now;
  if (++frames === 90) {                                   // slow PC? shrink the effects automatically
    if (total / 90 > 1.7 && quality > .35) { quality *= .6; leaves.length = Math.max(5, Math.ceil(leaves.length*.6)); }
    frames = 0; total = 0;
  } else total += raw;
  wind = Math.sin(now/2500)*.5 + Math.sin(now/900)*.2;

  bg.setTransform(1,0,0,1,0,0); bg.clearRect(0, 0, W, H);
  for (const l of leaves) {
    l.y += l.vy*dt; l.x += (Math.sin(now/900 + l.ph)*l.sw + wind*1.6)*dt*.6; l.rot += l.vr*dt;
    if (l.y > H + 30) Object.assign(l, mkLeaf(false));
    if (l.x > W + 40) l.x = -30; else if (l.x < -40) l.x = W + 30;
    draw(bg, l.e, l.x, l.y, l.s, l.rot, l.a);
  }

  if (P.length || fxDirty) {                               // only touch the effects canvas when needed
    fx.setTransform(1,0,0,1,0,0); fx.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.age += dt;
      if (p.age >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
      const k = Math.min(1, (p.life - p.age) / (p.life*.35));
      if (p.ring) { p.r += 7*dt; fx.setTransform(1,0,0,1,0,0); fx.globalAlpha = k*.7; fx.strokeStyle = "#7ddc6e"; fx.lineWidth = 3; fx.beginPath(); fx.arc(p.x, p.y, p.r, 0, 6.28); fx.stroke(); continue; }
      p.vy += p.g*dt; p.vx += wind*.03*dt; p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
      p.x += p.vx*dt + (p.flut ? Math.sin(p.age*.12 + p.ph)*1.1*dt : 0); p.y += p.vy*dt; p.rot += p.vr*dt;
      draw(fx, p.e, p.x, p.y, p.s, p.rot, k);
    }
    fxDirty = P.length > 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
