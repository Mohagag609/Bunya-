# Data Migration

This document describes the one-time data migration process that moves data from the application's original IndexedDB storage to the new SQLite database. This process is designed to be automatic, safe, and idempotent.

## Overview

The migration runs automatically on the first launch of the new Electron application. It detects if a migration is needed, exports all existing data from IndexedDB, backs up any current SQLite database, and then imports the data into the new SQLite database within a single, safe transaction.

## Triggering the Migration

1.  **Flag Check:** On application startup, the `initializeApp` function in `app/app.js` checks for a key named `sqlite_migration_complete` in the SQLite `keyval` table.
2.  **Execution:**
    -   If the flag is `true`, the application proceeds with normal startup, loading data from SQLite.
    -   If the flag is not present or `false`, the application initiates the migration flow.

## Migration Flow

The migration is a coordinated effort between the Renderer Process (which has access to IndexedDB) and the Main Process (which has access to SQLite).

### Step 1: Data Export (Renderer Process)

-   When the migration is triggered, a temporary UI message is shown to the user, informing them that a migration is in progress.
-   A special function, `exportAllFromIndexedDB()`, is called within `app/app.js`.
-   This function uses the standard `indexedDB.open()` Web API to connect to the legacy `estate_pro_db` database.
-   It iterates through all existing `objectStoreNames` and uses `store.getAll()` to dump the entire contents of each store into a JavaScript object.
    ```javascript
    // The resulting data structure
    const exportedData = {
        customers: [ ... ],
        units: [ ... ],
        // ... and so on for all object stores
    };
    ```
-   If no data is found, the migration is considered complete, the flag is set, and the app restarts.

### Step 2: Data Import (Main Process)

-   The renderer process sends the `exportedData` object to the main process via a single IPC call: `window.electronAPI.importToSqlite(exportedData)`.
-   An `ipcMain` handler (`migration:import-sqlite`) in `main/main.js` receives the data.

### Step 3: Backup

-   Before writing any new data, the `migration:import-sqlite` handler first checks if a `db/app.db` file already exists.
-   If it does, it is copied to `backups/app-{timestamp}.db` as a safety measure.

### Step 4: Transactional Import

-   The main process passes the data to the `performMigration(data)` function in the Data Access Layer (`db/dal.js`).
-   This function performs the entire import within a single `better-sqlite3` transaction. This ensures that the migration is **atomic**: it either completes fully or fails without leaving the database in a partial state.
-   The import process is as follows:
    1.  **Clear Data:** All tables are cleared of any existing data using `DELETE FROM`.
    2.  **Insertion Order:** Data is inserted in a specific order to respect foreign key constraints (e.g., `customers` are inserted before `contracts`).
    3.  **Data Transformation:**
        -   **Brokers:** The `brokerName` from old contracts is mapped to the new `brokerId` foreign key.
        -   **Partner Groups:** The denormalized `partners` array in the `partnerGroups` object is normalized into the new `partnerGroupMembers` junction table.
        -   **JSON Data:** Fields containing JSON objects (like `details` in `auditLog`) are stringified before insertion.
    4.  **Prepared Statements:** The import loop uses prepared `INSERT` statements for high performance.

### Step 5: Reporting and Finalization

-   If the transaction is successful, the `performMigration` function returns a report object containing the number of records processed for each table.
-   The `migration:import-sqlite` handler writes this report to `migration_report.json`.
-   The handler returns a success message to the renderer.
-   The renderer then calls `setKeyVal('sqlite_migration_complete', true)` to set the flag in the database, preventing the migration from running again.
-   Finally, the renderer shows an alert to the user and calls `location.reload()` to restart the application in a clean state, ensuring it loads all data fresh from the newly populated SQLite database.

## Error Handling

-   If any part of the database transaction in `performMigration` fails, the entire transaction is automatically rolled back by `better-sqlite3`, leaving the database in its pre-migration state.
-   The error is propagated back to the renderer, which displays an error message to the user, halting the application. The user can then inspect the logs and the backup to diagnose the issue.
