# T068: Profitability Report (Margin Analysis)

**Priority**: P1  
**Status**: todo  
**Size**: M  
**Depends on**: —

## Problem

The `costPrice` field exists on Product variants but is never used in any report. Store owners have no way to see their profit margins — by product, category, or overall. Without profitability data, they can't make informed pricing or purchasing decisions.

## Requirements

### Profitability Report Page
- New tab in Reports: "Profitability" or "Margins"
- Show profit margin analysis across:
  - **Overall**: Total revenue, total cost, gross profit, margin %
  - **By Product**: Each product's revenue, cost, profit, margin %
  - **By Category**: Aggregated category margins
  - **By Brand**: Aggregated brand margins (if brand data exists)

### Margin Calculations
- Revenue = Sum of line items' total (including GST)
- Cost = Sum of `costPrice × quantity` for each line item's product variant
- Gross Profit = Revenue - Cost
- Margin % = (Gross Profit / Revenue) × 100
- Note: GST should be excluded from margin calculation for accurate margin:
  - Net Revenue = Sum of taxable values
  - Net Cost = costPrice × quantity (cost is pre-GST)
  - Gross Margin = Net Revenue - Net Cost
  - Margin % = (Gross Margin / Net Revenue) × 100

### Filters
- Date range (today, 7 days, 30 days, custom)
- Store filter (for multi-store)
- Category filter
- Product search
- Margin threshold filter (e.g., "show only products with margin < 20%")

### Visualization
- Summary cards: Total Revenue, Total Cost, Gross Profit, Average Margin %
- Margin distribution chart: how many products in each margin bucket (<10%, 10-20%, 20-30%, 30%+)
- Trend line: margin % over time (daily/weekly)
- Top 10 most profitable products, Top 10 least profitable products

### Data Quality
- Flag products where `costPrice` is 0 or null (can't calculate margin)
- Show "N/A" or "—" for products without cost price
- Allow bulk cost price update from the report (link to inventory edit)

### API Endpoint
- `GET /api/reports/profitability?from=&to=&storeId=&categoryId=`
  - Returns: overall summary, per-product breakdown, per-category breakdown
  - Uses `InvoiceItem` joined with `ProductVariant.costPrice`

## Acceptance Criteria

- [ ] Profitability report shows overall summary (revenue, cost, profit, margin %)
- [ ] Per-product margin breakdown is correct
- [ ] Per-category margin breakdown is correct
- [ ] GST is excluded from margin calculation
- [ ] Products without cost price are flagged
- [ ] Date range and store filters work
- [ ] Margin threshold filter works (e.g., "margin < 20%")
- [ ] Top/least profitable products are highlighted
- [ ] CSV export works for profitability data

## Files to Create/Modify

- `src/app/api/reports/profitability/route.ts` — New: profitability calculations
- `src/app/(dashboard)/dashboard/reports/page.tsx` — Add Profitability tab
- `src/app/(dashboard)/dashboard/page.tsx` — Add margin widget to dashboard