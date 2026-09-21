"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Sale, SaleItem, StockMovement, User, Expense } from '@/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { addProduct, addSale, addStockMovement, updateProductStock, getUserRole, updateProduct as updateProductService, addExpense, updateExpense as updateExpenseService, deleteExpense as deleteExpenseService, updateUser as updateUserService } from '@/lib/firebase/services';

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
  addSale: (items: SaleItem[]) => Promise<void>;
  addStockEntry: (productId: string, qty: number, reason?: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
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
            role: 'employee'
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

    const qProducts = query(collection(db, 'products'), where('userId', '==', currentUser.id));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      prods.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(prods);
    });

    const qSales = query(collection(db, 'sales'), where('userId', '==', currentUser.id));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      const sls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      sls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSales(sls);
    });

    const qMovements = query(collection(db, 'movements'), where('userId', '==', currentUser.id));
    const unsubMovements = onSnapshot(qMovements, (snapshot) => {
      const movs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
      movs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(movs);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', currentUser.id));
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
    const id = await addProduct({ ...prod, userId: currentUser.id });
    if (prod.stock > 0) {
      await addStockMovement({
        productId: id,
        type: 'in',
        qty: prod.stock,
        date: new Date().toISOString(),
        userId: currentUser.id
      });
    }
  };

  const handleUpdateProduct = async (id: string, data: Partial<Product>) => {
    if (!currentUser) return;
    await updateProductService(id, data);
  };

  const handleAddSale = async (items: SaleItem[]) => {
    if (!currentUser) return;
    const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);
    
    await addSale({
      date: new Date().toISOString(),
      total,
      items,
      userId: currentUser.id
    });
    
    // Update stock and add movements
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        await updateProductStock(item.productId, product.stock - item.qty);
        await addStockMovement({
          productId: item.productId,
          type: 'out',
          qty: item.qty,
          date: new Date().toISOString(),
          userId: currentUser.id
        });
      }
    }
  };

  const handleAddStockEntry = async (productId: string, qty: number, reason?: string) => {
    if (!currentUser) return;
    const movementType: 'in' | 'out' = qty > 0 ? 'in' : 'out';
    const absQty = Math.abs(qty);
    
    const product = products.find(p => p.id === productId);
    if (product) {
      await updateProductStock(productId, product.stock + qty);
      await addStockMovement({
        productId,
        type: movementType,
        qty: absQty,
        date: new Date().toISOString(),
        reason,
        userId: currentUser.id
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
    await addExpense({ ...expense, userId: currentUser.id });
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
      addStockEntry: handleAddStockEntry,
      addUser: handleAddUser,
      addExpense: handleAddExpense,
      updateExpense: handleUpdateExpense,
      deleteExpense: handleDeleteExpense,
      updateUser: handleUpdateUser
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
