// ===== GUIDE: search + filter =====
const list = document.getElementById("guide-list"), box = document.getElementById("search"), chips = document.getElementById("chips");
let filter = "all";
chips.innerHTML = `<button class="chip on" data-b="all">All</button>` + Object.entries(BINS).map(([k,v])=>`<button class="chip" data-b="${k}">${v}</button>`).join("");
function render(){
  const q = box.value.trim().toLowerCase();
  const found = ITEMS.filter(i => (filter==="all"||i.b===filter) && (i.n+" "+BINS[i.b]).toLowerCase().includes(q));
  list.innerHTML = found.map(i=>`<div class="card"><span class="em">${i.e}</span><span class="tag t-${i.b}">${BINS[i.b]}</span><h3>${i.n}</h3><p>${i.t}</p></div>`).join("");
  document.getElementById("empty").style.display = found.length ? "none" : "block";
}
box.oninput = render;
chips.onclick = e => {const b=e.target.closest(".chip"); if(!b) return; filter=b.dataset.b; chips.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===b)); render()};
render();
