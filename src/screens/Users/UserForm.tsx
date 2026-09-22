import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ArrowLeft } from 'lucide-react';
import { createEmployeeAuth } from '@/lib/firebase/services';
import { toast } from 'sonner';

export function UserForm() {
  const router = useRouter();
  const { addUser, currentUser } = useStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'colaborador' | 'admin'>('colaborador');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !currentUser) return;
    
    setLoading(true);
    try {
      const uid = await createEmployeeAuth(email, password);
      
      await addUser({
        id: uid,
        name,
        email,
        role,
        adminId: currentUser.id
      });
      
      toast.success('Colaborador criado com sucesso!');
      router.push('/users');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao criar usuário. ' + err.message);
    } finally {
      setLoading(false);
    }
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
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Senha Provisória</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white md:bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 md:text-lg shadow-sm md:shadow-none"
                placeholder="Pelo menos 6 caracteres"
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">O colaborador usará esta senha para entrar no sistema.</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 md:text-lg">Nível de Acesso</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center p-4 rounded-xl border-2 transition-colors cursor-pointer md:text-lg ${role === 'colaborador' ? 'border-blue-900 bg-blue-50 text-blue-900 font-bold shadow-sm' : 'border-gray-200 text-gray-500 bg-white md:bg-gray-50 hover:bg-gray-100'}`}>
                  <input type="radio" name="role" value="colaborador" checked={role === 'colaborador'} onChange={() => setRole('colaborador')} className="hidden" />
                  Colaborador
                </label>
                <label className="flex-1 flex items-center justify-center p-4 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed md:text-lg opacity-70">
                  <input type="radio" name="role" value="admin" disabled className="hidden" />
                  Sócio
                </label>
              </div>
            </div>
          </form>

          <div className="p-4 md:p-8 bg-white md:bg-transparent border-t border-gray-100 md:border-none absolute md:relative bottom-0 left-0 right-0 z-10">
            <button 
              onClick={handleSubmit}
              disabled={!name || !email || !password || loading}
              className="w-full bg-blue-900 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
