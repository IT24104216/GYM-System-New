import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

describe('Ownership Guards', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  it('blocks user from reading another user progress', async () => {
    const owner = await createUser({
      name: 'Owner User',
      email: 'owner.user@example.com',
      role: 'user',
    });
    const other = await createUser({
      name: 'Other User',
      email: 'other.user@example.com',
      role: 'user',
    });

    const loginResponse = await loginAs(app, { identifier: owner.email });
    const token = loginResponse.body.token;

    const response = await request(app)
      .get(`/api/v1/progress/${other._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('allows user to read own progress', async () => {
    const owner = await createUser({
      name: 'Self User',
      email: 'self.user@example.com',
      role: 'user',
    });
    const loginResponse = await loginAs(app, { identifier: owner.email });
    const token = loginResponse.body.token;

    const response = await request(app)
      .get(`/api/v1/progress/${owner._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data.userId).toBe(String(owner._id));
  });
});
