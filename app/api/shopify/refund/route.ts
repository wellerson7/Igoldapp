import { NextRequest, NextResponse } from 'next/server';

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const VERSION = process.env.SHOPIFY_API_VERSION!;
const TOKEN = process.env.SHOPIFY_API_ACCESS_TOKEN!;
const GRAPHQL_URL = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;

const REFUND_MUTATION = /* GraphQL */ `
mutation refundCreate($input: RefundInput!) {
  refundCreate(input: $input) {
    userErrors { field message }
    refund {
      id
      totalRefundedSet { presentmentMoney { amount } }
      transactions(first: 10) {
        edges {
          node {
            id
            amountSet { presentmentMoney { amount } }
            kind
            gateway
          }
        }
      }
    }
  }
}
`;

// Função para buscar detalhes do pedido
async function fetchOrder(orderId: string) {
  const url = `https://${DOMAIN}/admin/api/${VERSION}/orders/${orderId}.json?fields=line_items,total_discounts_set,total_tax_set`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
  });

  if (!res.ok) {
    console.error('[refund] erro ao buscar pedido:', res.status, await res.text());
    throw new Error('Não foi possível buscar dados do pedido');
  }

  const { order } = await res.json();
  return order;
}

// Função para buscar a transação original
async function getOriginalTransaction(orderId: string) {
  const url = `https://${DOMAIN}/admin/api/${VERSION}/orders/${orderId}/transactions.json`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
  });

  if (!res.ok) {
    console.error('[refund] erro ao buscar transações:', res.status, await res.text());
    throw new Error('Não foi possível buscar transações');
  }

  const { transactions } = await res.json();
  return transactions.find((t: any) => t.kind === 'sale' || t.kind === 'capture');
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, refundLineItems, reason, seller, paymentMethod } = await req.json();

    // Validação básica
    if (!orderId || !Array.isArray(refundLineItems) || refundLineItems.length === 0) {
      return NextResponse.json(
        { error: 'orderId e refundLineItems são obrigatórios' },
        { status: 400 }
      );
    }

    // 1) Buscar dados do pedido e transação original
    const order = await fetchOrder(orderId);
    const saleTx = await getOriginalTransaction(orderId);
    if (!saleTx) {
      return NextResponse.json(
        { error: 'Transação original não encontrada' },
        { status: 400 }
      );
    }

    // 2) Cálculo do total a reembolsar
    const fullItemsTotal = order.line_items.reduce(
      (sum: number, li: any) => sum + parseFloat(li.price) * li.quantity,
      0
    );
    const orderDiscountTotal = parseFloat(order.total_discounts_set.presentment_money.amount);
    const totalTaxOrder = parseFloat(order.total_tax_set.presentment_money.amount);

    let refundSubtotal = 0;
    for (const { line_item_id, quantity } of refundLineItems) {
      const li = order.line_items.find((x: any) => x.id === line_item_id);
      if (!li) {
        return NextResponse.json(
          { error: `Line item ${line_item_id} não encontrado` },
          { status: 400 }
        );
      }
      const lineGross = parseFloat(li.price) * quantity;
      const discountShare = fullItemsTotal
        ? (lineGross / fullItemsTotal) * orderDiscountTotal
        : 0;
      const netLine = lineGross - discountShare;
      const taxShare = fullItemsTotal
        ? (lineGross / fullItemsTotal) * totalTaxOrder
        : 0;

      refundSubtotal += netLine + taxShare;
    }
    const refundAmount = refundSubtotal.toFixed(2);

    // 3) Montar os RefundLineItemInput (apenas lineItemId e quantity)
    const refundLines = refundLineItems.map((i: any) => ({
      lineItemId: `gid://shopify/LineItem/${i.line_item_id}`,
      quantity: i.quantity,
    }));

    // 4) Construir o note incluindo vendedor, se houver
    const noteWithSeller = seller
      ? `${reason || ''} (vendedor: ${seller})`
      : reason || '';

    // 5) Payload GraphQL
    const variables = {
      input: {
        orderId: `gid://shopify/Order/${orderId}`,
        refundLineItems: refundLines,
        transactions: [
          {
            orderId: `gid://shopify/Order/${orderId}`,
            parentId: `gid://shopify/OrderTransaction/${saleTx.id}`,
            gateway: saleTx.gateway,
            kind: 'REFUND',
            amount: refundAmount,
          },
        ],
        notify: true,
        note: noteWithSeller,
      },
    };

    console.log('[refund] variables:', JSON.stringify(variables));

    // 6) Executa a mutation
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': TOKEN,
      },
      body: JSON.stringify({ query: REFUND_MUTATION, variables }),
    });

    const text = await response.text();
    console.log('[refund] raw response:', text);

    const result = JSON.parse(text);
    if (result.errors?.length) {
      const msg = result.errors.map((e: any) => e.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const payload = result.data.refundCreate;
    if (payload.userErrors.length) {
      const msg = payload.userErrors.map((e: any) => e.message).join('; ');
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 7) Retorna o refund criado
    return NextResponse.json(payload.refund);
  } catch (err: any) {
    console.error('[refund] exceção não tratada:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar refund' },
      { status: 500 }
    );
  }
}
