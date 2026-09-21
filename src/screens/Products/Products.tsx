import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { Search, Plus, Settings, Package, TrendingUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Products() {
  const router = useRouter();
  const { products } = useStore();
  const [search, setSearch] = useState('');

  // Filter out deleted products and apply search
  const filtered = products.filter(p => !p.deleted && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 md:p-8 bg-white/80 backdrop-blur-md shadow-sm z-10 sticky top-0 md:bg-transparent md:backdrop-blur-none md:shadow-none">
        <div className="relative max-w-2xl mx-auto md:mx-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white md:bg-white/80 border border-gray-200 md:border-gray-300 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
          />
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <DropdownMenu key={product.id}>
              <DropdownMenuTrigger asChild>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900">
                  <div>
                    <h3 className="font-bold text-gray-800 md:text-lg pr-2">{product.name}</h3>
                    <p className="text-gray-500 text-sm md:text-base mt-1">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-full text-sm md:text-base font-bold ${
                      product.stock > 5 ? 'bg-green-100 text-green-700' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {product.stock} un
                    </div>
                    <div className="text-gray-300 group-hover:text-blue-900 transition-colors md:opacity-0 group-hover:opacity-100">
                      <Settings size={20} />
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-100 shadow-xl rounded-xl p-1 z-50">
                <DropdownMenuItem 
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:bg-gray-50 focus:text-blue-900 flex items-center gap-3" 
                  onClick={() => router.push(`/stock/new?productId=${product.id}`)}
                >
                  <Package size={18} className="text-blue-600" /> Repor Estoque
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:bg-gray-50 focus:text-blue-900 flex items-center gap-3" 
                  onClick={() => router.push(`/reports?productId=${product.id}`)}
                >
                  <TrendingUp size={18} className="text-green-600" /> Ver Vendas
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 focus:bg-gray-50 focus:text-blue-900 flex items-center gap-3" 
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <Settings size={18} className="text-gray-500" /> Configurações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 mt-20 text-lg">
            Nenhum produto encontrado.
          </div>
        )}
      </div>

      <button
        onClick={() => router.push('/products/new')}
        className="fixed md:absolute bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
