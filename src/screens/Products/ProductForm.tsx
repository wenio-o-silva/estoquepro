import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft } from 'lucide-react';

export function ProductForm() {
  const router = useRouter();
  const { addProduct } = useStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const handlePriceBlur = () => {
    if (price) {
      const numeric = parseFloat(price.replace(',', '.'));
      if (!isNaN(numeric)) {
        setPrice(numeric.toFixed(2));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    addProduct({
      name,
      price: parseFloat(price.replace(',', '.')),
      stock: parseInt(stock) || 0
    });
    router.push('/products');
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center p-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Novo Produto</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 md:gap-8 flex-1 pb-24 md:pb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Nome do Produto</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                placeholder="Ex: Capinha Silicone"
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
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Quantidade Inicial</label>
              <input
                type="number"
                value={stock}
                onChange={e => setStock(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                placeholder="0"
              />
            </div>
          </form>

          <div className="p-4 md:p-8 bg-white md:bg-transparent border-t border-gray-100 md:border-none absolute md:relative bottom-0 left-0 right-0 z-10">
            <button 
              onClick={handleSubmit}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
              Salvar Produto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
