
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAppBridge } from '@shopify/app-bridge-react'
import { Print } from '@shopify/app-bridge/actions'
type LineItem = {
  id: number;
  name: string;
  variant_title: string;
  quantity: number;
  price: string;
  image?: { src: string };
};

type OrderDetail = {
  id: number;
  name: string;
  created_at: string;
  location_name: string;
  current_total_price: string;
  total_discounts: string;
  current_total_tax: string;
  line_items: LineItem[];
};

export default function RefundPage() {
  // 1) Protege a página via NextAuth
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => signIn()
  });

  const params = useSearchParams();
  const router = useRouter();

  const [orderName, setOrderName] = useState<string>('');
  useEffect(() => {
    const q = params.get('orderName') || '';
    if (q) setOrderName(q);
    else if (typeof window !== 'undefined' && window.location.hash)
      setOrderName(window.location.hash);
  }, [params]);

  const [order, setOrder]             = useState<OrderDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [refundQty, setRefundQty]     = useState<Record<number,number>>({});
  const [reason, setReason]           = useState('');
  const [busy, setBusy]               = useState(false);
  const [message, setMessage]         = useState('');

  // 2) Carrega detalhes do pedido
  useEffect(() => {
    if (!orderName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/shopify/orders?orderName=${encodeURIComponent(orderName)}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
        return data as OrderDetail;
      })
      .then(o => {
        setOrder(o);
        const init: Record<number,number> = {};
        o.line_items.forEach(li => init[li.id] = 0);
        setRefundQty(init);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderName]);

  const changeQty = (id: number, v: number) => {
    if (!order) return;
    const max = order.line_items.find(li => li.id === id)?.quantity || 0;
    setRefundQty(prev => ({
      ...prev,
      [id]: Math.min(Math.max(0, v), max)
    }));
  };

  // 3) Envia o refund, incluindo seller na carga
  const doRefund = async () => {
    if (!order || status !== 'authenticated') return;
    setBusy(true);
    setError('');
    setMessage('');

    const items = Object.entries(refundQty)
      .map(([k,v]) => ({ line_item_id: +k, quantity: v }))
      .filter(x => x.quantity > 0);

    if (items.length === 0) {
      setMessage('Selecione ao menos 1 item para reembolso');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/shopify/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          refundLineItems: items,
          reason,
          seller: session.user?.name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar refund');

      // garantimos que session.user não é undefined, pois só chamamos esse trecho
setMessage(`Reembolso criado com sucesso! (por ${session.user!.name})`)
;
      if (typeof (window as any).openCashDrawer === 'function') {
        (window as any).openCashDrawer();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <Button
        className="mb-4 px-4 py-2 bg-black text-white rounded hover:opacity-90"
        onClick={() => router.push(`/order?orderName=${encodeURIComponent(orderName)}`)}
      >
        ← Voltar
      </Button>

      <h1 className="text-3xl font-bold text-center">
        {orderName ? `Pedido ${orderName}` : 'Pedido não informado'}
      </h1>

      {loading && <p className="text-center">Carregando…</p>}
      {error   && <p className="text-center text-red-500">{error}</p>}
      {!loading && !order && !error && (
        <p className="text-center">Nenhum pedido encontrado.</p>
      )}

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {order.line_items.map(item => (
              <Card key={item.id}>
                <CardContent className="flex gap-4">
                  <div className="w-20 h-20 relative">
                    {item.image?.src
                      ? <Image src={item.image.src} alt={item.name} fill className="object-cover rounded"/>
                      : <div className="bg-gray-200 w-full h-full rounded flex items-center justify-center text-gray-400">
                          Sem imagem
                        </div>
                    }
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">Variante: {item.variant_title}</p>
                    <p className="text-sm text-gray-600">Disponível: {item.quantity}</p>
                    <p className="font-medium">${item.price}</p>
                    <div className="mt-2">
                      <label className="text-sm">Qtd. reembolso:</label>
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={refundQty[item.id] ?? 0}
                        onChange={e => changeQty(item.id, Number(e.target.value))}
                        className="w-16 border rounded p-1 ml-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="flex justify-between">
                <span className="font-medium">Localização:</span>
                <span>{order.location_name || 'Online'}</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="text-xl font-bold">
                    ${order.current_total_price}
                  </span>
                </div>
                {parseFloat(order.total_discounts) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>–${parseFloat(order.total_discounts).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(order.current_total_tax) > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Taxas:</span>
                    <span>${parseFloat(order.current_total_tax).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <label className="block font-medium mb-1">Motivo (opcional)</label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>

            <Button
              onClick={doRefund}
              disabled={busy}
              className="w-full bg-black text-white py-3 rounded hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Processando…' : 'Confirmar Reembolso'}
            </Button>

            {message && <p className="text-center mt-2">{message}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
