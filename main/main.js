const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../app/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

const fs = require('fs');

// IPC handlers
const dal = require('../db/dal');

ipcMain.handle('db:run', async (event, sql, params) => {
  return dal.run(sql, params);
});

ipcMain.handle('db:get', async (event, sql, params) => {
  return dal.get(sql, params);
});

ipcMain.handle('db:all', async (event, sql, params) => {
  return dal.all(sql, params);
});

ipcMain.handle('migration:import-sqlite', async (event, data) => {
  console.log("Received data for migration. Starting import...");
  const dbPath = path.join(__dirname, '../db/app.db');

  // 1. Backup existing database if it exists
  if (fs.existsSync(dbPath)) {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `app-${timestamp}.db`);
    console.log(`Backing up existing database to ${backupPath}`);
    fs.copyFileSync(dbPath, backupPath);
  }

  // 2. Perform the migration
  try {
    const report = dal.performMigration(data);
    console.log("Migration successful.");

    // 3. Write migration report
    const reportPath = path.join(__dirname, '../migration_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Migration report saved to ${reportPath}`);

    return { success: true, report };
  } catch (error) {
    console.error("Migration failed:", error);
    // In a real scenario, you might want to restore the backup here.
    return { success: false, error: error.message };
  }
});

ipcMain.handle('contracts:create', async (event, data) => {
  try {
    const result = dal.createContractTransaction(data);
    return { success: true, result };
  } catch (error) {
    console.error("Failed to create contract:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('contracts:delete', async (event, contractId, keepCommission) => {
  try {
    dal.deleteContractTransaction(contractId, keepCommission);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete contract:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('installments:pay', async (event, data) => {
    try {
        const result = dal.payInstallmentTransaction(data);
        return { success: true, result };
    } catch (error) {
        console.error("Failed to process payment:", error);
        return { success: false, error: error.message };
    }
});


app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
