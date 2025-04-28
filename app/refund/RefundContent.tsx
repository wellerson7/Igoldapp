'use client';

import { useSession, signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

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

export default function RefundContent() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => signIn(),
  });

  const params = useSearchParams();
  const orderName = params.get('orderName')?.replace('#', '') || '';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundQty, setRefundQty] = useState<Record<number, number>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!orderName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/shopify/orders?orderName=${encodeURIComponent(orderName)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
        return data as OrderDetail;
      })
      .then((o) => {
        setOrder(o);
        const init: Record<number, number> = {};
        o.line_items.forEach((li) => (init[li.id] = 0));
        setRefundQty(init);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderName]);

  const changeQty = (id: number, v: number) => {
    if (!order) return;
    const max = order.line_items.find((li) => li.id === id)?.quantity || 0;
    setRefundQty((prev) => ({
      ...prev,
      [id]: Math.min(Math.max(0, v), max),
    }));
  };

  const doRefund = async () => {
    if (!order || status !== 'authenticated') return;
    setBusy(true);
    setError('');
    setMessage('');

    const items = Object.entries(refundQty)
      .map(([k, v]) => ({ line_item_id: +k, quantity: v }))
      .filter((x) => x.quantity > 0);

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
          seller: session.user?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar refund');

      setMessage(`Reembolso criado com sucesso! (por ${session.user!.name})`);
      if (typeof (window as any).openCashDrawer === 'function') {
        (window as any).openCashDrawer();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div>Carregando detalhes do reembolso...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;
  if (!order) return <div>Nenhum pedido encontrado.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Pedido #{order.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {order.line_items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex gap-4">
                <div className="w-20 h-20 relative">
                  {item.image?.src ? (
                    <Image
                      src={item.image.src}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="bg-gray-200 w-full h-full rounded flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <input
                    type="number"
                    value={refundQty[item.id] ?? 0}
                    onChange={(e) => changeQty(item.id, Number(e.target.value))}
                    className="border rounded p-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Button
        onClick={doRefund}
        disabled={busy}
        className="bg-black text-white py-2 px-4 rounded"
      >
        {busy ? 'Processando...' : 'Confirmar Reembolso'}
      </Button>
      {message && <p className="text-green-500">{message}</p>}
    </div>
  );
}