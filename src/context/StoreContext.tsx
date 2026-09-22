"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Sale, SaleItem, StockMovement, User, Expense } from '@/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { addProduct, addSale, addStockMovement, updateProductStock, getUserRole, updateProduct as updateProductService, addExpense, updateExpense as updateExpenseService, deleteExpense as deleteExpenseService, updateUser as updateUserService, updateSale as updateSaleService, createEmployeeAuth } from '@/lib/firebase/services';

type StoreState = {
  products: Product[];
  sales: Sale[];
  movements: StockMovement[];
  users: User[];
  expenses: Expense[];
  currentUser: User | null;
  firebaseUser: FirebaseAuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  addSale: (saleData: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (id: string, data: Partial<Sale>) => Promise<void>;
  addStockEntry: (productId: string, qty: number, reason?: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
};

const StoreContext = createContext<StoreState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // fetch user role
        const role = await getUserRole(user.uid);
        if (role) {
          setCurrentUser(role);
        } else {
          // If no role doc exists, maybe it's a new user or missing data.
          // Set a default or handle appropriately.
          setCurrentUser({
            id: user.uid,
            name: user.displayName || user.email || 'Usuário',
            email: user.email || '',
            role: 'colaborador'
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data listeners
  useEffect(() => {
    if (!currentUser) return; // Only fetch if logged in
    
    // storeId é o ID do admin. Se for colaborador, usa o adminId.
    const storeId = currentUser.role === 'admin' ? currentUser.id : currentUser.adminId;
    
    if (!storeId) return;

    const qProducts = query(collection(db, 'products'), where('userId', '==', storeId));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      prods.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(prods);
    });

    const qSales = query(collection(db, 'sales'), where('userId', '==', storeId));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      sls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSales(sls);
    });

    const qMovements = query(collection(db, 'movements'), where('userId', '==', storeId));
    const unsubMovements = onSnapshot(qMovements, (snapshot) => {
      const movs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
      movs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(movs);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(allUsers.filter(u => u.id === storeId || u.adminId === storeId));
    });

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', storeId));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      const exps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      exps.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      setExpenses(exps);
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubMovements();
      unsubUsers();
      unsubExpenses();
    };
  }, [currentUser]);

  const handleAddProduct = async (prod: Omit<Product, 'id'>) => {
    if (!currentUser) return;
    const storeId = currentUser.role === 'admin' ? currentUser.id : currentUser.adminId;
    const id = await addProduct({ ...prod, userId: storeId, createdBy: currentUser.id });
    if (prod.stock > 0) {
      await addStockMovement({
        productId: id,
        type: 'in',
        qty: prod.stock,
        date: new Date().toISOString(),
        reason: 'Estoque Inicial',
        userId: storeId,
        createdBy: currentUser.id
      });
    }
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    await updateProductService(id, data);
  };

  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    if (!currentUser) return;
    const storeId = currentUser.role === 'admin' ? currentUser.id : currentUser.adminId;
    const id = await addSale({ ...sale, userId: storeId, createdBy: currentUser.id });
    
    // Decrement stock for each item
    for (const item of sale.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        await updateProductStock(product.id, product.stock - item.qty);
        await addStockMovement({
          productId: product.id,
          type: 'out',
          qty: item.qty,
          date: new Date().toISOString(),
          reason: `Venda #${id.substring(0, 5)}`,
          userId: storeId,
          createdBy: currentUser.id
        });
      }
    }
  };

  const handleUpdateSale = async (id: string, data: Partial<Sale>) => {
    if (!currentUser) return;
    await updateSaleService(id, data);
  };

  const handleAddStockEntry = async (productId: string, qty: number, reason?: string) => {
    if (!currentUser) return;
    const storeId = currentUser.role === 'admin' ? currentUser.id : currentUser.adminId;
    const movementType: 'in' | 'out' = qty > 0 ? 'in' : 'out';
    const absQty = Math.abs(qty);
    
    const product = products.find(p => p.id === productId);
    if (product) {
      await updateProductStock(product.id, product.stock + qty);
      await addStockMovement({
        productId,
        type: movementType,
        qty: absQty,
        date: new Date().toISOString(),
        reason,
        userId: storeId,
        createdBy: currentUser.id
      });
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const handleAddUser = async (user: User) => {
    // In a real app, you would create the user in Firebase Auth via an admin SDK
    // For this prototype, we'll just add the role to Firestore.
    const { setDoc, doc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', user.id), user);
  };

  const handleUpdateUser = async (id: string, data: Partial<User>) => {
    await updateUserService(id, data);
    // If updating current user, update local state optimistically
    if (currentUser?.id === id) {
      setCurrentUser({ ...currentUser, ...data });
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return;
    const storeId = currentUser.role === 'admin' ? currentUser.id : currentUser.adminId;
    await addExpense({ ...expense, userId: storeId, createdBy: currentUser.id });
  };

  const handleUpdateExpense = async (id: string, data: Partial<Expense>) => {
    if (!currentUser) return;
    await updateExpenseService(id, data);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!currentUser) return;
    await deleteExpenseService(id);
  };

  return (
    <StoreContext.Provider value={{
      products, sales, movements, users, expenses, currentUser, firebaseUser, loading,
      logout: handleLogout,
      addProduct: handleAddProduct, 
      updateProduct: handleUpdateProduct,
      addSale: handleAddSale, 
      updateSale: handleUpdateSale,
      addStockEntry: handleAddStockEntry,
      addUser: handleAddUser,
      addExpense: handleAddExpense,
      updateExpense: handleUpdateExpense,
      deleteExpense: handleDeleteExpense,
      updateUser: handleUpdateUser,
      deleteProduct: async (id: string) => {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'products', id));
      }
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
