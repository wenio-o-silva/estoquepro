import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { Product } from '@/types';
import { Search, Plus, Minus, Trash2, CheckCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';

type CartItem = {
  product: Product;
  qty: number | '';
  salePrice: string;
};

export function Sale() {
  const router = useRouter();
  const { products, addSale } = useStore();
  
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = products.filter(p => 
    !p.deleted && p.stock > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.qty < product.stock) {
        setCart(cart.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
    } else {
      setCart([...cart, { product, qty: 1, salePrice: product.price.toFixed(2) }]);
    }
    setSearch('');
    setIsSearchFocused(false);
  };

  const updateQty = (productId: string, newQty: string | number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        if (newQty === '') return { ...item, qty: '' };
        let qty = typeof newQty === 'string' ? parseInt(newQty, 10) : newQty;
        if (isNaN(qty)) return { ...item, qty: '' };
        return { ...item, qty };
      }
      return item;
    }));
  };

  const handleQtyBlur = (productId: string) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        let finalQty = item.qty;
        if (finalQty === '' || finalQty <= 0) {
          finalQty = 1;
        } else if (finalQty > item.product.stock) {
          finalQty = item.product.stock;
        }
        return { ...item, qty: finalQty };
      }
      return item;
    }));
  };

  const updatePrice = (productId: string, newPrice: string) => {
    // Only allow valid numeric characters, dot, and comma
    if (newPrice !== '' && !/^[0-9.,]*$/.test(newPrice)) return;
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, salePrice: newPrice };
      }
      return item;
    }));
  };

  const handlePriceBlur = (productId: string) => {
    setCart(cart.map(item => {
      if (item.product.id === productId && item.salePrice !== '') {
        const numeric = parseFloat(item.salePrice.replace(',', '.'));
        if (!isNaN(numeric)) {
          return { ...item, salePrice: numeric.toFixed(2) };
        } else {
          return { ...item, salePrice: item.product.price.toFixed(2) }; // Revert to original if invalid
        }
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((acc, item) => acc + ((parseFloat(item.salePrice.replace(',', '.')) || 0) * (item.qty || 0)), 0);

  const handleFinish = () => {
    if (cart.length === 0) return;

    // Validações antes de finalizar
    const invalidZero = cart.find(item => item.qty === '' || item.qty <= 0);
    if (invalidZero) {
      toast.error('A quantidade não pode ser zero ou vazia.');
      return;
    }

    const invalidStock = cart.find(item => item.qty > item.product.stock);
    if (invalidStock) {
      toast.error(`A quantidade do produto ${invalidStock.product.name} excede o estoque disponível (${invalidStock.product.stock} un).`);
      return;
    }

    addSale(cart.map(item => ({
      productId: item.product.id,
      qty: item.qty as number,
      price: parseFloat(item.salePrice.replace(',', '.')) || 0
    })));
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-green-500 text-white animate-in fade-in duration-500">
        <CheckCircle size={80} className="mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold">Venda Finalizada!</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-4 md:p-8 bg-white border-b border-gray-100 shadow-sm md:shadow-none z-10 shrink-0 sticky top-0">
        <div ref={searchContainerRef} className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produto para adicionar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className="w-full bg-gray-50 border border-gray-200 md:border-gray-300 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm md:shadow-none transition-all"
          />
          {isSearchFocused && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto z-20 animate-in fade-in slide-in-from-top-2 duration-200">
              {filtered.map(p => (
                <button 
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full text-left p-4 border-b border-gray-50 last:border-0 hover:bg-blue-50 focus:bg-blue-50 transition-colors flex justify-between items-center group"
                >
                  <span className="font-medium text-gray-800 group-hover:text-blue-900">{p.name}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-blue-900 font-bold">R$ {p.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400">{p.stock} un disponíveis</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-gray-500 text-center">Nenhum produto ativo com estoque encontrado.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          <div className="p-4 md:p-8 flex flex-col gap-4 flex-1 pb-40 md:pb-8">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-10 md:mt-20 md:text-lg h-full">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Nenhum produto adicionado à venda.</p>
                <p className="text-sm mt-2 opacity-60">Use a barra de busca acima para selecionar produtos.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-all">
                  {/* Top: Name and Delete */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-gray-800 md:text-lg block">{item.product.name}</span>
                      <span className="text-xs text-gray-400 block mt-1">Estoque: {item.product.stock}</span>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors -mt-2 -mr-2">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  {/* Bottom: Inputs for Price and Quantity */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-2 pt-4 border-t border-gray-50">
                    
                    {/* Price Input */}
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.salePrice}
                        onChange={(e) => updatePrice(item.product.id, e.target.value)}
                        onBlur={() => handlePriceBlur(item.product.id)}
                        className="w-24 bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 transition-shadow"
                      />
                    </div>
                    
                    {/* Quantity Input with buttons */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-100 self-start sm:self-auto">
                      <button 
                        onClick={() => {
                          const currentQty = typeof item.qty === 'number' ? item.qty : 0;
                          const newQty = Math.max(1, currentQty - 1);
                          updateQty(item.product.id, newQty);
                        }}
                        className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-100 transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      
                      <input 
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.qty === '' ? '' : item.qty}
                        onChange={(e) => updateQty(item.product.id, e.target.value)}
                        onBlur={() => handleQtyBlur(item.product.id)}
                        className="w-14 text-center font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-900 rounded-lg"
                      />

                      <button 
                        onClick={() => {
                          const currentQty = typeof item.qty === 'number' ? item.qty : 0;
                          const newQty = Math.min(item.product.stock, currentQty + 1);
                          updateQty(item.product.id, newQty);
                        }}
                        disabled={item.qty >= item.product.stock}
                        className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 shadow-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 md:p-8 bg-white border-t border-gray-100 absolute md:relative bottom-0 left-0 right-0 z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 text-lg md:text-xl">Total da Venda</span>
              <span className="text-2xl md:text-3xl font-bold text-blue-900">R$ {total.toFixed(2)}</span>
            </div>
            <button 
              onClick={handleFinish}
              disabled={cart.length === 0}
              className="w-full bg-green-500 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-600 active:bg-green-700 transition-all shadow-sm transform active:scale-[0.98]"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
