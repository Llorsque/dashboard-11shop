
import { $ } from './components/utils.js';
import { overrideDataset, parseTextToRows, currentSalesFiltered, exportCSV, exportXLSX } from './components/store.js';
import { renderTiles } from './components/tiles.js';
import { currentFilters } from './filters.js';

$('#uploadBtn').addEventListener('click', async ()=>{
  const type = prompt('Welke dataset uploaden? (sales | inventory | staff_hours)','sales');
  if (!type) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx,.xls,.txt';
  input.onchange = async (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')){ alert('Static Mode ondersteunt alleen CSV (geen XLSX)'); return; }
    const text = await file.text();
    const rows = parseTextToRows(text);
    overrideDataset(type, rows);
    alert('Upload gelukt (Static Mode, in-memory).');
    renderTiles(currentFilters());
  };
  input.click();
});

$('#exportCsv').onclick = ()=> exportCSV(currentSalesFiltered(currentFilters()));
$('#exportXlsx').onclick = ()=> exportXLSX(currentSalesFiltered(currentFilters()));
