/**
 * Industry Presets for Ezvento
 *
 * Maps store types to default categories, GST rates, units, and workflow flags.
 */

export type IndustryType =
  | 'ELECTRONICS'
  | 'CLOTHING'
  | 'GROCERY'
  | 'PHARMACY'
  | 'RESTAURANT'
  | 'GENERAL_RETAIL'

interface IndustryPreset {
  label: string
  description: string
  icon: string
  categories: Array<{
    name: string
    hsnCode?: string
    gstRate: number
  }>
  defaultUnits: string[]
  workflowFlags: {
    weightBasedBilling: boolean
    batchExpiryTracking: boolean
    serialNumberTracking: boolean
  }
}

export const INDUSTRY_PRESETS: Record<IndustryType, IndustryPreset> = {
  ELECTRONICS: {
    label: 'Electronics',
    description: 'Mobiles, laptops, accessories, and gadgets',
    icon: '🔌',
    categories: [
      { name: 'Mobiles', hsnCode: '8517', gstRate: 18 },
      { name: 'Laptops', hsnCode: '8471', gstRate: 18 },
      { name: 'Tablets', hsnCode: '8471', gstRate: 18 },
      { name: 'Accessories', hsnCode: '8544', gstRate: 18 },
      { name: 'Audio', hsnCode: '8518', gstRate: 18 },
      { name: 'Wearables', hsnCode: '8517', gstRate: 18 },
      { name: 'Cameras', hsnCode: '8525', gstRate: 18 },
      { name: 'Storage', hsnCode: '8471', gstRate: 18 },
    ],
    defaultUnits: ['Pieces'],
    workflowFlags: {
      weightBasedBilling: false,
      batchExpiryTracking: false,
      serialNumberTracking: true,
    },
  },
  CLOTHING: {
    label: 'Clothing & Fashion',
    description: 'Apparel, textiles, and fashion accessories',
    icon: '👕',
    categories: [
      { name: 'Men\'s Wear', hsnCode: '6203', gstRate: 5 },
      { name: 'Women\'s Wear', hsnCode: '6204', gstRate: 5 },
      { name: 'Kids\' Wear', hsnCode: '6205', gstRate: 5 },
      { name: 'Footwear', hsnCode: '6403', gstRate: 5 },
      { name: 'Accessories', hsnCode: '6217', gstRate: 5 },
      { name: 'Innerwear', hsnCode: '6107', gstRate: 5 },
      { name: 'Sportswear', hsnCode: '6112', gstRate: 5 },
    ],
    defaultUnits: ['Pieces'],
    workflowFlags: {
      weightBasedBilling: false,
      batchExpiryTracking: false,
      serialNumberTracking: false,
    },
  },
  GROCERY: {
    label: 'Grocery & Supermarket',
    description: 'Daily essentials, vegetables, fruits, dairy',
    icon: '🛒',
    categories: [
      { name: 'Vegetables', hsnCode: '0701', gstRate: 0 },
      { name: 'Fruits', hsnCode: '0801', gstRate: 0 },
      { name: 'Dairy', hsnCode: '0401', gstRate: 5 },
      { name: 'Bakery', hsnCode: '1905', gstRate: 5 },
      { name: 'Pulses & Grains', hsnCode: '1006', gstRate: 0 },
      { name: 'Spices', hsnCode: '0901', gstRate: 5 },
      { name: 'Packaged Foods', hsnCode: '2106', gstRate: 12 },
      { name: 'Beverages', hsnCode: '2202', gstRate: 12 },
      { name: 'Snacks', hsnCode: '1905', gstRate: 12 },
      { name: 'Personal Care', hsnCode: '3304', gstRate: 18 },
      { name: 'Household', hsnCode: '3402', gstRate: 18 },
    ],
    defaultUnits: ['Kg', 'L', 'Pieces', 'G'],
    workflowFlags: {
      weightBasedBilling: true,
      batchExpiryTracking: true,
      serialNumberTracking: false,
    },
  },
  PHARMACY: {
    label: 'Pharmacy',
    description: 'Medicines, health products, and medical supplies',
    icon: '💊',
    categories: [
      { name: 'Allopathic', hsnCode: '3004', gstRate: 12 },
      { name: 'Generic Medicines', hsnCode: '3004', gstRate: 5 },
      { name: 'Ayurvedic', hsnCode: '3003', gstRate: 5 },
      { name: 'OTC', hsnCode: '3004', gstRate: 12 },
      { name: 'Supplements', hsnCode: '2106', gstRate: 12 },
      { name: 'Personal Care', hsnCode: '3304', gstRate: 18 },
      { name: 'Medical Devices', hsnCode: '9018', gstRate: 5 },
      { name: 'Surgical', hsnCode: '9018', gstRate: 5 },
    ],
    defaultUnits: ['Pieces', 'Strips', 'Boxes'],
    workflowFlags: {
      weightBasedBilling: false,
      batchExpiryTracking: true,
      serialNumberTracking: false,
    },
  },
  RESTAURANT: {
    label: 'Restaurant & Food',
    description: 'Dine-in, takeaway, and delivery food service',
    icon: '🍽️',
    categories: [
      { name: 'Starters', hsnCode: '2106', gstRate: 5 },
      { name: 'Main Course', hsnCode: '2106', gstRate: 5 },
      { name: 'Beverages', hsnCode: '2202', gstRate: 5 },
      { name: 'Desserts', hsnCode: '2106', gstRate: 5 },
      { name: 'Breads', hsnCode: '1905', gstRate: 5 },
      { name: 'Combos', hsnCode: '2106', gstRate: 5 },
    ],
    defaultUnits: ['Plate', 'Bowl', 'Glass', 'Pieces'],
    workflowFlags: {
      weightBasedBilling: false,
      batchExpiryTracking: true,
      serialNumberTracking: false,
    },
  },
  GENERAL_RETAIL: {
    label: 'General Retail',
    description: 'Mixed retail — general store with various product types',
    icon: '🏪',
    categories: [
      { name: 'General', hsnCode: '2106', gstRate: 18 },
      { name: 'Food & Beverages', hsnCode: '2106', gstRate: 12 },
      { name: 'Household', hsnCode: '3402', gstRate: 18 },
      { name: 'Stationery', hsnCode: '4820', gstRate: 12 },
      { name: 'Toys', hsnCode: '9503', gstRate: 12 },
      { name: 'Hardware', hsnCode: '8204', gstRate: 18 },
    ],
    defaultUnits: ['Pieces', 'Kg', 'L'],
    workflowFlags: {
      weightBasedBilling: false,
      batchExpiryTracking: false,
      serialNumberTracking: false,
    },
  },
}

/**
 * Create default categories for a tenant based on industry type.
 * Should be called after onboarding with the selected storeType.
 */
export async function seedIndustryCategories(
  tenantId: string,
  industryType: IndustryType
) {
  const { prisma } = await import('@/lib/db')
  const preset = INDUSTRY_PRESETS[industryType]
  if (!preset) return

  const categories = await prisma.category.createMany({
    data: preset.categories.map(cat => ({
      tenantId,
      name: cat.name,
      hsnCode: cat.hsnCode || null,
      isActive: true,
    })),
    skipDuplicates: true,
  })

  return categories
}

/**
 * Get the default GST rate for a new product based on industry type.
 */
export function getDefaultGstRate(industryType: IndustryType): number {
  const preset = INDUSTRY_PRESETS[industryType]
  if (!preset) return 18
  // Return the most common GST rate for this industry
  const rateCounts = new Map<number, number>()
  for (const cat of preset.categories) {
    rateCounts.set(cat.gstRate, (rateCounts.get(cat.gstRate) || 0) + 1)
  }
  let maxCount = 0
  let mostCommon = 18
  for (const [rate, count] of rateCounts) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = rate
    }
  }
  return mostCommon
}