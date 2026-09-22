import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowUpRight, ArrowDownRight, Plus, Settings, X } from 'lucide-react';
import { toast } from 'sonner';

export function Stock() {
  const router = useRouter();
  const { movements, products, currentUser, updateUser } = useStore();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') === 'low_stock' ? 'low_stock' : 'movements';
  const [tab, setTab] = useState<'movements' | 'low_stock'>(initialTab);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [thresholdValue, setThresholdValue] = useState('');

  // Sort movements by date desc
  const sortedMovements = [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const threshold = currentUser?.lowStockThreshold ?? 5;
  const lowStockProducts = products.filter(p => p.stock < threshold);

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Produto Excluído';

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 md:p-8 bg-white/80 backdrop-blur-md shadow-sm shrink-0 flex gap-2 z-10 sticky top-0 md:bg-transparent md:backdrop-blur-none md:shadow-none">
        <div className="flex gap-2 w-full max-w-2xl mx-auto md:mx-0">
          <button 
            onClick={() => setTab('movements')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm md:text-base transition-colors ${tab === 'movements' ? 'bg-blue-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            Movimentações
          </button>
          <button 
            onClick={() => setTab('low_stock')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm md:text-base transition-colors flex items-center justify-center gap-2 ${tab === 'low_stock' ? 'bg-red-100 text-red-700 shadow-sm border border-red-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            Estoque Baixo
            {lowStockProducts.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {lowStockProducts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:px-8 pb-24 md:pb-8">
        {tab === 'low_stock' && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-gray-600 font-medium">Produtos precisando de atenção</h2>
            <button 
              onClick={() => {
                setThresholdValue(threshold.toString());
                setIsConfigOpen(true);
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              <Settings size={16} />
              <span className="hidden md:inline">Configurar Limite</span>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tab === 'movements' ? (
            sortedMovements.map(m => (
              <div 
                key={m.id} 
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${m.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {m.type === 'in' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm md:text-base">{getProductName(m.productId)}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{new Date(m.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-lg shrink-0 ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'in' ? '+' : '-'}{m.qty}
                  </span>
                </div>
                
                {expandedId === m.id && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    {m.reason ? (
                      <p className="text-gray-600"><span className="font-bold text-gray-700">Motivo:</span> {m.reason}</p>
                    ) : (
                      <p className="text-gray-400 italic">Nenhum motivo registrado.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            lowStockProducts.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-800 md:text-lg">{p.name}</h3>
                  <div className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                    {p.stock} un
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/stock/new?productId=${p.id}`)}
                  className="w-full text-center text-sm md:text-base text-blue-600 font-medium py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Repor Estoque
                </button>
              </div>
            ))
          )}
        </div>
        
        {tab === 'movements' && sortedMovements.length === 0 && (
          <div className="text-center text-gray-500 mt-20 text-lg">
            Nenhuma movimentação registrada.
          </div>
        )}
        {tab === 'low_stock' && lowStockProducts.length === 0 && (
          <div className="text-center text-gray-500 mt-20 text-lg">
            Todos os produtos estão com estoque regular.
          </div>
        )}
      </div>

      <button
        onClick={() => router.push('/stock/new')}
        className="fixed md:absolute bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors z-20"
      >
        <Plus size={28} />
      </button>

      {/* Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Alerta de Estoque Baixo</h3>
              <button onClick={() => setIsConfigOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Avisar quando o estoque for menor que:</label>
              <input 
                type="number" 
                min="1"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-xs text-gray-500 mt-2">Atualmente o sistema te avisa quando um produto tem menos de {threshold} unidades.</p>
            </div>

            <div className="p-5 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  const val = parseInt(thresholdValue);
                  if (!isNaN(val) && val > 0 && currentUser) {
                    try {
                      await updateUser(currentUser.id, { lowStockThreshold: val });
                      toast.success('Limite atualizado!');
                      setIsConfigOpen(false);
                    } catch (e: any) {
                      console.error("Update User Error:", e);
                      toast.error('Erro ao atualizar limite: ' + (e.message || 'Desconhecido'));
                    }
                  } else {
                    toast.error('Valor inválido.');
                  }
                }}
                className="flex-1 bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
