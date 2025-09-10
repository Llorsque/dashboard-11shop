
import { formatMoney, formatPct, el } from './utils.js';
import { showModal } from './modal.js';
import { getMetrics } from './store.js';

const tilesRoot = document.getElementById('tiles');

const tileDefs = [
  {key:'revenue', label:'Omzet', fmt:formatMoney, sub: (k)=>`Orders: ${k.orders}`},
  {key:'gross', label:'Brutomarge', fmt:formatMoney, sub: (k)=>`Marge%: ${formatPct(k.marginPct)}`},
  {key:'marginPct', label:'Marge %', fmt:(x)=>formatPct(x)},
  {key:'aov', label:'Gem. orderwaarde', fmt:formatMoney},
  {key:'asp', label:'ASP (prijs/stuk)', fmt:formatMoney, sub:(k)=>`Stuks: ${k.units}`},
  {key:'topRevenueSKU', label:'Top product omzet', fmt:(x)=>`${x.sku}<br>${formatMoney(x.value)}`},
  {key:'topMarginSKU', label:'Top product marge', fmt:(x)=>`${x.sku}<br>${formatMoney(x.value)}`},
  {key:'revPerHour', label:'Omzet per uur', fmt:formatMoney, sub:(k)=>`Uren: ${k.staffHours.toFixed(1)}`},
  {key:'laborPct', label:'Loonkosten %', fmt:(x)=>formatPct(x)},
  {key:'returningPct', label:'Terugkerende klanten', fmt:(x)=>formatPct(x)},
  {key:'goalAttainment', label:'Doelrealisatie', fmt:(x)=>formatPct(x)},
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
  if (def.key==='revenue' || def.key==='gross' || def.key==='marginPct'){
    sections.push({title:'Kanaal-mix', list:kpis.channelMix.map(it=>({k:it.k, v: (it.v*100).toFixed(1)+'%'}))});
    sections.push({title:'Per merk (omzet)', list:kpis.byBrand.map(([k,v])=>({k, v: formatMoney(v.revenue)})).slice(0,8)});
    sections.push({title:'Per categorie (omzet)', list:kpis.byCategory.map(([k,v])=>({k, v: formatMoney(v.revenue)})).slice(0,8)});
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
  } else if (def.key==='goalAttainment'){
    sections.push({kv:[{k:'Omzet', v:formatMoney(kpis.revenue)}, {k:'Doel (geschat)', v:formatMoney(kpis.revenue/(kpis.goalAttainment||1))}]});
  } else if (def.key==='asp'){
    sections.push({kv:[{k:'Stuks verkocht', v:kpis.units}, {k:'ASP', v:formatMoney(kpis.asp)}]});
  }
  showModal(def.label, sections);
}

export function renderTiles(filters){
  const kpis = getMetrics(filters);
  tilesRoot.innerHTML = '';
  tileDefs.forEach(def=> tilesRoot.appendChild(tileEl(def, kpis)));
}
window.renderTiles = renderTiles;
