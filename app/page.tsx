'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';

type OrderSummary = {
  id: number;
  name: string;
  created_at: string;
  location_name: string;
  current_total_price: string;
};

export default function HomePage() {
  // 1) Força o PIN‐pad antes de renderizar qualquer coisa
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      signIn('credentials', { callbackUrl: window.location.href });
    },
  });

  // 3) Declarar hooks de estado antes do retorno condicional
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      setLoadingOrders(true);
      fetch('/api/shopify/orders?limit=10')
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Erro ao carregar pedidos');
          return data as OrderSummary[];
        })
        .then(setOrders)
        .catch((err) => setError(err.message))
        .finally(() => setLoadingOrders(false));
    }
  }, [status]);

  // 2) Enquanto o NextAuth carrega/verifica a sessão, mostra loader
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando…</p>
      </main>
    );
  }

  // 3) Se os pedidos ainda estão carregando
  if (loadingOrders) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Carregando pedidos…</p>
      </main>
    );
  }

  // 4) Renderiza a página quando os dados estão carregados
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <img src="/logo.png" alt="iGold Logo" className="mx-auto w-40" />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Número do pedido"
          className="flex-1 border p-3 rounded focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          onClick={() =>
            window.location.href = `/order?orderName=${encodeURIComponent(search)}`
          }
        >
          Buscar
        </Button>
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <ul className="space-y-3">
        {orders.map((o) => (
          <li
            key={o.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
          >
            <Link href={`/order?orderName=${encodeURIComponent(o.name)}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p>{o.location_name}</p>
                  <p className="font-bold">${o.current_total_price}</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}