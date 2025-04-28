import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!
const VERSION = process.env.SHOPIFY_API_VERSION!
const TOKEN   = process.env.SHOPIFY_API_ACCESS_TOKEN!

const ORDERS_URL    = `https://${DOMAIN}/admin/api/${VERSION}/orders.json`
const LOCATIONS_URL = `https://${DOMAIN}/admin/api/${VERSION}/locations.json`
const PRODUCT_URL   = (id: number) =>
  `https://${DOMAIN}/admin/api/${VERSION}/products/${id}.json?fields=images`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit     = searchParams.get('limit')   || '10'
  const orderName = searchParams.get('orderName')

  const params: string[] = []
  if (orderName) {
    params.push(`name=${encodeURIComponent(orderName)}`, 'status=any')
  } else {
    params.push(`limit=${encodeURIComponent(limit)}`, 'status=any')
  }

  // fetch orders
  const ordersRes = await fetch(`${ORDERS_URL}?${params.join('&')}`, {
    headers: { 'X-Shopify-Access-Token': TOKEN }
  })
  const ordersData = await ordersRes.json()
  if (!ordersRes.ok) {
    return NextResponse.json({ error: ordersData.errors || 'Erro ao buscar orders' }, { status: ordersRes.status })
  }
  const orders = orderName ? [ordersData.orders[0]] : ordersData.orders

  // fetch locations
  const locRes  = await fetch(LOCATIONS_URL, { headers: { 'X-Shopify-Access-Token': TOKEN } })
  const locData = await locRes.json()
  const locMap  = new Map<number,string>()
  locData.locations.forEach((l: any) => locMap.set(l.id, l.name))

  // enrich line items with image
  const enriched = await Promise.all(orders.map(async o => {
    const items = await Promise.all(o.line_items.map(async (it: any) => {
      let imageSrc: string | null = null
      if (it.product_id) {
        const pr = await fetch(PRODUCT_URL(it.product_id), {
          headers: { 'X-Shopify-Access-Token': TOKEN }
        })
        if (pr.ok) {
          const pd = await pr.json()
          imageSrc = pd.product.images?.[0]?.src || null
        }
      }
      return {
        id: it.id,
        name: it.name,
        variant_title: it.variant_title,
        quantity: it.quantity,
        price: it.price,
        image: imageSrc ? { src: imageSrc } : undefined
      }
    }))

    return {
      id:                  o.id,
      name:                o.name,
      created_at:          o.created_at,
      location_name:       locMap.get(o.location_id) || '',
      current_total_price: o.current_total_price,
      total_discounts:     o.current_total_discounts,
      current_total_tax:   o.current_total_tax,
      line_items:          items
    }
  }))

  return NextResponse.json(orderName ? enriched[0] : enriched)
}
