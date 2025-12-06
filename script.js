// script.js — JSON-driven renderer, search, animations
const DATA_URL = 'data.json';
const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const empty = document.getElementById('empty');

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;') }

function createCard(folderName, files){
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;

  card.innerHTML = `
    <div class="card-head">
      <div class="folder-icon" aria-hidden>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" fill="url(#g)"/>
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0" stop-color="#52e3ff" stop-opacity="0.15"/>
              <stop offset="1" stop-color="#8a5cff" stop-opacity="0.08"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <div class="folder-title">${escapeHtml(folderName)}</div>
        <div class="folder-meta">${files.length} file${files.length>1?'s':''}</div>
      </div>
      <div class="expand-arrow">▼</div>
    </div>
    <div class="file-list" aria-hidden="true">
      ${files.map(f => `<a href="${escapeAttr(f.link)}" target="_blank" rel="noreferrer">${escapeHtml(f.title)}</a>`).join('')}
    </div>
  `;

  card.addEventListener('click', (e)=>{
    if(e.target.tagName.toLowerCase()==='a') return;
    toggleList(card);
  });
  card.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' || e.key===' ') toggleList(card);
  });

  return card;
}

function toggleList(card){
  const list = card.querySelector('.file-list');
  const arrow = card.querySelector('.expand-arrow');
  const isOpen = list.classList.contains('show');
  if(isOpen){
    list.classList.remove('show');
    list.style.maxHeight = null;
    arrow.textContent = '▼';
  } else {
    list.classList.add('show');
    list.style.maxHeight = list.scrollHeight + 'px';
    arrow.textContent = '▲';
  }
}

function render(data){
  grid.innerHTML = '';
  const entries = Object.entries(data);
  for(const [folder, files] of entries){
    grid.appendChild(createCard(folder, files));
  }
}

function filterAndRender(data, q){
  const low = q.trim().toLowerCase();
  if(!low){ render(data); empty.hidden = true; return; }

  const out = {};
  for(const [folder, files] of Object.entries(data)){
    const matched = files.filter(f=> (f.title||'').toLowerCase().includes(low) || (folder||'').toLowerCase().includes(low));
    if(matched.length) out[folder] = matched;
  }
  render(out);
  empty.hidden = Object.keys(out).length>0;
}

async function loadData(){
  try {
    const res = await fetch(DATA_URL, {cache:'no-store'});
    if(!res.ok) throw new Error('no json');
    const json = await res.json();
    return json;
  } catch(e){
    console.warn('data.json load failed — falling back to empty');
    return {};
  }
}

(async ()=>{
  const data = await loadData();
  render(data);

  searchInput.addEventListener('input', e=>{
    filterAndRender(data, e.target.value);
  });
})();
