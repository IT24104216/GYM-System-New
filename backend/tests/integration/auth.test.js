import request from 'supertest';

function expectStatus(response, expected) {
  if (response.status !== expected) {
    // eslint-disable-next-line no-console
    console.error('Unexpected response:', response.status, response.body);
  }
  expect(response.status).toBe(expected);
}

describe('Auth API', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await import('../../src/app.js'));
  });

  it('registers a new user', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Member',
      email: 'member1@example.com',
      branch: 'Colombo Central',
      password: 'Pass1234',
    });

    expectStatus(response, 201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toMatchObject({
      email: 'member1@example.com',
      role: 'user',
      status: 'active',
    });
  });

  it('rejects duplicate registration', async () => {
    const payload = {
      name: 'Test Member',
      email: 'member2@example.com',
      branch: 'Colombo Central',
      password: 'Pass1234',
    };
    await request(app).post('/api/v1/auth/register').send(payload);
    const response = await request(app).post('/api/v1/auth/register').send(payload);

    expectStatus(response, 409);
    expect(response.body.message).toContain('already exists');
  });

  it('logs in and refreshes access token', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login User',
      email: 'member3@example.com',
      branch: 'Kandy',
      password: 'Pass1234',
    });

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      identifier: 'member3@example.com',
      password: 'Pass1234',
    });
    expectStatus(loginResponse, 200);
    expect(loginResponse.body).toHaveProperty('refreshToken');

    const refreshResponse = await request(app).post('/api/v1/auth/refresh').send({
      token: loginResponse.body.refreshToken,
    });
    expectStatus(refreshResponse, 200);
    expect(refreshResponse.body).toHaveProperty('token');
  });

  it('rejects invalid login password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Bad Password User',
      email: 'member4@example.com',
      branch: 'Galle',
      password: 'Pass1234',
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      identifier: 'member4@example.com',
      password: 'Wrong1234',
    });

    expectStatus(response, 401);
  });
});
