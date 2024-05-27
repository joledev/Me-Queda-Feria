export type TransactionType = "Gasto" | "Ingreso" | "Expense" | "Income";

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  date: number;
  type: "Expense" | "Income" | "Transfer"; // Añadido "Transfer"
  paymentMethod: string; // Añadido el método de pago
}

export interface Category {
  id: number;
  name: string;
  type: "Expense" | "Income";
}

export interface TransactionsByMonth {
  totalExpenses: number;
  totalIncome: number;
}
