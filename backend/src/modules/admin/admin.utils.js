export const REPORT_MONTHS = 7;

const toUiRole = {
  user: 'Member',
  coach: 'Coach',
  dietitian: 'Dietician',
  admin: 'Admin',
};

const toUiStatus = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

export function toUserDto(userDoc) {
  const roleChangedAt = userDoc.roleChangedAt || null;
  const headCoachId = userDoc.headCoachId
    ? String(userDoc.headCoachId?._id || userDoc.headCoachId)
    : '';
  const headCoachName = userDoc.headCoachId && typeof userDoc.headCoachId === 'object'
    ? String(userDoc.headCoachId?.name || '')
    : '';
  return {
    id: String(userDoc._id),
    branchUserId: userDoc.branchUserId || '',
    branch: userDoc.branch || '',
    name: userDoc.name,
    email: userDoc.email,
    role: toUiRole[userDoc.role] || 'Member',
    status: toUiStatus[userDoc.status] || 'Active',
    joined: new Date(userDoc.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    avatar: userDoc.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U',
    roleChangedAt,
    roleChangedAtLabel: roleChangedAt
      ? new Date(roleChangedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : null,
    coachRole: userDoc.role === 'coach'
      ? (String(userDoc.coachRole || 'head').toLowerCase() === 'sub' ? 'sub' : 'head')
      : null,
    headCoachId,
    headCoachName,
  };
}

const monthLabel = (date) =>
  date.toLocaleString('en-US', { month: 'short' });

const monthKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const getMonthRange = (months = REPORT_MONTHS, now = new Date()) => {
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const range = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - i, 1);
    range.push({
      key: monthKey(d),
      label: monthLabel(d),
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
    });
  }
  return range;
};

export const formatTrend = (current, previous) => {
  if (!previous) return '+0%';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
};
