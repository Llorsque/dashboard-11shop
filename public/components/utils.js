
export function formatMoney(n){ return new Intl.NumberFormat('nl-NL',{style:'currency', currency:'EUR'}).format(n||0) }
export function formatPct(x){ return (x*100).toFixed(1)+'%' }
export function $(sel){ return document.querySelector(sel) }
export function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==='class') e.className = v;
    else if (k==='html') e.innerHTML = v;
    else e.setAttribute(k,v);
  });
  children.forEach(c=> e.appendChild(c));
  return e;
}
