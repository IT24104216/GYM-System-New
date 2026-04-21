import { clearAuth, getToken, getUser, setToken, setUser } from './storage.js';

describe('shared storage utils', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('sets and gets token', () => {
    setToken('abc-token');
    expect(getToken()).toBe('abc-token');
  });

  it('sets and gets user', () => {
    const user = { id: 'u1', role: 'admin' };
    setUser(user);
    expect(getUser()).toEqual(user);
  });

  it('returns null when user json is invalid', () => {
    window.localStorage.setItem('gympro_user', '{bad-json');
    expect(getUser()).toBeNull();
  });

  it('clears auth data', () => {
    setToken('abc-token');
    setUser({ id: 'u1' });
    clearAuth();
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });
});
