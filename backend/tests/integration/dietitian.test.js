import mongoose from 'mongoose';
import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

describe('Dietitian API', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  async function createDietitianAuth() {
    const dietitian = await createUser({
      name: `Dietitian ${Date.now()}`,
      email: `dietitian.${Date.now()}@example.com`,
      role: 'dietitian',
    });
    const login = await loginAs(app, { identifier: dietitian.email });
    return {
      dietitian,
      authHeader: { Authorization: `Bearer ${login.body.token}` },
    };
  }

  it('creates a dietitian slot (201 happy path)', async () => {
    const { dietitian, authHeader } = await createDietitianAuth();

    const response = await request(app)
      .post(`/api/v1/dietitian/scheduling/${dietitian._id}`)
      .set(authHeader)
      .send({
        date: tomorrowIso(),
        startTime: '09:00',
        endTime: '10:00',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      dietitianId: String(dietitian._id),
      startTime: '09:00',
      endTime: '10:00',
    });
  });

  it('returns 401 for create slot without token', async () => {
    const dietitian = await createUser({
      name: `Dietitian NoToken ${Date.now()}`,
      email: `dietitian.notoken.${Date.now()}@example.com`,
      role: 'dietitian',
    });

    const response = await request(app)
      .post(`/api/v1/dietitian/scheduling/${dietitian._id}`)
      .send({
        date: tomorrowIso(),
        startTime: '10:00',
        endTime: '11:00',
      });

    expect(response.status).toBe(401);
  });

  it('returns 403 for non-dietitian token on create slot', async () => {
    const dietitian = await createUser({
      name: `Dietitian Target ${Date.now()}`,
      email: `dietitian.target.${Date.now()}@example.com`,
      role: 'dietitian',
    });
    const user = await createUser({
      name: `User ${Date.now()}`,
      email: `user.${Date.now()}@example.com`,
      role: 'user',
    });
    const login = await loginAs(app, { identifier: user.email });

    const response = await request(app)
      .post(`/api/v1/dietitian/scheduling/${dietitian._id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        date: tomorrowIso(),
        startTime: '11:00',
        endTime: '12:00',
      });

    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid slot payload', async () => {
    const { dietitian, authHeader } = await createDietitianAuth();

    const response = await request(app)
      .post(`/api/v1/dietitian/scheduling/${dietitian._id}`)
      .set(authHeader)
      .send({
        date: '21-03-2026',
        startTime: '9AM',
        endTime: '8AM',
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain('Validation failed');
  });

  it('returns 404 for admin token when dietitian id does not exist', async () => {
    const admin = await createUser({
      name: `Admin ${Date.now()}`,
      email: `admin.${Date.now()}@example.com`,
      role: 'admin',
    });
    const login = await loginAs(app, { identifier: admin.email });
    const missingDietitianId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post(`/api/v1/dietitian/scheduling/${missingDietitianId}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        date: tomorrowIso(),
        startTime: '14:00',
        endTime: '15:00',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Dietitian not found');
  });

  it('returns 409 for overlapping slot conflict', async () => {
    const { dietitian, authHeader } = await createDietitianAuth();
    const payload = {
      date: tomorrowIso(),
      startTime: '15:00',
      endTime: '16:00',
    };

    const first = await request(app)
      .post(`/api/v1/dietitian/scheduling/${dietitian._id}`)
      .set(authHeader)
      .send(payload);
    expect(first.status).toBe(201);

    const conflict = await request(app)
      .post(`/api/v1/dietitian/scheduling/${dietitian._id}`)
      .set(authHeader)
      .send({
        date: payload.date,
        startTime: '15:30',
        endTime: '16:30',
      });

    expect(conflict.status).toBe(409);
    expect(conflict.body.message).toContain('overlaps');
  });
});
