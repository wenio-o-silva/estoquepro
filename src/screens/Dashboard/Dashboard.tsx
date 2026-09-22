import React from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, PackageOpen, AlertTriangle, TrendingUp, Plus } from 'lucide-react';

export function Dashboard() {
  const router = useRouter();
  const { sales, products, currentUser } = useStore();
  const [activeTooltip, setActiveTooltip] = React.useState<number | null>(null);

  const today = new Date();
  const todaySales = sales.filter(s => {
    const sd = new Date(s.date);
    return sd.getDate() === today.getDate() && sd.getMonth() === today.getMonth() && sd.getFullYear() === today.getFullYear();
  });
  const todayTotal = todaySales.reduce((acc, sale) => acc + sale.total, 0);

  const last7DaysData = React.useMemo(() => {
    const data = [];
    let maxValue = 0;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const daySales = sales.filter(s => {
        const sd = new Date(s.date);
        return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      const total = daySales.reduce((acc, sale) => acc + sale.total, 0);
      
      if (total > maxValue) maxValue = total;
      
      data.push({
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).replace('.', ''),
        total
      });
    }
    
    return { data, maxValue: maxValue || 1 };
  }, [sales]);

  const threshold = currentUser?.lowStockThreshold ?? 5;
  const lowStockCount = products.filter(p => p.stock < threshold).length;
  const totalProducts = products.length;

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto">
      {/* Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {currentUser?.role === 'admin' && (
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-blue-900">
              <TrendingUp size={20} />
              <span className="font-medium text-sm md:text-base">Vendas Hoje</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold">R$ {todayTotal.toFixed(2)}</span>
            <span className="text-xs md:text-sm text-gray-500">{todaySales.length} pedidos</span>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-900">
            <PackageOpen size={20} />
            <span className="font-medium text-sm md:text-base">Produtos</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold">{totalProducts}</span>
          <span className="text-xs md:text-sm text-gray-500">cadastrados</span>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 p-4 md:p-6 rounded-2xl shadow-sm border border-red-100 flex items-center justify-between cursor-pointer hover:bg-red-100 transition-colors" onClick={() => router.push('/stock?tab=low_stock')}>
          <div className="flex items-center gap-3 md:gap-4 text-red-600">
            <AlertTriangle size={24} className="md:w-8 md:h-8" />
            <div>
              <h3 className="font-bold md:text-lg">Estoque Baixo</h3>
              <p className="text-sm md:text-base text-red-500">{lowStockCount} produtos precisando de atenção</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-2">
        <h3 className="text-gray-500 font-medium mb-3 px-1 md:text-lg">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <button 
            onClick={() => router.push('/sales/new')}
            className="bg-blue-900 text-white p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:bg-blue-800 transition-colors"
          >
            <div className="bg-white/20 p-3 md:p-4 rounded-full">
              <ShoppingBag size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="font-medium md:text-lg">Nova Venda</span>
          </button>
          
          <button 
            onClick={() => router.push('/products/new')}
            className="bg-white border-2 border-blue-900 text-blue-900 p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm hover:bg-blue-50 transition-colors"
          >
            <div className="bg-blue-100 p-3 md:p-4 rounded-full">
              <Plus size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="font-medium md:text-lg">Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Mini Graph (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <div className="mt-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium mb-4">Vendas dos Últimos 7 Dias</h3>
          
          <div className="h-32 flex items-end justify-between gap-2">
            {last7DaysData.data.map((d, i) => {
              const h = (d.total / last7DaysData.maxValue) * 100;
              return (
                <div 
                  key={i} 
                  className="w-full h-full bg-blue-100 rounded-t-sm flex flex-col justify-end group relative cursor-pointer"
                  onMouseEnter={() => setActiveTooltip(i)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setActiveTooltip(activeTooltip === i ? null : i)}
                >
                  {/* Tooltip on hover/click */}
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity pointer-events-none whitespace-nowrap z-10 ${activeTooltip === i ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                    R$ {d.total.toFixed(2)}
                  </div>
                  <div className="bg-blue-900 w-full rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            {last7DaysData.data.map((d, i) => (
              <span key={i} className="flex-1 text-center capitalize">{d.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
