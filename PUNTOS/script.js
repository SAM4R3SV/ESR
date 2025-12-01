// script.js
const RANGOS = [
  { id: 0, nombre: "Armadura sin Gema", min: 0, max: 36, desc: "Rango 0: Armadura sin Gema (0-36)." },
  { id: 1, nombre: "Armadura Oscura", min: 36, max: 168, desc: "Rango 1: Armadura Oscura (36-168)." },
  { id: 2, nombre: "Armadura de la Sabiduría", min: 168, max: 368, desc: "Rango 2: Armadura de la Sabiduría (168-368)." },
  { id: 3, nombre: "Armadura de Agua", min: 368, max: 940, desc: "Rango 3: Armadura de Agua (368-940)." },
  { id: 4, nombre: "Armadura del Guardián Naranja", min: 940, max: 1450, desc: "Rango 4: Armadura del Guardián Naranja (940-1450)." },
  { id: 5, nombre: "Armadura de la Naturaleza", min: 1450, max: 2830, desc: "Rango 5: Armadura de la Naturaleza (1450-2830)." },
  { id: 6, nombre: "Armadura del Diamante Rosa", min: 2830, max: 5640, desc: "Rango 6: Armadura del Diamante Rosa (2830-5640)." },
  { id: 7, nombre: "Armadura de las Estrellas", min: 5640, max: 11250, desc: "Rango 7: Armadura de las Estrellas (5640-11250)." },
  { id: 8, nombre: "Armadura de la Luna", min: 11250, max: 22450, desc: "Rango 8: Armadura de la Luna (11250-22450)." },
  { id: 9, nombre: "Líder", min: 22450, max: 44850, desc: "Rango 9: Líder (22450-44850)." },
  { id: 10, nombre: "Co-Líder", min: 44850, max: 89799, desc: "Rango 10: Co-Líder (44850-89799)." },
  { id: 11, nombre: "Líder Supremo Sol", min: 89799, max: Infinity, desc: "Rango 11: Líder Supremo Sol (89799+)." }
];

function getRankFromPoints(p) {
  // p puede venir como string; asegurar número
  const pts = Number(p) || 0;
  return RANGOS.find(r => pts >= r.min && pts < r.max) || RANGOS[RANGOS.length-1];
}

let usuarios = []; // cargados desde usuarios.json

// elementos
const usersTbody = document.getElementById('usersTbody');
const ranksTbody = document.getElementById('ranksTbody');
const searchInput = document.getElementById('search');
const rankFilter = document.getElementById('rankFilter');
const sortSelect = document.getElementById('sort');
const summary = document.getElementById('summary');
const reloadBtn = document.getElementById('reloadBtn');
const emptyMsg = document.getElementById('emptyMsg');

// poblar filtro de rangos
function initRankFilter() {
  RANGOS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.id} — ${r.nombre}`;
    rankFilter.appendChild(opt);
  });
}

// render tabla rangos
function renderRanks() {
  ranksTbody.innerHTML = '';
  RANGOS.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="width:6%">${r.id}</td><td style="width:28%">${r.nombre}</td><td style="width:12%">${r.min}</td><td style="width:12%">${r.max===Infinity?'∞':r.max}</td><td>${r.desc}</td>`;
    ranksTbody.appendChild(tr);
  });
}

// fetch usuarios.json
async function loadUsers() {
  try {
    const res = await fetch('usuarios.json', { cache: "no-store" });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    usuarios = await res.json();
    // normalizar: asegurar campos
    usuarios = usuarios.map(u => ({
      nombre: (u.nombre||'').toString(),
      puntos: Number(u.puntos) || 0,
      rankObj: getRankFromPoints(u.puntos)
    }));
    renderUsers();
  } catch (e) {
    console.error('Error cargando usuarios.json', e);
    summary.textContent = 'No se pudo cargar usuarios.json — revisa que exista en el mismo directorio y que GitHub Pages lo sirva.';
  }
}

// render usuarios según filtros
function renderUsers() {
  // aplicar filtros
  const q = (searchInput.value||'').toLowerCase();
  const rankSelected = rankFilter.value;
  const sortBy = sortSelect.value;

  let list = usuarios.slice();

  if (rankSelected !== 'all') {
    list = list.filter(u => getRankFromPoints(u.puntos).id.toString() === rankSelected);
  }

  if (q) {
    list = list.filter(u => u.nombre.toLowerCase().includes(q));
  }

  // ordenar
  if (sortBy === 'desc') list.sort((a,b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
  else if (sortBy === 'asc') list.sort((a,b) => a.puntos - b.puntos || a.nombre.localeCompare(b.nombre));
  else if (sortBy === 'name') list.sort((a,b) => a.nombre.localeCompare(b.nombre));

  // render
  usersTbody.innerHTML = '';
  if (list.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    list.forEach(u => {
      const r = getRankFromPoints(u.puntos);
      const tr = document.createElement('tr');
      tr.className = 'user-row';
      tr.innerHTML = `
        <td style="vertical-align:middle">
          <div style="font-weight:700">${escapeHtml(u.nombre)}</div>
        </td>
        <td style="vertical-align:middle">${u.puntos.toLocaleString()}</td>
        <td style="vertical-align:middle">
          <span class="rank-badge">${r.id} — ${r.nombre}</span>
        </td>
        <td style="vertical-align:middle"><button class="action-btn" onclick="copyUser('${escapeJsForAttr(u.nombre)}', ${u.puntos})">Copiar</button></td>
      `;
      usersTbody.appendChild(tr);
    });
  }

  summary.textContent = `Mostrando ${list.length} de ${usuarios.length} usuarios.`;
}

function escapeHtml(s) {
  if(!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}
function escapeJsForAttr(s){
  if(!s) return '';
  return s.replace(/'/g,"\\'").replace(/"/g,'\\"');
}

// copiar al portapapeles (nombre y puntos) — útil para Discord
function copyUser(name, puntos) {
  const text = `${name} — ${puntos} puntos`;
  navigator.clipboard.writeText(text).then(()=> {
    alert('Copiado: ' + text);
  }).catch(()=> {
    alert('No se pudo copiar automáticamente. Selecciona y copia manualmente: ' + text);
  });
}

// listeners
searchInput.addEventListener('input', renderUsers);
rankFilter.addEventListener('change', renderUsers);
sortSelect.addEventListener('change', renderUsers);
reloadBtn.addEventListener('click', ()=> {
  // forzar recarga (útil tras push a gh-pages)
  loadUsers();
});

// inicialización
initRankFilter();
renderRanks();
loadUsers();
