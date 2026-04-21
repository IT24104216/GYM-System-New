import { User } from '../users/users.model.js';
import { Notification } from './notifications.model.js';
import mongoose from 'mongoose';

const toString = (value) => String(value || '').trim();

const canReceivePush = async (recipientId) => {
  const id = toString(recipientId);
  if (!id) return false;
  if (!mongoose.isValidObjectId(id)) return true;
  const user = await User.findById(id).select('notificationPreferences.push status');
  if (!user || user.status !== 'active') return false;
  return user.notificationPreferences?.push !== false;
};

const getAllowedRecipients = async (recipientIds = []) => {
  const deduped = Array.from(new Set((Array.isArray(recipientIds) ? recipientIds : [])
    .map((item) => toString(item))
    .filter(Boolean)));
  if (!deduped.length) return new Set();

  const validObjectIds = deduped.filter((id) => mongoose.isValidObjectId(id));
  if (!validObjectIds.length) return new Set(deduped);

  const users = await User.find({
    _id: { $in: validObjectIds },
    status: 'active',
    $or: [
      { 'notificationPreferences.push': { $exists: false } },
      { 'notificationPreferences.push': true },
    ],
  }).select('_id');

  const allowed = new Set(users.map((item) => String(item._id)));
  deduped
    .filter((id) => !mongoose.isValidObjectId(id))
    .forEach((id) => allowed.add(id));
  return allowed;
};

const toPayload = (base = {}) => ({
  recipientId: toString(base.recipientId),
  recipientRole: toString(base.recipientRole),
  type: toString(base.type) || 'system',
  title: toString(base.title),
  message: toString(base.message),
  entityType: toString(base.entityType),
  entityId: toString(base.entityId),
  actionUrl: toString(base.actionUrl),
});

export const createNotification = async (payload = {}) => {
  const doc = toPayload(payload);
  if (!doc.recipientId || !doc.recipientRole || !doc.title || !doc.message) return null;
  const allowed = await canReceivePush(doc.recipientId);
  if (!allowed) return null;
  return Notification.create(doc);
};

export const createNotificationsForUsers = async (userIds = [], payload = {}) => {
  const deduped = Array.from(new Set((Array.isArray(userIds) ? userIds : [])
    .map((item) => toString(item))
    .filter(Boolean)));

  if (!deduped.length) return { insertedCount: 0 };
  const allowedRecipients = await getAllowedRecipients(deduped);
  const docs = deduped.map((recipientId) => ({
    ...toPayload(payload),
    recipientId,
    recipientRole: payload.recipientRole || 'user',
  })).filter((item) =>
    item.recipientId
    && allowedRecipients.has(item.recipientId)
    && item.recipientRole
    && item.title
    && item.message);

  if (!docs.length) return { insertedCount: 0 };
  const result = await Notification.insertMany(docs, { ordered: false });
  return { insertedCount: result.length };
};

export const createNotificationsForRole = async (role, payload = {}) => {
  const safeRole = toString(role);
  if (!safeRole) return { insertedCount: 0 };
  const users = await User.find({ role: safeRole, status: 'active' }).select('_id role');
  const ids = users.map((item) => String(item._id));
  return createNotificationsForUsers(ids, { ...payload, recipientRole: safeRole });
};

export const createNotificationForAdmins = async (payload = {}) =>
  createNotificationsForRole('admin', { ...payload, type: payload.type || 'admin' });
