// ===== GAME: Sort the Waste (60 seconds, DRAG AND DROP ONLY) =====
let score, streak, time, cur, timer, running = false, busy = false, deck = [];
const $ = id => document.getElementById(id);
const ICON = {bio:"🌱", rec:"♻️", res:"🗑️", haz:"⚠️"};
$("bins").innerHTML = Object.entries(BINS).map(([k,v]) => `<div class="slot" data-b="${k}"><div class="gbin g-${k}"><span class="lid"></span><i>${ICON[k]}</i>${v}</div></div>`).join("");
const bins = [...document.querySelectorAll(".slot")];   // plain divs, no click handler. The slot never moves, so hit-testing stays steady
const best = () => store.get("sr-best", 0);

function next() {   // shuffled deck: no repeats until every item has appeared
  if (!deck.length) deck = ITEMS.map((_, i) => i).sort(() => Math.random() - .5);
  cur = ITEMS[deck.pop()]; $("item").textContent = cur.e; $("item-name").textContent = cur.n;
}
function start() {
  score = 0; streak = 0; time = 60; running = true; busy = false; deck = [];
  $("result").style.display = "none"; $("start").style.display = "none";
  $("play-area").style.display = "block"; $("play-area").classList.remove("done"); $("feedback").textContent = "";
  upd(); next(); clearInterval(timer);
  timer = setInterval(() => { time--; upd(); if (time <= 0) end(); }, 1000);
}
function upd() { $("score").textContent = score; $("streak").textContent = streak; $("time").textContent = time; $("best").textContent = best(); }
function react(slot, ok) {   // bin animation: bounce when right, shake when wrong
  const bin = slot.firstElementChild;
  bin.classList.remove("hit-ok", "hit-no"); void bin.offsetWidth; bin.classList.add(ok ? "hit-ok" : "hit-no");
  bin.onanimationend = () => bin.classList.remove("hit-ok", "hit-no");
}
function answer(bin) {
  const ok = bin.dataset.b === cur.b, fb = $("feedback");
  if (ok) { streak++; score += 10 + Math.min(streak, 5)*2; time += 2; fb.textContent = "Correct! " + cur.t; fb.className = "good"; }
  else { streak = 0; score = Math.max(0, score - 5); time -= 5; fb.textContent = `Not quite. ${cur.n} goes in ${BINS[cur.b]}.`; fb.className = "bad"; }
  timePop(bin, ok); react(bin, ok); flashTimer(ok);
  if (time <= 0) { time = 0; upd(); end(); return; }     // a wrong answer can use up the last seconds
  upd(); next();
}
function timePop(slot, ok) {   // floating "+2s" (green) or "-5s" (red) above the bin
  const r = slot.getBoundingClientRect(), p = document.createElement("span");
  p.className = "tpop " + (ok ? "good" : "bad"); p.textContent = ok ? "+2s" : "-5s";
  p.style.left = r.left + r.width/2 + "px"; p.style.top = r.top + "px";
  document.body.append(p); setTimeout(() => p.remove(), 1000);
}
function flashTimer(ok) {      // the timer pill flashes too
  const t = $("time").parentElement; t.classList.remove("t-ok", "t-bad"); void t.offsetWidth; t.classList.add(ok ? "t-ok" : "t-bad");
}
function end() {
  running = false; clearInterval(timer); $("play-area").classList.add("done");
  if (score > best()) store.set("sr-best", score);
  const lvl = score >= 200 ? "Eco Master 🌟" : score >= 100 ? "Green Helper 🌿" : "Seedling 🌱";
  $("result").innerHTML = `<h2>Time's up! You scored ${score}</h2><p>Your rank: ${lvl}</p><button class="btn" id="again">Play again</button>`;
  $("result").style.display = "block"; $("again").onclick = start; $("best").textContent = best();
}
$("start").onclick = start;

// ===== DRAG (pointer events: works with mouse AND touch) =====
const drag = $("drag"); let active = false, sx = 0, sy = 0, lastX = 0, tilt = 0, moved = false;
const binAt = (x, y) => bins.find(b => { const r = b.getBoundingClientRect(); return x > r.left - 10 && x < r.right + 10 && y > r.top - 10 && y < r.bottom + 10; });
const clearOver = () => bins.forEach(b => b.classList.remove("over"));
drag.addEventListener("pointerdown", e => {
  if (!running || busy) return;
  active = true; moved = false; sx = lastX = e.clientX; sy = e.clientY; tilt = 0;
  drag.setPointerCapture(e.pointerId); drag.classList.add("dragging"); drag.style.transition = "none"; e.preventDefault();
});
drag.addEventListener("pointermove", e => {
  if (!active) return;
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
  tilt += (Math.max(-25, Math.min(25, (e.clientX - lastX)*2)) - tilt)*.3; lastX = e.clientX;   // tilts with drag speed
  drag.style.transform = `translate(${dx}px,${dy}px) rotate(${tilt}deg) scale(1.2)`;
  clearOver(); const b = binAt(e.clientX, e.clientY); if (b) b.classList.add("over");
});
function release(e, cancelled) {
  if (!active) return; active = false;
  const bin = cancelled ? null : binAt(e.clientX, e.clientY);
  drag.classList.remove("dragging"); clearOver();
  if (moved) { window.justDragged = true; setTimeout(() => window.justDragged = false, 80); }
  if (!bin || !running) { drag.style.transition = "transform .4s cubic-bezier(.3,1.6,.5,1)"; drag.style.transform = ""; return; }   // missed: snap back
  busy = true;                                           // dropped: item drops into the bin, then the answer counts
  const r = bin.getBoundingClientRect(), d = drag.getBoundingClientRect();
  const tx = (e.clientX - sx) + (r.left + r.width/2) - (d.left + d.width/2);   // current offset + distance to bin center
  const ty = (e.clientY - sy) + (r.top + r.height/2) - (d.top + d.height/2);
  drag.style.transition = "transform .25s ease-in, opacity .25s";
  drag.style.transform = `translate(${tx}px,${ty}px) scale(.15) rotate(180deg)`; drag.style.opacity = "0";
  burst(r.left + r.width/2, r.top);
  setTimeout(() => {
    drag.style.transition = "none"; drag.style.transform = ""; drag.style.opacity = "1";
    if (running) answer(bin);
    busy = false;
  }, 260);
}
drag.addEventListener("pointerup", e => release(e, false));
drag.addEventListener("pointercancel", e => release(e, true));
$("best").textContent = best();
