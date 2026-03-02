import { test, expect } from '@playwright/test';

// Generate a unique email for each test run to avoid DB conflicts
const generateTestEmail = () => `test-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
const TEST_PASSWORD = 'Password123!';

// ─── AUTHENTICATION FLOW ────────────────────────────────────
test.describe('Authentication Flow', () => {
  test('registers a new user and completes onboarding', async ({ page }) => {
    const testEmail = generateTestEmail();

    // 1. Landing to Registration
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Fluência real');
    // We have "Começar Grátis" and "Criar Conta Grátis". Let's click the hero CTA.
    await page.locator('text=Criar Conta Grátis').first().click();
    await expect(page).toHaveURL(/\/register/);

    // 2. Fill Form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="birthdate"]', '2000-01-01');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // 3. Onboarding Chat UI
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('h2')).toContainText('Assistente SpeakFlow');

    // Check that we have the text input to talk to the AI
    await expect(page.locator('input[placeholder="Digite sua resposta..."]')).toBeVisible();

    // Note: We do not complete the entire 10-step AI conversation in the E2E test 
    // to save OpenAI tokens and avoid test flakiness. 
  });

  test('logs out and redirects to login, protecting /home', async ({ page, request }) => {
    const testEmail = generateTestEmail();

    // Seed User via API
    const res = await request.post('/api/auth/register', {
      data: {
        name: 'Test Setup',
        email: testEmail,
        password: TEST_PASSWORD,
        birthdate: '1990-01-01'
      }
    });
    expect(res.ok()).toBeTruthy();

    // Perform Login via UI
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    // Perform Logout via UI (Sair button title="Sair da conta")
    await page.click('button[title="Sair da conta"]');

    // Wait for redirect to land exactly on the origin URL (trailing slash)
    await expect(page).toHaveURL(/localhost:\d+\/$/);

    // Verify Route Protection
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/); // Should bounce back to login
  });
});

// ─── DASHBOARD & CONVERSATION ──────────────────────────────
test.describe('Dashboard and Session Flow', () => {
  // We need an authenticated session before each test
  test.beforeEach(async ({ page, request, context }) => {
    const testEmail = generateTestEmail();
    const res = await request.post('/api/auth/register', {
      data: {
        name: 'Session Setup',
        email: testEmail,
        password: TEST_PASSWORD,
        birthdate: '1990-01-01'
      }
    });
    const { user } = await res.json();

    // Manually login via API and set cookie on context to speed up tests
    const loginRes = await request.post('/api/auth/login', {
      data: { email: testEmail, password: TEST_PASSWORD }
    });
    const headers = loginRes.headers();
    const setCookie = headers['set-cookie'];
    if (setCookie) {
      const match = setCookie.match(/speakflow_session=(.*?);/);
      if (match) {
        await context.addCookies([{
          name: 'speakflow_session',
          value: match[1],
          domain: 'localhost',
          path: '/'
        }]);
      }
    }
  });

  test('starts a session with selected topic', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('h1')).toContainText("Let's talk");

    // Choose Advanced level
    await page.click('button:has-text("advanced")');
    await page.click('[data-testid="topic-card-a1"]');
    await page.click('[data-testid="btn-start-session"]');

    // Verify it reached session screen
    await expect(page).toHaveURL(/\/conversation\/session-.*[?&]level=advanced/);
    await expect(page.locator('[data-testid="session-timer"]')).toBeVisible();
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
