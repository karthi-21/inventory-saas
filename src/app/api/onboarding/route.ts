import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoreType, PermissionModule, PermissionAction, TenantPlan } from '@prisma/client'
import {
  unauthorizedResponse,
  createdResponse,
  errorResponse,
  validateRequired,
  handlePrismaError,
  logActivity,
  generateStoreCode
} from '@/lib/api'
import type { OnboardingData } from '@/types'

/**
 * POST /api/onboarding - Complete onboarding wizard
 * Creates tenant, store, locations, default categories and personas, links user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) return unauthorizedResponse()

    const body: OnboardingData = await request.json()
    const {
      storeName,
      storeType,
      businessName,
      gstin,
      pan,
      fssaiNumber,
      address,
      state,
      pincode,
      phone,
      email,
      storeCount,
      hasExpiryTracking,
      hasSerialTracking,
      hasBatchTracking,
      hasMultiStore,
      personas: selectedPersonas,
      plan
    } = body

    // Validate required fields
    const validationError = validateRequired(body as unknown as Record<string, unknown>, [
      'storeName', 'storeType', 'businessName', 'address', 'state', 'pincode', 'phone'
    ])
    if (validationError) return errorResponse(validationError, 400)

    // Check if user already has a tenant
    const existingUser = await prisma.user.findFirst({
      where: { email: authUser.email! },
      include: { tenant: true }
    })

    if (existingUser?.tenantId) {
      const storeCode = await generateStoreCode(existingUser.tenantId)
      const result = await prisma.$transaction(async (tx) => {
        // Create Store with locations
        const store = await tx.store.create({
          data: {
            tenantId: existingUser.tenantId,
            name: storeName,
            code: storeCode,
            storeType: storeType as StoreType,
            address,
            state,
            pincode,
            phone,
            isActive: true,
            locations: {
              create: [
                {
                  name: storeType === 'RESTAURANT' ? 'Main Kitchen' : 'Main Location',
                  type: storeType === 'RESTAURANT' ? 'KITCHEN' : 'SHOWROOM',
                  isActive: true
                }
              ]
            }
          },
          include: { locations: true }
        })

        // Create additional stores if multi-store
        if (hasMultiStore && storeCount && parseInt(storeCount) > 1) {
          const count = parseInt(storeCount)
          for (let i = 2; i <= Math.min(count, 5); i++) {
            await tx.store.create({
              data: {
                tenantId: existingUser.tenantId,
                name: `${storeName} - Location ${i}`,
                code: `STR-${String(i).padStart(3, '0')}`,
                storeType: storeType as StoreType,
                address,
                state,
                pincode,
                phone,
                isActive: true,
                locations: {
                  create: [
                    {
                      name: storeType === 'RESTAURANT' ? 'Kitchen' : 'Showroom',
                      type: storeType === 'RESTAURANT' ? 'KITCHEN' : 'SHOWROOM',
                      isActive: true
                    }
                  ]
                }
              }
            })
          }
        }

        // Create default categories
        const categoryNames = getDefaultCategories(storeType as StoreType)
        const categories = await Promise.all(
          categoryNames.map(name =>
            tx.category.create({
              data: {
                tenantId: existingUser.tenantId,
                name,
                isActive: true
              }
            })
          )
        )

        // Grant user access to store
        await tx.userStoreAccess.create({
          data: {
            userId: existingUser.id,
            storeId: store.id,
            isDefault: true
          }
        })

        return {
          tenant: existingUser.tenant,
          user: existingUser,
          store,
          categories,
          personas: []
        }
      })

      // Log onboarding completion
      await logActivity({
        tenantId: result.tenant.id,
        userId: result.user.id,
        action: 'ONBOARDING_COMPLETE',
        module: 'SETTINGS_EDIT',
        entityType: 'Tenant',
        entityId: result.tenant.id,
        metadata: {
          storeName,
          storeType,
          businessName,
          categoryCount: result.categories.length,
          personaCount: 0
        }
      })

      return createdResponse({
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          tenant: {
            id: result.tenant.id,
            name: result.tenant.name,
            subdomain: result.tenant.subdomain
          },
          store: {
            id: result.store.id,
            name: result.store.name,
            code: result.store.code,
            locations: result.store.locations.length
          },
          user: {
            id: result.user.id,
            email: result.user.email,
            isOwner: result.user.isOwner
          },
          categories: result.categories.map(c => ({ id: c.id, name: c.name })),
          personas: []
        }
      })
    }

    // Generate subdomain from business name
    const subdomain = generateSubdomain(businessName)

    // Check if subdomain is unique
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain }
    })
    if (existingTenant) {
      return errorResponse('Business name already taken', 409)
    }

    // Create tenant with transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          subdomain,
          pan,
          gstin,
          fssaiNumber,
          address,
          state,
          pincode,
          phone,
          email
        }
      })

      // 2. Create User in database linked to tenant
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: email || authUser.email!,
          phone,
          firstName: authUser.user_metadata?.firstName || businessName,
          lastName: authUser.user_metadata?.lastName,
          isOwner: true,
          isActive: true,
          emailVerified: true
        }
      })

      // 3. Create Store with locations
      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: storeName,
          code: 'STR-001',
          storeType: storeType as StoreType,
          address,
          state,
          pincode,
          phone,
          isActive: true,
          locations: {
            create: [
              {
                name: storeType === 'RESTAURANT' ? 'Main Kitchen' : 'Main Location',
                type: storeType === 'RESTAURANT' ? 'KITCHEN' : 'SHOWROOM',
                isActive: true
              }
            ]
          }
        },
        include: { locations: true }
      })

      // Create additional stores if multi-store
      if (hasMultiStore && storeCount && parseInt(storeCount) > 1) {
        const count = parseInt(storeCount)
        for (let i = 2; i <= Math.min(count, 5); i++) {
          await tx.store.create({
            data: {
              tenantId: tenant.id,
              name: `${storeName} - Location ${i}`,
              code: `STR-${String(i).padStart(3, '0')}`,
              storeType: storeType as StoreType,
              address,
              state,
              pincode,
              phone,
              isActive: true,
              locations: {
                create: [
                  {
                    name: storeType === 'RESTAURANT' ? 'Kitchen' : 'Showroom',
                    type: storeType === 'RESTAURANT' ? 'KITCHEN' : 'SHOWROOM',
                    isActive: true
                  }
                ]
              }
            }
          })
        }
      }

      // 4. Create default categories
      const categoryNames = getDefaultCategories(storeType as StoreType)
      const categories = await Promise.all(
        categoryNames.map(name =>
          tx.category.create({
            data: {
              tenantId: tenant.id,
              name,
              isActive: true
            }
          })
        )
      )

      // 5. Create default personas with permissions
      const defaultPersonas = getDefaultPersonas(storeType as StoreType)
      const createdPersonas = []

      for (const personaDef of defaultPersonas) {
        // Skip if not selected (except Owner which is always created)
        if (personaDef.name !== 'Owner/Admin' &&
            selectedPersonas &&
            !selectedPersonas.includes(personaDef.name)) {
          continue
        }

        const persona = await tx.persona.create({
          data: {
            tenantId: tenant.id,
            name: personaDef.name,
            description: personaDef.description,
            isSystem: false,
            permissions: {
              create: personaDef.permissions.map(p => ({
                module: p.module as PermissionModule,
                action: p.action as PermissionAction
              }))
            }
          },
          include: { permissions: true }
        })

        createdPersonas.push(persona)

        // Assign Owner/Admin persona to the creator
        if (personaDef.name === 'Owner/Admin') {
          await tx.userPersona.create({
            data: {
              userId: user.id,
              personaId: persona.id,
              storeId: store.id
            }
          })
        }
      }

      // 6. Create tenant settings
      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          defaultLanguage: 'en',
          currency: 'INR',
          fiscalYearStart: 4,
          lowStockAlertDays: 7,
          expiryAlertDays: hasExpiryTracking ? 7 : 30,
          invoicePrefix: 'INV',
          decimalPlaces: 2,
          roundOffEnabled: true
        }
      })

      const PLAN_MAP: Record<string, TenantPlan> = {
        launch: 'STARTER',
        grow: 'PRO',
        scale: 'ENTERPRISE',
      }

      // 7. Create initial subscription (14-day trial)
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: (plan && PLAN_MAP[plan]) || (hasMultiStore ? 'PRO' : 'STARTER'),
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      })

      // 8. Grant user access to store
      await tx.userStoreAccess.create({
        data: {
          userId: user.id,
          storeId: store.id,
          isDefault: true
        }
      })

      return {
        tenant,
        user,
        store,
        categories,
        personas: createdPersonas
      }
    })

    // Log onboarding completion
    await logActivity({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: 'ONBOARDING_COMPLETE',
      module: 'SETTINGS_EDIT',
      entityType: 'Tenant',
      entityId: result.tenant.id,
      metadata: {
        storeName,
        storeType,
        businessName,
        categoryCount: result.categories.length,
        personaCount: result.personas.length
      }
    })

    return createdResponse({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          subdomain: result.tenant.subdomain
        },
        store: {
          id: result.store.id,
          name: result.store.name,
          code: result.store.code,
          locations: result.store.locations.length
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          isOwner: result.user.isOwner
        },
        categories: result.categories.map(c => ({ id: c.id, name: c.name })),
        personas: result.personas.map(p => ({ id: p.id, name: p.name }))
      }
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

function generateSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getDefaultCategories(storeType: StoreType): string[] {
  const base = ['General']
  switch (storeType) {
    case 'ELECTRONICS':
      return [...base, 'Mobiles', 'TVs', 'Appliances', 'Audio', 'Accessories']
    case 'CLOTHING':
      return [...base, 'Men', 'Women', 'Kids', 'Footwear', 'Accessories']
    case 'GROCERY':
      return [...base, 'Food Grains', 'Dairy', 'Beverages', 'Snacks', 'Personal Care']
    case 'SUPERMARKET':
      return [...base, 'Food', 'Beverages', 'Household', 'Personal Care', 'Frozen']
    case 'RESTAURANT':
      return [...base, 'Starters', 'Main Course', 'Desserts', 'Beverages', 'Combos']
    case 'WHOLESALE':
      return [...base, 'Bulk Goods', 'Industrial', 'Raw Materials']
    default:
      return base
  }
}

interface PersonaDefinition {
  name: string
  description: string
  permissions: { module: string; action: string }[]
}

function getDefaultPersonas(storeType: StoreType): PersonaDefinition[] {
  const fullAccess = Object.values(PermissionModule).map(module => ({
    module,
    action: 'VIEW' as PermissionAction
  }))

  const ownerPerms = [
    { module: 'STORE_VIEW', action: 'VIEW' },
    { module: 'STORE_EDIT', action: 'EDIT' },
    { module: 'USER_VIEW', action: 'VIEW' },
    { module: 'USER_CREATE', action: 'CREATE' },
    { module: 'USER_EDIT', action: 'EDIT' },
    { module: 'USER_DELETE', action: 'DELETE' },
    { module: 'PRODUCT_VIEW', action: 'VIEW' },
    { module: 'PRODUCT_CREATE', action: 'CREATE' },
    { module: 'PRODUCT_EDIT', action: 'EDIT' },
    { module: 'PRODUCT_DELETE', action: 'DELETE' },
    { module: 'INVENTORY_VIEW', action: 'VIEW' },
    { module: 'INVENTORY_EDIT', action: 'EDIT' },
    { module: 'INVENTORY_ADJUST', action: 'ADJUST' },
    { module: 'BILLING_VIEW', action: 'VIEW' },
    { module: 'BILLING_CREATE', action: 'CREATE' },
    { module: 'BILLING_EDIT', action: 'EDIT' },
    { module: 'BILLING_DELETE', action: 'DELETE' },
    { module: 'BILLING_RETURN', action: 'DELETE' },
    { module: 'CUSTOMER_VIEW', action: 'VIEW' },
    { module: 'CUSTOMER_CREATE', action: 'CREATE' },
    { module: 'CUSTOMER_EDIT', action: 'EDIT' },
    { module: 'CUSTOMER_DELETE', action: 'DELETE' },
    { module: 'VENDOR_VIEW', action: 'VIEW' },
    { module: 'VENDOR_CREATE', action: 'CREATE' },
    { module: 'VENDOR_EDIT', action: 'EDIT' },
    { module: 'VENDOR_DELETE', action: 'DELETE' },
    { module: 'PURCHASE_VIEW', action: 'VIEW' },
    { module: 'PURCHASE_CREATE', action: 'CREATE' },
    { module: 'PURCHASE_EDIT', action: 'EDIT' },
    { module: 'REPORT_VIEW', action: 'VIEW' },
    { module: 'REPORT_EXPORT', action: 'VIEW' },
    { module: 'SETTINGS_VIEW', action: 'VIEW' },
    { module: 'SETTINGS_EDIT', action: 'EDIT' },
    { module: 'PRICE_OVERRIDE', action: 'EDIT' },
    { module: 'DISCOUNT_GLOBAL', action: 'EDIT' }
  ]

  const storeManagerPerms = [
    { module: 'STORE_VIEW', action: 'VIEW' },
    { module: 'PRODUCT_VIEW', action: 'VIEW' },
    { module: 'PRODUCT_CREATE', action: 'CREATE' },
    { module: 'PRODUCT_EDIT', action: 'EDIT' },
    { module: 'INVENTORY_VIEW', action: 'VIEW' },
    { module: 'INVENTORY_EDIT', action: 'EDIT' },
    { module: 'INVENTORY_ADJUST', action: 'ADJUST' },
    { module: 'BILLING_VIEW', action: 'VIEW' },
    { module: 'BILLING_CREATE', action: 'CREATE' },
    { module: 'BILLING_EDIT', action: 'EDIT' },
    { module: 'BILLING_RETURN', action: 'DELETE' },
    { module: 'CUSTOMER_VIEW', action: 'VIEW' },
    { module: 'CUSTOMER_CREATE', action: 'CREATE' },
    { module: 'CUSTOMER_EDIT', action: 'EDIT' },
    { module: 'VENDOR_VIEW', action: 'VIEW' },
    { module: 'VENDOR_CREATE', action: 'CREATE' },
    { module: 'VENDOR_EDIT', action: 'EDIT' },
    { module: 'PURCHASE_VIEW', action: 'VIEW' },
    { module: 'PURCHASE_CREATE', action: 'CREATE' },
    { module: 'REPORT_VIEW', action: 'VIEW' },
    { module: 'REPORT_EXPORT', action: 'VIEW' },
    { module: 'PRICE_OVERRIDE', action: 'EDIT' },
    { module: 'DISCOUNT_GLOBAL', action: 'EDIT' }
  ]

  const billingOperatorPerms = [
    { module: 'PRODUCT_VIEW', action: 'VIEW' },
    { module: 'INVENTORY_VIEW', action: 'VIEW' },
    { module: 'BILLING_VIEW', action: 'VIEW' },
    { module: 'BILLING_CREATE', action: 'CREATE' },
    { module: 'BILLING_EDIT', action: 'EDIT' },
    { module: 'BILLING_RETURN', action: 'DELETE' },
    { module: 'CUSTOMER_VIEW', action: 'VIEW' },
    { module: 'CUSTOMER_CREATE', action: 'CREATE' },
    { module: 'CUSTOMER_EDIT', action: 'EDIT' }
  ]

  const common: PersonaDefinition[] = [
    {
      name: 'Owner/Admin',
      description: 'Full access to all features',
      permissions: ownerPerms
    },
    {
      name: 'Store Manager',
      description: 'Day-to-day store operations',
      permissions: storeManagerPerms
    },
    {
      name: 'Billing Operator',
      description: 'POS and billing operations',
      permissions: billingOperatorPerms
    }
  ]

  switch (storeType) {
    case 'ELECTRONICS':
      return [
        ...common,
        {
          name: 'Inventory Manager',
          description: 'Stock and warranty management',
          permissions: [
            { module: 'PRODUCT_VIEW', action: 'VIEW' },
            { module: 'PRODUCT_CREATE', action: 'CREATE' },
            { module: 'PRODUCT_EDIT', action: 'EDIT' },
            { module: 'INVENTORY_VIEW', action: 'VIEW' },
            { module: 'INVENTORY_EDIT', action: 'EDIT' },
            { module: 'INVENTORY_ADJUST', action: 'ADJUST' },
            { module: 'REPORT_VIEW', action: 'VIEW' }
          ]
        },
        {
          name: 'Vendor Manager',
          description: 'Supplier and purchase orders',
          permissions: [
            { module: 'VENDOR_VIEW', action: 'VIEW' },
            { module: 'VENDOR_CREATE', action: 'CREATE' },
            { module: 'VENDOR_EDIT', action: 'EDIT' },
            { module: 'PURCHASE_VIEW', action: 'VIEW' },
            { module: 'PURCHASE_CREATE', action: 'CREATE' },
            { module: 'PURCHASE_EDIT', action: 'EDIT' }
          ]
        }
      ]
    case 'RESTAURANT':
      return [
        ...common,
        {
          name: 'Kitchen Staff',
          description: 'Kitchen order management',
          permissions: [
            { module: 'KOT_VIEW', action: 'VIEW' },
            { module: 'KOT_EDIT', action: 'EDIT' },
            { module: 'TABLE_MANAGE', action: 'EDIT' },
            { module: 'BOM_VIEW', action: 'VIEW' },
            { module: 'BOM_EDIT', action: 'EDIT' }
          ]
        },
        {
          name: 'Table Host',
          description: 'Table and reservation management',
          permissions: [
            { module: 'TABLE_MANAGE', action: 'EDIT' },
            { module: 'KOT_VIEW', action: 'VIEW' },
            { module: 'CUSTOMER_VIEW', action: 'VIEW' },
            { module: 'CUSTOMER_CREATE', action: 'CREATE' }
          ]
        }
      ]
    case 'GROCERY':
    case 'SUPERMARKET':
      return [
        ...common,
        {
          name: 'Inventory Manager',
          description: 'Stock and expiry management',
          permissions: [
            { module: 'PRODUCT_VIEW', action: 'VIEW' },
            { module: 'PRODUCT_CREATE', action: 'CREATE' },
            { module: 'PRODUCT_EDIT', action: 'EDIT' },
            { module: 'INVENTORY_VIEW', action: 'VIEW' },
            { module: 'INVENTORY_EDIT', action: 'EDIT' },
            { module: 'INVENTORY_ADJUST', action: 'ADJUST' }
          ]
        },
        {
          name: 'Vendor Manager',
          description: 'Supplier management',
          permissions: [
            { module: 'VENDOR_VIEW', action: 'VIEW' },
            { module: 'VENDOR_CREATE', action: 'CREATE' },
            { module: 'VENDOR_EDIT', action: 'EDIT' },
            { module: 'PURCHASE_VIEW', action: 'VIEW' },
            { module: 'PURCHASE_CREATE', action: 'CREATE' }
          ]
        }
      ]
    default:
      return common
  }
}
