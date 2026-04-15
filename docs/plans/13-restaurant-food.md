# Day 13: Restaurant Mode & Quick Wins

## Goal
Restaurant owners can use OmniBIZ for table management, KOT (kitchen order tickets), and combo meals — completing the "under 10 minutes" promise for food businesses.

---

## Why This Day Matters
The restaurant/food business segment is different from retail. They need:
- Table management (dine-in)
- KOT system (kitchen receives orders)
- Combo meals (BOM)
- Faster billing (no item-by-item scanning)

---

## Tasks

### 13.1 Restaurant Dashboard
- [ ] Store type detected → show restaurant-specific dashboard
- [ ] Floor plan view: table grid with status (available/occupied/reserved)
- [ ] Quick stats: covers today, average order value, tables occupied

### 13.2 Table Management (`/dashboard/restaurant/tables`)
- [ ] Visual floor plan editor:
  - Add tables: click to place, drag to move
  - Set capacity per table (2, 4, 6, 8, etc.)
  - Name tables: "T1", "T2", "Bar 1", etc.
  - Color-coded status: green=available, red=occupied, yellow=reserved
- [ ] Table list view (alternative)
- [ ] "Reserve Table": customer name, phone, time, party size
- [ ] "Clear Table": end dining, move to billing

### 13.3 POS for Restaurant
- [ ] "Start Order" → select table → starts new KOT
- [ ] Menu items displayed as category grid (no search needed)
- [ ] Tap item → add to order (no barcode needed)
- [ ] Combo meals: tap combo → auto-add components
- [ ] Modifier options: "No onions", "Extra cheese", etc.
- [ ] Send to Kitchen → KOT created
- [ ] Split bill: by item, by person, equal split

### 13.4 KOT (Kitchen Order Ticket) System
- [ ] Kitchen display: list of pending KOTs
- [ ] Color-coded: new (yellow), in-progress (blue), ready (green)
- [ ] Tap KOT → mark items as ready
- [ ] "Served" button → KOT complete
- [ ] Audio alert on new KOT
- [ ] KOT printed on kitchen printer (58mm)

### 13.5 Menu Item Management
- [ ] Add menu item: name, category, price, image, prep time
- [ ] Prep time: shows estimated ready time
- [ ] Has variants: Size (S/M/L), etc.
- [ ] Add-ons: "Extra cheese +₹30", "Double patty +₹60"
- [ ] Combo meals (BOM): select items that make up combo, set combo price
- [ ] Recipe/ingredient link (future: link to inventory)

### 13.6 Bill Generation
- [ ] From table → "Generate Bill"
- [ ] Show itemized bill
- [ ] Apply discounts (bill-level, item-level)
- [ ] Split bill options
- [ ] Payment: Cash, UPI, Card, Mixed
- [ ] Print bill / receipt
- [ ] "Clear Table" → mark table available

### 13.7 Restaurant API
- [ ] GET/PUT `/api/restaurant/tables`: Manage tables
- [ ] POST `/api/restaurant/tables/[id]/reserve`: Reserve
- [ ] POST `/api/restaurant/tables/[id]/clear`: Clear table
- [ ] GET/POST `/api/restaurant/kot`: Kitchen orders
- [ ] PUT `/api/restaurant/kot/[id]`: Update KOT status
- [ ] GET/POST `/api/restaurant/menu`: Menu items
- [ ] POST `/api/restaurant/bill`: Generate bill from table

---

## Deliverable
A restaurant owner can set up tables, take orders via KOT, and generate bills — matching their existing workflow without learning new software.

---

## Dependencies
- Day 3 (onboarding detects restaurant type)
- Day 4 (POS adapted for restaurant)
- Day 5 (products → menu items)
- Prisma schema: RestaurantTable, MenuItem, KOT, KOTItem models exist
