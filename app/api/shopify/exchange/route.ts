import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}`;
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_API_ACCESS_TOKEN!,
  'Content-Type': 'application/json',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      returnItems,
      addItems,
      reason,
      seller,
      paymentMethod,
    } = body;

    if (
      !orderId ||
      !returnItems?.length ||
      !addItems?.length ||
      !reason ||
      !paymentMethod
    ) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // 1. Calcular REFUND
    const refundCalcRes = await fetch(
      `${SHOPIFY_API_URL}/orders/${orderId}/refunds/calculate.json`,
      {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          refund: {
            shipping: { full_refund: false },
            refund_line_items: returnItems.map((item: any) => ({
              line_item_id: item.lineItemId,
              quantity: item.quantity,
              restock_type: 'return',
            })),
          },
        }),
      }
    );

    if (!refundCalcRes.ok) {
      const errorData = await refundCalcRes.json();
      throw new Error(errorData.errors || 'Erro ao calcular reembolso');
    }

    const refundPreview = await refundCalcRes.json();

    // 2. Criar REFUND real
    const refundRes = await fetch(`${SHOPIFY_API_URL}/orders/${orderId}/refunds.json`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        refund: {
          notify: true,
          note: `Troca solicitada por ${seller || 'cliente'} — Motivo: ${reason}`,
          shipping: { full_refund: false },
          refund_line_items: refundPreview.refund.refund_line_items,
          transactions: refundPreview.refund.transactions,
        },
      }),
    });

    if (!refundRes.ok) {
      const errorData = await refundRes.json();
      throw new Error(errorData.errors || 'Erro ao processar reembolso');
    }

    // 3. Criar DRAFT ORDER
    const draftOrderRes = await fetch(`${SHOPIFY_API_URL}/draft_orders.json`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        draft_order: {
          line_items: addItems.map((item: any) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
          note: `Itens de troca para pedido #${orderId}`,
          use_customer_default_address: true,
          tags: ['troca'],
        },
      }),
    });

    if (!draftOrderRes.ok) {
      const errorData = await draftOrderRes.json();
      throw new Error(errorData.errors || 'Erro ao criar pedido de troca');
    }

    const draftData = await draftOrderRes.json();

    // 4. Cartão → gerar link de pagamento
    if (paymentMethod === 'card') {
      const invoiceRes = await fetch(
        `${SHOPIFY_API_URL}/draft_orders/${draftData.draft_order.id}/send_invoice.json`,
        {
          method: 'POST',
          headers: HEADERS,
        }
      );

      if (!invoiceRes.ok) {
        throw new Error('Erro ao enviar link de pagamento');
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: draftData.draft_order.invoice_url,
      });
    }

    // 5. Dinheiro → finalizar pedido direto
    if (paymentMethod === 'cash') {
      const completeRes = await fetch(
        `${SHOPIFY_API_URL}/draft_orders/${draftData.draft_order.id}/complete.json`,
        {
          method: 'PUT',
          headers: HEADERS,
        }
      );

      if (!completeRes.ok) {
        throw new Error('Erro ao concluir pedido com pagamento em dinheiro');
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro ao processar troca:', err);
    return NextResponse.json(
      { error: err.message || 'Erro inesperado.' },
      { status: 500 }
    );
  }
}
