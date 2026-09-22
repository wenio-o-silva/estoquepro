import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { currentUser } = useStore();

  useEffect(() => {
    if (currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Don't router.push here, let the useEffect handle it once currentUser is loaded.
    } catch (error: any) {
      toast.error('Erro ao fazer login', { description: 'Verifique suas credenciais e tente novamente.' });
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-blue-900 text-white justify-center px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="bg-white/20 p-4 rounded-2xl mb-4">
            <Package size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-center">EstoquePro</h1>
          <p className="text-blue-200 mt-2">Gestão simples para sua loja</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-blue-200 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="admin@loja.com"
              disabled={isLoggingIn}
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
              disabled={isLoggingIn}
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoggingIn || !email || !password}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 disabled:bg-green-600/50 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/signup')}
            disabled={isLoggingIn}
            className="text-blue-200 hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Não tem uma conta? Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
