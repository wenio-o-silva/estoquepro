export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt?: any;
  userId?: string; // Store ID
  createdBy?: string; // Employee ID
  deleted?: boolean;
};

export type SaleItem = {
  productId: string;
  qty: number;
  price: number;
};

export type Payment = {
  id: string;
  amount: number;
  date: string;
};

export type Sale = {
  id: string;
  date: string;
  total: number;
  items: SaleItem[];
  userId?: string; // Store ID
  createdBy?: string; // Employee ID
  paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'FIADO';
  status?: 'PAGO' | 'PENDENTE';
  customerName?: string;
  customerPhone?: string;
  expectedPaymentDate?: string;
  payments?: Payment[];
};

export type StockMovement = {
  id: string;
  productId: string;
  type: 'in' | 'out';
  qty: number;
  date: string;
  reason?: string;
  userId?: string; // Store ID
  createdBy?: string; // Employee ID
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'colaborador';
  adminId?: string; // Used by colaborador to link to store owner
  financialClosingDay?: number;
  lowStockThreshold?: number;
};

export type Expense = {
  id: string;
  title: string;
  value: number;
  dueDate: string;
  priority: 'ALTA' | 'NORMAL' | 'BAIXA';
  status: 'PENDENTE' | 'PAGO';
  paymentDate?: string;
  userId?: string; // Store ID
  createdBy?: string; // Employee ID
  recurring?: boolean;
  recurringId?: string;
};
