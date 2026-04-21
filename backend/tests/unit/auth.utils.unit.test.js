import {
  escapeRegex,
  getBranchCode,
  hashResetToken,
  isLikelyEmail,
  isValidEmailFormat,
  toPublicUser,
} from '../../src/modules/auth/auth.utils.js';

describe('auth.utils', () => {
  it('detects likely email and validates format', () => {
    expect(isLikelyEmail('user@example.com')).toBe(true);
    expect(isLikelyEmail('username')).toBe(false);
    expect(isValidEmailFormat('user@example.com')).toBe(true);
    expect(isValidEmailFormat('user@')).toBe(false);
  });

  it('escapes regex special chars', () => {
    expect(escapeRegex('a+b?(x)')).toBe('a\\+b\\?\\(x\\)');
  });

  it('builds branch code from branch name', () => {
    expect(getBranchCode('Colombo Central')).toBe('CC');
    expect(getBranchCode('Kandy')).toBe('KA');
    expect(getBranchCode('')).toBe('BR');
  });

  it('hashes reset token deterministically', () => {
    const a = hashResetToken('abc123');
    const b = hashResetToken('abc123');
    const c = hashResetToken('xyz789');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
  });

  it('maps private user document to public user payload', () => {
    const mapped = toPublicUser({
      _id: 'u1',
      branchUserId: 'CC0001',
      name: 'Test User',
      email: 'test@example.com',
      role: 'dietician',
      status: 'active',
      branch: 'Colombo Central',
      notificationPreferences: { email: true, push: false },
    });

    expect(mapped).toMatchObject({
      id: 'u1',
      role: 'dietitian',
      branchUserId: 'CC0001',
      email: 'test@example.com',
    });
  });
});
