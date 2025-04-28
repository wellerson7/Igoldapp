'use client';

import { useSearchParams } from 'next/navigation';

export default function SummaryContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Summary Page</h1>
      {orderId ? (
        <p>
          Showing summary for Order ID: <strong>{orderId}</strong>
        </p>
      ) : (
        <p>No order ID provided.</p>
      )}
    </div>
  );
}