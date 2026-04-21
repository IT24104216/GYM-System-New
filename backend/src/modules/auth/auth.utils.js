import crypto from 'crypto';
import { normalizeRole } from '../../shared/utils/roles.js';

export const isLikelyEmail = (value = '') => String(value).includes('@');

export const isValidEmailFormat = (value = '') =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const toPublicUser = (userDoc) => ({
  id: String(userDoc._id),
  branchUserId: userDoc.branchUserId || '',
  name: userDoc.name,
  email: userDoc.email,
  role: normalizeRole(userDoc.role),
  status: userDoc.status,
  branch: userDoc.branch || '',
  notificationPreferences: {
    email: userDoc.notificationPreferences?.email ?? true,
    push: userDoc.notificationPreferences?.push ?? true,
  },
});

export const getBranchCode = (branch) => {
  const normalized = String(branch || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '');
  if (!normalized) return 'BR';
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts.map((part) => part[0]).join('').slice(0, 3);
};

export const hashResetToken = (rawToken) =>
  crypto.createHash('sha256').update(String(rawToken || '')).digest('hex');
