import { test, expect } from '@playwright/test';

test('homepage loads and has correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('internetmatt');
});

test('homepage has main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'internetmatt' })).toBeVisible();
});
