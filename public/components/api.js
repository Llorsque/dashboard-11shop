
const API = location.origin.includes('3001') ? location.origin : (location.origin.replace(/:\d+$/,'')+':3001');
export async function getOptions(){
  const r = await fetch(`${API}/api/options`); return r.json();
}
export async function getMetrics(filters){
  const params = new URLSearchParams();
  for (const [k,v] of Object.entries(filters)){
    if (!v || (Array.isArray(v)&&!v.length)) continue;
    if (Array.isArray(v)) v.forEach(x=>params.append(k,x)); else params.set(k,v);
  }
  const r = await fetch(`${API}/api/metrics?`+params.toString());
  return r.json();
}
export async function uploadFile(type, file){
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch(`${API}/api/upload/${type}`, { method:'POST', body: fd });
  return r.json();
}
export function exportFile(fmt, filters){
  const params = new URLSearchParams();
  for (const [k,v] of Object.entries(filters)){
    if (!v || (Array.isArray(v)&&!v.length)) continue;
    if (Array.isArray(v)) v.forEach(x=>params.append(k,x)); else params.set(k,v);
  }
  const url = `${API}/api/export/${fmt}?`+params.toString();
  window.open(url, '_blank');
}
