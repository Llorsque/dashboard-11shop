
import { $, el } from './utils.js';

const backdrop = el('div', {class:'modal-backdrop', id:'modalBackdrop'});
document.body.appendChild(backdrop);

export function showModal(title, sections){
  backdrop.innerHTML = '';
  const modal = el('div', {class:'modal'});
  const header = el('header',{},[
    el('h3', {html:title}),
    el('button',{class:'close', 'aria-label':'Sluiten'}, [document.createTextNode('×')])
  ]);
  header.querySelector('button').onclick = closeModal;
  modal.appendChild(header);
  sections.forEach(sec=>{
    const s = el('div',{class:'section'});
    if (sec.title) s.appendChild(el('h4',{html:sec.title}));
    if (sec.kv){
      const wrap = el('div',{class:'kv'});
      sec.kv.forEach(row=>{
        wrap.appendChild(el('div',{class:'k', html:row.k}));
        wrap.appendChild(el('div',{class:'v', html:row.v}));
      });
      s.appendChild(wrap);
    }
    if (sec.list){
      sec.list.forEach(item=> s.appendChild(el('div',{class:'pill'},[
        el('span',{html:item.k}), el('strong',{html:item.v})
      ])));
    }
    modal.appendChild(s);
  });
  backdrop.appendChild(modal);
  backdrop.style.display='flex';
}
export function closeModal(){ backdrop.style.display='none' }
backdrop.addEventListener('click',(e)=>{ if (e.target===backdrop) closeModal() });
window.addEventListener('keydown',(e)=>{ if (e.key==='Escape') closeModal() });
