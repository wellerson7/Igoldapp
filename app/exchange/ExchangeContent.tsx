'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Fuse from 'fuse.js';
import { toast } from 'sonner';

interface LineItem {
  id: number;
  name: string;
  variant_title: string;
  quantity: number;
  price: string;
  image?: { src: string };
}

interface Variant {
  image: string;
  id: string;
  title: string;
  price: number;
  sku: string;
}

interface OrderDetail {
  id: number;
  name: string;
  line_items: LineItem[];
}

export function ExchangeContent() {
  const { data: session } = useSession();
  const params = useSearchParams();
  const orderName = params.get('orderName')?.replace('#', '') || '';

  const [step, setStep] = useState(1);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Variant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fuse = new Fuse(variants, { keys: ['title', 'sku'], threshold: 0.3 });

  useEffect(() => {
    if (!orderName) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const orderResponse = await fetch(`/api/shopify/orders?orderName=${encodeURIComponent(orderName)}`);
        if (!orderResponse.ok) throw new Error('Erro ao buscar pedido');
        const orderData = await orderResponse.json();
        setOrder(orderData);

        const variantsResponse = await fetch('/api/shopify/variants');
        if (!variantsResponse.ok) throw new Error('Erro ao buscar produtos');
        const variantsData = await variantsResponse.json();
        setVariants(variantsData);

      } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Erro ao buscar dados');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderName]);

  const filteredVariants = searchQuery
    ? fuse.search(searchQuery).map((result) => result.item)
    : variants;

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar produto por nome ou SKU"
        className="w-full p-2 border border-gray-300 rounded mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredVariants.map((variant) => (
          <Card key={variant.id} onClick={() => setSelectedProduct(variant)} className="cursor-pointer">
            <CardContent className="flex flex-col items-center p-4">
              <Image
                src={variant.image || '/placeholder.jpg'}
                alt={variant.title}
                width={100}
                height={100}
                className="mb-2"
              />
              <p className="font-semibold text-center">{variant.title}</p>
              <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
              <p className="text-sm text-gray-700">R$ {variant.price.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProduct && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center">
          <Button onClick={() => toast.success(`Produto selecionado: ${selectedProduct.title}`)}>
            Confirmar troca: {selectedProduct.title}
          </Button>
        </div>
      )}
    </>
  );
}
