
# 11S Shop Prototype Dashboard

Een minimalistische, production-ready *prototype* voor een schaatswinkel (detailhandel).  
Focus: **tiles met kern-KPI's**, **filters**, **upload & export** (CSV/XLSX), **modals met detail** – **zonder grafieken of tabellen**.

## Features
- 📊 Tiles met o.a. omzet, marge%, brutomarge, top product omzet/marge, AOV, conversie (mock), voorraad-kengetallen, omzet/uur, loonkosten%.
- 🔎 Filters: datumrange, merk, categorie, verkoopkanaal.
- ⬆️ Upload CSV/XLSX voor **sales**, **inventory**, **staff_hours**.
- ⬇️ Export van gefilterde dataset als CSV/XLSX.
- 🪄 Voorbeelddata inbegrepen in `/data/sample`.
- 🎨 UI in stijl van 11S Shop: kleuren **#212945** (Navy) en **#52E8E8** (Ice Blue), font **Archivo**.
- 💬 Klik op een tile → modal met detail (key-value, geen tabellen).
- 🧱 Eenvoudige Node/Express backend (uploads met Multer; parsing CSV & XLSX).

## Data modellen (kolommen)
### `sales` (verkoopregels)
- `date` (YYYY-MM-DD)
- `order_id`
- `sku`
- `product_name`
- `category`
- `brand`
- `channel` (store, web, marketplace)
- `qty` (integer)
- `price` (incl. btw optioneel, we rekenen excl. btw indien `vat_rate` is gevuld)
- `cost` (inkoop per stuk)
- `vat_rate` (0–0.21 optioneel)

### `inventory`
- `date` (snapshot datum)
- `sku`
- `on_hand`
- `cost`
- `reorder_point` (optioneel)
- `category`, `brand`

### `staff_hours`
- `date`
- `employee_id`
- `role` (sales, warehouse, admin)
- `hours`
- `hourly_wage`

> Minimale set voor KPI's: `sales` (date, sku, qty, price, cost, category, brand, channel), `staff_hours` (date, hours, hourly_wage).

## KPI-definities
- **Omzet**: Σ(qty * price_excl_vat)
- **Brutomarge €**: Σ(qty * (price_excl_vat - cost))
- **Marge %**: brutomarge / omzet
- **AOV**: omzet / unieke orders
- **Top product omzet**: SKU met hoogste Σ(qty * price_excl_vat)
- **Top product marge**: SKU met hoogste brutomarge
- **Omzet per uur**: omzet / Σ staff hours (verkooprollen)
- **Loonkosten %**: Σ(hours * wage) / omzet
- **Voorraad-kengetal (sell-through 30d)**: (verkoop 30d) / (gem. voorraad 30d) – indien inventory aanwezig
- **Omzet per kanaal/merk/categorie**: gebruikt in detailmodals

## Snel starten
```bash
# 1) Node 18+
npm install
npm run dev   # ontwikkelmodus op http://localhost:5173 (frontend) & http://localhost:3001 (api)
# of
npm run start # production server (Express serveert /public en API op :3001)
```

### Uploaden
- Ga naar het dashboard → **Upload Data** → kies type (sales/inventory/staff_hours) → upload CSV of XLSX.
- Kolomnamen zoals hierboven. CSV delimiter `,` of `;` wordt automatisch gedetecteerd.

### Exporteren
- Gebruik filters → **Export CSV** / **Export XLSX** voor de gefilterde *sales* subset.

## GitHub instructies
1. Maak een nieuwe repo, bv. `11s-shop-dashboard`.
2. Upload de inhoud van deze map (of unzip en push).
3. Voor development:
   ```bash
   git clone <repo-url>
   cd 11s-shop-dashboard
   npm install
   npm run dev
   ```
4. Voor deploy als Node-app (Render, Railway, VPS):
   ```bash
   npm run start
   ```
5. Voor GitHub Pages alleen frontend:
   - Host `/public` map als static site; API-uploads werken dan niet (client-only modus met sample data).

## Licentie
MIT – vrij te gebruiken voor prototype-doeleinden.
