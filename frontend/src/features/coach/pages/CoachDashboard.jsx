import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/utils/constants';
import { useAuth } from '@/shared/hooks/useAuth';
import { getCoachAppointments, getCoachMemberProgressScores } from '../api/coach.api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MotionBox = Motion(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const getInitials = (name = '') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() || '')
  .join('') || 'NA';

const getNoteValue = (notes, key) => {
  if (!notes) return '';
  const pattern = new RegExp(`${key}:\\s*([^|]+)`, 'i');
  const match = notes.match(pattern);
  return match?.[1]?.trim() || '';
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatTime12 = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatWait = (createdAt) => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 'just now';
  const diffMs = Math.max(Date.now() - created.getTime(), 0);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours} hours`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const typeToColor = {
  consultation: '#8B5CF6',
  training: '#0D9488',
  assessment: '#84CC16',
  nutrition: '#F59E0B',
  other: '#3B82F6',
};

const priorityGrad = {
  urgent: 'linear-gradient(135deg, #EF4444, #DC2626)',
  high: 'linear-gradient(135deg, #F97316, #EF4444)',
  normal: 'linear-gradient(135deg, #3B82F6, #0D9488)',
};

function CircularScore({ score, id, isDark }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const gradId = `scoreGrad-${id}`;

  return (
    <Box sx={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke={isDark ? '#334155' : '#F1F5F9'} strokeWidth="5" />
        <Motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
      </svg>
      <Typography sx={{ position: 'absolute', fontSize: '0.875rem', fontWeight: 900, color: isDark ? '#f8fafc' : '#111827' }}>{score}</Typography>
    </Box>
  );
}

function CoachDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const coachId = String(user?.id || user?._id || '');
  const [flippedMemberIds, setFlippedMemberIds] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [memberProgressScores, setMemberProgressScores] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });
  const isDark = theme.palette.mode === 'dark';
  const panelBg = isDark ? '#0f1b34' : '#ffffff';
  const panelBorder = isDark ? '#24344f' : '#f3f4f6';
  const primaryText = theme.palette.text.primary;
  const secondaryText = theme.palette.text.secondary;
  const mutedText = isDark ? '#94a3b8' : '#9ca3af';
  const hoverRowBg = isDark ? 'rgba(148,163,184,0.08)' : '#f9fafb';
  const currentRowBg = isDark
    ? 'linear-gradient(90deg, rgba(132,204,22,0.12) 0%, rgba(13,148,136,0.16) 100%)'
    : 'linear-gradient(90deg, #ecfccb 0%, #ccfbf1 100%)';
  const currentRowBorder = isDark ? '#2dd4bf' : '#99f6e4';
  const barBg = isDark ? '#1f2937' : '#f3f4f6';
  const chartGrid = isDark ? '#23324b' : '#F1F5F9';

  const loadDashboardData = useCallback(async () => {
    if (!coachId) return;
    try {
      const [{ data }, { data: scorePayload }] = await Promise.all([
        getCoachAppointments({ page: 1, limit: 300 }),
        getCoachMemberProgressScores(coachId, { days: 7 }),
      ]);

      const all = Array.isArray(data?.data) ? data.data : [];
      const coachName = String(user?.name || '').trim().toLowerCase();
      const mine = all.filter((item) => {
        const byId = String(item.coachId || '') === coachId;
        const byNoteId = String(getNoteValue(item.notes, 'CoachId') || '') === coachId;
        const noteCoach = getNoteValue(item.notes, 'Coach').toLowerCase();
        const byName = coachName && noteCoach && noteCoach === coachName;
        return item.sessionType !== 'nutrition' && (byId || byNoteId || byName);
      });
      setAppointments(mine);
      setMemberProgressScores(scorePayload?.data?.byUserId || {});
    } catch (error) {
      setAppointments([]);
      setMemberProgressScores({});
      setToast({
        open: true,
        message: error?.response?.data?.message || 'Failed to load coach dashboard data',
        severity: 'error',
      });
    }
  }, [coachId, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboardData();
    }, 0);
    const id = setInterval(() => {
      void loadDashboardData();
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(id);
    };
  }, [loadDashboardData]);

  const { stats, schedule, consultations, members, weeklyData, scheduleDateLabel } = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const weekStart = new Date(todayStart);
    const day = weekStart.getDay();
    const diffToMonday = (day + 6) % 7;
    weekStart.setDate(weekStart.getDate() - diffToMonday);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const validAppointments = appointments.filter((item) => item.status !== 'cancelled' && item.status !== 'rejected');
    const activeAppointments = appointments.filter((item) => item.status === 'approved' || item.status === 'completed');
    const pendingAppointments = appointments.filter((item) => item.status === 'pending');

    const uniqueActiveClients = new Set(activeAppointments.map((item) => String(item.userId))).size;

    const todayAppointments = validAppointments.filter((item) => {
      const starts = new Date(item.startsAt);
      return starts >= todayStart && starts < tomorrowStart;
    });

    const thisMonthAppointments = validAppointments.filter((item) => {
      const starts = new Date(item.startsAt);
      return starts >= monthStart;
    });
    const prevMonthAppointments = validAppointments.filter((item) => {
      const starts = new Date(item.startsAt);
      return starts >= prevMonthStart && starts < monthStart;
    });

    const progressScoreRows = Object.values(memberProgressScores || {});
    const avgScore = progressScoreRows.length
      ? Math.round(progressScoreRows.reduce((sum, row) => sum + Number(row?.score || 0), 0) / progressScoreRows.length)
      : 0;

    const revenueMtd = thisMonthAppointments.filter((item) => item.status === 'completed').length * 75;
    const prevRevenue = prevMonthAppointments.filter((item) => item.status === 'completed').length * 75;

    const sessionsDiff = thisMonthAppointments.length - prevMonthAppointments.length;
    const scoreDiff = avgScore - (prevMonthAppointments.length ? Math.round((prevMonthAppointments.filter((x) => x.status === 'completed').length / prevMonthAppointments.length) * 100) : 0);
    const revenueDiff = revenueMtd - prevRevenue;

    const statsComputed = [
      {
        label: 'Active Clients',
        value: String(uniqueActiveClients),
        Icon: GroupsRoundedIcon,
        gradient: 'linear-gradient(135deg, #84CC16, #0D9488)',
        change: `${sessionsDiff >= 0 ? '+' : ''}${sessionsDiff} this month`,
      },
      {
        label: 'Sessions Today',
        value: String(todayAppointments.length),
        Icon: CalendarMonthRoundedIcon,
        gradient: 'linear-gradient(135deg, #0D9488, #0284C7)',
        change: `${todayAppointments.filter((x) => x.status === 'pending').length} remaining`,
      },
      {
        label: 'Avg Client Score',
        value: `${avgScore}%`,
        Icon: StarBorderRoundedIcon,
        gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
        change: `${scoreDiff >= 0 ? '+' : ''}${scoreDiff}% vs last month`,
      },
      {
        label: 'Revenue MTD',
        value: `$${revenueMtd.toLocaleString()}`,
        Icon: AttachMoneyRoundedIcon,
        gradient: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
        change: `${revenueDiff >= 0 ? '+' : ''}${revenueDiff} vs last month`,
      },
    ];

    const scheduleRows = todayAppointments
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 6)
      .map((item, index) => ({
        time: formatTime12(item.startsAt),
        client: getNoteValue(item.notes, 'User Name') || `User ${String(item.userId).slice(0, 6)}`,
        type: item.sessionType === 'other' ? 'Session' : `${item.sessionType[0].toUpperCase()}${item.sessionType.slice(1)}`,
        typeColor: typeToColor[item.sessionType] || '#3B82F6',
        status: index === 0 && item.status === 'pending' ? 'current' : item.status === 'completed' ? 'done' : 'upcoming',
      }));

    const queueRows = pendingAppointments
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 6)
      .map((item) => {
        const priorityRaw = (getNoteValue(item.notes, 'Priority') || 'Normal').toLowerCase();
        const priorityLabel = priorityRaw === 'urgent' ? 'URGENT' : priorityRaw === 'high' ? 'HIGH' : 'NORMAL';
        const userName = getNoteValue(item.notes, 'User Name') || `User ${String(item.userId).slice(0, 6)}`;
        return {
          name: userName,
          issue: getNoteValue(item.notes, 'Description') || item.notes || 'Consultation request',
          priority: priorityLabel,
          wait: formatWait(item.createdAt),
          avatar: getInitials(userName),
          priorityGrad: priorityRaw === 'urgent' ? priorityGrad.urgent : priorityRaw === 'high' ? priorityGrad.high : priorityGrad.normal,
        };
      });

    const membersByUser = new Map();
    activeAppointments
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach((item) => {
        const userId = String(item.userId);
        if (!membersByUser.has(userId)) membersByUser.set(userId, []);
        membersByUser.get(userId).push(item);
      });

    const gradientPool = [
      'linear-gradient(135deg, #84CC16, #0D9488)',
      'linear-gradient(135deg, #0D9488, #0284C7)',
      'linear-gradient(135deg, #F59E0B, #EF4444)',
      'linear-gradient(135deg, #8B5CF6, #EC4899)',
      'linear-gradient(135deg, #06B6D4, #3B82F6)',
      'linear-gradient(135deg, #10B981, #0D9488)',
    ];

    const memberRows = Array.from(membersByUser.entries())
      .slice(0, 6)
      .map(([userId, items], idx) => {
        const latest = items[0];
        const userName = getNoteValue(latest.notes, 'User Name') || `User ${userId.slice(0, 6)}`;
        const totalSessions = items.length;
        const completedSessions = items.filter((x) => x.status === 'completed').length;
        const program = Math.min(Math.round((completedSessions / totalSessions) * 100), 100);
        const scoreData = memberProgressScores[userId];
        const score = clamp(Number(scoreData?.score || 0), 0, 100);
        return {
          id: userId,
          name: userName,
          age: Number(getNoteValue(latest.notes, 'Age') || 0) || '-',
          goal: getNoteValue(latest.notes, 'Goal') || 'General',
          score,
          program,
          lastActive: latest.status === 'completed' ? 'Completed session' : 'Today',
          avatar: getInitials(userName),
          grad: gradientPool[idx % gradientPool.length],
          email: getNoteValue(latest.notes, 'User Email') || '-',
          phone: getNoteValue(latest.notes, 'Mobile') || '-',
          preferredSlot: formatTime12(latest.startsAt) || '-',
          trainingDays: 'As scheduled',
          priority: getNoteValue(latest.notes, 'Priority') || 'Normal',
          notes: getNoteValue(latest.notes, 'Description') || latest.notes || '-',
        };
      });

    const weeklyMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    validAppointments.forEach((item) => {
      const starts = new Date(item.startsAt);
      if (Number.isNaN(starts.getTime())) return;
      if (starts < weekStart) return;
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (starts >= weekEnd) return;
      const dayIndex = (starts.getDay() + 6) % 7;
      const dayKey = weekDays[dayIndex];
      weeklyMap[dayKey] += 1;
    });

    const weeklyRows = weekDays.map((dayKey) => ({ day: dayKey, sessions: weeklyMap[dayKey] }));

    return {
      stats: statsComputed,
      schedule: scheduleRows,
      consultations: queueRows,
      members: memberRows,
      weeklyData: weeklyRows,
      scheduleDateLabel: now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  }, [appointments, memberProgressScores]);

  const toggleMemberCard = (id) => {
    setFlippedMemberIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
      <MotionBox
        variants={itemVariants}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <MotionBox
              key={s.label}
              whileHover={{ y: -2 }}
              sx={{
                background: panelBg,
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: panelBorder,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: s.gradient }}>
                  <Icon sx={{ fontSize: 20 }} />
                </div>
                <TrendingUpRoundedIcon sx={{ color: '#10b981', fontSize: 14 }} />
              </div>
              <Typography sx={{ fontSize: '2.25rem', fontWeight: 900, color: primaryText, lineHeight: 1.2 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '1rem', color: secondaryText, mt: 0.4 }}>{s.label}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500, mt: 1 }}>{s.change}</Typography>
            </MotionBox>
          );
        })}
      </MotionBox>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        <Motion.div variants={itemVariants}>
          <Box sx={{ background: panelBg, borderRadius: 2, p: 2.5, border: '1px solid', borderColor: panelBorder, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: primaryText, fontSize: '1.25rem' }}>Today's Schedule</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: mutedText }}>{scheduleDateLabel}</Typography>
            </Stack>
            <Stack spacing={1}>
              {!schedule.length && (
                <Typography sx={{ fontSize: '0.9rem', color: mutedText }}>No sessions scheduled for today.</Typography>
              )}
              {schedule.map((s, i) => (
                <Motion.div key={`${s.time}-${s.client}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.07) }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 1.5,
                      transition: 'background-color 0.2s ease',
                      ...(s.status === 'current'
                        ? {
                            background: currentRowBg,
                            border: '1px solid',
                            borderColor: currentRowBorder,
                          }
                        : s.status === 'done'
                          ? { opacity: 0.5 }
                          : { '&:hover': { backgroundColor: hoverRowBg } }),
                    }}
                  >
                    <Typography sx={{ width: 72, flexShrink: 0, fontSize: '0.82rem', color: mutedText, fontFamily: 'monospace' }}>{s.time}</Typography>
                    {s.status === 'current' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #84CC16, #0D9488)' }} />}
                    <Typography sx={{ flex: 1, minWidth: 0, fontSize: '1.05rem', fontWeight: 700, color: primaryText }}>{s.client}</Typography>
                    <Box component="span" sx={{ px: 1.2, py: 0.55, borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, color: '#fff', backgroundColor: s.typeColor }}>
                      {s.type}
                    </Box>
                  </Box>
                </Motion.div>
              ))}
            </Stack>
          </Box>
        </Motion.div>

        <Motion.div variants={itemVariants}>
          <Box sx={{ background: panelBg, borderRadius: 2, p: 2.5, border: '1px solid', borderColor: panelBorder, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: primaryText, fontSize: '1.25rem' }}>Consultation Queue</Typography>
              <Box component="span" sx={{ px: 1, py: 0.5, borderRadius: 999, color: '#fff', fontWeight: 700, fontSize: '0.75rem', background: 'linear-gradient(135deg, #EF4444, #F97316)' }}>
                {consultations.length} pending
              </Box>
            </Stack>
            <Stack spacing={1.5}>
              {consultations.map((c, i) => (
                <Motion.div key={c.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: panelBorder, '&:hover': { borderColor: isDark ? '#334155' : '#e5e7eb' } }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: c.priorityGrad }}>{c.avatar}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: primaryText }}>{c.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: mutedText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.issue}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
                        <Box component="span" sx={{ px: 1, py: 0.5, borderRadius: 999, color: '#fff', fontWeight: 700, fontSize: '0.75rem', background: c.priorityGrad }}>
                          {c.priority}
                        </Box>
                        <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontSize: '0.75rem', color: mutedText }}>
                          <AccessTimeRoundedIcon sx={{ fontSize: 10 }} /> {c.wait}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box component="button" type="button" style={{ padding: '6px 12px', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, border: 0, background: 'linear-gradient(135deg, #84CC16, #0D9488)', cursor: 'pointer', flexShrink: 0 }}>
                      Start
                    </Box>
                  </Box>
                </Motion.div>
              ))}
              {!consultations.length && (
                <Typography sx={{ fontSize: '0.9rem', color: mutedText }}>No pending consultation requests.</Typography>
              )}
            </Stack>
          </Box>
        </Motion.div>
      </Box>

      <Motion.div variants={itemVariants}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, color: primaryText, fontSize: '1.25rem' }}>Active Members</Typography>
          <Box
            component="button"
            type="button"
            onClick={() => navigate(ROUTES.COACH_CLIENTS)}
            style={{ border: 0, background: 'transparent', color: '#0d9488', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            View all <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
          </Box>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {!members.length && (
            <Box sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: panelBorder }}>
              <Typography sx={{ color: mutedText }}>No active members yet.</Typography>
            </Box>
          )}
          {members.map((m, i) => (
            <Motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} whileHover={{ y: -3 }}>
              <Box sx={{ perspective: '1200px' }}>
                <Box
                  sx={{
                    position: 'relative',
                    minHeight: 258,
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s ease',
                    transform: flippedMemberIds[m.id] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  <Box sx={{ position: 'absolute', inset: 0, background: panelBg, borderRadius: 2, p: 2, border: '1px solid', borderColor: panelBorder, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', backfaceVisibility: 'hidden' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ width: 44, height: 44, color: '#fff', fontWeight: 700, background: m.grad }}>{m.avatar}</Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: primaryText, fontWeight: 700 }}>{m.name}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: mutedText }}>Age {m.age} - {m.goal}</Typography>
                      </Box>
                      <Box sx={{ ml: 'auto' }}>
                        <CircularScore score={m.score} id={m.avatar} isDark={isDark} />
                      </Box>
                    </Stack>

                    <Box sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.7 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: secondaryText }}>Program Progress</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: primaryText, fontWeight: 600 }}>{m.program}%</Typography>
                      </Stack>
                      <Box sx={{ height: 6, borderRadius: 999, bgcolor: barBg, overflow: 'hidden' }}>
                        <Motion.div
                          style={{ height: '100%', borderRadius: 999, background: m.grad }}
                          initial={{ width: 0 }}
                          animate={{ width: `${m.program}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 + i * 0.1 }}
                        />
                      </Box>
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: '0.75rem', color: mutedText, display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
                        <MonitorHeartRoundedIcon sx={{ fontSize: 11 }} /> {m.lastActive}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => toggleMemberCard(m.id)}
                        sx={{ textTransform: 'none', color: '#0d9488', fontWeight: 600, p: 0, minWidth: 0, fontSize: 12 }}
                      >
                        View Profile
                      </Button>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: panelBg,
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: panelBorder,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: primaryText, mb: 1 }}>Client Details</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.78rem', mb: 0.5 }}><strong>Email:</strong> {m.email}</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.78rem', mb: 0.5 }}><strong>Phone:</strong> {m.phone}</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.78rem', mb: 0.5 }}><strong>Preferred Slot:</strong> {m.preferredSlot}</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.78rem', mb: 0.5 }}><strong>Training Days:</strong> {m.trainingDays}</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.78rem', mb: 0.5 }}><strong>Priority:</strong> {m.priority}</Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.78rem' }}><strong>Notes:</strong> {m.notes}</Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => toggleMemberCard(m.id)}
                      sx={{ textTransform: 'none', color: '#0d9488', fontWeight: 600, alignSelf: 'flex-start', p: 0, minWidth: 0, fontSize: 12 }}
                    >
                      Back
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Motion.div>
          ))}
        </Box>
      </Motion.div>

      <Motion.div variants={itemVariants}>
        <Box sx={{ background: panelBg, borderRadius: 2, p: 2.5, border: '1px solid', borderColor: panelBorder, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: primaryText, mb: 2 }}>Sessions This Week</Typography>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84CC16" />
                  <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: mutedText }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: mutedText }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${panelBorder}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  fontSize: 12,
                  background: panelBg,
                  color: primaryText,
                }}
              />
              <Bar dataKey="sessions" fill="url(#sessGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Motion.div>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Motion.div>
  );
}

export default CoachDashboard;
