# Capacitor SQLite Demo (Angular)

A tutorial-first CRUD app for expenses built with Angular, Ionic, Capacitor, and SQLite.

- [We also have a React version](https://github.com/capawesome-team/capacitor-sqlite-react-demo)
- [Step by step video tutorial](https://youtu.be/JJg2r1UIxlk)

## What this app includes

- Expense list view with total amount summary.
- Create, edit, and delete flows for expenses.
- Local persistence with SQLite using the Capawesome plugin.
- A delete flow that uses a transaction and writes a deletion log record.

The project is intentionally small so you can use it as a reference for SQLite integration patterns in Capacitor apps.


## Tech stack

- Angular 21 (standalone components and signals)
- Ionic 8
- Capacitor 8
- [`@capawesome-team/capacitor-sqlite`](https://capawesome.io/plugins/sqlite/)
- `@sqlite.org/sqlite-wasm` for web runtime support

## Demo
https://github.com/user-attachments/assets/bb5a1d3d-9b8b-4171-8165-6e87bd128fb6


## App routes

- `/expenses` -> expense list page
- `/expenses/new` -> create expense page
- `/expenses/:id/edit` -> edit existing expense page

Unknown routes redirect to `/expenses`.

## SQLite schema

The app creates a single database file: `expenses.sqlite3`.

Schema is initialized in one version (`version: 1`) with these tables:

- `expenses`
  - `id`, `title`, `category`, `amount`, `expenseDate`, `notes`, `createdAt`, `updatedAt`
- `application_logs`
  - `id`, `expenseId`, `deletedAt`

## SQLite examples implemented in this app

### 1) Open database and create schema

`DatabaseService` opens the DB and runs the initial schema with `upgradeStatements`.

### 2) Generic query helper

`DatabaseService.query<T>(statement, values)` wraps `Sqlite.query(...)` and returns typed rows.

Used by `ExpensesService` for reads such as:

- `getAllExpenses()`
- `getExpenseById(id)`

### 3) Generic execute helper

`DatabaseService.execute(statement, values)` wraps `Sqlite.execute(...)` for inserts, updates, and deletes.

Used by `ExpensesService` for:

- `INSERT INTO expenses ...`
- `UPDATE expenses ...`
- `DELETE FROM expenses ...`
- `INSERT INTO application_logs ...`

### 4) Transaction example (multiple operations)

`ExpensesService.deleteExpense(...)` demonstrates a transaction:

- begins transaction
- inserts a deletion entry into `application_logs`
- deletes the expense from `expenses`
- commits transaction

`createExpense(...)` and `updateExpense(...)` are intentionally simple single-statement operations (no transaction/logging) to keep the demo easy to follow.

If any delete step fails, the code calls `rollbackTransaction()` and rethrows the error.

### 5) Connection lifecycle

The app opens the database at startup and closes it when the app is being destroyed:

- `AppComponent` initializes `DatabaseService` on startup.
- `DatabaseService.close()` is called on `window:beforeunload` and `ngOnDestroy()`.
- The close flow handles errors defensively and clears local connection state.

## Demo design choices

This project intentionally stays minimal:

- Schema stays on `version: 1` for a clean demo setup.
- No indexes to keep the schema easy to read.
- No multi-step migration chain.
- Only delete demonstrates transaction + logging.

## Project structure

```text
src/
  app/
    app.component.ts
    app.routes.ts
    models/
      expense.model.ts
    pages/
      expense-list/
      expense-form/
    services/
      database.ts
      expenses.ts
```

## Setup and run

### 1) Install dependencies

```bash
npm install
```

### 2) Configure Capawesome Insiders registry

This plugin requires a Capawesome Insiders license key.

```bash
npm config set @capawesome-team:registry https://npm.registry.capawesome.io
npm config set //npm.registry.capawesome.io/:_authToken <YOUR_LICENSE_KEY>
```

### 3) Run on web

```bash
npm start
```

You can also use:

```bash
ionic serve
```

### 4) Build and sync native projects

```bash
npm run build
npx cap sync
```

### 5) Open native projects

```bash
npx cap open android
npx cap open ios
```

## Web runtime notes

- The web build uses `@sqlite.org/sqlite-wasm`.
- WASM assets are copied to `assets/sqlite-wasm`.
- COOP/COEP headers are configured for local web serving.
- On web, `DatabaseService` calls `Sqlite.initialize(...)` with a worker before opening the database.

## Reset local data

If you want a clean demo state:

- If you previously ran an older version of this demo, reset local data so the schema is recreated without indexes.
- Web: clear site data (IndexedDB/OPFS) in the browser devtools.
- Android/iOS: uninstall the app from the device/emulator and reinstall.
- For this demo, schema is recreated from `version: 1` at first launch.
