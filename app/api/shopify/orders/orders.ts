// app/api/shopify/orders/orders.ts
import { NextResponse } from 'next/server'

const SHOP       = process.env.SHOPIFY_STORE_DOMAIN!  // ex: "igold-inc.myshopify.com"
const API_VER   = process.env.SHOPIFY_API_VERSION!   // ex: "2023-10"
const TOKEN     = process.env.SHOPIFY_API_ACCESS_TOKEN!

const BASE_URL  = `https://${SHOP}/admin/api/${API_VER}`

export async function fetchOrderDetails(orderName: string) {
  // limpa o “#” inicial, se existir
  const cleanName = orderName.replace(/^#/, '')
  // busca a ordem pelo name
  const ordersRes = await fetch(`${BASE_URL}/orders.json?name=${cleanName}`, {
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
  })
  const ordersData = await ordersRes.json()
  if (!ordersRes.ok || !ordersData.orders?.length) {
    throw new Error(ordersData.errors || 'Order not found')
  }
  const order = ordersData.orders[0]

  // busca o nome da localização, se houver location_id
  let location_name = ''
  if (order.location_id) {
    const locRes = await fetch(`${BASE_URL}/locations/${order.location_id}.json`, {
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
      },
    })
    const locData = await locRes.json()
    if (locRes.ok && locData.location?.name) {
      location_name = locData.location.name
    }
  }

  return {
    ...order,
    location_name,
  }
}
