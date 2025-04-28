import { Suspense } from 'react';
import { ExchangeContent } from './ExchangeContent';

export default function ExchangePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Trocar Produto</h1>
      <Suspense fallback={<div>Carregando troca...</div>}>
        <ExchangeContent />
      </Suspense>
    </div>
  );
}
