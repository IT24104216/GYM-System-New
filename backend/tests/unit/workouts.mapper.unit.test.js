import { mapWorkoutRequest } from '../../src/modules/workouts/workouts.mapper.js';

describe('workouts.mapper', () => {
  it('maps appointment notes into workout request fields', () => {
    const appointment = {
      _id: 'apt-1',
      userId: 'user-123456',
      notes: 'User Name: John Doe | Goal: Fat Loss | Sessions: 4 | Priority: High | Description: Need beginner plan',
      createdAt: new Date('2026-03-21T00:00:00.000Z'),
    };
    const plansByUser = new Map([
      ['user-123456', { hasPlan: true, hasSubmittedPlan: true }],
    ]);

    const mapped = mapWorkoutRequest(appointment, plansByUser);

    expect(mapped).toMatchObject({
      appointmentId: 'apt-1',
      userId: 'user-123456',
      name: 'John Doe',
      avatar: 'JD',
      goal: 'Fat Loss',
      sessionsPerWeek: 4,
      priority: 'High',
      hasPlan: true,
      hasSubmittedPlan: true,
    });
    expect(mapped.requestedOn).toBe('2026-03-21');
  });

  it('uses defaults when notes do not contain keyed values', () => {
    const appointment = {
      _id: 'apt-2',
      userId: 'abcdef123456',
      notes: '',
      createdAt: new Date('2026-03-21T00:00:00.000Z'),
    };

    const mapped = mapWorkoutRequest(appointment, new Map());

    expect(mapped.name).toBe('User abcdef');
    expect(mapped.goal).toBe('General Fitness');
    expect(mapped.sessionsPerWeek).toBe(3);
    expect(mapped.priority).toBe('Medium');
    expect(mapped.hasPlan).toBe(false);
    expect(mapped.hasSubmittedPlan).toBe(false);
  });
});
