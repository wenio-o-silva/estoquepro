import { Suspense } from 'react';
import { ProductEdit } from '@/screens/Products/ProductEdit';

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProductEdit />
    </Suspense>
  );
}
