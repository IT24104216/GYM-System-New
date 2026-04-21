import assert from 'node:assert/strict';
import { requireOwnership } from '../src/shared/middleware/auth/requireOwnership.js';

const runGuard = (guard, req) =>
  new Promise((resolve) => {
    const state = { statusCode: null, body: null, nextCalled: false };
    const res = {
      status(code) {
        state.statusCode = code;
        return {
          json(payload) {
            state.body = payload;
            resolve(state);
          },
        };
      },
    };
    const next = () => {
      state.nextCalled = true;
      resolve(state);
    };
    guard(req, res, next);
  });

try {
  const guard = requireOwnership({ checks: [{ from: 'query', key: 'userId' }], allowRoles: ['admin'] });

  const mismatch = await runGuard(guard, {
    user: { id: 'user-1', role: 'user' },
    query: { userId: 'user-2' },
  });
  assert.equal(mismatch.statusCode, 403, 'Expected 403 for ownership mismatch');
  assert.equal(mismatch.nextCalled, false, 'Next must not be called on mismatch');

  const ownerMatch = await runGuard(guard, {
    user: { id: 'user-1', role: 'user' },
    query: { userId: 'user-1' },
  });
  assert.equal(ownerMatch.nextCalled, true, 'Expected next() for owner match');

  const adminBypass = await runGuard(guard, {
    user: { id: 'admin-1', role: 'admin' },
    query: { userId: 'user-2' },
  });
  assert.equal(adminBypass.nextCalled, true, 'Expected next() for admin bypass');

  console.log('Ownership guard smoke tests passed.');
  process.exitCode = 0;
} catch (error) {
  console.error('Ownership guard smoke tests failed:', error?.message || error);
  process.exitCode = 1;
}
