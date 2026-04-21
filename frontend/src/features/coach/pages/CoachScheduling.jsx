import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  createCoachSchedulingSlot,
  deleteCoachSchedulingSlot,
  getCoachSchedulingSlots,
  updateCoachSchedulingSlot,
} from '../api/coach.api';

const MotionBox = motion(Box);
const SLOT_TYPES = ['In-Person', 'Online', 'Hybrid'];

const initialForm = {
  date: '',
  startTime: '',
  endTime: '',
  type: 'In-Person',
  notes: '',
};

const toDateTime = (date, time) => new Date(`${date}T${time}:00`);
const parseIsoDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const formatIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const stripToDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date) => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return stripToDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff));
};
const endOfWeek = (date) => {
  const start = startOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
};
const formatWeekRange = (start, end) => {
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startLabel} - ${endLabel}`;
};
const toLocalIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const toMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return (hours * 60) + minutes;
};

function CoachScheduling() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const formIconColor = isDark ? '#cbd5e1' : theme.palette.action.active;
  const formBorderDefault = isDark ? 'rgba(148, 163, 184, 0.38)' : theme.palette.divider;
  const formBorderHover = isDark ? 'rgba(148, 163, 184, 0.62)' : theme.palette.text.secondary;
  const formBorderFocus = isDark ? '#93c5fd' : theme.palette.primary.main;
  const { user } = useAuth();
  const coachId = user?.id;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(() => stripToDay(new Date()));

  const loadSlots = useCallback(async () => {
    if (!coachId) return;
    setLoading(true);
    setError('');
    try {
      const response = await getCoachSchedulingSlots(coachId);
      const apiSlots = Array.isArray(response?.data?.data) ? response.data.data : [];
      const normalized = apiSlots.map((slot) => ({
        id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: slot.sessionType,
        notes: slot.notes || '',
      }));
      setSlots(normalized);
    } catch (loadErr) {
      setError(loadErr?.response?.data?.message || 'Failed to load scheduling slots');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSlots();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSlots]);

  const orderedSlots = useMemo(() => {
    return [...slots].sort((a, b) => toDateTime(a.date, a.startTime) - toDateTime(b.date, b.startTime));
  }, [slots]);

  const filteredSlots = useMemo(() => {
    const dayRef = stripToDay(selectedDate);
    const weekStart = startOfWeek(dayRef);
    const weekEnd = endOfWeek(dayRef);

    if (viewMode === 'daily') {
      return orderedSlots.filter((slot) => stripToDay(parseIsoDate(slot.date)).getTime() === dayRef.getTime());
    }
    if (viewMode === 'weekly') {
      return orderedSlots.filter((slot) => {
        const day = parseIsoDate(slot.date);
        return day >= weekStart && day <= weekEnd;
      });
    }
    return orderedSlots.filter((slot) => {
      const day = parseIsoDate(slot.date);
      return day.getFullYear() === dayRef.getFullYear() && day.getMonth() === dayRef.getMonth();
    });
  }, [orderedSlots, viewMode, selectedDate]);

  const selectedWeekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const selectedWeekEnd = useMemo(() => endOfWeek(selectedDate), [selectedDate]);
  const selectedDayLabel = useMemo(
    () => selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    [selectedDate]
  );

  const slotGroups = useMemo(() => {
    if (viewMode === 'daily') {
      return [{
        key: formatIso(selectedDate),
        label: selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
        items: filteredSlots,
      }];
    }

    if (viewMode === 'weekly') {
      return Array.from({ length: 7 }).map((_, index) => {
        const day = new Date(selectedWeekStart);
        day.setDate(selectedWeekStart.getDate() + index);
        const dayKey = formatIso(day);
        return {
          key: dayKey,
          label: day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
          items: filteredSlots.filter((slot) => slot.date === dayKey),
        };
      });
    }

    const groupsMap = filteredSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = [];
      acc[slot.date].push(slot);
      return acc;
    }, {});
    return Object.keys(groupsMap).sort().map((dateKey) => ({
      key: dateKey,
      label: parseIsoDate(dateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      items: groupsMap[dateKey],
    }));
  }, [viewMode, filteredSlots, selectedDate, selectedWeekStart]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const upcoming = slots.filter((s) => toDateTime(s.date, s.endTime) >= now).length;
    const todayCount = slots.filter((s) => s.date === today).length;
    return {
      total: slots.length,
      today: todayCount,
      upcoming,
    };
  }, [slots]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError('');
  };

  const onChange = (field) => (event) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validate = () => {
    if (!form.date || !form.startTime || !form.endTime) {
      return 'Please complete date and time fields.';
    }

    const todayIso = toLocalIsoDate(new Date());
    if (form.date < todayIso) {
      return 'Please choose today or a future date.';
    }

    const startMinutes = toMinutes(form.startTime);
    const endMinutes = toMinutes(form.endTime);
    if (startMinutes < 0 || endMinutes < 0) {
      return 'Please choose a valid start and end time.';
    }
    if (endMinutes <= startMinutes) {
      return 'End time must be after start time.';
    }
    if (form.date === todayIso) {
      const now = new Date();
      const nowMinutes = (now.getHours() * 60) + now.getMinutes();
      if (startMinutes <= nowMinutes) {
        return 'Selected start time has already passed. Please choose a future time.';
      }
    }

    const duplicate = slots.some((s) => (
      s.id !== editingId
      && s.date === form.date
      && s.startTime === form.startTime
      && s.endTime === form.endTime
    ));
    if (duplicate) {
      return 'This time slot already exists.';
    }

    return '';
  };

  const onSubmit = async () => {
    if (!coachId) {
      setError('Coach account is required');
      return;
    }

    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    const payload = {
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      sessionType: form.type,
      notes: form.notes.trim(),
    };

    try {
      setError('');
      if (editingId) {
        await updateCoachSchedulingSlot(coachId, editingId, payload);
      } else {
        await createCoachSchedulingSlot(coachId, payload);
      }
      await loadSlots();
      setSelectedDate(parseIsoDate(payload.date));
      resetForm();
    } catch (submitErr) {
      setError(submitErr?.response?.data?.message || 'Failed to save slot');
    }
  };

  const onEdit = (slot) => {
    setEditingId(slot.id);
    setSelectedDate(parseIsoDate(slot.date));
    setForm({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      notes: slot.notes || '',
    });
  };

  const onDelete = async () => {
    if (!deleteId) return;
    if (!coachId) {
      setError('Coach account is required');
      return;
    }
    try {
      setError('');
      await deleteCoachSchedulingSlot(coachId, deleteId);
      await loadSlots();
      setDeleteId(null);
      if (editingId === deleteId) resetForm();
    } catch (deleteErr) {
      setError(deleteErr?.response?.data?.message || 'Failed to delete slot');
    }
  };

  const moveRange = (direction) => {
    const delta = direction === 'next' ? 1 : -1;
    const next = new Date(selectedDate);
    if (viewMode === 'monthly') {
      next.setMonth(next.getMonth() + delta);
    } else if (viewMode === 'weekly') {
      next.setDate(next.getDate() + (7 * delta));
    } else {
      next.setDate(next.getDate() + delta);
    }
    setSelectedDate(stripToDay(next));
  };

  const slotStatus = (slot) => {
    const now = new Date();
    const start = toDateTime(slot.date, slot.startTime);
    const end = toDateTime(slot.date, slot.endTime);
    if (end < now) return { label: 'Completed', color: '#64748b' };
    if (start <= now && end >= now) return { label: 'Ongoing', color: '#0d9488' };
    return { label: 'Upcoming', color: '#16a34a' };
  };

  const isSlotReadOnly = (slot) => toDateTime(slot.date, slot.endTime) < new Date();

  return (
    <MotionBox
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      sx={{ pb: 3 }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.9rem' }, fontWeight: 900, color: 'text.primary' }}>
          Coach Scheduling
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.3 }}>
          Manage your available consultation and training slots professionally.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
          mb: 2.2,
          width: '100%',
        }}
      >
        {[{ label: 'Total Slots', value: stats.total, icon: <CalendarMonthRoundedIcon /> }, { label: 'Today', value: stats.today, icon: <AccessTimeRoundedIcon /> }, { label: 'Upcoming', value: stats.upcoming, icon: <EventAvailableRoundedIcon /> }].map((item) => (
          <Card key={item.label} sx={{ borderRadius: 2.6, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', minHeight: 130, width: '100%' }}>
            <CardContent sx={{ p: 2.2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem' }}>{item.label}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '2rem', color: 'text.primary', lineHeight: 1.1 }}>{item.value}</Typography>
                </Box>
                <Box sx={{ width: 48, height: 48, borderRadius: 1.7, display: 'grid', placeItems: 'center', bgcolor: isDark ? '#173155' : '#e6f0ff', color: isDark ? '#93c5fd' : '#2563eb' }}>
                  {item.icon}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(340px, 0.42fr) minmax(0, 1fr)' },
          gap: 2,
          width: '100%',
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Card sx={{ borderRadius: 2.8, border: '1px solid', borderColor: 'divider', minHeight: 560 }}>
            <CardContent sx={{ p: 2.4 }}>
              <Typography sx={{ fontWeight: 800, mb: 1.2, color: 'text.primary' }}>
                {editingId ? 'Edit Slot' : 'Add Availability Slot'}
              </Typography>

              <Stack spacing={1.2}>
                <TextField
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={onChange('date')}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': { color: 'text.secondary' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'text.primary' },
                    '& .MuiOutlinedInput-root': {
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: formBorderDefault },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: formBorderHover },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: formBorderFocus, borderWidth: 1.4 },
                    },
                    '& .MuiSvgIcon-root': { color: formIconColor },
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                      opacity: isDark ? 1 : 0.74,
                      filter: isDark ? 'invert(0.92) saturate(0) brightness(1.15)' : 'none',
                      cursor: 'pointer',
                    },
                  }}
                />
                <Stack direction="row" spacing={1.2}>
                  <TextField
                    label="Start"
                    type="time"
                    value={form.startTime}
                    onChange={onChange('startTime')}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': { color: 'text.secondary' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'text.primary' },
                      '& .MuiOutlinedInput-root': {
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: formBorderDefault },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: formBorderHover },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: formBorderFocus, borderWidth: 1.4 },
                      },
                      '& .MuiSvgIcon-root': { color: formIconColor },
                      '& input[type="time"]::-webkit-calendar-picker-indicator': {
                        opacity: isDark ? 1 : 0.74,
                        filter: isDark ? 'invert(0.92) saturate(0) brightness(1.15)' : 'none',
                        cursor: 'pointer',
                      },
                    }}
                  />
                  <TextField
                    label="End"
                    type="time"
                    value={form.endTime}
                    onChange={onChange('endTime')}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': { color: 'text.secondary' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'text.primary' },
                      '& .MuiOutlinedInput-root': {
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: formBorderDefault },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: formBorderHover },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: formBorderFocus, borderWidth: 1.4 },
                      },
                      '& .MuiSvgIcon-root': { color: formIconColor },
                      '& input[type="time"]::-webkit-calendar-picker-indicator': {
                        opacity: isDark ? 1 : 0.74,
                        filter: isDark ? 'invert(0.92) saturate(0) brightness(1.15)' : 'none',
                        cursor: 'pointer',
                      },
                    }}
                  />
                </Stack>
                <TextField
                  select
                  label="Session Type"
                  value={form.type}
                  onChange={onChange('type')}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': { color: 'text.secondary' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'text.primary' },
                    '& .MuiOutlinedInput-root': {
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: formBorderDefault },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: formBorderHover },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: formBorderFocus, borderWidth: 1.4 },
                    },
                    '& .MuiSelect-icon': { color: formIconColor, opacity: 1 },
                    '& .MuiSvgIcon-root': { color: formIconColor },
                  }}
                >
                  {SLOT_TYPES.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Notes (optional)"
                  value={form.notes}
                  onChange={onChange('notes')}
                  multiline
                  minRows={4}
                  size="small"
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': { color: 'text.secondary' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'text.primary' },
                    '& .MuiOutlinedInput-root': {
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: formBorderDefault },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: formBorderHover },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: formBorderFocus, borderWidth: 1.4 },
                    },
                  }}
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    onClick={onSubmit}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.6, bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }}
                  >
                    {editingId ? 'Update Slot' : 'Add Slot'}
                  </Button>
                  {editingId && (
                    <Button variant="text" onClick={resetForm} sx={{ textTransform: 'none' }}>Cancel</Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Card sx={{ borderRadius: 2.8, border: '1px solid', borderColor: 'divider', minHeight: 560 }}>
            <CardContent sx={{ p: 2.4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent="space-between" sx={{ mb: 1.4 }}>
                <Stack spacing={1}>
                  <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>Available Time Slots</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      onClick={() => moveRange('prev')}
                      sx={{ minWidth: 38, width: 38, height: 38, p: 0, borderRadius: 1.4, border: '1px solid', borderColor: 'divider' }}
                    >
                      <ChevronLeftRoundedIcon />
                    </Button>
                    <Box sx={{ px: 1.4, py: 0.8, borderRadius: 1.4, border: '1px solid', borderColor: 'divider', minWidth: 180, textAlign: 'center' }}>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.9rem' }}>
                        {viewMode === 'monthly' && selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        {viewMode === 'weekly' && formatWeekRange(selectedWeekStart, selectedWeekEnd)}
                        {viewMode === 'daily' && selectedDayLabel}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => moveRange('next')}
                      sx={{ minWidth: 38, width: 38, height: 38, p: 0, borderRadius: 1.4, border: '1px solid', borderColor: 'divider' }}
                    >
                      <ChevronRightRoundedIcon />
                    </Button>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={0.8}>
                  {[
                    { key: 'daily', label: 'Daily' },
                    { key: 'weekly', label: 'Weekly' },
                    { key: 'monthly', label: 'Monthly' },
                  ].map((mode) => (
                    <Button
                      key={mode.key}
                      size="small"
                      onClick={() => setViewMode(mode.key)}
                      variant={viewMode === mode.key ? 'contained' : 'outlined'}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1.5,
                        fontWeight: 700,
                        minWidth: 80,
                        ...(viewMode === mode.key
                          ? { bgcolor: '#0d9488', '&:hover': { bgcolor: '#0f766e' } }
                          : {}),
                      }}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>

              {!loading && !filteredSlots.length && (
                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, py: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {viewMode === 'daily' && `No slots for ${selectedDayLabel}.`}
                    {viewMode === 'weekly' && `No slots for ${formatWeekRange(selectedWeekStart, selectedWeekEnd)}.`}
                    {viewMode === 'monthly' && `No slots for ${selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`}
                  </Typography>
                </Box>
              )}
              {loading && (
                <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, py: 4, textAlign: 'center' }}>
                  <Typography sx={{ color: 'text.secondary' }}>Loading slots...</Typography>
                </Box>
              )}

              <Stack spacing={1.4}>
                {slotGroups.map((group) => (
                  <Box key={group.key}>
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.88rem', mb: 0.8 }}>
                      {group.label}
                    </Typography>
                    {!group.items.length && (
                      <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1.6, px: 1.2, py: 1.1 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>No slots for this day.</Typography>
                      </Box>
                    )}
                    <Stack spacing={1.1}>
                      {group.items.map((slot) => {
                        const status = slotStatus(slot);
                        const readOnly = isSlotReadOnly(slot);
                        return (
                          <Box key={slot.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.8, px: 1.5, py: 1.2, bgcolor: 'background.paper' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {slot.date} | {slot.startTime} - {slot.endTime}
                                </Typography>
                                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                  <Chip label={slot.type} size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }} />
                                  <Chip label={status.label} size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700, bgcolor: `${status.color}20`, color: status.color }} />
                                  {readOnly && (
                                    <Chip label="Read-only" size="small" sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#64748b20', color: '#64748b' }} />
                                  )}
                                </Stack>
                                {!!slot.notes && (
                                  <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', mt: 0.6 }}>{slot.notes}</Typography>
                                )}
                              </Box>

                              <Stack direction="row" spacing={0.8}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditRoundedIcon />}
                                  onClick={() => onEdit(slot)}
                                  disabled={readOnly}
                                  sx={{ textTransform: 'none', borderRadius: 1.4 }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  startIcon={<DeleteOutlineRoundedIcon />}
                                  onClick={() => setDeleteId(slot.id)}
                                  disabled={readOnly}
                                  sx={{ textTransform: 'none', borderRadius: 1.4 }}
                                >
                                  Delete
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Slot</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this slot?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={onDelete} color="error" variant="contained" sx={{ textTransform: 'none' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </MotionBox>
  );
}

export default CoachScheduling;


