export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt?: any;
  userId?: string;
  deleted?: boolean;
};

export type SaleItem = {
  productId: string;
  qty: number;
  price: number;
};

export type Sale = {
  id: string;
  date: string;
  total: number;
  items: SaleItem[];
  userId?: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  type: 'in' | 'out';
  qty: number;
  date: string;
  reason?: string;
  userId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  financialClosingDay?: number;
};

export type Expense = {
  id: string;
  title: string;
  value: number;
  dueDate: string;
  priority: 'ALTA' | 'NORMAL' | 'BAIXA';
  status: 'PENDENTE' | 'PAGO';
  paymentDate?: string;
  userId?: string;
  recurring?: boolean;
  recurringId?: string;
};
