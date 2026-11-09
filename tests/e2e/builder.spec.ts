
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');

  // Dismiss the first-visit tutorial if it is displayed.
  const tutorialButton = page.getByRole('button', { name: 'Got it' });

  if (await tutorialButton.isVisible().catch(() => false)) {
    await tutorialButton.click();
  }

  await expect(page.getByLabel('Module title')).toBeVisible();
});

test('E2E-001 create a module with blocks', async ({ page }) => {
  await page
    .getByRole('button', { name: /Add a building block|Add block/i })
    .first()
    .click();

  await page.getByRole('button', { name: /Rich text/i }).click();

  await expect(
    page.getByRole('group', {
      name: /Rich text block, position 4 of 4/i,
    }),
  ).toBeVisible();
});

test('preview device toggles', async ({ page }) => {
  await page.getByRole('button', { name: 'Mobile preview' }).click();

  await expect(page.locator('.preview-device')).toHaveClass(/mobile/);

  await page.getByRole('button', { name: 'Tablet preview' }).click();

  await expect(page.locator('.preview-device')).toHaveClass(/tablet/);
});

test('undo and redo', async ({ page }) => {
  const titleInput = page.getByLabel('Module title');

  await titleInput.fill('EduForge E2E Test Module');

  await page.getByRole('button', { name: /Undo/ }).click();

  await expect(titleInput).not.toHaveValue('EduForge E2E Test Module');

  await page.getByRole('button', { name: /Redo/ }).click();

  await expect(titleInput).toHaveValue('EduForge E2E Test Module');

  await expect(page.locator('.canvas')).toBeVisible();
});

test('calculator appears in learner preview', async ({ page }) => {
  await expect(
    page.getByText('Home loan EMI calculator'),
  ).toBeVisible();
});

test('import picker and creator guide', async ({ page }) => {
  await page.getByRole('button', { name: 'Creator guide' }).click();

  const dialog = page.getByRole('dialog', {
    name: 'Creator quick guide',
  });

  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Got it' }).click();

  await expect(dialog).not.toBeVisible();
});
