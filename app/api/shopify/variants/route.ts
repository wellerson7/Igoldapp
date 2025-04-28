import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const VERSION = process.env.SHOPIFY_API_VERSION!;
const TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN!;

export async function GET(_req: NextRequest) {
  try {
    let allVariants: any[] = [];
    let hasNextPage = true;
    let pageInfo: string | null = null;

    while (hasNextPage) {
      let url = `https://${DOMAIN}/admin/api/${VERSION}/products.json?fields=id,title,variants,images&limit=250`;

      if (pageInfo) {
        url += `&page_info=${pageInfo}`;
      }

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': TOKEN,
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error fetching variants:', res.status, text); // Log do erro da API
        throw new Error(`Erro ao buscar variantes: ${res.status} - ${text}`);
      }

      const { products, next_page_info } = await res.json();

      // Adiciona as variantes dos produtos ao array allVariants
      allVariants = [
        ...allVariants,
        ...products.flatMap((p: any) =>
          p.variants.map((v: any) => ({
            id: v.id.toString(),
            title: `${p.title}${v.title ? ` — ${v.title}` : ''}`,
            price: parseFloat(v.price),
            sku: v.sku,
            image: p.images?.[0] ? p.images[0] : null, // Pegando a primeira imagem
          }))
        ),
      ];

      // Se houver uma próxima página, a paginamos com o valor de `next_page_info`
      pageInfo = next_page_info || null;
      hasNextPage = pageInfo !== null; // Se houver próxima página, continua a requisição
    }

    return NextResponse.json(allVariants); // Retorna todos os produtos
  } catch (err: any) {
    console.error('api/shopify/variants error:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
