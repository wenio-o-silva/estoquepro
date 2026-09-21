import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Sale } from '@/types';

export function SalesHistory() {
  const router = useRouter();
  const { sales, products } = useStore();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getOrderName = (sale: Sale) => {
    if (sale.items.length === 0) return `Pedido #${sale.id.substring(0, 4)}`;
    const product = products.find(p => p.id === sale.items[0].productId);
    const name = product ? product.name : `Pedido #${sale.id.substring(0, 4)}`;
    const displayName = name.length > 25 ? name.substring(0, 25) + '...' : name;
    
    if (sale.items.length > 1) {
      return `${displayName} (+${sale.items.length - 1})`;
    }
    return displayName;
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="flex items-center p-4 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Histórico de Vendas</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        {sortedSales.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 md:mt-20 md:text-lg">
            Nenhuma venda registrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSales.map(sale => {
              const isExpanded = expandedId === sale.id;

              return (
                <div 
                  key={sale.id} 
                  onClick={() => toggleExpand(sale.id)}
                  className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-900 shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 md:text-lg">{getOrderName(sale)}</h3>
                        <p className="text-xs md:text-sm text-gray-500">
                          {new Date(sale.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="block font-bold text-blue-900 md:text-xl">R$ {sale.total.toFixed(2)}</span>
                      <div className="flex items-center gap-1 text-gray-400 mt-1">
                        <span className="text-xs md:text-sm">{sale.items.length} itens</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Itens do Pedido</h4>
                      {sale.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm text-gray-600">
                            <span className="font-medium truncate mr-2">{item.qty}x {product ? product.name : 'Produto não encontrado'}</span>
                            <span className="font-bold whitespace-nowrap">R$ {(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
