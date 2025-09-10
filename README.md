
# 11S Shop Prototype Dashboard (GitHub-first)

Dit is een **static-first** prototype dat je zo op **GitHub (Pages)** kunt draaien.  
Alles (KPI-berekening, filters, klik-modals, uploads & exports) gebeurt **client-side** in de browser.
Als er een backend beschikbaar is, gebruikt de app die automatisch; zo niet, dan blijft alles werken in **Static Mode**.

## Live draaien via GitHub
1. Maak een repo aan, bijvoorbeeld `11s-shop-dashboard`.
2. Upload de inhoud van **deze zip** naar de root van je repo.
3. Zet **GitHub Pages** aan op de `main` branch (root of `/docs`).
4. Open de Pages-URL → het dashboard werkt volledig client-side.

> In Static Mode kun je **uploaden** (in-memory override) en **exporteren** (client-side downloads). Er is geen serveropslag.

## Scripts (alleen nodig als je een backend wilt draaien)
- `npm install`
- `npm run start` – Node/Express backend (optioneel).

## Data-indeling
- `public/data/sales.csv`
- `public/data/inventory.csv`
- `public/data/staff_hours.csv`

Dummy data is aanwezig voor **2023**, **2024** en **2025 t/m Q3 (30 september)**.

## Kolommen
### sales
date, order_id, sku, product_name, category, brand, channel, qty, price, cost, vat_rate

### inventory
date, sku, on_hand, cost, reorder_point, category, brand

### staff_hours
date, employee_id, role, hours, hourly_wage

## KPI’s (tiles)
- Omzet, Brutomarge €, Marge %, Gem. orderwaarde
- Top product (omzet), Top product (marge)
- Omzet per uur, Loonkosten %

**Klik** op een tile voor detail (modals met key-value/pills, géén grafieken/tabellen).

## Upload/Export (Static Mode)
- **Upload:** knop ‘Upload data’ → kies type (`sales/inventory/staff_hours`) → kies file; dataset wordt **in-memory** overschreven (blijft actief zolang het tabblad open is).
- **Export:** exporteert de **huidige gefilterde sales** naar CSV of XLSX (client-side download).
