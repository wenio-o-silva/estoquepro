import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ChevronLeft, ChevronRight, Package, DollarSign, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Reports() {
  const router = useRouter();
  const { sales, products } = useStore();

  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [timeOffset, setTimeOffset] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const specificChartRef = useRef<HTMLDivElement>(null);

  const topProducts = useMemo(() => {
    let start: Date;
    let end: Date;

    if (reportType === 'weekly') {
      start = new Date();
      start.setDate(start.getDate() - start.getDay() + (timeOffset * 7));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date();
      start.setMonth(start.getMonth() + timeOffset, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const periodSales = sales.filter(s => {
      const sd = new Date(s.date);
      return sd >= start && sd <= end;
    });

    const productCounts: Record<string, { qty: number, value: number }> = {};
    
    periodSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { qty: 0, value: 0 };
        }
        productCounts[item.productId].qty += item.qty;
        productCounts[item.productId].value += item.price * item.qty;
      });
    });

    return Object.entries(productCounts)
      .map(([productId, data]) => ({
        productId,
        product: products.find(p => p.id === productId),
        ...data
      }))
      .filter(item => item.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [sales, products, reportType, timeOffset]);

  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const pid = searchParams.get('productId');
    if (pid) {
      if (!selectedProductId) setSelectedProductId(pid);
      if (!hasScrolled) {
        setHasScrolled(true);
        setTimeout(() => {
          specificChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    } else if (!selectedProductId && topProducts.length > 0) {
      setSelectedProductId(topProducts[0].productId);
    }
  }, [topProducts, selectedProductId, hasScrolled]);

  const handleTypeChange = (type: 'weekly' | 'monthly') => {
    setReportType(type);
    setTimeOffset(0);
  };

  const chartData = useMemo(() => {
    if (reportType === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (timeOffset * 7));
      startOfWeek.setHours(0, 0, 0, 0);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const daySales = sales.filter(s => {
          const sd = new Date(s.date);
          return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
        });
        const totalValue = daySales.reduce((acc, sale) => acc + sale.total, 0);
        const totalQty = daySales.reduce((acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.qty, 0), 0);
        const specificQty = daySales.reduce((acc, s) => {
          const item = s.items.find(i => i.productId === selectedProductId);
          return acc + (item ? item.qty : 0);
        }, 0);

        days.push({
          name: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          fullDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: totalValue,
          quantity: totalQty,
          specificQty
        });
      }
      return days;
    } else {
      // Monthly view
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + timeOffset, 1);
      
      const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      
      const periods = [
        { start: 1, end: 7 },
        { start: 8, end: 14 },
        { start: 15, end: 21 },
        { start: 22, end: lastDay }
      ];

      return periods.map((period, index) => {
        let totalValue = 0;
        let totalQty = 0;
        let specificQty = 0;
        
        for (let day = period.start; day <= period.end; day++) {
          const d = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day, 12, 0, 0);
          const daySales = sales.filter(s => {
            const sd = new Date(s.date);
            return sd.getDate() === d.getDate() && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
          });
          totalValue += daySales.reduce((acc, sale) => acc + sale.total, 0);
          totalQty += daySales.reduce((acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.qty, 0), 0);
          specificQty += daySales.reduce((acc, s) => {
            const item = s.items.find(i => i.productId === selectedProductId);
            return acc + (item ? item.qty : 0);
          }, 0);
        }
        
        return {
          name: `${String(period.start).padStart(2, '0')} a ${String(period.end).padStart(2, '0')}`,
          label: `Semana ${index + 1}`,
          value: totalValue,
          quantity: totalQty,
          specificQty
        };
      });
    }
  }, [sales, timeOffset, reportType, selectedProductId]);

  const stats = useMemo(() => {
    const totalValue = chartData.reduce((acc, d) => acc + d.value, 0);
    const totalQuantity = chartData.reduce((acc, d) => acc + d.quantity, 0);
    
    let daysInPeriod = 7;
    if (reportType === 'monthly') {
      const now = new Date();
      daysInPeriod = new Date(now.getFullYear(), now.getMonth() + timeOffset + 1, 0).getDate();
    }
    
    const avgValue = totalValue / daysInPeriod;
    const avgQuantity = totalQuantity / daysInPeriod;

    const bestPeriod = [...chartData].sort((a, b) => b.value - a.value)[0];

    return {
      totalValue,
      totalQuantity,
      avgValue,
      avgQuantity,
      bestPeriod: bestPeriod ? (reportType === 'weekly' ? bestPeriod.name : bestPeriod.label) : '-'
    };
  }, [chartData, reportType, timeOffset]);

  const timeLabel = useMemo(() => {
    if (reportType === 'weekly') {
      const start = new Date();
      start.setDate(start.getDate() - start.getDay() + (timeOffset * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString('pt-BR', { month: 'short' })}`;
    } else {
      const d = new Date();
      d.setMonth(d.getMonth() + timeOffset);
      return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  }, [timeOffset, reportType]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold ml-2">Relatórios</h2>
        </div>

        {/* Time Selector */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setTimeOffset(timeOffset - 1)}
            className="p-3 rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex-1 text-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="mx-auto flex flex-col items-center justify-center outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 p-1">
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-1 hover:text-gray-900 transition-colors">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">{reportType === 'weekly' ? 'Semana' : 'Mês'}</span>
                  <ChevronDown size={14} />
                </div>
                <div className="font-bold text-lg text-gray-900 capitalize">{timeLabel}</div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 bg-white border border-gray-100 shadow-xl rounded-xl p-1 z-50">
                <DropdownMenuItem 
                  className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-gray-50 focus:text-gray-900 ${reportType === 'weekly' ? 'bg-gray-50 text-blue-900' : 'text-gray-700'}`}
                  onClick={() => handleTypeChange('weekly')}
                >
                  Visualização Semanal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-gray-50 focus:text-gray-900 ${reportType === 'monthly' ? 'bg-gray-50 text-blue-900' : 'text-gray-700'}`}
                  onClick={() => handleTypeChange('monthly')}
                >
                  Visualização Mensal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            onClick={() => setTimeOffset(timeOffset + 1)}
            disabled={timeOffset >= 0}
            className="p-3 rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 disabled:opacity-30 disabled:active:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-5 md:gap-8 pb-20 md:pb-8">
        {/* Main Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-5 md:p-6 rounded-2xl shadow-lg text-white col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <DollarSign size={20} className="md:w-6 md:h-6" />
              <span className="text-sm md:text-base">Valor Bruto</span>
            </div>
            <div className="text-3xl md:text-5xl font-bold">
              R$ {stats.totalValue.toFixed(2)}
            </div>
            <div className="text-xs md:text-sm opacity-75 mt-2">
              Total {reportType === 'weekly' ? 'da semana' : 'do mês'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-500 p-5 md:p-6 rounded-2xl shadow-lg text-white col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <Package size={20} className="md:w-6 md:h-6" />
              <span className="text-sm md:text-base">Produtos</span>
            </div>
            <div className="text-3xl md:text-5xl font-bold">{stats.totalQuantity}</div>
            <div className="text-xs md:text-sm opacity-75 mt-2">Itens vendidos</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">
          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 lg:col-span-1 h-full">
            <div className="flex items-center gap-2 text-gray-800 mb-4 md:mb-6">
              <TrendingUp size={20} className="text-blue-900 md:w-6 md:h-6" />
              <h3 className="font-bold md:text-lg">
                Resumo {reportType === 'weekly' ? 'da Semana' : 'do Mês'}
              </h3>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm md:text-base">
                  Melhor {reportType === 'weekly' ? 'dia' : 'período'}
                </span>
                <span className="font-bold text-gray-900 md:text-lg">{stats.bestPeriod}</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
                <div>
                  <div className="text-xs md:text-sm text-gray-500 mb-2">Valor (R$)</div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm md:text-base">Média diária</span>
                      <span className="font-bold text-green-600 md:text-lg">{stats.avgValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm md:text-base">Total</span>
                      <span className="font-bold text-blue-900 md:text-lg">{stats.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs md:text-sm text-gray-500 mb-2">Produtos</div>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm md:text-base">Média diária</span>
                      <span className="font-bold text-green-600 md:text-lg">{stats.avgQuantity.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm md:text-base">Total</span>
                      <span className="font-bold text-blue-900 md:text-lg">{stats.totalQuantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-5 md:gap-8">
            {/* Value Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <h3 className="text-gray-800 font-bold mb-4 md:mb-6 flex items-center gap-2 md:text-lg">
                <DollarSign size={18} className="text-blue-900 md:w-6 md:h-6" />
                Valor das Vendas
              </h3>
              <div className="h-56 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      width={50}
                    />
                    <Tooltip
                      cursor={{ fill: '#F9FAFB' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      formatter={(value: any) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                    />
                    <Bar
                      dataKey="value"
                      fill="#1E3A8A"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quantity Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <h3 className="text-gray-800 font-bold mb-4 md:mb-6 flex items-center gap-2 md:text-lg">
                <Package size={18} className="text-green-600 md:w-6 md:h-6" />
                Quantidade de Produtos Vendidos
              </h3>
              <div className="h-56 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      width={30}
                    />
                    <Tooltip
                      cursor={{ fill: '#F9FAFB' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      formatter={(value: any) => [`${value} unid.`, 'Quantidade']}
                    />
                    <Bar
                      dataKey="quantity"
                      fill="#16A34A"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Specific Product Chart */}
            <div ref={specificChartRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 scroll-mt-24">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
                <h3 className="text-gray-800 font-bold flex items-center gap-2 md:text-lg">
                  <Package size={18} className="text-purple-600 md:w-6 md:h-6" />
                  Vendas por Produto Específico
                </h3>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 w-full md:w-auto"
                >
                  <option value="" disabled>Selecione um produto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="h-56 md:h-72 w-full">
                {selectedProductId ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        width={30}
                      />
                      <Tooltip
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          padding: '12px'
                        }}
                        formatter={(value: any) => [`${value} unid.`, products.find(p => p.id === selectedProductId)?.name || 'Produto']}
                      />
                      <Bar
                        dataKey="specificQty"
                        fill="#9333EA"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm md:text-base border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    Selecione um produto acima para visualizar.
                  </div>
                )}
              </div>
            </div>

            {/* Top 10 Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-gray-100">
                <h3 className="text-gray-800 font-bold flex items-center gap-2 md:text-lg">
                  <TrendingUp size={18} className="text-blue-900 md:w-6 md:h-6" />
                  Top 10 Produtos Mais Vendidos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Produto</th>
                      <th className="px-6 py-4 text-right">Qtd. Vendida</th>
                      <th className="px-6 py-4 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                          Nenhuma venda no período
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {item.product?.name}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-900 font-bold px-2.5 py-1 rounded-lg">
                              {item.qty} un
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            R$ {item.value.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
