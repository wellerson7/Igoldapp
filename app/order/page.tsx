import { Suspense } from 'react';
import { OrderContent } from './OrderContent'; // Certifique-se do caminho correto

export default function OrderPage() {
  return (
    <Suspense fallback={<div>Carregando página do pedido...</div>}>
      <OrderContent />
    </Suspense>
  );
}