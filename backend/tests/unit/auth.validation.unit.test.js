import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../../src/modules/auth/auth.validation.js';

describe('auth.validation schemas', () => {
  it('accepts valid register payload', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      branch: 'Colombo Central',
      password: 'Pass1234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects register payload with invalid branch', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      branch: 'Invalid Branch',
      password: 'Pass1234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password in register payload', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      branch: 'Kandy',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid login and refresh payloads', () => {
    expect(loginSchema.safeParse({ identifier: 'user@example.com', password: 'Pass1234' }).success).toBe(true);
    expect(refreshSchema.safeParse({ token: 'refresh-token-value' }).success).toBe(true);
  });

  it('validates reset password confirmPassword match', () => {
    const ok = resetPasswordSchema.safeParse({
      token: '12345678901234567890',
      password: 'NewPass123',
      confirmPassword: 'NewPass123',
    });
    const bad = resetPasswordSchema.safeParse({
      token: '12345678901234567890',
      password: 'NewPass123',
      confirmPassword: 'Mismatch123',
    });

    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it('accepts valid forgot password payload', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'valid@example.com' });
    expect(result.success).toBe(true);
  });
});
