import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'expenses',
    loadComponent: () =>
      import('./pages/expense-list/expense-list.component').then(
        (module) => module.ExpenseListComponent,
      ),
  },
  {
    path: 'expenses/new',
    loadComponent: () =>
      import('./pages/expense-form/expense-form.component').then(
        (module) => module.ExpenseFormComponent,
      ),
  },
  {
    path: 'expenses/:id/edit',
    loadComponent: () =>
      import('./pages/expense-form/expense-form.component').then(
        (module) => module.ExpenseFormComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'expenses',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'expenses',
  },
];
