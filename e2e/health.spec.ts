import { test, expect } from '@playwright/test';

// Basic availability check for the health endpoint.
test('health endpoint returns ok response', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload).toEqual({
    ok: true,
    ts: expect.any(String),
  });
});
