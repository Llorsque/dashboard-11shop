
import { el, $ } from './components/utils.js';
import { initStore, getOptions } from './components/store.js';
import { renderTiles } from './components/tiles.js';

const root = $('#filters');

function multiSelect(label, id, options){
  const wrap = el('div',{class:'filter-card'});
  wrap.appendChild(el('label',{for:id, html:label}));
  const sel = el('select',{id, multiple:true, size: Math.min(6, options.length||3)});
  options.forEach(o=> sel.appendChild(el('option',{value:o, html:o})));
  wrap.appendChild(sel);
  return wrap;
}
function dateInput(label, id){
  const wrap = el('div',{class:'filter-card'});
  wrap.appendChild(el('label',{for:id, html:label}));
  const inp = el('input',{type:'date', id});
  wrap.appendChild(inp);
  return wrap;
}

export function currentFilters(){
  const f = {
    from: $('#from')?.value || '',
    to: $('#to')?.value || '',
    brand: [...($('#brand')?.selectedOptions||[])].map(o=>o.value),
    category: [...($('#category')?.selectedOptions||[])].map(o=>o.value),
    channel: [...($('#channel')?.selectedOptions||[])].map(o=>o.value),
  };
  return f;
}

async function build(){
  await initStore();
  const opts = getOptions();
  root.innerHTML = '';
  root.appendChild(dateInput('Vanaf', 'from'));
  root.appendChild(dateInput('Tot en met', 'to'));
  root.appendChild(multiSelect('Merk(en)', 'brand', opts.brands));
  root.appendChild(multiSelect('Categorie(ën)', 'category', opts.categories));
  root.appendChild(multiSelect('Kanaal', 'channel', opts.channels));
  root.addEventListener('change', ()=> renderTiles(currentFilters()));
  renderTiles(currentFilters());
}
build();
