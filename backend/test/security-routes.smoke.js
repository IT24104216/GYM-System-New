import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

const { app } = await import('../src/app.js');

const server = await new Promise((resolve) => {
  const instance = app.listen(0, () => resolve(instance));
});

const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}/api/v1`;

try {
  const healthRes = await fetch(`${baseUrl}/health`);
  assert.equal(healthRes.status, 200, 'Expected public health endpoint to return 200');

  const protectedGetUrls = [
    `${baseUrl}/admin/users`,
    `${baseUrl}/workouts/plans`,
    `${baseUrl}/progress/123`,
    `${baseUrl}/lockers/list`,
    `${baseUrl}/promotions/list`,
    `${baseUrl}/notifications/list?userId=123`,
    `${baseUrl}/meal-plans/user-plan?userId=123`,
  ];

  for (const url of protectedGetUrls) {
    const res = await fetch(url);
    assert.equal(res.status, 401, `Expected 401 for unauthenticated request: ${url}`);
  }

  console.log('Security smoke tests passed.');
  process.exitCode = 0;
} catch (error) {
  console.error('Security smoke tests failed:', error?.message || error);
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
}
