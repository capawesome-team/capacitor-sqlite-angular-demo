import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Sqlite } from '@capawesome-team/capacitor-sqlite';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private readonly platform = Capacitor.getPlatform();
  private readonly isWebPlatform = this.platform === 'web';
  private databaseId: string | null = null;
  private initializingPromise: Promise<string> | null = null;

  async initialize(): Promise<void> {
    await this.ensureDatabase();
  }

  async query<T>(
    statement: string,
    values: Array<string | number | null> = [],
  ): Promise<T[]> {
    const databaseId = await this.ensureDatabase();
    const result = await Sqlite.query({
      databaseId,
      statement,
      values,
    });
    const rows = result.rows ?? [];
    if (rows.length === 0) {
      return [];
    }

    const firstRow = rows[0] as unknown;
    const isArrayRows = Array.isArray(firstRow);
    if (!isArrayRows) {
      return rows as unknown as T[];
    }

    const columns = result.columns ?? [];
    return rows.map((row) => {
      const rowValues = row as unknown[];
      return columns.reduce<Record<string, unknown>>(
        (accumulator, column, index) => {
          accumulator[column] = rowValues[index] ?? null;
          return accumulator;
        },
        {},
      );
    }) as unknown as T[];
  }

  async execute(
    statement: string,
    values: Array<string | number | null> = [],
  ): Promise<void> {
    const databaseId = await this.ensureDatabase();
    await Sqlite.execute({
      databaseId,
      statement,
      values,
    });
  }

  async beginTransaction(): Promise<void> {
    const databaseId = await this.ensureDatabase();
    await Sqlite.beginTransaction({ databaseId });
  }

  async commitTransaction(): Promise<void> {
    const databaseId = await this.ensureDatabase();
    await Sqlite.commitTransaction({ databaseId });
  }

  async rollbackTransaction(): Promise<void> {
    const databaseId = await this.ensureDatabase();
    await Sqlite.rollbackTransaction({ databaseId });
  }

  async close(): Promise<void> {
    const databaseId = await this.getOpenDatabaseId();
    if (!databaseId) {
      return;
    }

    try {
      await Sqlite.close({ databaseId });
    } catch (error) {
      console.warn('Failed to close SQLite database.', error);
    } finally {
      this.databaseId = null;
      this.initializingPromise = null;
    }
  }

  private async ensureDatabase(): Promise<string> {
    if (this.databaseId) {
      return this.databaseId;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = this.openDatabase();

    try {
      this.databaseId = await this.initializingPromise;
      return this.databaseId;
    } finally {
      this.initializingPromise = null;
    }
  }

  private async getOpenDatabaseId(): Promise<string | null> {
    if (this.databaseId) {
      return this.databaseId;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    return null;
  }

  private async openDatabase(): Promise<string> {
    if (this.isWebPlatform) {
      await Sqlite.initialize({
        worker: new Worker('/assets/sqlite-wasm/sqlite3-worker1.mjs', {
          type: 'module',
        }),
      });
    }

    const { databaseId } = await Sqlite.open({
      path: 'expenses.sqlite3',
      version: 1,
      upgradeStatements: [
        {
          version: 1,
          statements: [
            `CREATE TABLE IF NOT EXISTS expenses (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              category TEXT NOT NULL,
              amount REAL NOT NULL,
              expenseDate TEXT NOT NULL,
              notes TEXT,
              createdAt TEXT NOT NULL,
              updatedAt TEXT NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS application_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              expenseId INTEGER NOT NULL,
              deletedAt TEXT NOT NULL
            )`,
          ],
        },
      ],
    });

    return databaseId;
  }
}
