import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '../../models/expense.model';
import { ExpensesService } from '../../services/expenses';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss'],
  imports: [
    ReactiveFormsModule,
    IonAlert,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonTextarea,
    IonTitle,
    IonToast,
    IonToolbar,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class ExpenseFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly expensesService = inject(ExpensesService);
  private readonly expensesRoute = '/expenses';

  private editingExpenseId: number | null = null;

  readonly isLoadingExpense = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleteAlertOpen = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal('');
  readonly isToastOpen = signal(false);

  readonly expenseForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    category: ['', [Validators.required, Validators.maxLength(80)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    expenseDate: ['', Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  readonly categoryOptions = [
    'Food',
    'Transport',
    'Housing',
    'Health',
    'Entertainment',
    'Other',
  ];

  get isEditMode(): boolean {
    return this.editingExpenseId !== null;
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit' : 'Create';
  }

  get submitLabel(): string {
    return this.isEditMode ? 'Save' : 'Create';
  }

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    const expenseId = Number(idParam);
    if (Number.isNaN(expenseId)) {
      this.errorMessage.set('Invalid expense ID.');
      return;
    }

    this.editingExpenseId = expenseId;
    this.isLoadingExpense.set(true);

    try {
      const expense = await this.expensesService.getExpenseById(expenseId);
      if (!expense) {
        this.errorMessage.set('Expense not found.');
        return;
      }

      this.expenseForm.patchValue({
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        notes: expense.notes ?? '',
      });
    } finally {
      this.isLoadingExpense.set(false);
    }
  }

  async submitForm(): Promise<void> {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.expenseForm.getRawValue();

    this.errorMessage.set(null);
    this.isSaving.set(true);

    try {
      const normalizedExpenseDate = this.normalizeExpenseDate(
        formValue.expenseDate,
      );
      if (!normalizedExpenseDate) {
        this.errorMessage.set('Expense date is invalid.');
        return;
      }

      const payload: CreateExpenseInput | UpdateExpenseInput = {
        title: formValue.title,
        category: formValue.category,
        amount: Number(formValue.amount),
        expenseDate: normalizedExpenseDate,
        notes: formValue.notes,
      };

      if (this.isEditMode && this.editingExpenseId !== null) {
        await this.expensesService.updateExpense(
          this.editingExpenseId,
          payload,
        );
        this.openToast('Expense updated.');
      } else {
        await this.expensesService.createExpense(payload);
        this.openToast('Expense created.');
      }

      await this.expensesService.refreshExpenses();
      await this.navigateToExpenses();
    } catch {
      this.errorMessage.set('Could not save expense. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async cancel(): Promise<void> {
    await this.navigateToExpenses();
  }

  openDeleteConfirmation(): void {
    this.isDeleteAlertOpen.set(true);
  }

  closeDeleteConfirmation(): void {
    this.isDeleteAlertOpen.set(false);
  }

  async confirmDelete(): Promise<void> {
    if (!this.isEditMode || this.editingExpenseId === null) {
      this.closeDeleteConfirmation();
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    try {
      await this.expensesService.deleteExpense(this.editingExpenseId);
      await this.expensesService.refreshExpenses();
      this.openToast('Expense deleted.');
      await this.navigateToExpenses();
    } catch {
      this.errorMessage.set('Could not delete expense. Please try again.');
    } finally {
      this.isSaving.set(false);
      this.closeDeleteConfirmation();
    }
  }

  closeToast(): void {
    this.isToastOpen.set(false);
  }

  isFieldInvalid(fieldName: keyof typeof this.expenseForm.controls): boolean {
    const field = this.expenseForm.controls[fieldName];
    return field.invalid && (field.dirty || field.touched);
  }

  onExpenseDateChange(event: Event): void {
    const customEvent = event as CustomEvent<{
      value?: string | string[] | null;
    }>;
    const eventValue = customEvent.detail?.value;
    const selectedValue = Array.isArray(eventValue)
      ? eventValue[0]
      : eventValue;
    this.expenseForm.controls.expenseDate.setValue(selectedValue ?? '');
    this.expenseForm.controls.expenseDate.markAsDirty();
    this.expenseForm.controls.expenseDate.markAsTouched();
  }

  private normalizeExpenseDate(value: string): string | null {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  private openToast(message: string): void {
    this.toastMessage.set(message);
    this.isToastOpen.set(true);
  }

  private async navigateToExpenses(): Promise<void> {
    await this.router.navigateByUrl(this.expensesRoute);
  }
}
