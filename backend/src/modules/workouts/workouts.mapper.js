import { derivePriority, getNoteValue } from './workouts.service.js';

export const mapWorkoutRequest = (appointment, plansByUser) => {
  const userId = String(appointment.userId);
  const userName = getNoteValue(appointment.notes, 'User Name') || `User ${userId.slice(0, 6)}`;
  const goal = getNoteValue(appointment.notes, 'Goal') || 'General Fitness';
  const sessionsPerWeek = Number(getNoteValue(appointment.notes, 'Sessions')) || 3;

  return {
    appointmentId: String(appointment._id),
    userId,
    name: userName,
    avatar: userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U',
    age: Number(getNoteValue(appointment.notes, 'Age')) || 25,
    goal,
    priority: derivePriority(appointment),
    requestedOn: appointment.createdAt.toISOString().slice(0, 10),
    sessionsPerWeek,
    notes: getNoteValue(appointment.notes, 'Description') || appointment.notes || '',
    hasPlan: plansByUser.has(userId),
    hasSubmittedPlan: plansByUser.get(userId)?.hasSubmittedPlan || false,
  };
};
