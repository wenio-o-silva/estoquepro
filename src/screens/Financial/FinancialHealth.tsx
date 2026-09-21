'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { Expense } from '@/types';
import { 
  ArrowLeft, Plus, CheckCircle2, Circle, MoreVertical, 
  TrendingUp, TrendingDown, DollarSign, Calendar, X, Settings 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FinancialHealth() {
  const router = useRouter();
  const { sales, expenses, currentUser, addExpense, updateExpense, deleteExpense, updateUser } = useStore();

  const [period, setPeriod] = useState<string>('0');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  
  // Expenses Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'ALTA' | 'NORMAL' | 'BAIXA'>('NORMAL');
  const [recurring, setRecurring] = useState(false);

  // Automation state
  const [hasProcessedRecurring, setHasProcessedRecurring] = useState(false);

  // Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configDay, setConfigDay] = useState('');

  // --- Date Range Calculation ---
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
    return start.toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());
  };

  // --- Recurring Automation ---
  useEffect(() => {
    if (expenses.length > 0 && !hasProcessedRecurring && currentUser) {
      setHasProcessedRecurring(true);
      
      const cycleEnd = getCycleRange(0).end;

      const recurringGroups = expenses.reduce((acc, exp) => {
        if (exp.recurring && exp.recurringId) {
          if (!acc[exp.recurringId]) acc[exp.recurringId] = [];
          acc[exp.recurringId].push(exp);
        }
        return acc;
      }, {} as Record<string, Expense[]>);

      Object.values(recurringGroups).forEach(group => {
        const latestExpense = group.reduce((latest, current) => 
          new Date(current.dueDate) > new Date(latest.dueDate) ? current : latest
        , group[0]);

        let nextDueDate = new Date(latestExpense.dueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        const promises: Promise<void>[] = [];
        
        while (nextDueDate <= cycleEnd) {
          promises.push(
            addExpense({
              title: latestExpense.title,
              value: latestExpense.value,
              dueDate: nextDueDate.toISOString(),
              priority: latestExpense.priority,
              status: 'PENDENTE',
              recurring: true,
              recurringId: latestExpense.recurringId
            })
          );
          nextDueDate = new Date(nextDueDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }
        
        if (promises.length > 0) {
          Promise.all(promises).catch(console.error);
        }
      });
    }
  }, [expenses, hasProcessedRecurring, currentUser]);

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      const start = customStart ? new Date(customStart + 'T00:00:00') : new Date();
      const end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
      if (!customStart) start.setHours(0,0,0,0);
      if (!customEnd) end.setHours(23,59,59,999);
      return { start, end };
    }
    return getCycleRange(parseInt(period));
  }, [period, customStart, customEnd, currentUser?.financialClosingDay]);

  const periodSalesTotal = useMemo(() => {
    return sales
      .filter(s => {
        const d = new Date(s.date);
        return d >= dateRange.start && d <= dateRange.end;
      })
      .reduce((acc, s) => acc + s.total, 0);
  }, [sales, dateRange]);

  const periodExpensesTotal = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.dueDate);
        return d >= dateRange.start && d <= dateRange.end;
      })
      .reduce((acc, e) => acc + e.value, 0);
  }, [expenses, dateRange]);

  const netBalance = periodSalesTotal - periodExpensesTotal;

  // --- Lists ---
  const pendingExpenses = expenses.filter(e => e.status === 'PENDENTE');

  const paidExpenses = expenses.filter(e => {
    if (e.status !== 'PAGO') return false;
    const d = new Date(e.dueDate);
    return d >= dateRange.start && d <= dateRange.end;
  }).sort((a, b) => {
    const da = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
    const db = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
    return db - da;
  });

  // --- Expense Actions ---
  const handleOpenModal = (exp?: Expense) => {
    if (exp) {
      setEditingExpense(exp);
      setTitle(exp.title);
      setValue(exp.value.toFixed(2));
      setDueDate(exp.dueDate.split('T')[0]);
      setPriority(exp.priority);
      setRecurring(exp.recurring || false);
    } else {
      setEditingExpense(null);
      setTitle('');
      setValue('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('NORMAL');
      setRecurring(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handlePriceBlur = () => {
    if (value) {
      const numeric = parseFloat(value.replace(',', '.'));
      if (!isNaN(numeric)) {
        setValue(numeric.toFixed(2));
      }
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !value || !dueDate) return;

    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue)) {
      toast.error('Valor inválido.');
      return;
    }

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

    try {
      if (editingExpense) {
        const updateData: Partial<Expense> = {
          title,
          value: numericValue,
          dueDate: new Date(dueDate + 'T12:00:00').toISOString(),
          priority,
          recurring,
        };
        if (recurring) {
          updateData.recurringId = editingExpense.recurringId || generateId();
        } else {
          updateData.recurringId = null as any;
        }

        await updateExpense(editingExpense.id, updateData);
        toast.success('Despesa atualizada!');
      } else {
        const newData: Omit<Expense, 'id'> = {
          title,
          value: numericValue,
          dueDate: new Date(dueDate + 'T12:00:00').toISOString(),
          priority,
          status: 'PENDENTE',
          recurring,
        };
        if (recurring) {
          newData.recurringId = generateId();
        }

        await addExpense(newData);
        toast.success('Despesa adicionada!');
      }
      handleCloseModal();
    } catch (err) {
      console.error("Erro ao salvar despesa:", err);
      toast.error('Erro ao salvar despesa.');
    }
  };

  const handleToggleStatus = async (exp: Expense) => {
    try {
      const isPending = exp.status === 'PENDENTE';
      await updateExpense(exp.id, {
        status: isPending ? 'PAGO' : 'PENDENTE',
        paymentDate: isPending ? new Date().toISOString() : undefined
      });
      toast.success(isPending ? 'Marcado como pago!' : 'Retornado para pendente!');
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await deleteExpense(id);
        toast.success('Despesa excluída!');
        handleCloseModal();
      } catch (err) {
        toast.error('Erro ao excluir.');
      }
    }
  };

  // --- Config Actions ---
  const handleOpenConfig = () => {
    setConfigDay((currentUser?.financialClosingDay || 1).toString());
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!currentUser) return;
    const day = parseInt(configDay);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error('Dia inválido.');
      return;
    }
    try {
      await updateUser(currentUser.id, { financialClosingDay: day });
      toast.success('Dia de fechamento salvo com sucesso!');
      setIsConfigModalOpen(false);
    } catch (err) {
      toast.error('Erro ao salvar configuração.');
    }
  };

  const getPriorityColor = (p: string) => {
    if (p === 'ALTA') return 'bg-red-500';
    if (p === 'NORMAL') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getPriorityLabel = (p: string) => {
    if (p === 'ALTA') return 'Alta';
    if (p === 'NORMAL') return 'Normal';
    return 'Baixa';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-900 rounded-lg font-bold text-lg">R$</span>
            <h2 className="text-xl font-bold">Raio-X Financeiro</h2>
          </div>
        </div>

        {/* Resumo Dashboard */}
        <div className="p-4 bg-gray-50/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/financial/history')}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <Calendar size={14} />
                Histórico de 6 Meses
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenConfig}
                className="p-2 text-gray-400 hover:text-blue-900 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                title="Configurar Dia de Fechamento"
              >
                <Settings size={18} />
              </button>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="text-sm font-bold bg-white border border-gray-200 text-blue-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
              >
                <option value="0">{getCycleName(0)}</option>
                <option value="-1">{getCycleName(-1)}</option>
                <option value="-2">{getCycleName(-2)}</option>
                <option value="-3">{getCycleName(-3)}</option>
                <option value="custom">Personalizado...</option>
              </select>
            </div>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Início</label>
                <input 
                  type="date" 
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Fim</label>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-xs font-bold uppercase">Entradas</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-gray-900">R$ {periodSalesTotal.toFixed(2)}</div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingDown size={16} className="text-red-500" />
                <span className="text-xs font-bold uppercase">Saídas</span>
              </div>
              <div className="text-lg md:text-xl font-bold text-gray-900">R$ {periodExpensesTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className={`p-5 rounded-xl shadow-sm border ${netBalance >= 0 ? 'bg-green-600 border-green-700' : 'bg-red-500 border-red-600'} text-white`}>
            <div className="flex items-center gap-2 mb-1 opacity-90">
              <DollarSign size={18} />
              <span className="text-sm font-bold uppercase">Saldo Líquido</span>
            </div>
            <div className="text-3xl md:text-4xl font-bold">
              R$ {netBalance.toFixed(2)}
            </div>
            <div className="text-xs mt-2 opacity-80">
              Período: {dateRange.start.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} a {dateRange.end.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-2 ${activeTab === 'pending' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors border-b-2 ${activeTab === 'history' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            Histórico Pago
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {activeTab === 'pending' && (
            <>
              {pendingExpenses.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  Nenhuma despesa pendente! 🎉
                </div>
              ) : (
                pendingExpenses.map(exp => (
                  <ExpenseCard 
                    key={exp.id} 
                    expense={exp} 
                    onToggle={() => handleToggleStatus(exp)} 
                    onEdit={() => handleOpenModal(exp)} 
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {paidExpenses.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  Nenhuma despesa paga ainda.
                </div>
              ) : (
                paidExpenses.map(exp => (
                  <ExpenseCard 
                    key={exp.id} 
                    expense={exp} 
                    onToggle={() => handleToggleStatus(exp)} 
                    onEdit={() => handleOpenModal(exp)} 
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* FAB */}
      <button 
        onClick={() => handleOpenModal()}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-800 transition-transform active:scale-95 z-20"
      >
        <Plus size={28} />
      </button>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between p-4 z-10">
              <h3 className="font-bold text-lg text-gray-900">{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-4 md:p-6 flex flex-col gap-5">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Título da Despesa</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
                  placeholder="Ex: Conta de Luz, Fornecedor X"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onBlur={handlePriceBlur}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Data de Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
                >
                  <option value="ALTA">Alta (Urgente)</option>
                  <option value="NORMAL">Normal</option>
                  <option value="BAIXA">Baixa</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={e => setRecurring(e.target.checked)}
                  className="w-5 h-5 text-blue-900 bg-white border-blue-200 rounded focus:ring-blue-900 focus:ring-2"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-blue-900 cursor-pointer">
                  Repetir todo mês (Despesa Recorrente)
                </label>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                <button 
                  type="submit"
                  className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Salvar
                </button>
                {editingExpense && (
                  <button 
                    type="button"
                    onClick={() => handleDelete(editingExpense.id)}
                    className="w-full bg-white text-red-500 border border-red-200 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Excluir Despesa
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm m-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-900">Configuração do Mês</h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Seu mês de faturamento vai de que dia a que dia? (ex: 05)
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dia de Início/Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={configDay}
                onChange={e => setConfigDay(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
                placeholder="Ex: 5"
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveConfig}
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

function ExpenseCard({ 
  expense, 
  onToggle, 
  onEdit, 
  getPriorityColor,
  getPriorityLabel
}: { 
  expense: Expense, 
  onToggle: () => void, 
  onEdit: () => void,
  getPriorityColor: (p: string) => string,
  getPriorityLabel: (p: string) => string
}) {
  const isPaid = expense.status === 'PAGO';

  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm border ${isPaid ? 'border-green-200 bg-green-50/30' : 'border-gray-100'} flex items-center justify-between gap-4 transition-all hover:shadow-md`}>
      <button 
        onClick={onToggle}
        className="shrink-0 flex items-center justify-center transition-transform active:scale-90"
      >
        {isPaid ? (
          <CheckCircle2 size={28} className="text-green-500" />
        ) : (
          <Circle size={28} className="text-gray-300 hover:text-blue-900" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(expense.priority)}`} title={`Prioridade ${getPriorityLabel(expense.priority)}`} />
          <h4 className={`font-bold text-gray-900 truncate ${isPaid ? 'line-through text-gray-500' : ''}`}>
            {expense.title}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Vence: {new Date(expense.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          </div>
          {isPaid && expense.paymentDate && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 size={12} />
              <span>Pago: {new Date(expense.paymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={`font-bold ${isPaid ? 'text-gray-400' : 'text-gray-900'} text-lg`}>
          R$ {expense.value.toFixed(2)}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full outline-none">
            <MoreVertical size={20} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-100 shadow-xl rounded-xl p-1 z-50">
            <DropdownMenuItem 
              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium focus:bg-gray-50 focus:text-blue-900 text-gray-700 outline-none"
              onClick={onEdit}
            >
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
