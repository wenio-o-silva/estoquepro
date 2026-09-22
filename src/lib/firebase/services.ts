import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, where, orderBy, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from './config';
import { Product, Sale, SaleItem, StockMovement, User, Expense } from '@/types';

// Products
export const getProducts = async (adminId: string): Promise<Product[]> => {
  const q = query(collection(db, 'products'), where('adminId', '==', adminId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)).sort((a, b) => a.name.localeCompare(b.name));
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
export const getSales = async (adminId: string): Promise<Sale[]> => {
  const q = query(collection(db, 'sales'), where('adminId', '==', adminId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addSale = async (sale: Omit<Sale, 'id'>) => {
  const docRef = await addDoc(collection(db, 'sales'), {
    ...sale,
    date: sale.date || new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

// Stock Movements
export const getStockMovements = async (adminId: string): Promise<StockMovement[]> => {
  const q = query(collection(db, 'movements'), where('adminId', '==', adminId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addStockMovement = async (movement: Omit<StockMovement, 'id'>) => {
  const docRef = await addDoc(collection(db, 'movements'), {
    ...movement,
    date: new Date().toISOString()
  });
  return docRef.id;
};

// Expenses
export const updateSale = async (id: string, data: Partial<Sale>) => {
  const docRef = doc(db, 'sales', id);
  await updateDoc(docRef, data);
};

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
  await setDoc(ref, data, { merge: true });
};

export const createUserRole = async (user: User) => {
  const ref = doc(db, 'users', user.id);
  await setDoc(ref, user);
};

export const getUsers = async (adminId?: string): Promise<User[]> => {
  // Se adminId for passado, busca os usuários daquela loja.
  // Como admin também precisa se ver, o filtro pode ser feito no cliente ou garantir que adminId é salvo no próprio admin
  const snapshot = await getDocs(collection(db, 'users'));
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  if (adminId) {
    return users.filter(u => u.id === adminId || u.adminId === adminId);
  }
  return users;
};

export const createEmployeeAuth = async (email: string, pass: string): Promise<string> => {
  const tempApp = initializeApp(firebaseConfig, 'TempApp' + Date.now());
  const tempAuth = getAuth(tempApp);
  const cred = await createUserWithEmailAndPassword(tempAuth, email, pass);
  await tempAuth.signOut();
  return cred.user.uid;
};
