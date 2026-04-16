// Re-export Prisma types with renamed imports to avoid conflicts
import type {
  Tenant as TenantModel,
  Store as StoreModel,
  Location as LocationModel,
  User as UserModel,
  UserStoreAccess as UserStoreAccessModel,
  Persona as PersonaModel,
  PersonaPermission as PersonaPermissionModel,
  UserPersona as UserPersonaModel,
  Category as CategoryModel,
  Product as ProductModel,
  ProductVariant as ProductVariantModel,
  InventoryStock as InventoryStockModel,
  StockMovement as StockMovementModel,
  StockAdjustment as StockAdjustmentModel,
  Customer as CustomerModel,
  LoyaltyPointsLog as LoyaltyPointsLogModel,
  Vendor as VendorModel,
  PurchaseOrder as PurchaseOrderModel,
  PurchaseInvoice as PurchaseInvoiceModel,
  SalesInvoice as SalesInvoiceModel,
  SalesInvoiceItem as SalesInvoiceItemModel,
  Payment as PaymentModel,
  SalesReturn as SalesReturnModel,
  RestaurantTable as RestaurantTableModel,
  MenuItem as MenuItemModel,
  BOMItem as BOMItemModel,
  KOT as KOTModel,
  KOTItem as KOTItemModel,
  Shift as ShiftModel,
  ActivityLog as ActivityLogModel,
  PrinterConfig as PrinterConfigModel,
  Subscription as SubscriptionModel,
  TenantSettings as TenantSettingsModel,
} from '@prisma/client'

export type {
  TenantModel as Tenant,
  StoreModel as Store,
  LocationModel as Location,
  UserModel as User,
  UserStoreAccessModel as UserStoreAccess,
  PersonaModel as Persona,
  PersonaPermissionModel as PersonaPermission,
  UserPersonaModel as UserPersona,
  CategoryModel as Category,
  ProductModel as Product,
  ProductVariantModel as ProductVariant,
  InventoryStockModel as InventoryStock,
  StockMovementModel as StockMovement,
  StockAdjustmentModel as StockAdjustment,
  CustomerModel as Customer,
  LoyaltyPointsLogModel as LoyaltyPointsLog,
  VendorModel as Vendor,
  PurchaseOrderModel as PurchaseOrder,
  PurchaseInvoiceModel as PurchaseInvoice,
  SalesInvoiceModel as SalesInvoice,
  SalesInvoiceItemModel as SalesInvoiceItem,
  PaymentModel as Payment,
  SalesReturnModel as SalesReturn,
  RestaurantTableModel as RestaurantTable,
  MenuItemModel as MenuItem,
  BOMItemModel as BOMItem,
  KOTModel as KOT,
  KOTItemModel as KOTItem,
  ShiftModel as Shift,
  ActivityLogModel as ActivityLog,
  PrinterConfigModel as PrinterConfig,
  SubscriptionModel as Subscription,
  TenantSettingsModel as TenantSettings,
}

export {
  TenantPlan, SubscriptionStatus, StoreType, LocationType,
  ProductType, StockMovementType, AdjustmentReason,
  CustomerType, PurchaseOrderStatus, PurchaseStatus,
  InvoiceType, PaymentStatus, BillingType, PaymentMethod, InvoiceStatus, IRNStatus,
  TableStatus, KOTStatus, KOTItemStatus, ShiftStatus,
  PrinterType, PrinterConnection, PermissionModule, PermissionAction
} from '@prisma/client'

// App-specific composite types

export interface StoreWithLocations extends StoreModel {
  locations: LocationModel[]
}

export interface UserWithAccess extends UserModel {
  storeAccess: UserStoreAccessModel[]
  userPersonas: (UserPersonaModel & { persona: PersonaModel })[]
}

export interface CustomerWithBalance extends CustomerModel {
  outstandingAmount: number
}

export interface ProductWithCategory extends ProductModel {
  category: CategoryModel | null
  variants: ProductVariantModel[]
}

export interface SalesInvoiceWithDetails extends SalesInvoiceModel {
  items: SalesInvoiceItemModel[]
  payments: PaymentModel[]
  customer: CustomerModel | null
  createdBy: UserModel
  store: StoreModel
}

// POS-specific types
export interface POSCartItem {
  productId: string
  variantId?: string
  name: string
  sku: string
  barcode?: string
  quantity: number
  unitPrice: number
  discountPercent: number
  discountAmount: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  serialNumbers?: string[]
  batchNumber?: string
  expiryDate?: Date
}

export interface POSBill {
  items: POSCartItem[]
  customerId?: string
  customerName?: string
  subtotal: number
  totalDiscount: number
  totalGst: number
  roundOff: number
  totalAmount: number
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'CREDIT' | 'PARTIAL' | 'MIXED'
  billingType: 'CASH' | 'CREDIT' | 'CARD' | 'UPI' | 'MIXED'
  amountPaid: number
  amountDue: number
}

// Onboarding wizard types
export interface OnboardingData {
  storeName: string
  storeType: 'ELECTRONICS' | 'CLOTHING' | 'GROCERY' | 'SUPERMARKET' | 'WHOLESALE' | 'RESTAURANT' | 'MULTI_CATEGORY'
  businessName: string
  gstin?: string
  pan?: string
  fssaiNumber?: string
  address: string
  state: string
  pincode: string
  phone: string
  email: string
  storeCount: string
  hasExpiryTracking: boolean
  hasSerialTracking: boolean
  hasBatchTracking: boolean
  hasMultiStore: boolean
  personas: string[]
}

// GST calculation helpers
export interface GSTBreakdown {
  rate: number
  cgst: number
  sgst: number
  igst: number
  taxableAmount: number
  totalGst: number
}

// Export formats
export type ExportFormat = 'xlsx' | 'csv' | 'pdf'
