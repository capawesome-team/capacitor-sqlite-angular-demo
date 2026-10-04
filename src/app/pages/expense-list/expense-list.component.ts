import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  calendarOutline,
  cashOutline,
  pricetagOutline,
  trashOutline,
} from 'ionicons/icons';
import { Expense } from '../../models/expense.model';
import { ExpensesService } from '../../services/expenses';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  imports: [
    RouterLink,
    IonAlert,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonText,
    IonTitle,
    IonToast,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class ExpenseListComponent implements OnInit {
  private readonly expensesService = inject(ExpensesService);
  private readonly router = inject(Router);
  private readonly dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  private readonly amountFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  readonly expenses = this.expensesService.expenses;
  readonly isLoading = this.expensesService.isLoading;
  readonly expenseCount = computed(() => this.expenses().length);
  readonly totalAmount = computed(() =>
    this.expenses().reduce((total, expense) => total + expense.amount, 0),
  );
  readonly selectedExpenseForDeletion = signal<Expense | null>(null);
  readonly toastMessage = signal('');
  readonly isToastOpen = signal(false);

  constructor() {
    addIcons({
      add,
      calendarOutline,
      cashOutline,
      pricetagOutline,
      trashOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.expensesService.refreshExpenses();
  }

  trackByExpenseId(_index: number, expense: Expense): number {
    return expense.id;
  }

  openDeleteConfirmation(expense: Expense, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedExpenseForDeletion.set(expense);
  }

  closeDeleteConfirmation(): void {
    this.selectedExpenseForDeletion.set(null);
  }

  async confirmDelete(): Promise<void> {
    const expense = this.selectedExpenseForDeletion();
    if (!expense) {
      return;
    }

    try {
      await this.expensesService.deleteExpense(Number(expense.id));
      await this.expensesService.refreshExpenses();
      this.openToast(`Deleted "${expense.title}".`);
    } catch {
      this.openToast('Could not delete expense. Please try again.');
    } finally {
      this.closeDeleteConfirmation();
    }
  }

  async editExpense(expenseId: number): Promise<void> {
    await this.router.navigate(['/expenses', expenseId, 'edit']);
  }

  closeToast(): void {
    this.isToastOpen.set(false);
  }

  formatDate(date: string): string {
    if (!date) {
      return 'No date';
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return this.dateFormatter.format(parsedDate);
  }

  formatAmount(amount: number): string {
    return this.amountFormatter.format(amount);
  }

  get expenseSummaryLabel(): string {
    const count = this.expenseCount();
    return `${count} ${count === 1 ? 'expense' : 'expenses'}`;
  }

  private openToast(message: string): void {
    this.toastMessage.set(message);
    this.isToastOpen.set(true);
  }
}
