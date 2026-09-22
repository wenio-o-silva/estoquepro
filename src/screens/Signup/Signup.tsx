import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();
  const { addUser, currentUser } = useStore();

  useEffect(() => {
    if (currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningUp) return;
    if (!name || !email || !password) {
      toast.error('Preencha todos os campos.');
      return;
    }

    setIsSigningUp(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save role/name in Firestore
      await addUser({
        id: userCredential.user.uid,
        name,
        email,
        role: 'admin'
      });

      toast.success('Conta criada com sucesso!');
      // router.push('/') removido, o useEffect fará o redirect quando o contexto atualizar
    } catch (error: any) {
      toast.error('Erro ao criar conta', { description: 'Verifique os dados e tente novamente.' });
      setIsSigningUp(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-blue-900 text-white justify-center px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="bg-white/20 p-4 rounded-2xl mb-4">
            <Package size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center">Criar Conta</h1>
          <p className="text-blue-200 mt-2">Comece a gerenciar sua loja</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-blue-200 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Seu Nome"
              disabled={isSigningUp}
            />
          </div>
          <div>
            <label className="block text-sm text-blue-200 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="admin@loja.com"
              disabled={isSigningUp}
            />
          </div>
          <div>
            <label className="block text-sm text-blue-200 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="••••••••"
              disabled={isSigningUp}
            />
          </div>
          
          <button 
            type="submit"
            disabled={isSigningUp || !name || !email || !password}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 disabled:bg-green-600/50 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSigningUp ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Cadastrando...
              </>
            ) : (
              'Cadastrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/login')}
            disabled={isSigningUp}
            className="text-blue-200 hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Já tem uma conta? Faça login
          </button>
        </div>
      </div>
    </div>
  );
}
