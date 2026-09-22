"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, BarChart2, Menu, LogOut, DollarSign, History } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useStore();

  const getTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/products')) return 'Produtos';
    if (pathname.startsWith('/sales')) return 'Vendas';
    if (pathname.startsWith('/financial')) return 'Financeiro';
    if (pathname.startsWith('/stock')) return 'Estoque';
    if (pathname.startsWith('/users')) return 'Usuários';
    if (pathname.startsWith('/reports')) return 'Relatórios';
    if (pathname.startsWith('/more')) return 'Mais';
    return 'App';
  };

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Package, label: 'Produtos', path: '/products' },
    { icon: ShoppingCart, label: 'Vendas', path: '/sales/new' },
    currentUser?.role === 'admin' 
      ? { icon: DollarSign, label: 'Raio-X', path: '/financial' }
      : { icon: History, label: 'Histórico', path: '/sales/history' },
    { icon: Menu, label: 'Mais', path: '/more' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-gray-50 overflow-hidden relative">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-blue-900 text-white shrink-0">
        <div className="p-6 text-2xl font-bold border-b border-white/10 flex items-center gap-3">
          <Package size={28} />
          EstoquePro
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path) && item.path !== '/sales/new');
            const actualIsActive = item.path === '/sales/new' ? pathname === '/sales/new' : isActive;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  actualIsActive ? 'bg-white/20 text-white font-bold' : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} className={actualIsActive ? 'stroke-[2.5px]' : ''} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 w-full p-3 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden h-full">
        {/* Header (Top bar) */}
        <header className="bg-blue-900 md:bg-white md:text-gray-800 text-white p-4 md:px-8 md:py-6 flex items-center justify-between z-10 shrink-0 md:shadow-sm">
          <h1 className="text-xl md:text-2xl font-bold">{getTitle()}</h1>
          <button onClick={handleLogout} className="p-2 -mr-2 md:hidden">
            <LogOut size={20} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative md:bg-gray-50/50">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden bg-white border-t border-gray-200 shrink-0 pb-safe">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path) && item.path !== '/sales/new');
              const actualIsActive = item.path === '/sales/new' ? pathname === '/sales/new' : isActive;

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex flex-col items-center p-3 w-full ${actualIsActive ? 'text-blue-900' : 'text-gray-500'}`}
                >
                  <Icon size={24} className={actualIsActive ? 'stroke-[2.5px]' : ''} />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
