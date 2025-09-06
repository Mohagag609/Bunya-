# Application Architecture

This document outlines the architecture of the Real Estate Investment Manager desktop application. The application is built using Electron, with a Node.js backend for data access and a frontend that reuses the original web application's vanilla JavaScript, HTML, and CSS.

## Core Technologies

-   **Runtime:** [Electron](https://www.electronjs.org/)
-   **Database:** [SQLite](https://www.sqlite.org/index.html) (via `better-sqlite3`)
-   **Frontend:** HTML, CSS, Vanilla JavaScript
-   **Packaging:** [electron-builder](https://www.electron.build/)

## Directory Structure

The project is organized into the following main directories:

```
/
├── app/               # Renderer process files (UI)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── main/              # Main process files
│   ├── main.js        # Electron main entry point
│   └── preload.js     # Electron preload script
├── db/                # Data Access Layer (DAL)
│   ├── dal.js         # Main DAL module
│   ├── schema.sql     # Database schema definition
│   └── app.db         # SQLite database file (created at runtime)
├── migration/         # Migration-related files and reports
├── backups/           # Automatic database backups
├── logs/              # Application logs (future use)
├── tests/             # Test files
│   ├── e2e.spec.js    # End-to-end tests
│   └── ...
├── node_modules/      # Project dependencies
└── package.json       # NPM configuration
```

## Process Model

The application follows Electron's main/renderer process model to ensure security and performance.

### Main Process (`main/main.js`)

-   **Responsibilities:**
    -   Manages the application lifecycle (`app` events).
    -   Creates and manages the `BrowserWindow` (the application's UI).
    -   Acts as the sole interface to the database and file system.
    -   Listens for and responds to IPC (Inter-Process Communication) messages from the renderer.
-   **Security:**
    -   `nodeIntegration` is disabled in the renderer.
    -   `contextIsolation` is enabled. This is a critical security measure that prevents the renderer process from directly accessing Node.js APIs.

### Renderer Process (`app/`)

-   **Responsibilities:**
    -   Renders the user interface (HTML, CSS).
    -   Runs all the UI logic from the original application (`app.js`).
    -   Sends requests for data to the main process via the IPC bridge exposed by the preload script.
    -   Receives data from the main process and updates the DOM.
-   **Security:**
    -   The renderer process has no direct access to Node.js modules like `fs` or `better-sqlite3`. All data and system access must be requested through the secure IPC bridge.

### Preload Script (`main/preload.js`)

-   The preload script acts as a secure bridge between the renderer and main processes.
-   It uses `contextBridge` to expose a specific, limited API (`window.electronAPI`) to the renderer.
-   This API provides functions that the renderer can call (e.g., `electronAPI.run(...)`), which in turn use `ipcRenderer` to send messages to the main process handlers.

## Data Access Layer (DAL) (`db/`)

-   The DAL is responsible for all database operations. It is only ever imported and used in the **main process**.
-   It uses the `better-sqlite3` library for synchronous, high-performance SQLite access.
-   **`dal.js`**:
    -   Initializes the database connection.
    -   Applies the schema from `schema.sql` on first run.
    -   Provides transactional functions for complex operations (e.g., creating a contract).
    -   Provides generic helper functions (`run`, `get`, `all`) for simple queries.
-   **`schema.sql`**: Contains all `CREATE TABLE` statements, defining the application's data model, including relationships via foreign keys.
-   **`app.db`**: The SQLite database file. It is git-ignored and created in the `db` directory at runtime.

## Inter-Process Communication (IPC)

-   Communication between the renderer and main process is handled exclusively through asynchronous IPC channels.
-   **Example Flow (Adding a Customer):**
    1.  User fills the form in the renderer UI and clicks "Save".
    2.  The `addCustomer` function in `app.js` is called.
    3.  It calls `window.electronAPI.run('INSERT INTO ...', [params])`.
    4.  The preload script's `run` function sends an IPC message (`db:run`) to the main process with the SQL and parameters.
    5.  The `ipcMain.handle('db:run', ...)` handler in `main.js` receives the message.
    6.  The handler calls the `dal.run()` function, which executes the `INSERT` statement in the database.
    7.  The result (or any error) is returned back to the renderer via the promise chain.
    8.  `app.js` receives the successful result and optimistically updates the UI.
