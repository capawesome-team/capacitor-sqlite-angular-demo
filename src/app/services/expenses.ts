import { Injectable, inject, signal } from '@angular/core';
import {
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from '../models/expense.model';
import { DatabaseService } from './database';

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private readonly databaseService = inject(DatabaseService);
  private readonly expensesState = signal<Expense[]>([]);
  private readonly loadingState = signal(false);

  readonly expenses = this.expensesState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();

  async getAllExpenses(): Promise<Expense[]> {
    const rows = await this.databaseService.query<ExpenseRow>(
      'SELECT id, title, category, amount, expenseDate, notes, createdAt, updatedAt FROM expenses ORDER BY expenseDate DESC, createdAt DESC',
    );
    const expenses = rows.map((row) => this.toExpense(row));
    this.expensesState.set(expenses);
    return expenses;
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    const rows = await this.databaseService.query<ExpenseRow>(
      'SELECT id, title, category, amount, expenseDate, notes, createdAt, updatedAt FROM expenses WHERE id = ? LIMIT 1',
      [id],
    );

    if (!rows[0]) {
      return null;
    }

    return this.toExpense(rows[0]);
  }

  async createExpense(input: CreateExpenseInput): Promise<void> {
    const now = new Date().toISOString();
    await this.databaseService.execute(
      'INSERT INTO expenses (title, category, amount, expenseDate, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        input.title.trim(),
        input.category.trim(),
        input.amount,
        input.expenseDate,
        this.normalizeNotes(input.notes),
        now,
        now,
      ],
    );
  }

  async updateExpense(id: number, input: UpdateExpenseInput): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.databaseService.execute(
      'UPDATE expenses SET title = ?, category = ?, amount = ?, expenseDate = ?, notes = ?, updatedAt = ? WHERE id = ?',
      [
        input.title.trim(),
        input.category.trim(),
        input.amount,
        input.expenseDate,
        this.normalizeNotes(input.notes),
        updatedAt,
        id,
      ],
    );
  }

  async deleteExpense(id: number): Promise<void> {
    const deletedAt = new Date().toISOString();
    await this.databaseService.beginTransaction();
    try {
      await this.recordApplicationLog(id, deletedAt);
      await this.databaseService.execute('DELETE FROM expenses WHERE id = ?', [
        id,
      ]);
      await this.databaseService.commitTransaction();
    } catch (error) {
      await this.databaseService.rollbackTransaction();
      throw error;
    }
  }

  async refreshExpenses(): Promise<void> {
    this.loadingState.set(true);
    try {
      await this.getAllExpenses();
    } finally {
      this.loadingState.set(false);
    }
  }

  private normalizeNotes(notes?: string | null): string | null {
    const trimmed = notes?.trim();
    return trimmed ? trimmed : null;
  }

  private async recordApplicationLog(
    expenseId: number,
    deletedAt: string,
  ): Promise<void> {
    await this.databaseService.execute(
      'INSERT INTO application_logs (expenseId, deletedAt) VALUES (?, ?)',
      [expenseId, deletedAt],
    );
  }

  private toExpense(row: ExpenseRow): Expense {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      amount: Number(row.amount),
      expenseDate: row.expenseDate,
      notes: row.notes ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

interface ExpenseRow {
  id: number;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
