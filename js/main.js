// ===== A. THEME (light / dark) =====
const store = {get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const root = document.documentElement;
root.dataset.theme = store.get("sr-theme","light");
// ===== B. DRAWER + ON/OFF SWITCHES =====
// Effects are ON by default. The version key resets any old saved "off" value once.
if (store.get("sr-fx-v", 0) < 2) { store.set("sr-trail", true); store.set("sr-click", true); store.set("sr-fx-v", 2); }
const settings = {trail:store.get("sr-trail",true), click:store.get("sr-click",true)};
const drawer = document.createElement("aside"); drawer.id="drawer"; drawer.setAttribute("aria-hidden","true");
drawer.innerHTML = `<h3>SortRight menu</h3><a class="dl" href="index.html">Home</a><a class="dl" href="about.html">About</a><a class="dl" href="guide.html">Waste Guide</a><a class="dl" href="play.html">Sort Game</a>
<div class="switch">Dark mode<button id="sw-theme" aria-label="Toggle dark mode"></button></div>
<div class="switch">Leaf mouse trail<button id="sw-trail" aria-label="Toggle leaf trail"></button></div>
<div class="switch">Click effects<button id="sw-click" aria-label="Toggle click effects"></button></div>`;
const scrim = document.createElement("div"); scrim.id="scrim";
document.body.append(drawer, scrim);
const toggleDrawer = o => {drawer.classList.toggle("open",o); drawer.setAttribute("aria-hidden",String(!o)); scrim.classList.toggle("show",o)};
document.getElementById("menu-btn").onclick = () => toggleDrawer(true);
scrim.onclick = () => toggleDrawer(false);
document.addEventListener("keydown", e => e.key==="Escape" && toggleDrawer(false));
function wire(id, get, set){const b=document.getElementById(id); b.classList.toggle("on",get()); b.onclick=()=>{set(!get()); b.classList.toggle("on",get())}}
wire("sw-theme",()=>root.dataset.theme==="dark",v=>{root.dataset.theme=v?"dark":"light";store.set("sr-theme",root.dataset.theme)});
wire("sw-trail",()=>settings.trail,v=>{settings.trail=v;store.set("sr-trail",v)});
wire("sw-click",()=>settings.click,v=>{settings.click=v;store.set("sr-click",v)});
// (C + D: trail and click effects now live in js/effects.js)
// ===== E. SCROLL REVEAL =====
const io = new IntersectionObserver(es => es.forEach(x => x.isIntersecting && x.target.classList.add("in")), {threshold:.15});
document.querySelectorAll(".reveal").forEach(el => io.observe(el));
// ===== F. COUNT-UP NUMBERS =====
document.querySelectorAll("[data-items]").forEach(el => el.dataset.count = ITEMS.length);
document.querySelectorAll("[data-count]").forEach(el => {
  const end = +el.dataset.count; let n = 0;
  new IntersectionObserver((es,ob) => {if(es[0].isIntersecting){ob.disconnect();const t=setInterval(()=>{n+=Math.ceil(end/40);if(n>=end){n=end;clearInterval(t)}el.textContent=n+(el.dataset.suffix||"")},35)}}).observe(el);
});
// ===== G. DAILY PLEDGE (home page) =====
const pledgeBtn = document.getElementById("pledge-btn");
if (pledgeBtn) {
  const out = document.getElementById("pledge-count"), today = new Date().toDateString();
  const show = () => {const p=store.get("sr-pledge",{days:0,last:""}); out.textContent = p.last===today ? `Done today! 🌍 Total sorting days: ${p.days}` : `Sorting days so far: ${p.days}`; pledgeBtn.disabled = p.last===today};
  pledgeBtn.onclick = () => {const p=store.get("sr-pledge",{days:0,last:""}); if(p.last!==today){p.days++;p.last=today;store.set("sr-pledge",p)} show()};
  show();
}
