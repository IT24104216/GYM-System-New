import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

describe('Access Matrix', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  it('returns 401 for protected admin route without token', async () => {
    const response = await request(app).get('/api/v1/admin/users');
    expect(response.status).toBe(401);
  });

  it('returns 403 for user token on admin route', async () => {
    const user = await createUser({
      name: 'Normal User',
      email: 'user.access@example.com',
      role: 'user',
    });
    const loginResponse = await loginAs(app, { identifier: user.email });
    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('returns 200 for admin token on admin route', async () => {
    const admin = await createUser({
      name: 'Admin User',
      email: 'admin.access@example.com',
      role: 'admin',
    });
    const loginResponse = await loginAs(app, { identifier: admin.email });
    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
