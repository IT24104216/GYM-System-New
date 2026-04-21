import mongoose from 'mongoose';
import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

describe('Coach API', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  async function createCoachAuth() {
    const coach = await createUser({
      name: `Coach ${Date.now()}`,
      email: `coach.${Date.now()}@example.com`,
      role: 'coach',
    });
    const login = await loginAs(app, { identifier: coach.email });
    return {
      coach,
      authHeader: { Authorization: `Bearer ${login.body.token}` },
    };
  }

  it('creates a coach slot (201 happy path)', async () => {
    const { coach, authHeader } = await createCoachAuth();

    const response = await request(app)
      .post(`/api/v1/coach/scheduling/${coach._id}`)
      .set(authHeader)
      .send({
        date: tomorrowIso(),
        startTime: '09:00',
        endTime: '10:00',
        sessionType: 'Online',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      coachId: String(coach._id),
      startTime: '09:00',
      endTime: '10:00',
      sessionType: 'Online',
    });
  });

  it('returns 401 for create slot without token', async () => {
    const coach = await createUser({
      name: `Coach NoToken ${Date.now()}`,
      email: `coach.notoken.${Date.now()}@example.com`,
      role: 'coach',
    });

    const response = await request(app)
      .post(`/api/v1/coach/scheduling/${coach._id}`)
      .send({
        date: tomorrowIso(),
        startTime: '10:00',
        endTime: '11:00',
      });

    expect(response.status).toBe(401);
  });

  it('returns 403 for non-coach token on create slot', async () => {
    const coach = await createUser({
      name: `Coach Target ${Date.now()}`,
      email: `coach.target.${Date.now()}@example.com`,
      role: 'coach',
    });
    const user = await createUser({
      name: `User ${Date.now()}`,
      email: `user.${Date.now()}@example.com`,
      role: 'user',
    });
    const login = await loginAs(app, { identifier: user.email });

    const response = await request(app)
      .post(`/api/v1/coach/scheduling/${coach._id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        date: tomorrowIso(),
        startTime: '11:00',
        endTime: '12:00',
      });

    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid slot payload', async () => {
    const { coach, authHeader } = await createCoachAuth();

    const response = await request(app)
      .post(`/api/v1/coach/scheduling/${coach._id}`)
      .set(authHeader)
      .send({
        date: '21-03-2026',
        startTime: '9AM',
        endTime: '8AM',
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain('Validation failed');
  });

  it('returns 403 when coach tries to access another coach id', async () => {
    const { authHeader } = await createCoachAuth();
    const missingCoachId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post(`/api/v1/coach/scheduling/${missingCoachId}`)
      .set(authHeader)
      .send({
        date: tomorrowIso(),
        startTime: '14:00',
        endTime: '15:00',
      });

    expect(response.status).toBe(403);
  });

  it('returns 409 for overlapping slot conflict', async () => {
    const { coach, authHeader } = await createCoachAuth();
    const payload = {
      date: tomorrowIso(),
      startTime: '15:00',
      endTime: '16:00',
      sessionType: 'In-Person',
    };

    const first = await request(app)
      .post(`/api/v1/coach/scheduling/${coach._id}`)
      .set(authHeader)
      .send(payload);
    expect(first.status).toBe(201);

    const conflict = await request(app)
      .post(`/api/v1/coach/scheduling/${coach._id}`)
      .set(authHeader)
      .send({
        date: payload.date,
        startTime: '15:30',
        endTime: '16:30',
        sessionType: 'In-Person',
      });

    expect(conflict.status).toBe(409);
    expect(conflict.body.message).toContain('overlaps');
  });
});
