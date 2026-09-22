'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft, BookOpen, User as UserIcon, MessageCircle, DollarSign, X, Edit2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type CustomerDebt = {
  name: string;
  phone: string;
  totalDebt: number;
  expectedDate?: string;
};

export function Notebook() {
  const router = useRouter();
  const { sales, updateSale, currentUser } = useStore();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDebt, setEditDebt] = useState<number | ''>('');

  const pendingSales = useMemo(() => {
    return sales.filter(s => s.status === 'PENDENTE' && s.paymentMethod === 'FIADO' && s.customerName);
  }, [sales]);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerDebt>();

    pendingSales.forEach(sale => {
      const name = sale.customerName!;
      const phone = sale.customerPhone || '';
      
      const totalPaidAlready = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
      const debt = sale.total - totalPaidAlready;

      if (debt > 0) {
        if (!map.has(name)) {
          map.set(name, { name, phone, totalDebt: 0, expectedDate: sale.expectedPaymentDate });
        }
        const customer = map.get(name)!;
        customer.totalDebt += debt;
        if (phone && !customer.phone) customer.phone = phone; // Keep first available phone
        if (sale.expectedPaymentDate) {
          // Keep the earliest expected date
          if (!customer.expectedDate || new Date(sale.expectedPaymentDate) < new Date(customer.expectedDate)) {
            customer.expectedDate = sale.expectedPaymentDate;
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [pendingSales]);

  const handleOpenEdit = (customer: CustomerDebt) => {
    setSelectedCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditDate(customer.expectedDate ? customer.expectedDate.split('T')[0] : '');
    setEditDebt(customer.totalDebt);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCustomer) return;
    if (!editName.trim()) {
      toast.error('O nome não pode ser vazio.');
      return;
    }

    const customerSales = pendingSales.filter(s => s.customerName === selectedCustomer.name);
    
    // Batch update standard fields
    const promises = customerSales.map(sale => {
      const updateData: any = { customerName: editName.trim() };
      if (editPhone.trim()) {
        updateData.customerPhone = editPhone.trim();
      } else {
        // If they cleared the phone, we should remove it, but passing undefined will crash Firebase.
        // For now, if it's empty, we just pass an empty string instead of undefined.
        updateData.customerPhone = '';
      }

      if (editDate) {
        updateData.expectedPaymentDate = new Date(editDate + 'T12:00:00').toISOString();
      } else {
        updateData.expectedPaymentDate = '';
      }

      return updateSale(sale.id, updateData);
    });

    await Promise.all(promises);

    // Adjust total debt if it was manually edited
    const newDebtVal = typeof editDebt === 'string' ? parseFloat(editDebt.toString()) : editDebt;
    if (!isNaN(newDebtVal) && newDebtVal >= 0 && newDebtVal !== selectedCustomer.totalDebt) {
      const diff = newDebtVal - selectedCustomer.totalDebt;
      // Get the latest sale to apply the diff
      const sortedByLatest = [...customerSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortedByLatest.length > 0) {
        const latestSale = sortedByLatest[0];
        // We adjust the total price of the sale to reflect the new debt balance.
        // It's the simplest way to force the debt up or down without affecting existing payments.
        const newTotal = Math.max(0, latestSale.total + diff);
        await updateSale(latestSale.id, { total: newTotal });
      }
    }

    toast.success('Informações atualizadas!');
    setIsEditModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleOpenPayment = (customer: CustomerDebt) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.totalDebt); // Default to full payment
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedCustomer) return;
    const amount = typeof paymentAmount === 'string' ? parseFloat(paymentAmount.toString()) : paymentAmount;
    if (isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }

    if (amount > selectedCustomer.totalDebt) {
      toast.error('O valor não pode ser maior que a dívida atual.');
      return;
    }

    const customerSales = pendingSales
      .filter(s => s.customerName === selectedCustomer.name)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingAmount = amount;
    
    for (const sale of customerSales) {
      if (remainingAmount <= 0) break;
      
      const totalPaidAlready = (sale.payments || []).reduce((acc, p) => acc + p.amount, 0);
      const debt = sale.total - totalPaidAlready;
      
      if (debt > 0) {
        const paymentForThisSale = Math.min(debt, remainingAmount);
        
        const newPayment = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          amount: paymentForThisSale,
          date: new Date().toISOString()
        };
        
        const updatedPayments = [...(sale.payments || []), newPayment];
        const newTotalPaid = totalPaidAlready + paymentForThisSale;
        const newStatus = newTotalPaid >= sale.total ? 'PAGO' : 'PENDENTE';
        
        await updateSale(sale.id, {
          payments: updatedPayments,
          status: newStatus
        });
        
        remainingAmount -= paymentForThisSale;
      }
    }
    
    setIsPaymentModalOpen(false);
    setSelectedCustomer(null);
    setPaymentAmount('');
    toast.success('Pagamento registrado com sucesso!');
  };

  const openWhatsApp = (phone: string, name: string, debt: number) => {
    const formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone) {
      toast.error('Número de telefone não cadastrado.');
      return;
    }
    
    const message = `Olá ${name}, tudo bem? Estou passando para lembrar da sua pendência no valor de R$ ${debt.toFixed(2)}. Qualquer dúvida estou à disposição!`;
    const url = `https://wa.me/55${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="flex items-center p-4 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <span className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-lg font-bold text-lg">
            <BookOpen size={18} />
          </span>
          <h2 className="text-xl font-bold">Caderneta Digital</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          
          {currentUser?.role === 'admin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center mb-4">
              <div>
                <h3 className="text-gray-500 font-medium">Total a Receber</h3>
                <p className="text-3xl font-bold text-orange-600">
                  R$ {customers.reduce((acc, c) => acc + c.totalDebt, 0).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <DollarSign size={24} />
              </div>
            </div>
          )}

          {customers.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 md:mt-20 md:text-lg">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              Nenhum cliente com dívida pendente.
            </div>
          ) : (
            customers.map((c, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 md:text-lg">{c.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase">Pendente</span>
                        {c.expectedDate && (
                          <span className="text-[10px] flex items-center gap-1 font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <Calendar size={10} />
                            {new Date(c.expectedDate).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => handleOpenEdit(c)} className="text-gray-400 hover:text-blue-900 bg-gray-50 p-1.5 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-500 block">Dívida Total</span>
                      <span className="font-bold text-orange-600 md:text-xl">R$ {c.totalDebt.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 pt-4 border-t border-gray-50">
                  <button 
                    onClick={() => handleOpenPayment(c)}
                    className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-600 transition-colors shadow-sm"
                  >
                    Registrar Pagamento
                  </button>
                  <button 
                    onClick={() => openWhatsApp(c.phone, c.name, c.totalDebt)}
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-[#20bd5a] transition-colors shadow-sm"
                  >
                    <MessageCircle size={18} />
                    Cobrar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-800">Registrar Pagamento</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <span className="text-gray-600 font-medium">{selectedCustomer.name}</span>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Dívida Atual</span>
                  <span className="font-bold text-gray-800">R$ {selectedCustomer.totalDebt.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Valor do Pagamento</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={selectedCustomer.totalDebt}
                    value={paymentAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setPaymentAmount(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Se for um pagamento parcial, abateremos das dívidas mais antigas primeiro.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={handleConfirmPayment}
                className="w-full bg-green-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-600 transition-all shadow-md transform active:scale-[0.98]"
              >
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-800">Editar Dívida</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">WhatsApp</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Data de Pagamento</label>
                <input 
                  type="date" 
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-1 block">Valor Total da Dívida (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={editDebt}
                  onChange={e => {
                    const val = e.target.value;
                    setEditDebt(val === '' ? '' : Number(val));
                  }}
                  className="w-full bg-orange-50 border border-orange-200 rounded-xl py-3 px-4 font-bold text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-gray-500 mt-1">Altere o valor apenas se você digitou errado na hora da venda.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={handleSaveEdit}
                className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-800 transition-all shadow-md transform active:scale-[0.98]"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
