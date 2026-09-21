import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

type MovementType = 'in' | 'out';

export function StockEntry() {
  const router = useRouter();
  const { products, addStockEntry } = useStore();

  const [movementType, setMovementType] = useState<MovementType>('in');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    // Read the productId query param without causing Suspense warnings in Server Components
    const searchParams = new URLSearchParams(window.location.search);
    const pid = searchParams.get('productId');
    if (pid) {
      setProductId(pid);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !qty) return;

    const quantity = parseInt(qty, 10);
    const finalQuantity = movementType === 'in' ? quantity : -quantity;

    addStockEntry(productId, finalQuantity, reason);
    router.push('/stock');
  };

  const isEntry = movementType === 'in';

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center p-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Ajuste de Estoque</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 md:gap-8 flex-1 pb-24 md:pb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-3 md:text-lg">Tipo de Movimentação</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('in')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold transition-all md:text-lg ${
                    movementType === 'in'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-white md:bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Plus size={20} />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('out')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-bold transition-all md:text-lg ${
                    movementType === 'out'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white md:bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Minus size={20} />
                  Saída
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Produto</label>
              <select
                value={productId}
                onChange={e => setProductId(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                required
              >
                <option value="" disabled>Selecione um produto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Estoque atual: {p.stock})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">
                {isEntry ? 'Quantidade a Adicionar' : 'Quantidade a Remover'}
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm md:shadow-none"
                placeholder="Ex: 10"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">
                Motivo {!isEntry && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                placeholder={isEntry ? "Ex: Compra de fornecedor" : "Ex: Produto quebrado, perdido, ajuste manual"}
                required={!isEntry}
              />
            </div>
          </form>

          <div className="p-4 md:p-8 bg-white md:bg-transparent border-t border-gray-100 md:border-none absolute md:relative bottom-0 left-0 right-0 z-10">
            <button
              onClick={handleSubmit}
              disabled={!productId || !qty || (!isEntry && !reason)}
              className={`w-full disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-sm ${
                isEntry
                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600 active:bg-red-600'
              }`}
            >
              {isEntry ? 'Confirmar Entrada' : 'Confirmar Saída'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
