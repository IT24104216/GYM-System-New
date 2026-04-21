import bcrypt from 'bcryptjs';
import request from 'supertest';
import { User } from '../../src/modules/users/users.model.js';

export async function createUser({
  name,
  email,
  password = 'Pass1234',
  role = 'user',
  status = 'active',
  branch = 'Colombo Central',
} = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name || `${role} user`,
    email: email || `${role}.${Date.now()}@example.com`,
    passwordHash,
    role,
    status,
    branch,
  });
  return user;
}

export async function loginAs(app, { identifier, password = 'Pass1234' }) {
  const response = await request(app).post('/api/v1/auth/login').send({
    identifier,
    password,
  });
  return response;
}
