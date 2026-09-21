"use client";

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PRODUCTS = [
  { name: 'Smartphone Galaxy S23', price: 3500, stock: 15 },
  { name: 'Notebook Dell Inspiron', price: 4200, stock: 8 },
  { name: 'Monitor LG 29" Ultrawide', price: 1100, stock: 12 },
  { name: 'Teclado Mecânico Keychron', price: 450, stock: 20 },
  { name: 'Mouse Sem Fio Logitech MX', price: 380, stock: 25 },
  { name: 'Cadeira Ergonômica', price: 1200, stock: 5 },
  { name: 'Mesa de Escritório', price: 850, stock: 7 },
  { name: 'Fone de Ouvido Bluetooth', price: 299, stock: 30 },
  { name: 'Webcam Full HD', price: 250, stock: 18 },
  { name: 'HD Externo 2TB', price: 480, stock: 10 },
];

export default function SeedPage() {
  const { currentUser } = useStore();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para criar registros.');
      return;
    }
    
    setIsSeeding(true);
    try {
      const userId = "AhpyIdbrT8WFytEoDviEJIpInzM2";
      
      const createdProducts = [];

      // 1. Create Products
      for (const prod of PRODUCTS) {
        const docRef = await addDoc(collection(db, 'products'), {
          ...prod,
          userId,
          createdAt: serverTimestamp()
        });
        createdProducts.push({ id: docRef.id, ...prod });
      }

      // 2. Create Movements and Sales
      for (let i = 0; i < 10; i++) {
        const product = createdProducts[i % createdProducts.length];
        const date = new Date();
        date.setDate(date.getDate() - (10 - i)); // spread over the last 10 days
        
        // Stock Movement (entrada inicial)
        await addDoc(collection(db, 'movements'), {
          productId: product.id,
          type: 'in',
          qty: product.stock + 5, // simulate a larger initial stock
          date: date.toISOString(),
          userId
        });

        // Sale
        const qtySold = Math.floor(Math.random() * 3) + 1;
        await addDoc(collection(db, 'sales'), {
          date: new Date(date.getTime() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours after movement
          total: product.price * qtySold,
          items: [{
            productId: product.id,
            qty: qtySold,
            price: product.price
          }],
          userId
        });

        // Stock Movement (saída da venda)
        await addDoc(collection(db, 'movements'), {
          productId: product.id,
          type: 'out',
          qty: qtySold,
          date: new Date(date.getTime() + 1000 * 60 * 60 * 2).toISOString(),
          userId
        });
      }

      toast.success('Banco de dados populado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao popular banco de dados.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Popular Banco de Dados</h1>
      <p className="text-slate-600 mb-8">
        Clique no botão abaixo para gerar 10 produtos, movimentações de estoque e vendas variadas.
        Isso simulará a utilização do site para o usuário logado ({currentUser?.id}).
      </p>

      <button
        onClick={handleSeed}
        disabled={isSeeding || !currentUser}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2"
      >
        {isSeeding ? <Loader2 className="animate-spin" /> : null}
        {isSeeding ? 'Criando registros...' : 'Gerar Dados de Teste'}
      </button>
    </div>
  );
}
