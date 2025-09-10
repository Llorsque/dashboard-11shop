
import { uploadFile, exportFile } from './components/api.js';
import { $ } from './components/utils.js';
import { renderTiles } from './components/tiles.js';
import { currentFilters } from './filters.js';

const uploadBtn = $('#uploadBtn');
uploadBtn.addEventListener('click', async ()=>{
  const type = prompt('Welke dataset uploaden? (sales | inventory | staff_hours)','sales');
  if (!type) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx,.xls';
  input.onchange = async (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const res = await uploadFile(type, file);
    if (res.ok){ alert('Upload gelukt voor '+type); renderTiles(currentFilters()); }
    else alert('Upload mislukt: '+res.error);
  };
  input.click();
});

$('#exportCsv').onclick = ()=> exportFile('csv', currentFilters());
$('#exportXlsx').onclick = ()=> exportFile('xlsx', currentFilters());
