import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  delegateAppointment,
  getCoachAppointments,
  getCoachQueue,
  getCoachQueueStats,
  getMyTeam,
  snoozeAppointment,
  updateCoachAppointmentStatus,
} from '@/features/coach/api/coach.api';

const MotionBox = motion(Box);

const PRIORITY_META = {
  urgent: {
    label: 'URGENT',
    fg: '#dc2626',
    bg: '#fee2e2',
    border: '#ef4444',
  },
  normal: {
    label: 'NORMAL',
    fg: '#d97706',
    bg: '#fef3c7',
    border: '#f59e0b',
  },
  low: {
    label: 'LOW',
    fg: '#0f766e',
    bg: '#ccfbf1',
    border: '#14b8a6',
  },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

const SNOOZE_OPTIONS = [
  { value: 60, label: 'Snooze 1 hour' },
  { value: 240, label: 'Snooze 4 hours' },
  { value: 'tomorrow', label: 'Snooze until tomorrow' },
];

const normalizePriority = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'low') return normalized;
  return 'normal';
};

const getInitials = (name = '') =>
  name
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

const formatWait = (hours) => {
  const totalMinutes = Math.max(0, Math.round(Number(hours || 0) * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `waiting ${h}h ${m}m`;
};

const formatSla = (hoursRemaining) => {
  if (hoursRemaining === null || hoursRemaining === undefined) return 'No SLA';
  const totalMinutes = Math.round(Math.abs(Number(hoursRemaining)) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (hoursRemaining < 0) {
    return `OVERDUE by ${h}h ${m}m`;
  }
  return `respond in ${h}h ${m}m`;
};

const formatRelativeSeconds = (dateValue) => {
  if (!dateValue) return 'not updated';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  return `${mins}m ago`;
};

const toTomorrowMinutes = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diffMs = Math.max(tomorrow.getTime() - now.getTime(), 60 * 1000);
  return Math.ceil(diffMs / (60 * 1000));
};

function CoachClients() {
  const theme = useTheme();
  const { user } = useAuth();
  const coachId = String(user?.id || user?._id || '');
  const isDark = theme.palette.mode === 'dark';
  const panelBg = isDark ? '#0f1b34' : '#ffffff';
  const panelBorder = isDark ? '#24344f' : '#e5e7eb';
  const muted = isDark ? '#94a3b8' : '#6b7280';
  const isHeadCoach = String(user?.coachRole || 'head').toLowerCase() === 'head';
  const isSubCoach = String(user?.coachRole || 'head').toLowerCase() === 'sub';

  const [queue, setQueue] = useState([]);
  const [snoozedQueue, setSnoozedQueue] = useState([]);
  const [queueStats, setQueueStats] = useState({
    urgentCount: 0,
    normalCount: 0,
    lowCount: 0,
    slaBreachedCount: 0,
    avgWaitHours: 0,
    longestWaitHours: 0,
    escalatedTodayCount: 0,
  });
  const [members, setMembers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [queuePriorityFilter, setQueuePriorityFilter] = useState('all');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '' });
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    appointment: null,
    reason: '',
    error: '',
    isSubmitting: false,
  });
  const [delegateDialog, setDelegateDialog] = useState({
    open: false,
    appointment: null,
    subCoachId: '',
    error: '',
    isSubmitting: false,
  });

  const mapQueueRow = useCallback((item) => {
    const priority = normalizePriority(item.priority);
    const escalations = Array.isArray(item.escalationHistory) ? item.escalationHistory : [];
    const latestEscalation = escalations.length ? escalations[escalations.length - 1] : null;
    const name = getNoteValue(item.notes, 'User Name') || `User ${String(item.userId || '').slice(0, 6)}`;
    return {
      id: item._id,
      queuePosition: Number(item.queuePosition || 0),
      userId: item.userId,
      name,
      goal: getNoteValue(item.notes, 'Goal') || item.sessionType || 'General',
      description: getNoteValue(item.notes, 'Description') || item.notes || '-',
      notes: item.notes || '',
      priority,
      waitTimeHours: Number(item.waitTimeHours || 0),
      slaRemainingHours:
        item.slaRemainingHours === null || item.slaRemainingHours === undefined
          ? null
          : Number(item.slaRemainingHours),
      slaBreached: Boolean(item.slaBreached),
      delegatedByCoachName: String(item.delegatedByCoachName || ''),
      delegatedByCoachId: String(item.delegatedByCoachId || ''),
      snoozedUntil: item.snoozedUntil || null,
      startsAt: item.startsAt,
      latestEscalation,
      avatar: getInitials(name),
    };
  }, []);

  const mapMemberRow = useCallback((item) => {
    const name = getNoteValue(item.notes, 'User Name') || `User ${String(item.userId).slice(0, 6)}`;
    const status = item.status === 'completed' ? 'Completed' : 'Active';
    return {
      id: item.userId,
      name,
      goal: getNoteValue(item.notes, 'Goal') || item.sessionType || 'General',
      email: getNoteValue(item.notes, 'User Email') || '-',
      phone: getNoteValue(item.notes, 'Mobile') || '-',
      status,
      avatar: getInitials(name),
      priority: normalizePriority(item.priority),
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!coachId) return;
    try {
      const [queuePayload, statsPayload, appointmentsPayload, teamPayload] = await Promise.all([
        getCoachQueue(),
        getCoachQueueStats(),
        getCoachAppointments({ page: 1, limit: 200 }),
        isHeadCoach
          ? getMyTeam().catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      const queueRows = Array.isArray(queuePayload?.data?.data)
        ? queuePayload.data.data.map(mapQueueRow)
        : [];
      const snoozedRows = Array.isArray(queuePayload?.data?.snoozed)
        ? queuePayload.data.snoozed.map(mapQueueRow)
        : [];
      setQueue(queueRows);
      setSnoozedQueue(snoozedRows);

      setQueueStats({
        urgentCount: Number(statsPayload?.data?.data?.urgentCount || 0),
        normalCount: Number(statsPayload?.data?.data?.normalCount || 0),
        lowCount: Number(statsPayload?.data?.data?.lowCount || 0),
        slaBreachedCount: Number(statsPayload?.data?.data?.slaBreachedCount || 0),
        avgWaitHours: Number(statsPayload?.data?.data?.avgWaitHours || 0),
        longestWaitHours: Number(statsPayload?.data?.data?.longestWaitHours || 0),
        escalatedTodayCount: Number(statsPayload?.data?.data?.escalatedTodayCount || 0),
      });

      const allAppointments = Array.isArray(appointmentsPayload?.data?.data)
        ? appointmentsPayload.data.data
        : [];
      const accepted = allAppointments.filter((item) => item.status === 'approved' || item.status === 'completed');
      const byUser = new Map();
      accepted.forEach((item) => {
        const previous = byUser.get(item.userId);
        if (!previous || new Date(item.updatedAt).getTime() > new Date(previous.updatedAt).getTime()) {
          byUser.set(item.userId, item);
        }
      });
      setMembers(Array.from(byUser.values()).map(mapMemberRow));

      setTeamMembers(Array.isArray(teamPayload?.data?.data) ? teamPayload.data.data : []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to load coach queue.' });
    }
  }, [coachId, isHeadCoach, mapMemberRow, mapQueueRow]);

  useEffect(() => {
    void loadData();
    const refreshInterval = setInterval(() => {
      void loadData();
    }, 60000);
    const tickInterval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [loadData]);

  const visibleQueue = useMemo(() => {
    if (queuePriorityFilter === 'all') return queue;
    return queue.filter((item) => item.priority === queuePriorityFilter);
  }, [queue, queuePriorityFilter]);

  const approveRequest = async (request) => {
    try {
      await updateCoachAppointmentStatus(request.id, { status: 'approved' });
      await loadData();
      setToast({ open: true, message: 'Appointment approved.' });
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to approve appointment.' });
    }
  };

  const openRejectDialog = (request) => {
    setRejectDialog({
      open: true,
      appointment: request,
      reason: '',
      error: '',
      isSubmitting: false,
    });
  };

  const closeRejectDialog = () => {
    setRejectDialog({
      open: false,
      appointment: null,
      reason: '',
      error: '',
      isSubmitting: false,
    });
  };

  const rejectRequest = async () => {
    const request = rejectDialog.appointment;
    const reason = rejectDialog.reason.trim();
    if (!request?.id) return;
    if (!reason) {
      setRejectDialog((prev) => ({ ...prev, error: 'Please add a reject reason.' }));
      return;
    }

    const existingSegments = String(request.notes || '')
      .split('|')
      .map((segment) => segment.trim())
      .filter((segment) => segment && !/^Reject Reason\s*:/i.test(segment));
    const notesWithRejectReason = [...existingSegments, `Reject Reason: ${reason}`].join(' | ');

    setRejectDialog((prev) => ({ ...prev, error: '', isSubmitting: true }));
    try {
      await updateCoachAppointmentStatus(request.id, {
        status: 'rejected',
        notes: notesWithRejectReason,
      });
      await loadData();
      setToast({ open: true, message: 'Appointment rejected.' });
      closeRejectDialog();
    } catch (error) {
      setRejectDialog((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error?.response?.data?.message || 'Failed to reject appointment.',
      }));
    }
  };

  const handleSnooze = async (appointmentId, value) => {
    const minutes = value === 'tomorrow' ? toTomorrowMinutes() : Number(value || 0);
    if (!minutes || minutes < 1) return;
    try {
      await snoozeAppointment(appointmentId, minutes);
      await loadData();
      setToast({ open: true, message: 'Appointment snoozed.' });
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to snooze appointment.' });
    }
  };

  const openDelegateDialog = (request) => {
    setDelegateDialog({
      open: true,
      appointment: request,
      subCoachId: '',
      error: '',
      isSubmitting: false,
    });
  };

  const closeDelegateDialog = () => {
    setDelegateDialog({
      open: false,
      appointment: null,
      subCoachId: '',
      error: '',
      isSubmitting: false,
    });
  };

  const submitDelegate = async () => {
    if (!delegateDialog.appointment?.id) return;
    if (!delegateDialog.subCoachId) {
      setDelegateDialog((prev) => ({ ...prev, error: 'Please select a sub-coach.' }));
      return;
    }

    setDelegateDialog((prev) => ({ ...prev, error: '', isSubmitting: true }));
    try {
      await delegateAppointment(delegateDialog.appointment.id, delegateDialog.subCoachId);
      await loadData();
      setToast({ open: true, message: 'Appointment delegated successfully.' });
      closeDelegateDialog();
    } catch (error) {
      setDelegateDialog((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error?.response?.data?.message || 'Failed to delegate appointment.',
      }));
    }
  };

  return (
    <Box sx={{ pb: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.85rem' }, fontWeight: 900, color: 'text.primary' }}>
          Coach Clients Queue
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.4 }}>
          Priority queue with FIFO behavior, auto-escalation support, and SLA tracking.
        </Typography>
      </Box>

      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          background: queueStats.slaBreachedCount > 0 ? (isDark ? '#331515' : '#fff1f2') : panelBg,
          borderRadius: 2.2,
          border: '1px solid',
          borderColor: queueStats.slaBreachedCount > 0 ? '#ef4444' : panelBorder,
          p: 2,
          mb: 2,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.2}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${queueStats.urgentCount} Urgent`} sx={{ fontWeight: 800, bgcolor: '#fee2e2', color: '#dc2626' }} />
            <Chip label={`${queueStats.normalCount} Normal`} sx={{ fontWeight: 800, bgcolor: '#fef3c7', color: '#d97706' }} />
            <Chip label={`${queueStats.lowCount} Low`} sx={{ fontWeight: 800, bgcolor: '#ccfbf1', color: '#0f766e' }} />
            <Chip label={`${queueStats.slaBreachedCount} SLA Breached`} sx={{ fontWeight: 800, bgcolor: '#fecaca', color: '#b91c1c' }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.secondary' }}>
              Avg wait: {Number(queueStats.avgWaitHours || 0).toFixed(1)} hrs
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: muted }}>
              Last updated {formatRelativeSeconds(lastUpdatedAt || nowTick)}
            </Typography>
          </Stack>
        </Stack>
        {queueStats.slaBreachedCount > 0 && (
          <Typography sx={{ mt: 1, color: '#dc2626', fontWeight: 900, fontSize: '0.84rem' }}>
            ACTION REQUIRED
          </Typography>
        )}
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        sx={{
          background: panelBg,
          borderRadius: 2.2,
          border: '1px solid',
          borderColor: panelBorder,
          p: 2,
          mb: 2,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={queuePriorityFilter === option.value ? 'contained' : 'outlined'}
                onClick={() => setQueuePriorityFilter(option.value)}
                sx={{ textTransform: 'none', borderRadius: 99, fontWeight: 700 }}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
          <Typography sx={{ fontSize: '0.82rem', color: muted }}>
            Queue positions stay fixed while filtering.
          </Typography>
        </Stack>

        <Stack spacing={1.3}>
          {!queue.length && (
            <Typography sx={{ color: 'text.secondary', py: 1 }}>No pending requests in the active queue.</Typography>
          )}

          {visibleQueue.map((row) => {
            const meta = PRIORITY_META[row.priority] || PRIORITY_META.normal;
            const overdue = Number(row.slaRemainingHours || 0) < 0 || row.slaBreached;
            return (
              <Box
                key={row.id}
                sx={{
                  borderLeft: `6px solid ${meta.border}`,
                  borderRadius: 1.8,
                  border: '1px solid',
                  borderColor: panelBorder,
                  p: 1.4,
                  background: isDark ? '#0c162d' : '#ffffff',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`#${row.queuePosition}`}
                      size="small"
                      sx={{ fontWeight: 900, bgcolor: isDark ? '#1f2937' : '#eef2ff' }}
                    />
                    <Chip
                      size="small"
                      label={meta.label}
                      sx={{ fontWeight: 800, color: meta.fg, bgcolor: meta.bg }}
                    />
                    {row.slaBreached && (
                      <Chip
                        size="small"
                        label="SLA BREACHED"
                        sx={{
                          fontWeight: 900,
                          color: '#ffffff',
                          bgcolor: '#dc2626',
                          animation: 'pulse 1.3s infinite',
                          '@keyframes pulse': {
                            '0%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                            '100%': { opacity: 1 },
                          },
                        }}
                      />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel id={`snooze-${row.id}`}>Snooze</InputLabel>
                      <Select
                        labelId={`snooze-${row.id}`}
                        label="Snooze"
                        value=""
                        onChange={(event) => {
                          void handleSnooze(row.id, event.target.value);
                        }}
                      >
                        {SNOOZE_OPTIONS.map((option) => (
                          <MenuItem key={String(option.value)} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => approveRequest(row)}
                      sx={{ textTransform: 'none', borderRadius: 1.4, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => openRejectDialog(row)}
                      sx={{ textTransform: 'none', borderRadius: 1.4 }}
                    >
                      Reject
                    </Button>
                    {isHeadCoach && teamMembers.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openDelegateDialog(row)}
                        sx={{ textTransform: 'none', borderRadius: 1.4 }}
                      >
                        Delegate
                      </Button>
                    )}
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 1 }}>
                  <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem', fontWeight: 800 }}>{row.avatar}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.93rem' }}>{row.name}</Typography>
                    <Typography sx={{ color: muted, fontSize: '0.83rem' }}>{row.goal}</Typography>
                    {isSubCoach && row.delegatedByCoachName && (
                      <Typography sx={{ color: '#0d9488', fontSize: '0.74rem', fontWeight: 700 }}>
                        Delegated by {row.delegatedByCoachName}
                      </Typography>
                    )}
                    {row.latestEscalation?.fromPriority && (
                      <Typography sx={{ color: muted, fontSize: '0.74rem', mt: 0.2 }}>
                        Auto-escalated from {String(row.latestEscalation.fromPriority).toUpperCase()}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: '0.81rem', color: muted }}>{formatWait(row.waitTimeHours)}</Typography>
                  <Typography sx={{ fontSize: '0.81rem', color: overdue ? '#dc2626' : muted, fontWeight: overdue ? 800 : 500 }}>
                    {formatSla(row.slaRemainingHours)}
                  </Typography>
                </Stack>

                <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: '0.82rem' }}>
                  {row.description}
                </Typography>
              </Box>
            );
          })}

          {queue.length > 0 && visibleQueue.length === 0 && (
            <Typography sx={{ color: 'text.secondary', py: 1 }}>
              No queue items match this priority filter.
            </Typography>
          )}
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Button
            size="small"
            onClick={() => setShowSnoozed((prev) => !prev)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {showSnoozed ? 'Hide Snoozed' : `Show Snoozed (${snoozedQueue.length})`}
          </Button>
          {showSnoozed && (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {!snoozedQueue.length && (
                <Typography sx={{ color: muted, fontSize: '0.84rem' }}>No snoozed items.</Typography>
              )}
              {snoozedQueue.map((row) => {
                const meta = PRIORITY_META[row.priority] || PRIORITY_META.normal;
                return (
                  <Box
                    key={`snoozed-${row.id}`}
                    sx={{
                      borderLeft: `6px solid ${meta.border}`,
                      borderRadius: 1.6,
                      border: '1px dashed',
                      borderColor: panelBorder,
                      p: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {row.name} - {row.goal}
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: muted }}>
                        Snoozed until {row.snoozedUntil ? new Date(row.snoozedUntil).toLocaleString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </MotionBox>

      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        sx={{
          background: panelBg,
          borderRadius: 2.2,
          border: '1px solid',
          borderColor: panelBorder,
          p: 2,
          mb: 2,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem', mb: 1.2 }}>
          Members Progress Snapshot
        </Typography>
        <Stack spacing={1}>
          {!members.length && (
            <Typography sx={{ color: muted, fontSize: '0.86rem' }}>No approved/completed members yet.</Typography>
          )}
          {members.map((member) => {
            const meta = PRIORITY_META[member.priority] || PRIORITY_META.normal;
            return (
              <Stack
                key={member.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ p: 1.2, border: '1px solid', borderColor: panelBorder, borderRadius: 1.5 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 34, height: 34, fontSize: '0.75rem' }}>{member.avatar}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{member.name}</Typography>
                    <Typography sx={{ color: muted, fontSize: '0.79rem' }}>{member.goal}</Typography>
                    <Typography sx={{ color: muted, fontSize: '0.76rem' }}>{member.email} | {member.phone}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={member.status} size="small" sx={{ fontWeight: 700 }} />
                  <Chip size="small" label={meta.label} sx={{ color: meta.fg, bgcolor: meta.bg, fontWeight: 800 }} />
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </MotionBox>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        message={toast.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />

      <Dialog open={rejectDialog.open} onClose={closeRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Appointment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1, color: muted, fontSize: '0.9rem' }}>
            Add a reason for rejection. This will be shown in user booking history.
          </Typography>
          <Typography sx={{ mb: 1, color: 'text.primary', fontSize: '0.9rem', fontWeight: 700 }}>
            {rejectDialog.appointment?.name || ''}
          </Typography>
          <TextField
            fullWidth
            required
            label="Reject Reason"
            multiline
            minRows={3}
            value={rejectDialog.reason}
            onChange={(event) =>
              setRejectDialog((prev) => ({ ...prev, reason: event.target.value, error: '' }))
            }
          />
          {rejectDialog.error && (
            <Typography sx={{ mt: 1, color: '#ef4444', fontSize: '0.84rem', fontWeight: 600 }}>
              {rejectDialog.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={rejectRequest}
            disabled={rejectDialog.isSubmitting}
          >
            {rejectDialog.isSubmitting ? 'Submitting...' : 'Submit Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delegateDialog.open} onClose={closeDelegateDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delegate Appointment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1, color: muted, fontSize: '0.9rem' }}>
            Select a sub-coach to reassign this pending booking.
          </Typography>
          <Typography sx={{ mb: 1.2, color: 'text.primary', fontSize: '0.9rem', fontWeight: 700 }}>
            {delegateDialog.appointment?.name || ''}
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="delegate-subcoach-label">Sub-Coach</InputLabel>
            <Select
              labelId="delegate-subcoach-label"
              label="Sub-Coach"
              value={delegateDialog.subCoachId}
              onChange={(event) =>
                setDelegateDialog((prev) => ({
                  ...prev,
                  subCoachId: event.target.value,
                  error: '',
                }))
              }
            >
              {teamMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {`${member.name} (${Number(member.pendingCount || 0)} pending)`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {delegateDialog.error && (
            <Typography sx={{ mt: 1, color: '#ef4444', fontSize: '0.84rem', fontWeight: 600 }}>
              {delegateDialog.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelegateDialog}>Cancel</Button>
          <Button variant="contained" onClick={submitDelegate} disabled={delegateDialog.isSubmitting}>
            {delegateDialog.isSubmitting ? 'Delegating...' : 'Delegate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CoachClients;
