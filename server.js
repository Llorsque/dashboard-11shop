
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse';
import XLSX from 'xlsx';

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT || 3001;
const DEV = process.argv.includes('--dev');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({limit:'10mb'}));

const dataDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, dataDir); },
  filename: function (req, file, cb) {
    const type = req.params.type;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${type}${ext}`);
  }
});
const upload = multer({ storage });

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
function detectDelimiter(sample) {
  return sample.includes(';') && sample.split(';').length > sample.split(',').length ? ';' : ',';
}
function readCSV(filePath){
  const raw = fs.readFileSync(filePath,'utf8');
  const delimiter = detectDelimiter(raw.slice(0, 2048));
  return new Promise((resolve, reject)=>{
    csvParse(raw, {columns:true, skip_empty_lines:true, delimiter}, (err, records)=>{
      if (err) reject(err); else resolve(records);
    });
  });
}
async function readXLSX(filePath){
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, {defval:null});
}
async function readAny(filePath){
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return await readCSV(filePath);
  return await readXLSX(filePath);
}
function toNumber(x){
  if (x===null || x===undefined || x==='') return 0;
  const n = Number(String(x).replace(',','.'));
  return isNaN(n) ? 0 : n;
}
function toDate(x){
  if (!x) return null;
  const d = new Date(x);
  return isNaN(d.getTime()) ? null : d;
}
function priceExclVAT(price, vat){
  const p = toNumber(price);
  const v = toNumber(vat);
  if (v>0 && v<1) return p/(1+v);
  return p;
}

// Load datasets from uploads or samples fallback
async function loadData(){
  const dataset = {};
  for (const type of ['sales','inventory','staff_hours']){
    let f = null;
    for (const ext of ['.csv','.xlsx','.xls']){
      const p = path.join(dataDir, `${type}${ext}`);
      if (fs.existsSync(p)) { f = p; break; }
    }
    if (!f){
      // fallback to sample data
      f = path.join(__dirname, 'data','sample', `${type}.csv`);
    }
    dataset[type] = await readAny(f);
  }
  return dataset;
}

function within(date, from, to){
  const d = toDate(date);
  if (!d) return false;
  if (from && d < new Date(from)) return false;
  if (to && d > new Date(to)) return false;
  return true;
}

function applyFilters(rows, filters){
  return rows.filter(r=>{
    if (filters.from || filters.to){
      if (!within(r.date, filters.from, filters.to)) return false;
    }
    if (filters.brand && filters.brand.length && !filters.brand.includes(String(r.brand||'').trim())) return false;
    if (filters.category && filters.category.length && !filters.category.includes(String(r.category||'').trim())) return false;
    if (filters.channel && filters.channel.length && !filters.channel.includes(String(r.channel||'').trim())) return false;
    return true;
  });
}

function computeKPIs(dataset, filters){
  const sales = applyFilters(dataset.sales, filters);
  const hours = applyFilters(dataset.staff_hours, filters);

  let revenue = 0, costSum = 0, orders = new Set();
  let skuRevenue = {}, skuMargin = {};
  for (const r of sales){
    const qty = toNumber(r.qty);
    const price = priceExclVAT(r.price, r.vat_rate);
    const cost = toNumber(r.cost);
    const lineRev = qty * price;
    const lineCost = qty * cost;
    revenue += lineRev;
    costSum += lineCost;
    orders.add(r.order_id);
    const sku = r.sku || 'UNKNOWN';
    skuRevenue[sku] = (skuRevenue[sku]||0) + lineRev;
    skuMargin[sku]  = (skuMargin[sku]||0)  + (lineRev - lineCost);
  }

  const gross = revenue - costSum;
  const marginPct = revenue>0 ? gross/revenue : 0;
  const aov = orders.size>0 ? revenue/orders.size : 0;
  const topRevSku = Object.entries(skuRevenue).sort((a,b)=>b[1]-a[1])[0] || ['—',0];
  const topMarSku = Object.entries(skuMargin).sort((a,b)=>b[1]-a[1])[0] || ['—',0];

  let staffHours = 0, laborCost = 0;
  for (const h of hours){
    const hrs = toNumber(h.hours);
    staffHours += hrs;
    laborCost += hrs * toNumber(h.hourly_wage);
  }
  const revPerHour = staffHours>0 ? revenue/staffHours : 0;
  const laborPct = revenue>0 ? laborCost/revenue : 0;

  // Channel/brand/category splits for detail
  const sumBy = (field)=>{
    const m = {};
    for (const r of sales){
      const key = String(r[field]||'—');
      const qty = toNumber(r.qty);
      const price = priceExclVAT(r.price, r.vat_rate);
      const cost = toNumber(r.cost);
      const rev = qty*price;
      const gm = rev - qty*cost;
      if (!m[key]) m[key] = {revenue:0, gross:0};
      m[key].revenue += rev;
      m[key].gross += gm;
    }
    return Object.entries(m).sort((a,b)=>b[1].revenue-a[1].revenue);
  };

  return {
    revenue, gross, marginPct, aov,
    topRevenueSKU: {sku: topRevSku[0], value: topRevSku[1]},
    topMarginSKU: {sku: topMarSku[0], value: topMarSku[1]},
    revPerHour, laborPct,
    byChannel: sumBy('channel').slice(0,5),
    byBrand: sumBy('brand').slice(0,10),
    byCategory: sumBy('category').slice(0,10),
    orders: orders.size,
    staffHours, laborCost
  };
}

app.get('/api/metrics', async (req,res)=>{
  const dataset = await loadData();
  const filters = {
    from: req.query.from || null,
    to: req.query.to || null,
    brand: req.query.brand ? [].concat(req.query.brand) : [],
    category: req.query.category ? [].concat(req.query.category) : [],
    channel: req.query.channel ? [].concat(req.query.channel) : []
  };
  const kpis = computeKPIs(dataset, filters);
  res.json({ ok:true, kpis });
});

app.get('/api/options', async (req,res)=>{
  const dataset = await loadData();
  const uniq = (arr, key)=>[...new Set(arr.map(r=>String(r[key]||'').trim()).filter(Boolean))].sort();
  res.json({
    ok:true,
    brands: uniq(dataset.sales,'brand'),
    categories: uniq(dataset.sales,'category'),
    channels: uniq(dataset.sales,'channel')
  });
});

app.post('/api/upload/:type', upload.single('file'), async (req,res)=>{
  const type = req.params.type;
  if (!['sales','inventory','staff_hours'].includes(type)){
    return res.status(400).json({ok:false, error:'Unknown type'});
  }
  if (!req.file){
    return res.status(400).json({ok:false, error:'No file'});
  }
  return res.json({ok:true, file:req.file.filename});
});

app.get('/api/export/:format', async (req,res)=>{
  const format = req.params.format; // csv | xlsx
  const dataset = await loadData();
  const filters = {
    from: req.query.from || null,
    to: req.query.to || null,
    brand: req.query.brand ? [].concat(req.query.brand) : [],
    category: req.query.category ? [].concat(req.query.category) : [],
    channel: req.query.channel ? [].concat(req.query.channel) : []
  };
  const rows = dataset.sales.filter(r=>{
    if (filters.from || filters.to){
      if (!within(r.date, filters.from, filters.to)) return false;
    }
    if (filters.brand.length && !filters.brand.includes(String(r.brand||''))) return false;
    if (filters.category.length && !filters.category.includes(String(r.category||''))) return false;
    if (filters.channel.length && !filters.channel.includes(String(r.channel||''))) return false;
    return true;
  });
  if (format === 'csv'){
    const headers = Object.keys(rows[0]||{});
    const csv = [headers.join(',')].concat(rows.map(r=>headers.map(h=>String(r[h]).replace(/,/g,'')).join(','))).join('\n');
    res.setHeader('Content-Disposition','attachment; filename="export.csv"');
    res.type('text/csv').send(csv);
  } else {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'sales');
    const buf = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});
    res.setHeader('Content-Disposition','attachment; filename="export.xlsx"');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buf);
  }
});

app.get('/api/health', (req,res)=>res.json({ok:true, time:new Date().toISOString()}));

// In dev, run API and serve /public via vite-like static; in prod, Express already serves /public.
app.listen(PORT, ()=>{
  console.log(`API listening on http://localhost:${PORT}`);
  if (!DEV) console.log('Serving static from /public');
});
