import { normalizeRole } from '../../src/shared/utils/roles.js';

describe('normalizeRole', () => {
  it('maps dietician to dietitian', () => {
    expect(normalizeRole('dietician')).toBe('dietitian');
  });

  it('maps member to user', () => {
    expect(normalizeRole('member')).toBe('user');
  });

  it('normalizes case and spaces', () => {
    expect(normalizeRole('  ADMIN  ')).toBe('admin');
  });
});
