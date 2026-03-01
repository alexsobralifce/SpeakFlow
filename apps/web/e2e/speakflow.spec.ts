import { test, expect } from '@playwright/test';

// ─── ONBOARDING ────────────────────────────────────────────
test.describe('Onboarding Flow', () => {
  test('shows step 1 on /onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('h1')).toContainText('What is your English level?');
    await expect(page.locator('[data-testid="level-beginner"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-intermediate"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-advanced"]')).toBeVisible();
  });

  test('advances to step 2 after selecting a level', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('[data-testid="level-intermediate"]');
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('h1')).toContainText('What is your main goal?');
  });

  test('advances to step 3 after selecting a goal', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('[data-testid="level-intermediate"]');
    await page.click('[data-testid="btn-next"]');
    await page.click('[data-testid="goal-travel"]');
    await page.click('[data-testid="btn-next"]');
    await expect(page.locator('h1')).toContainText('Pick a scenario');
  });

  test('redirects to /home after finishing onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await page.click('[data-testid="level-intermediate"]');
    await page.click('[data-testid="btn-next"]');
    await page.click('[data-testid="goal-travel"]');
    await page.click('[data-testid="btn-next"]');
    await page.click('[data-testid="scenario-coffee-shop"]');
    await page.click('[data-testid="btn-finish"]');
    await expect(page).toHaveURL('/home');
  });
});

// ─── HOME DASHBOARD ───────────────────────────────────────
test.describe('Home Dashboard', () => {
  test('shows dashboard headline and start button', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('h1')).toContainText('Ready to practice');
    await expect(page.locator('[data-testid="btn-start-session"]')).toBeVisible();
  });

  test('navigates to conversation from home', async ({ page }) => {
    await page.goto('/home');
    await page.click('[data-testid="btn-start-session"]');
    await expect(page).toHaveURL(/\/conversation\/.*/);
  });
});

// ─── CONVERSATION SCREEN ──────────────────────────────────
test.describe('Conversation Screen', () => {
  test('shows initial UI before session starts', async ({ page }) => {
    await page.goto('/conversation/e2e-test-session');
    await expect(page.locator('[data-testid="session-timer"]')).toContainText('10:00');
    await expect(page.locator('[data-testid="btn-start-session"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-mic"]')).toBeVisible();
  });

  test('shows End Session button after starting', async ({ page }) => {
    await page.goto('/conversation/e2e-test-session');
    await page.click('[data-testid="btn-start-session"]');
    await expect(page.locator('[data-testid="btn-end-session"]')).toBeVisible();
  });

  test('CC toggle changes label', async ({ page }) => {
    await page.goto('/conversation/e2e-test-session');
    const ccBtn = page.locator('[data-testid="btn-cc-toggle"]');
    await expect(ccBtn).toContainText('Hide CC');
    await ccBtn.click();
    await expect(ccBtn).toContainText('Show CC');
  });
});

// ─── FEEDBACK SCREEN ─────────────────────────────────────
test.describe('Feedback Screen', () => {
  test('shows feedback report page', async ({ page }) => {
    await page.goto('/feedback/mock-session-123');
    await expect(page.locator('h1')).toContainText('Session Feedback');
    await expect(page.locator('[data-testid="score-fluency"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-vocabulary"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-grammar"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-practice-again"]')).toBeVisible();
  });
});
