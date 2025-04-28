'use client';

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

export function OrderContent() {
  const params = useSearchParams();
  const name = params.get('orderName')?.replace('#', '') || '';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/shopify/orders?orderName=${encodeURIComponent(name)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
        return data as OrderDetail;
      })
      .then((o) => setOrder(o))
      .catch((e) => {
        console.error(e.message);
        setError(e.message);
        toast.error(e.message || 'Erro ao carregar os detalhes do pedido.');
      })
      .finally(() => setLoading(false));
  }, [name]);

  const totalDiscount = parseFloat(order?.total_discounts || '0').toFixed(2);
  const totalTax = parseFloat(order?.current_total_tax || '0').toFixed(2);

  const handleRefund = (itemId: number) => {
    // Lógica para processar o reembolso
    console.log(`Refund solicitado para o item ${itemId}`);
    toast.success(`Reembolso iniciado para o item ${itemId}`);
  };

  const handleExchange = (itemId: number) => {
    // Lógica para processar a troca
    console.log(`Exchange solicitado para o item ${itemId}`);
    toast.success(`Troca iniciada para o item ${itemId}`);
  };

  if (loading) return <p className="text-center">Carregando…</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!order) return <p className="text-center">Nenhum pedido encontrado.</p>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <img src="/logo.png" alt="iGold Logo" className="mx-auto w-40" />
        <h1 className="text-3xl font-bold">Pedido #{name}</h1>
      </div>

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
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">Variante: {item.variant_title}</p>
                  <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                  <p className="font-medium">${item.price}</p>
                  {/* Botões de Refund e Exchange, alinhados à direita */}
                  <div className="flex gap-4 mt-4 justify-end">
                    <Button onClick={() => handleRefund(item.id)} className="bg-black text-white">
                      Refund
                    </Button>
                    <Button onClick={() => handleExchange(item.id)} className="bg-black text-white">
                      Exchange
                    </Button>
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
              {parseFloat(totalDiscount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>–${totalDiscount}</span>
                </div>
              )}
              {parseFloat(totalTax) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Taxas:</span>
                  <span>${totalTax}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
