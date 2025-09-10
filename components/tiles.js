
import { formatMoney, formatPct, el } from './utils.js';
import { showModal } from './modal.js';
import { getMetrics } from './store.js';

const tilesRoot = document.getElementById('tiles');

const tileDefs = [
  {key:'revenue', label:'Omzet', fmt:formatMoney, sub: (k)=>`Orders: ${k.orders}`},
  {key:'gross', label:'Brutomarge', fmt:formatMoney, sub: (k)=>`Marge%: ${formatPct(k.marginPct)}`},
  {key:'aov', label:'Gem. Orderwaarde', fmt:formatMoney, sub: (k)=>`Orders: ${k.orders}`},
  {key:'topRevenueSKU', label:'Top product omzet', fmt:(x)=>`${x.sku}<br>${formatMoney(x.value)}`},
  {key:'topMarginSKU', label:'Top product marge', fmt:(x)=>`${x.sku}<br>${formatMoney(x.value)}`},
  {key:'revPerHour', label:'Omzet per uur', fmt:formatMoney, sub:(k)=>`Uren: ${k.staffHours.toFixed(1)}`},
  {key:'laborPct', label:'Loonkosten %', fmt:(x)=>formatPct(x), sub:(k)=>`Kosten: ${formatMoney(k.laborCost)}`},
];

function tileEl(def, kpis){
  const val = kpis[def.key];
  const tile = el('div',{class:'tile'});
  tile.appendChild(el('div',{class:'label', html:def.label}));
  tile.appendChild(el('div',{class:'value', html:def.fmt(val)}));
  if (def.sub){ tile.appendChild(el('div',{class:'sub', html:def.sub(kpis)})); }
  tile.onclick = ()=> openDetail(def, kpis);
  return tile;
}

function openDetail(def, kpis){
  const sections = [];
  if (def.key==='revenue' || def.key==='gross'){
    sections.push({title:'Per kanaal', list:kpis.byChannel.map(([k,v])=>({k, v: formatMoney(v.revenue)}))});
    sections.push({title:'Per merk', list:kpis.byBrand.map(([k,v])=>({k, v: formatMoney(v.revenue)}))});
    sections.push({title:'Per categorie', list:kpis.byCategory.map(([k,v])=>({k, v: formatMoney(v.revenue)}))});
  } else if (def.key==='laborPct' || def.key==='revPerHour'){
    sections.push({title:'Uren & kosten', kv:[
      {k:'Uren', v:kpis.staffHours.toFixed(1)},
      {k:'Loonkosten', v:formatMoney(kpis.laborCost)},
      {k:'Omzet', v:formatMoney(kpis.revenue)},
      {k:'Loonkosten %', v:formatPct(kpis.laborPct)},
      {k:'Omzet/uur', v:formatMoney(kpis.revPerHour)},
    ]});
  } else if (def.key==='topRevenueSKU' || def.key==='topMarginSKU'){
    sections.push({kv:[{k:'SKU', v:kpis[def.key].sku}, {k:'Waarde', v:formatMoney(kpis[def.key].value)}]});
  } else if (def.key==='aov'){
    sections.push({kv:[{k:'Orders', v:kpis.orders}, {k:'Omzet', v:formatMoney(kpis.revenue)}]});
  }
  showModal(def.label, sections);
}

export function renderTiles(filters){
  const kpis = getMetrics(filters);
  tilesRoot.innerHTML = '';
  tileDefs.forEach(def=> tilesRoot.appendChild(tileEl(def, kpis)));
}
window.renderTiles = renderTiles;
