import React from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { History, Users, PieChart, LogOut, ChevronRight, BarChart2, BookOpen } from 'lucide-react';

export function MoreMenu() {
  const router = useRouter();
  const { currentUser, logout } = useStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 md:p-8 gap-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 md:text-xl">{currentUser?.name}</h2>
            <p className="text-gray-500 text-sm md:text-base capitalize">{currentUser?.role === 'admin' ? 'Administrador' : 'Colaborador'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button 
            onClick={() => router.push('/sales/history')}
            className="w-full flex items-center justify-between p-4 md:p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4 text-gray-700">
              <History size={24} className="text-blue-900" />
              <span className="font-medium md:text-lg">Histórico de Vendas</span>
            </div>
            <ChevronRight size={24} className="text-gray-400" />
          </button>

          <button 
            onClick={() => router.push('/stock')}
            className="w-full flex items-center justify-between p-4 md:p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4 text-gray-700">
              <span className="w-6 h-6 flex items-center justify-center text-blue-900">
                <BarChart2 size={24} />
              </span>
              <span className="font-medium md:text-lg">Estoque</span>
            </div>
            <ChevronRight size={24} className="text-gray-400" />
          </button>

          <button 
            onClick={() => router.push('/notebook')}
            className="w-full flex items-center justify-between p-4 md:p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4 text-gray-700">
              <span className="w-6 h-6 flex items-center justify-center text-blue-900">
                <BookOpen size={24} />
              </span>
              <span className="font-medium md:text-lg">Caderneta Digital</span>
            </div>
            <ChevronRight size={24} className="text-gray-400" />
          </button>

          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => router.push('/reports')}
              className="w-full flex items-center justify-between p-4 md:p-6 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 text-gray-700">
                <PieChart size={24} className="text-blue-900" />
                <span className="font-medium md:text-lg">Relatórios</span>
              </div>
              <ChevronRight size={24} className="text-gray-400" />
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button 
              onClick={() => router.push('/users')}
              className="w-full flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 text-gray-700">
                <Users size={24} className="text-blue-900" />
                <span className="font-medium md:text-lg">Gerenciar Usuários</span>
              </div>
              <ChevronRight size={24} className="text-gray-400" />
            </button>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="mt-8 mb-6 w-full flex items-center justify-center gap-3 p-4 md:p-6 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors md:text-lg"
        >
          <LogOut size={24} />
          Sair do Aplicativo
        </button>
      </div>
    </div>
  );
}
