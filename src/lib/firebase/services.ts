import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, orderBy, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './config';
import { Product, Sale, SaleItem, StockMovement, User, Expense } from '@/types';

// Products
export const getProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, 'products'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateProductStock = async (productId: string, newStock: number) => {
  const ref = doc(db, 'products', productId);
  await updateDoc(ref, { stock: newStock });
};

export const updateProduct = async (productId: string, data: Partial<Product>) => {
  const ref = doc(db, 'products', productId);
  await updateDoc(ref, data);
};

// Sales
export const getSales = async (): Promise<Sale[]> => {
  const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};

export const addSale = async (sale: Omit<Sale, 'id'>) => {
  const docRef = await addDoc(collection(db, 'sales'), {
    ...sale,
    date: new Date().toISOString()
  });
  return docRef.id;
};

// Stock Movements
export const getStockMovements = async (): Promise<StockMovement[]> => {
  const q = query(collection(db, 'movements'), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
};

export const addStockMovement = async (movement: Omit<StockMovement, 'id'>) => {
  const docRef = await addDoc(collection(db, 'movements'), {
    ...movement,
    date: new Date().toISOString()
  });
  return docRef.id;
};

// Expenses
export const addExpense = async (expense: Omit<Expense, 'id'>) => {
  const docRef = await addDoc(collection(db, 'expenses'), {
    ...expense,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateExpense = async (expenseId: string, data: Partial<Expense>) => {
  const ref = doc(db, 'expenses', expenseId);
  await updateDoc(ref, data);
};

// We will implement soft delete or hard delete. Hard delete for expenses is fine.
export const deleteExpense = async (expenseId: string) => {
  const ref = doc(db, 'expenses', expenseId);
  await deleteDoc(ref);
};

// Users (Role management in Firestore)
export const getUserRole = async (uid: string): Promise<User | null> => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as User;
  }
  return null;
};

export const updateUser = async (uid: string, data: Partial<User>) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, data);
};

export const createUserRole = async (user: User) => {
  const ref = doc(db, 'users', user.id);
  await setDoc(ref, user);
};

export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};
