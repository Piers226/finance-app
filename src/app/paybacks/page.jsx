'use client';

import { Suspense } from 'react';
import PaybacksClientPage from './PaybacksClientPage';

export default function PaybacksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaybacksClientPage />
    </Suspense>
  );
}