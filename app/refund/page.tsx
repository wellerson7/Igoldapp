import { Suspense } from 'react';
import RefundContent from './RefundContent';

export default function RefundPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <Suspense fallback={<div>Carregando página de reembolso...</div>}>
        <RefundContent />
      </Suspense>
    </main>
  );
}