# Day 7: Reports & GST Compliance

## Goal
A retailer can view sales reports, export GST summaries, and download GSTR-1/3B data in the format required for GST filing.

---

## Why This Day Matters
GST compliance is mandatory for Indian businesses. Without GST reports, retailers cannot file returns. This is a key selling point vs. Excel-based systems.

---

## Tasks

### 7.1 Reports Page (`/dashboard/reports`)
- [ ] The reports page exists. Audit and enhance:
  - [ ] Tab navigation: Sales, Inventory, GST, Customer, Vendor
  - [ ] Date range selector: Today, Yesterday, This Week, This Month, Custom
  - [ ] Export buttons: PDF, Excel, CSV

### 7.2 Sales Report
- [ ] Table: Invoice #, Date, Customer, Store, Items, Subtotal, Discount, GST, Total, Payment, Status
- [ ] Group by: Day, Week, Month, Store
- [ ] Summary cards: Total Sales, Total GST, Avg Order Value, Total Invoices
- [ ] Payment mode breakdown: Cash, UPI, Card, Credit totals

### 7.3 GST Summary Report
- [ ] HSN-wise summary: HSN Code, Description, Total Qty, Taxable Amount, CGST, SGST, IGST, Total GST
- [ ] Invoice-wise: all B2B invoices with GSTIN
- [ ] B2C summary: aggregate by rate (5%, 12%, 18%, 28%)
- [ ] Export to Excel: formatted for GSTR-1 filing

### 7.4 GSTR-1 Export
- [ ] Generate GSTR-1 compatible Excel file
- [ ] B2B invoices: GSTIN-wise breakdown
- [ ] B2C large invoices: >₹2.5 lakh per invoice
- [ ] B2C small invoices: aggregate by place of supply
- [ ] Credit/Debit Notes
- [ ] "Download GSTR-1 Excel" button

### 7.5 GSTR-3B Summary
- [ ] Auto-calculate from invoice data:
  - Total taxable supply (inter-state vs intra-state)
  - Total integrated tax (IGST)
  - Total central tax (CGST)
  - Total state tax (SGST)
  - Total Cess
- [ ] "Download GSTR-3B Summary" for accountant reference

### 7.6 Inventory Report
- [ ] Current stock levels by store/location
- [ ] Low stock alerts (below reorder level)
- [ ] Expiry report (items expiring within 30/60/90 days)
- [ ] Stock movement: Opening → In → Out → Closing

### 7.7 Reports API
- [ ] GET `/api/reports/sales`: Sales data with date range, filters
- [ ] GET `/api/reports/gst`: GST summary
- [ ] GET `/api/reports/gstr1`: GSTR-1 formatted data
- [ ] GET `/api/reports/inventory`: Stock levels
- [ ] GET `/api/reports/export`: Generate PDF/Excel from any report

### 7.8 Excel/CSV Generation
- [ ] Use `xlsx` library (already installed: `xlsx`)
- [ ] Format Excel files with:
  - Column headers
  - Number formatting (INR)
  - Date formatting (DD/MM/YYYY)
  - GSTIN validation
  - Auto-fit column widths
  - Freeze header row

### 7.9 Dashboard Widgets (Reports)
- [ ] Add report widgets to dashboard:
  - Today's sales vs yesterday
  - This month's sales trend (line chart)
  - GST collected this month
  - Low stock alerts
- [ ] Use simple chart library or just display numbers with trend arrows

---

## Deliverable
A retailer can: view daily sales, download GST summaries, and export GSTR-1 data for their accountant — in 2 clicks.

---

## Dependencies
- Day 4 (billing creates invoices)
- Day 5 (products with HSN codes)
- Day 6 (customers with GSTIN)
- Existing reports page
