import { test, expect, Page } from '@playwright/test';

const BASE = 'http://127.0.0.1:8788';

// Helper: add a shopping item directly via localStorage so we can test the list UI
async function seedShoppingList(page: Page) {
  await page.evaluate(() => {
    const item = {
      id: 'test-1',
      name: 'Молоко',
      amount: '1 л',
      category: 'Молочні',
      checked: false,
    };
    const raw = localStorage.getItem('meal-planner-storage');
    const state = raw ? JSON.parse(raw) : {};
    state.state = state.state || {};
    state.state.shoppingList = [item];
    localStorage.setItem('meal-planner-storage', JSON.stringify(state));
  });
  await page.reload();
}

test.describe('Shopping list page', () => {
  test('renders empty state', async ({ page }) => {
    await page.goto(`${BASE}/shopping`);
    await expect(page.getByText('Список порожній')).toBeVisible();
  });

  test('shows items and "Знайти в магазині" button when list has items', async ({ page }) => {
    await page.goto(`${BASE}/shopping`);
    await seedShoppingList(page);
    await expect(page.getByText('Молоко')).toBeVisible();
    await expect(page.getByText(/Знайти в|Увійти в zakaz/)).toBeVisible();
  });
});

test.describe('ZakazAuthSheet — city/store/login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/shopping`);
    await seedShoppingList(page);
    // Click the "find in store" / "login to zakaz" button
    await page.getByText(/Увійти в zakaz|Знайти в/).click();
  });

  test('opens auth sheet with city list', async ({ page }) => {
    await expect(page.getByText('Ваше місто')).toBeVisible();
    await expect(page.getByText('Київ')).toBeVisible();
    await expect(page.getByText('Львів')).toBeVisible();
  });

  test('city → store selection shows store list', async ({ page }) => {
    await page.getByText('Київ').click();
    await expect(page.getByText('Auchan Київ')).toBeVisible();
    await expect(page.getByText('Metro Київ')).toBeVisible();
  });

  test('store selection shows phone+password login form', async ({ page }) => {
    await page.getByText('Київ').click();
    await page.getByText('Auchan Київ').click();
    await expect(page.getByPlaceholder(/Номер телефону/)).toBeVisible();
    await expect(page.getByPlaceholder('Пароль')).toBeVisible();
    await expect(page.getByText('Увійти та підключити кошик')).toBeVisible();
  });

  test('submit button is disabled when fields are empty', async ({ page }) => {
    await page.getByText('Київ').click();
    await page.getByText('Auchan Київ').click();
    const btn = page.getByText('Увійти та підключити кошик');
    await expect(btn).toBeDisabled();
  });

  test('submit button enables when both fields filled', async ({ page }) => {
    await page.getByText('Київ').click();
    await page.getByText('Auchan Київ').click();
    await page.getByPlaceholder(/Номер телефону/).fill('0991234567');
    await page.getByPlaceholder('Пароль').fill('somepassword');
    const btn = page.getByText('Увійти та підключити кошик');
    await expect(btn).toBeEnabled();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.getByText('Київ').click();
    await page.getByText('Auchan Київ').click();
    await page.getByPlaceholder(/Номер телефону/).fill('0991234567');
    await page.getByPlaceholder('Пароль').fill('wrongpassword123');
    await page.getByText('Увійти та підключити кошик').click();
    await expect(page.getByText(/Невірний номер|Помилка/)).toBeVisible({ timeout: 15000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.getByText('Київ').click();
    await page.getByText('Auchan Київ').click();
    const input = page.getByPlaceholder('Пароль');
    await expect(input).toHaveAttribute('type', 'password');
    await page.getByLabel('Показати пароль').click();
    await expect(input).toHaveAttribute('type', 'text');
  });
});

test.describe('API endpoints', () => {
  test('zakaz-search returns results', async ({ request }) => {
    const res = await request.get(`${BASE}/api/zakaz-search?q=молоко&storeId=48246401&chain=auchan&per_page=5&page=1`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.count).toBeGreaterThan(0);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0]).toHaveProperty('title');
    expect(data.results[0]).toHaveProperty('image');
    expect(data.results[0]).toHaveProperty('price');
  });

  test('zakaz-login returns 400 on missing chain', async ({ request }) => {
    const res = await request.post(`${BASE}/api/zakaz-login`, {
      data: { phone: '0991234567', password: 'test' },
    });
    expect(res.status()).toBe(400);
  });

  test('zakaz-login returns 401 on wrong credentials', async ({ request }) => {
    const res = await request.post(`${BASE}/api/zakaz-login`, {
      data: { chain: 'auchan', phone: '0991234567', password: 'wrongpassword123' },
    });
    expect(res.status()).toBe(401);
  });

  test('zakaz-image proxy serves real image', async ({ request }) => {
    const imgUrl = 'https://img2.zakaz.ua/36d57d0ab9ac47ce8615ea1c2adb475c/1691490862-s350x350.jpg';
    const res = await request.get(`${BASE}/api/zakaz-image?src=${encodeURIComponent(imgUrl)}`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toMatch(/^image\//);
  });

  test('zakaz-image blocks non-allowed host', async ({ request }) => {
    const res = await request.get(`${BASE}/api/zakaz-image?src=${encodeURIComponent('https://evil.com/img.jpg')}`);
    expect(res.status()).toBe(403);
  });
});
