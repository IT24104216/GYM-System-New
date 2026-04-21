import mongoose from 'mongoose';
import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

describe('Admin API', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  async function getAdminAuthHeader() {
    const admin = await createUser({
      name: `Admin ${uid()}`,
      email: `admin.${uid()}@example.com`,
      role: 'admin',
    });
    const loginResponse = await loginAs(app, { identifier: admin.email });
    return { admin, authHeader: { Authorization: `Bearer ${loginResponse.body.token}` } };
  }

  it('returns 200 for admin listing users (happy path)', async () => {
    const { authHeader } = await getAdminAuthHeader();

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set(authHeader);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('returns 401 for admin route without token', async () => {
    const response = await request(app).get('/api/v1/admin/users');
    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admin token on admin route', async () => {
    const user = await createUser({
      name: `User ${uid()}`,
      email: `user.${uid()}@example.com`,
      role: 'user',
    });
    const loginResponse = await loginAs(app, { identifier: user.email });

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid role update payload', async () => {
    const { authHeader } = await getAdminAuthHeader();
    const target = await createUser({
      name: `Target ${uid()}`,
      email: `target.${uid()}@example.com`,
      role: 'user',
    });

    const response = await request(app)
      .put(`/api/v1/admin/users/${target._id}`)
      .set(authHeader)
      .send({ role: 'superuser' });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain('Invalid role');
  });

  it('returns 404 when admin requests missing user id', async () => {
    const { authHeader } = await getAdminAuthHeader();
    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .get(`/api/v1/admin/users/${missingId}`)
      .set(authHeader);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('returns 409 when updating admin settings with existing email', async () => {
    const { admin, authHeader } = await getAdminAuthHeader();
    const existing = await createUser({
      name: `Existing ${uid()}`,
      email: `existing.${uid()}@example.com`,
      role: 'user',
    });

    const response = await request(app)
      .put('/api/v1/admin/settings')
      .set(authHeader)
      .send({
        adminId: String(admin._id),
        fullName: admin.name,
        email: existing.email,
        emailNotifications: true,
        pushNotifications: true,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already in use');
  });
});
