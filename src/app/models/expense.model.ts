export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
}

export interface UpdateExpenseInput {
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
}
