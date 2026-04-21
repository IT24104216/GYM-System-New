import mongoose from 'mongoose';
import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const baseWorkoutPayload = ({ coachId, userId }) => ({
  coachId: String(coachId),
  userId: String(userId),
  planTitle: `Plan ${unique()}`,
  durationDays: 30,
  daysPerWeek: 4,
  exercises: [
    {
      name: 'Squat',
      amount: '3 x 12',
      description: 'Leg strength',
      assignedMinutes: 30,
    },
  ],
});

describe('Workouts API', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  async function createCoachAuth() {
    const coach = await createUser({
      name: `Coach ${unique()}`,
      email: `coach.${unique()}@example.com`,
      role: 'coach',
    });
    const login = await loginAs(app, { identifier: coach.email });
    return { coach, token: login.body.token };
  }

  it('creates workout plan (201 happy path)', async () => {
    const { coach, token } = await createCoachAuth();
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.${unique()}@example.com`,
      role: 'user',
    });

    const response = await request(app)
      .post('/api/v1/workouts/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(baseWorkoutPayload({ coachId: coach._id, userId: user._id }));

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      coachId: String(coach._id),
      userId: String(user._id),
    });
  });

  it('returns 401 without token', async () => {
    const coach = await createUser({
      name: `Coach ${unique()}`,
      email: `coach.noauth.${unique()}@example.com`,
      role: 'coach',
    });
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.noauth.${unique()}@example.com`,
      role: 'user',
    });

    const response = await request(app)
      .post('/api/v1/workouts/plans')
      .send(baseWorkoutPayload({ coachId: coach._id, userId: user._id }));

    expect(response.status).toBe(401);
  });

  it('returns 403 for wrong role token', async () => {
    const coach = await createUser({
      name: `Coach ${unique()}`,
      email: `coach.forbidden.${unique()}@example.com`,
      role: 'coach',
    });
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.forbidden.${unique()}@example.com`,
      role: 'user',
    });
    const loggedUser = await loginAs(app, { identifier: user.email });

    const response = await request(app)
      .post('/api/v1/workouts/plans')
      .set('Authorization', `Bearer ${loggedUser.body.token}`)
      .send(baseWorkoutPayload({ coachId: coach._id, userId: user._id }));

    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid payload', async () => {
    const { coach, token } = await createCoachAuth();
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.invalid.${unique()}@example.com`,
      role: 'user',
    });

    const response = await request(app)
      .post('/api/v1/workouts/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        coachId: String(coach._id),
        userId: String(user._id),
        planTitle: 'Invalid Plan',
        exercises: [],
      });

    expect(response.status).toBe(422);
    expect(response.body.message).toContain('Validation failed');
  });

  it('returns 404 for missing user while creating plan', async () => {
    const { coach, token } = await createCoachAuth();
    const missingUserId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .post('/api/v1/workouts/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(baseWorkoutPayload({ coachId: coach._id, userId: missingUserId }));

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('User not found');
  });

  it('returns 409 when submitting incomplete workout plan', async () => {
    const { coach, token } = await createCoachAuth();
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.conflict.${unique()}@example.com`,
      role: 'user',
    });

    const created = await request(app)
      .post('/api/v1/workouts/plans')
      .set('Authorization', `Bearer ${token}`)
      .send(baseWorkoutPayload({ coachId: coach._id, userId: user._id }));

    expect(created.status).toBe(201);

    const submitResponse = await request(app)
      .patch(`/api/v1/workouts/plans/${created.body.data._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ submitted: true, mode: 'all' });

    expect(submitResponse.status).toBe(409);
  });
});
