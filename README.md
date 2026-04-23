# Capacitor SQLite Demo (Angular)

A simple CRUD expenses app built with Angular, Ionic, Capacitor, and SQLite. Source code for the [step-by-step video tutorial](https://youtu.be/JJg2r1UIxlk).

> Looking for React? See the [React version](https://github.com/capawesome-team/capacitor-sqlite-react-demo).

## Features

- Create, edit, and delete expenses
- Local persistence with SQLite
- Schema creation via `upgradeStatements`
- Typed queries and parameterized statements
- Transactions with commit and rollback
- Database connection lifecycle management
- Web support via `@sqlite.org/sqlite-wasm`

[Check the demo](https://www.youtube.com/shorts/fL4NMJTvMlw)

## Built with

- Angular 21
- Ionic 8
- Capacitor 8
- [`@capawesome-team/capacitor-sqlite`](https://capawesome.io/plugins/sqlite/)


## Getting started

The SQLite plugin requires a [Capawesome Insiders](https://capawesome.io/insiders/) license key:

```bash
npm config set @capawesome-team:registry https://npm.registry.capawesome.io
npm config set //npm.registry.capawesome.io/:_authToken <YOUR_LICENSE_KEY>
```

Install dependencies and run:

```bash
npm install
npm start
```

To run on native platforms:

```bash
npm run build
npx cap sync
npx cap open android # or ios
```
