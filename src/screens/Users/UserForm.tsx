import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft } from 'lucide-react';

export function UserForm() {
  const router = useRouter();
  const { addUser } = useStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    
    addUser({
      id: 'u' + Date.now().toString(),
      name,
      email,
      role
    });
    router.push('/users');
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center p-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Novo Usuário</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 md:gap-8 flex-1 pb-24 md:pb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                placeholder="João Silva"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                placeholder="joao@loja.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Nível de Acesso</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 transition-colors cursor-pointer md:text-lg ${role === 'employee' ? 'border-blue-900 bg-blue-50 text-blue-900 font-bold shadow-sm' : 'border-gray-200 text-gray-500 bg-white md:bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="radio" name="role" value="employee" checked={role === 'employee'} onChange={() => setRole('employee')} className="hidden" />
                  Funcionário
                </label>
                <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 transition-colors cursor-pointer md:text-lg ${role === 'admin' ? 'border-blue-900 bg-blue-50 text-blue-900 font-bold shadow-sm' : 'border-gray-200 text-gray-500 bg-white md:bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} className="hidden" />
                  Admin
                </label>
              </div>
            </div>
          </form>

          <div className="p-4 md:p-8 bg-white md:bg-transparent border-t border-gray-100 md:border-none absolute md:relative bottom-0 left-0 right-0 z-10">
            <button 
              onClick={handleSubmit}
              disabled={!name || !email}
              className="w-full bg-blue-900 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-800 transition-colors shadow-sm"
            >
              Salvar Usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
