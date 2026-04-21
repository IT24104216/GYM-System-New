import { authorizeRoles } from '../../src/shared/middleware/auth/authorizeRoles.js';

const createRes = () => {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
  return res;
};

describe('authorizeRoles middleware', () => {
  it('returns 401 when user role is missing', () => {
    const middleware = authorizeRoles('admin');
    const req = { user: {} };
    const res = createRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not allowed', () => {
    const middleware = authorizeRoles('admin');
    const req = { user: { role: 'user' } };
    const res = createRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when role is allowed', () => {
    const middleware = authorizeRoles('admin', 'dietitian');
    const req = { user: { role: 'dietician' } };
    const res = createRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
