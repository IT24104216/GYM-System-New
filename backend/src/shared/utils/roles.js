export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'dietician') return 'dietitian';
  if (value === 'member') return 'user';
  return value;
}
