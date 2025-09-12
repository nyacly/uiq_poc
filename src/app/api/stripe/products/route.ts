import { NextRequest, NextResponse } from 'next/server'
import { db, stripe_products, stripe_prices } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // membership, business, listing_boost
    const tier = searchParams.get('tier') // free, plus, family, basic, standard, premium

    // Build where conditions array
    const whereConditions = [eq(stripe_products.is_active, true)]
    
    if (type) {
      whereConditions.push(eq(stripe_products.type, type))
    }
    
    if (tier) {
      whereConditions.push(eq(stripe_products.tier, tier))
    }

    const query = db
      .select({
        product: stripe_products,
        prices: stripe_prices
      })
      .from(stripe_products)
      .leftJoin(stripe_prices, eq(stripe_products.stripe_product_id, stripe_prices.stripe_product_id))
      .where(and(...whereConditions))

    const results = await query

    // Group prices by product
    const productsWithPrices = results.reduce((acc: any[], row: { product: { id: any; }; prices: any; }) => {
      const existingProduct = acc.find(p => p.id === row.product.id)

      if (existingProduct) {
        if (row.prices) {
          existingProduct.prices.push(row.prices)
        }
      } else {
        acc.push({
          ...row.product,
          prices: row.prices ? [row.prices] : []
        })
      }

      return acc
    }, [])

    return NextResponse.json({
      products: productsWithPrices
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', message: errorMessage },
      { status: 500 }
    )
  }
}