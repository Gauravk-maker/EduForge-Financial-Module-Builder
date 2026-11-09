import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('E2E-001 create a module with blocks', async ({ page }) => {
  await expect(page.getByLabel('Module title')).toBeVisible();
  await page
    .getByRole('button', { name: /Add a building block|Add block/i })
    .first()
    .click();
  await page.getByRole('button', { name: /Rich text/i }).click();
  await expect(
  page.getByRole('group', { name: /Rich text block, position 1 of/ })
    .getByText('RICH TEXT')
).toBeVisible();
});
test('preview device toggles', async ({ page }) => {
  await page.getByRole('button', { name: 'Mobile preview' }).click();
  await expect(page.locator('.preview-device')).toHaveClass(/mobile/);
  await page.getByRole('button', { name: 'Tablet preview' }).click();
  await expect(page.locator('.preview-device')).toHaveClass(/tablet/);
});
test('undo and redo', async ({ page }) => {
  await page.getByRole('button', { name: /Undo/ }).click();
  await page.getByRole('button', { name: /Redo/ }).click();
  await expect(page.locator('.canvas')).toBeVisible();
});
test('calculator appears in learner preview', async ({ page }) => {
  await expect(page.getByText('Home loan EMI calculator')).toBeVisible();
});
test('import picker and creator guide', async ({ page }) => {
  await page.getByRole('button', { name: 'Creator guide' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible();

await page.getByRole('button', { name: 'Got it' }).first().click();

await expect(page.getByRole('dialog')).not.toBeVisible();
});
