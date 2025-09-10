
import { download } from './utils.js';

const state = {
  datasets: { sales:[], inventory:[], staff_hours:[] },
  overrides: { sales:null, inventory:null, staff_hours:null },
  options: { brands:[], categories:[], channels:[] },
};

function parseCSV(text){
  // simple CSV/semicolon autodetect; no quoted commas support to keep lightweight
  const delim = (text.slice(0,2000).split(';').length > text.slice(0,2000).split(',').length) ? ';' : ',';
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(delim).map(s=>s.trim());
  return lines.map(line=>{
    const parts = line.split(delim);
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (parts[i]!==undefined ? parts[i] : ''));
    return obj;
  });
}

async function loadCSV(url){
  const res = await fetch(url);
  const txt = await res.text();
  return parseCSV(txt);
}

function toNumber(x){ if (x===null || x===undefined || x==='') return 0; const n = Number(String(x).replace(',','.')); return isNaN(n)?0:n }
function toDate(x){ const d=new Date(x); return isNaN(d.getTime())?null:d }
function priceExclVAT(price, vat){ const p=toNumber(price); const v=toNumber(vat); return (v>0 && v<1)? p/(1+v) : p }
function within(date, from, to){ const d=toDate(date); if (!d) return false; if (from && d<new Date(from)) return false; if (to && d>new Date(to)) return false; return true }

function applyFilters(rows, f){
  return rows.filter(r=>{
    if (f.from || f.to){ if (!within(r.date, f.from, f.to)) return false; }
    if (f.brand?.length && !f.brand.includes(String(r.brand||'').trim())) return false;
    if (f.category?.length && !f.category.includes(String(r.category||'').trim())) return false;
    if (f.channel?.length && !f.channel.includes(String(r.channel||'').trim())) return false;
    return true;
  });
}

function computeKPIs(dataset, filters){
  const sales = applyFilters(dataset.sales, filters);
  const hours = applyFilters(dataset.staff_hours, filters);
  let revenue=0, costSum=0, orders=new Set();
  let skuRevenue={}, skuMargin={};
  for (const r of sales){
    const qty = toNumber(r.qty);
    const price = priceExclVAT(r.price, r.vat_rate);
    const cost = toNumber(r.cost);
    const rev = qty*price;
    const lc = qty*cost;
    revenue += rev;
    costSum += lc;
    if (r.order_id) orders.add(r.order_id);
    const sku = r.sku || 'UNKNOWN';
    skuRevenue[sku] = (skuRevenue[sku]||0)+rev;
    skuMargin[sku]  = (skuMargin[sku]||0)+(rev-lc);
  }
  const gross = revenue - costSum;
  const marginPct = revenue>0 ? gross/revenue : 0;
  const aov = orders.size>0 ? revenue/orders.size : 0;
  const topRev = Object.entries(skuRevenue).sort((a,b)=>b[1]-a[1])[0] || ['—',0];
  const topMar = Object.entries(skuMargin).sort((a,b)=>b[1]-a[1])[0] || ['—',0];
  let staffHours=0, laborCost=0;
  for (const h of hours){ const hrs=toNumber(h.hours); staffHours+=hrs; laborCost+=hrs*toNumber(h.hourly_wage); }
  const revPerHour = staffHours>0 ? revenue/staffHours : 0;
  const laborPct = revenue>0 ? laborCost/revenue : 0;

  const sumBy = (field)=>{
    const m = {};
    for (const r of sales){
      const key = String(r[field]||'—');
      const qty=toNumber(r.qty);
      const price = priceExclVAT(r.price, r.vat_rate);
      const cost = toNumber(r.cost);
      const rev = qty*price;
      const gm = rev - qty*cost;
      if (!m[key]) m[key]={revenue:0, gross:0};
      m[key].revenue += rev;
      m[key].gross += gm;
    }
    return Object.entries(m).sort((a,b)=>b[1].revenue-a[1].revenue);
  };

  return {
    revenue, gross, marginPct, aov,
    topRevenueSKU:{sku:topRev[0], value:topRev[1]},
    topMarginSKU:{sku:topMar[0], value:topMar[1]},
    revPerHour, laborPct,
    byChannel: sumBy('channel').slice(0,5),
    byBrand: sumBy('brand').slice(0,10),
    byCategory: sumBy('category').slice(0,10),
    orders: orders.size,
    staffHours, laborCost
  };
}

function uniq(rows, key){ return [...new Set(rows.map(r=>String(r[key]||'').trim()).filter(Boolean))].sort() }

export async function initStore(){
  // If overrides exist, keep them; else load defaults
  if (!state.overrides.sales){
    state.datasets.sales = await loadCSV('./data/sales.csv');
    state.datasets.inventory = await loadCSV('./data/inventory.csv');
    state.datasets.staff_hours = await loadCSV('./data/staff_hours.csv');
  } else {
    state.datasets = { ...state.overrides };
  }
  state.options = {
    brands: uniq(state.datasets.sales,'brand'),
    categories: uniq(state.datasets.sales,'category'),
    channels: uniq(state.datasets.sales,'channel'),
  };
}

export function getOptions(){ return state.options }
export function getMetrics(filters){ return computeKPIs(state.datasets, filters) }
export function overrideDataset(type, rows){
  state.overrides[type] = rows;
  // After override, rebuild datasets
  state.datasets = { ...state.datasets, [type]: rows };
  state.options = {
    brands: uniq(state.datasets.sales,'brand'),
    categories: uniq(state.datasets.sales,'category'),
    channels: uniq(state.datasets.sales,'channel'),
  };
}

export function exportCSV(rows){
  if (!rows.length){ download('export.csv', new Blob([''], {type:'text/csv'})); return; }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r=>headers.map(h=>String(r[h]??'').replace(/,/g,'')).join(',')));
  download('export.csv', new Blob([lines.join('\n')], {type:'text/csv'}));
}
export async function exportXLSX(rows){
  // Lightweight XLSX via CSV rename (most spreadsheets can open). True XLSX would need a lib.
  const headers = Object.keys(rows[0]||{});
  const lines = [headers.join(',')].concat(rows.map(r=>headers.map(h=>String(r[h]??'').replace(/,/g,'')).join(',')));
  download('export.xlsx', new Blob([lines.join('\n')], {type:'application/vnd.ms-excel'}));
}

export function currentSalesFiltered(filters){
  const rows = applyFilters(state.datasets.sales, filters);
  return rows;
}

// For uploads: parse CSV text into objects for override
export function parseTextToRows(text){ return parseCSV(text) }
