import mongoose from 'mongoose';
import request from 'supertest';
import { createUser, loginAs } from '../helpers/auth.js';

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const planMeals = () => ({
  breakfast: [{ mealName: 'Oats', calories: 300 }],
  lunch: [{ mealName: 'Rice and chicken', calories: 500 }],
  dinner: [{ mealName: 'Salad', calories: 250 }],
  snacks: [{ mealName: 'Nuts', calories: 150 }],
});

describe('Meal Plans API', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  async function createDietitianAuth() {
    const dietitian = await createUser({
      name: `Dietitian ${unique()}`,
      email: `dietitian.${unique()}@example.com`,
      role: 'dietitian',
    });
    const login = await loginAs(app, { identifier: dietitian.email });
    return { dietitian, token: login.body.token };
  }

  it('creates meal library item (201 happy path)', async () => {
    const { dietitian, token } = await createDietitianAuth();

    const response = await request(app)
      .post('/api/v1/meal-plans/library')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dietitianId: String(dietitian._id),
        category: 'weight_loss',
        mealName: 'Grilled Fish',
        calories: 350,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      dietitianId: String(dietitian._id),
      mealName: 'Grilled Fish',
    });
  });

  it('returns 401 without token', async () => {
    const dietitian = await createUser({
      name: `Dietitian ${unique()}`,
      email: `dietitian.noauth.${unique()}@example.com`,
      role: 'dietitian',
    });

    const response = await request(app)
      .post('/api/v1/meal-plans/library')
      .send({
        dietitianId: String(dietitian._id),
        category: 'weight_loss',
        mealName: 'Soup',
      });

    expect(response.status).toBe(401);
  });

  it('returns 403 for wrong role token', async () => {
    const dietitian = await createUser({
      name: `Dietitian ${unique()}`,
      email: `dietitian.forbidden.${unique()}@example.com`,
      role: 'dietitian',
    });
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.forbidden.${unique()}@example.com`,
      role: 'user',
    });
    const userLogin = await loginAs(app, { identifier: user.email });

    const response = await request(app)
      .post('/api/v1/meal-plans/library')
      .set('Authorization', `Bearer ${userLogin.body.token}`)
      .send({
        dietitianId: String(dietitian._id),
        category: 'weight_loss',
        mealName: 'Soup',
      });

    expect(response.status).toBe(403);
  });

  it('returns 422 for invalid payload', async () => {
    const { dietitian, token } = await createDietitianAuth();

    const response = await request(app)
      .post('/api/v1/meal-plans/library')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dietitianId: String(dietitian._id),
        category: 'invalid-category',
        mealName: '',
      });

    expect(response.status).toBe(422);
  });

  it('returns 404 when library item id is missing', async () => {
    const { dietitian, token } = await createDietitianAuth();
    const missingId = new mongoose.Types.ObjectId().toString();

    const response = await request(app)
      .put(`/api/v1/meal-plans/library/${missingId}?dietitianId=${dietitian._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mealName: 'Updated Meal' });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('returns 409 when deleting submitted diet plan', async () => {
    const { dietitian, token } = await createDietitianAuth();
    const user = await createUser({
      name: `User ${unique()}`,
      email: `user.plan.${unique()}@example.com`,
      role: 'user',
    });

    const createPlan = await request(app)
      .post('/api/v1/meal-plans/client-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        dietitianId: String(dietitian._id),
        userId: String(user._id),
        memberName: user.name,
        ...planMeals(),
      });
    expect(createPlan.status).toBe(200);

    const planId = createPlan.body.data._id;
    const submit = await request(app)
      .patch(`/api/v1/meal-plans/client-plans/${planId}/submit?dietitianId=${dietitian._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ submitted: true });
    expect(submit.status).toBe(200);

    const deleteResponse = await request(app)
      .delete(`/api/v1/meal-plans/client-plans/${planId}?dietitianId=${dietitian._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(409);
  });
});
