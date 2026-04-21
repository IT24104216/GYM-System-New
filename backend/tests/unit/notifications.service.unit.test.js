import { beforeEach, describe, expect, it, vi } from 'vitest';

const findByIdMock = vi.fn();
const findMock = vi.fn();
const createMock = vi.fn();
const insertManyMock = vi.fn();
const isValidObjectIdMock = vi.fn();

vi.mock('../../src/modules/users/users.model.js', () => ({
  User: {
    findById: (...args) => findByIdMock(...args),
    find: (...args) => findMock(...args),
  },
}));

vi.mock('../../src/modules/notifications/notifications.model.js', () => ({
  Notification: {
    create: (...args) => createMock(...args),
    insertMany: (...args) => insertManyMock(...args),
  },
}));

vi.mock('mongoose', () => ({
  default: {
    isValidObjectId: (...args) => isValidObjectIdMock(...args),
  },
}));

import {
  createNotification,
  createNotificationForAdmins,
  createNotificationsForUsers,
} from '../../src/modules/notifications/notifications.service.js';

describe('notifications.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isValidObjectIdMock.mockImplementation((id) => String(id).startsWith('obj-'));
  });

  it('returns null when required fields are missing', async () => {
    const result = await createNotification({ title: 'Hello' });
    expect(result).toBeNull();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates notification for allowed recipient', async () => {
    findByIdMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        status: 'active',
        notificationPreferences: { push: true },
      }),
    });
    createMock.mockResolvedValue({ _id: 'n1' });

    const result = await createNotification({
      recipientId: 'obj-100',
      recipientRole: 'user',
      type: 'system',
      title: 'Reminder',
      message: 'Check your dashboard',
    });

    expect(result).toEqual({ _id: 'n1' });
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('creates notifications for users with dedupe and eligibility filtering', async () => {
    findMock.mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: 'obj-1' }]),
    });
    insertManyMock.mockResolvedValue([{}, {}]);

    const result = await createNotificationsForUsers(
      ['obj-1', 'obj-1', 'raw-user'],
      {
        title: 'Promo',
        message: 'New offer',
        type: 'promotion',
      },
    );

    expect(result.insertedCount).toBe(2);
    expect(insertManyMock).toHaveBeenCalledTimes(1);
    expect(insertManyMock.mock.calls[0][0].length).toBe(2);
  });

  it('creates admin notifications via role lookup', async () => {
    findMock
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue([{ _id: 'obj-admin-1' }]),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue([{ _id: 'obj-admin-1' }]),
      });
    insertManyMock.mockResolvedValue([{}]);

    const result = await createNotificationForAdmins({
      title: 'Alert',
      message: 'System maintenance',
    });

    expect(result.insertedCount).toBe(1);
    expect(insertManyMock).toHaveBeenCalledTimes(1);
  });
});
