import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft, UserPlus, Shield } from 'lucide-react';

export function Users() {
  const router = useRouter();
  const { users, currentUser } = useStore();

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-4 text-center text-red-500 mt-10">
        Acesso negado. Apenas administradores.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="flex items-center p-4 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Usuários</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map(user => (
            <div key={user.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg md:text-xl shrink-0">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 md:text-lg">{user?.name || 'Usuário Sem Nome'}</h3>
                  <p className="text-xs md:text-sm text-gray-500 break-all">{user.email}</p>
                </div>
              </div>
              {user.role === 'admin' && (
                <div className="bg-blue-100 text-blue-800 text-xs md:text-sm font-bold px-3 py-1 rounded-full border border-blue-200">
                  Admin
                </div>
              )}
              {user.role === 'colaborador' && (
                <div className="bg-gray-100 text-gray-600 text-xs md:text-sm font-bold px-3 py-1 rounded-full border border-gray-200">
                  Colaborador
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push('/users/new')}
        className="fixed md:absolute bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors z-20"
      >
        <UserPlus size={24} />
      </button>
    </div>
  );
}
