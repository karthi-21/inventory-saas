import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * Auth Callback Handler
 *
 * Handles redirects from:
 * 1. Supabase OAuth (Google) - uses ?code=xxx
 * 2. Email confirmation - uses ?token=xxx&type=signup or ?confirmation_token=xxx
 * 3. Phone OTP - uses ?token=xxx&type=sms
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token') || searchParams.get('confirmation_token')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const plan = searchParams.get('plan') || localStorage?.getItem('selected_plan') || 'grow'

  // Handle OAuth errors
  if (error) {
    console.error('Auth error:', error)
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent(error)}`)
  }

  try {
    const supabase = await createServerSupabaseClient()
    let user = null

    // Case 1: OAuth code exchange (Google)
    if (code) {
      const { data: { user: oauthUser }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
      if (authError || !oauthUser) {
        console.error('OAuth session exchange error:', authError)
        return NextResponse.redirect(`${origin}/signup?error=auth_failed`)
      }
      user = oauthUser
    }
    // Case 2: Email confirmation token or OTP token
    else if (token) {
      // Verify the token (this sets up the session for email confirm or OTP)
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.verifyToken({
        type: type === 'sms' ? 'otp' : 'signup',
        token: token,
      })

      if (tokenError || !tokenUser) {
        console.error('Token verification error:', tokenError)
        return NextResponse.redirect(`${origin}/signup?error=invalid_token`)
      }
      user = tokenUser
    }
    // Case 3: No code or token - try to get current session
    else {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      user = sessionUser
    }

    if (!user) {
      return NextResponse.redirect(`${origin}/signup?error=no_session`)
    }

    // Get plan from localStorage or query param
    const selectedPlan = typeof localStorage !== 'undefined'
      ? localStorage.getItem('selected_plan')
      : null

    // Check if user already exists in Prisma
    let dbUser = await prisma.user.findFirst({
      where: { email: user.email }
    })

    if (!dbUser) {
      // Create tenant FIRST
      const subdomain = (user.user_metadata?.store_name || user.email?.split('@')[0] || 'store')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)

      const tenant = await prisma.tenant.create({
        data: {
          name: user.user_metadata?.store_name || `${user.email?.split('@')[0]}'s Store`,
          subdomain,
        }
      })

      // Create user linked to tenant
      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          phone: user.phone || null,
          firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User',
          lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
          isOwner: true,
          isActive: true,
          emailVerified: user.email_confirmed_at != null || token != null,
          tenantId: tenant.id,
        }
      })

      // Create trial subscription if not exists
      const existingSub = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id }
      })

      if (!existingSub) {
        await prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            plan: 'PRO',
            status: 'TRIALING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          }
        })
      }

      // Create default store for the tenant
      const store = await prisma.store.create({
        data: {
          tenantId: tenant.id,
          name: user.user_metadata?.store_name || `${user.email?.split('@')[0]}'s Store`,
          code: 'STR-001',
          storeType: 'MULTI_CATEGORY',
          isActive: true,
          locations: {
            create: {
              name: 'Main Location',
              type: 'SHOWROOM',
              isActive: true
            }
          }
        }
      })

      // Create default categories based on store type
      const storeType = user.user_metadata?.store_type || 'MULTI_CATEGORY'
      const defaultCategories = getDefaultCategories(storeType)

      for (const cat of defaultCategories) {
        await prisma.category.create({
          data: {
            tenantId: tenant.id,
            name: cat.name,
            description: cat.description,
          }
        })
      }

      // Link user to store
      await prisma.userStoreAccess.create({
        data: {
          userId: dbUser.id,
          storeId: store.id,
          isDefault: true
        }
      })
    }

    // Redirect to payment with selected plan
    const redirectPlan = selectedPlan || plan
    return NextResponse.redirect(`${origin}/payment?plan=${redirectPlan}`)
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`${origin}/signup?error=server_error`)
  }
}

function getDefaultCategories(storeType: string) {
  const categories: Record<string, Array<{ name: string; description: string }>> = {
    ELECTRONICS: [
      { name: 'Mobiles', description: 'Mobile phones and accessories' },
      { name: 'Laptops', description: 'Laptops and computers' },
      { name: 'TVs', description: 'Televisions and displays' },
      { name: 'Audio', description: 'Headphones, speakers, soundbars' },
      { name: 'Accessories', description: 'Cables, chargers, cases' },
    ],
    CLOTHING: [
      { name: 'Men', description: 'Men\'s clothing' },
      { name: 'Women', description: 'Women\'s clothing' },
      { name: 'Kids', description: 'Children\'s clothing' },
      { name: 'Footwear', description: 'Shoes and sandals' },
      { name: 'Accessories', description: 'Bags, belts, watches' },
    ],
    GROCERY: [
      { name: 'Fruits & Vegetables', description: 'Fresh produce' },
      { name: 'Dairy', description: 'Milk, cheese, yogurt' },
      { name: 'Packaged Foods', description: 'Chips, biscuits, beverages' },
      { name: 'Household', description: 'Cleaning supplies' },
      { name: 'Personal Care', description: 'Soap, shampoo, toothpaste' },
    ],
    SUPERMARKET: [
      { name: 'Groceries', description: 'Food items' },
      { name: 'Household', description: 'Home care products' },
      { name: 'Personal Care', description: 'Personal hygiene' },
      { name: 'Beverages', description: 'Drinks and juices' },
    ],
    RESTAURANT: [
      { name: 'Starters', description: 'Appetizers' },
      { name: 'Main Course', description: 'Main dishes' },
      { name: 'Beverages', description: 'Drinks' },
      { name: 'Desserts', description: 'Sweet dishes' },
    ],
    WHOLESALE: [
      { name: 'Bulk Goods', description: 'Wholesale lots' },
      { name: 'Electronics', description: 'Electronic goods' },
      { name: 'Food & Beverages', description: 'Food products' },
    ],
    MULTI_CATEGORY: [
      { name: 'General', description: 'General merchandise' },
    ],
  }
  return categories[storeType] || categories.MULTI_CATEGORY
}
