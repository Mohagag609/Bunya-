const { test, expect, _electron: electron } = require('@playwright/test');

let electronApp;
let window;

test.beforeAll(async () => {
  // Launch the electron app.
  electronApp = await electron.launch({ args: ['main/main.js'] });
  // Get the first window that the app opens.
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  // Exit the app.
  await electronApp.close();
});

test('App starts and loads dashboard', async () => {
  await window.waitForSelector('#tabs');
  const title = await window.title();
  expect(title).toBe('مدير الاستثمار العقاري — النسخة النهائية (محلي) — محدثة');

  const dashTab = window.locator('#tab-dash');
  await expect(dashTab).toHaveClass(/active/);
});

test('Create a new customer', async () => {
  // Navigate to customers tab
  await window.locator('#tab-customers').click();

  // Wait for the add customer form to be visible
  await window.waitForSelector('#c-name');

  const customerName = `Test Customer ${Date.now()}`;
  const customerPhone = '0123456789';

  // Fill in the form
  await window.locator('#c-name').fill(customerName);
  await window.locator('#c-phone').fill(customerPhone);

  // Click the save button
  await window.locator('button:has-text("حفظ")').click();

  // Wait for the alert and accept it
  window.on('dialog', dialog => dialog.accept());

  // Check if the new customer appears in the table
  const newCustomerRow = window.locator(`#c-list tr:has-text("${customerName}")`);
  await expect(newCustomerRow).toBeVisible();
  await expect(newCustomerRow).toContainText(customerPhone);
});

test.skip('Create a new unit', async () => {
  // This test is skipped because it's a placeholder.
  // 1. Navigate to Units tab
  // 2. Fill in the form for a new unit
  // 3. Select a partner group
  // 4. Click save
  // 5. Expect to be navigated to the unit details page
  // 6. Verify the unit details
});

test.skip('Create a new contract', async () => {
  // This test is skipped because it's a placeholder.
  // This is a complex flow that requires a customer and a unit to exist first.
  // 1. Navigate to Contracts tab
  // 2. Select a unit and a customer
  // 3. Fill in contract details (down payment, etc.)
  // 4. Generate installments
  // 5. Click save
  // 6. Verify the new contract appears in the list
});
