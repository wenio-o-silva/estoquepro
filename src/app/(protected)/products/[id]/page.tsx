import { ProductEdit } from '@/screens/Products/ProductEdit';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ProductEdit id={resolvedParams.id} />;
}
