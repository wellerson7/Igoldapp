'use client';

import { Suspense } from 'react';
import SummaryContent from './SummaryContent';

export default function SummaryPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading summary...</div>}>
        <SummaryContent />
      </Suspense>
    </main>
  );
}