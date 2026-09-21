'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export function FinancialHistory() {
  const router = useRouter();
  const { sales, expenses, currentUser } = useStore();

  const getCycleRange = (offset: number) => {
    const closingDay = currentUser?.financialClosingDay || 1;
    const now = new Date();
    
    let startMonth = now.getMonth();
    let startYear = now.getFullYear();
    
    if (now.getDate() < closingDay) {
      startMonth -= 1;
      if (startMonth < 0) {
        startMonth = 11;
        startYear -= 1;
      }
    }
    
    startMonth += offset;
    startYear += Math.floor(startMonth / 12);
    startMonth = ((startMonth % 12) + 12) % 12;
    
    const start = new Date(startYear, startMonth, closingDay);
    start.setHours(0, 0, 0, 0);
    
    let endMonth = startMonth + 1;
    let endYear = startYear;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
    
    const end = new Date(endYear, endMonth, closingDay);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  const getCycleName = (offset: number) => {
    if (offset === 0) return 'Mês Atual';
    const { start } = getCycleRange(offset);
    return start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  };

  const historyData = useMemo(() => {
    const months = [];
    // Last 6 months: 0 to -5
    for (let i = 0; i >= -5; i--) {
      const { start, end } = getCycleRange(i);
      
      const periodSalesTotal = sales
        .filter(s => {
          const d = new Date(s.date);
          return d >= start && d <= end;
        })
        .reduce((acc, s) => acc + s.total, 0);

      const periodExpensesTotal = expenses
        .filter(e => {
          const d = new Date(e.dueDate);
          return d >= start && d <= end;
        })
        .reduce((acc, e) => acc + e.value, 0);

      const netBalance = periodSalesTotal - periodExpensesTotal;

      months.push({
        name: getCycleName(i),
        period: `${start.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} a ${end.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}`,
        incomes: periodSalesTotal,
        expenses: periodExpensesTotal,
        profit: netBalance
      });
    }
    return months;
  }, [sales, expenses, currentUser?.financialClosingDay]);

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-900 rounded-lg font-bold text-lg">
              <DollarSign size={18} />
            </span>
            <h2 className="text-xl font-bold">Histórico (6 Meses)</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm md:text-base text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium text-xs md:text-sm uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Período</th>
                    <th className="px-6 py-4 text-right">Entradas</th>
                    <th className="px-6 py-4 text-right">Saídas</th>
                    <th className="px-6 py-4 text-right">Lucro Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyData.map((data, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{data.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{data.period}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-gray-900 font-medium">
                          <TrendingUp size={14} className="text-green-500" />
                          R$ {data.incomes.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-gray-900 font-medium">
                          <TrendingDown size={14} className="text-red-500" />
                          R$ {data.expenses.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center justify-center font-bold px-3 py-1.5 rounded-lg ${
                          data.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          R$ {data.profit.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
