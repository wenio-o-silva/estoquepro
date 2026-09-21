'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft, Trash2 } from 'lucide-react';

export function ProductEdit({ id }: { id: string }) {
  const router = useRouter();
  const { products, updateProduct } = useStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const product = products.find(p => p.id === id);
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setLoading(false);
    } else if (products.length > 0) {
      // Products loaded but not found -> perhaps deleted or invalid ID
      router.push('/products');
    }
  }, [products, id, router]);

  const handlePriceBlur = () => {
    if (price) {
      const numeric = parseFloat(price.replace(',', '.'));
      if (!isNaN(numeric)) {
        setPrice(numeric.toFixed(2));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    await updateProduct(id, {
      name,
      price: parseFloat(price.replace(',', '.'))
    });
    router.push('/products');
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Tem certeza que deseja excluir este produto? Ele continuará aparecendo no histórico de vendas passadas, mas não poderá mais ser vendido.");
    if (confirm) {
      await updateProduct(id, { deleted: true });
      router.push('/products');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center p-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Configurações do Produto</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 md:gap-8 flex-1 pb-40 md:pb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Nome do Produto</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                onBlur={handlePriceBlur}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                required
              />
            </div>
            
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button 
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 text-red-600 font-bold py-4 rounded-xl text-lg hover:bg-red-50 border border-red-200 transition-colors shadow-sm"
              >
                <Trash2 size={20} /> Excluir Produto
              </button>
              <p className="text-xs text-center text-gray-400 mt-3 px-4">
                A exclusão ocultará o produto do estoque, mas não apagará o histórico financeiro.
              </p>
            </div>
          </form>

          <div className="p-4 md:p-8 bg-white md:bg-transparent border-t border-gray-100 md:border-none absolute md:relative bottom-0 left-0 right-0 z-10">
            <button 
              onClick={handleSubmit}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
