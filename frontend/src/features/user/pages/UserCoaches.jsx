import { motion } from 'framer-motion';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  bookCoachAppointment,
  createFeedback,
  getFeedbacks,
  getPublicCoaches,
  getUserAppointments,
  updateAppointmentStatus,
  updateUserAppointment,
} from '@/features/user/api/user.api';
import { getCoachAvailableSlots } from '@/features/coach/api/coach.api';
import { ROUTES } from '@/shared/utils/constants';

const MotionCard = motion(Card);

const BOOKINGS = [
  {
    id: 'b1',
    coachName: 'Emma Carter',
    date: '2026-03-08',
    time: '07:30 AM',
    fromTime: '07:30',
    toTime: '08:30',
    appointmentType: 'In-person',
    goal: 'Weight Reducing',
    status: 'upcoming',
    progressStatus: 'confirmed',
  },
  {
    id: 'b2',
    coachName: 'Noah Bennett',
    date: '2026-03-19',
    time: '06:00 PM',
    fromTime: '18:00',
    toTime: '19:00',
    appointmentType: 'Online',
    goal: 'Weight Gaining',
    status: 'upcoming',
    progressStatus: 'pending',
  },
  {
    id: 'b3',
    coachName: 'Sophia Reed',
    date: '2026-02-22',
    time: '09:00 AM',
    fromTime: '09:00',
    toTime: '10:00',
    appointmentType: 'In-person',
    goal: 'Weight Reducing',
    status: 'past',
    progressStatus: 'completed',
  },
  {
    id: 'b4',
    coachName: 'Liam Hayes',
    date: '2026-02-10',
    time: '05:30 PM',
    fromTime: '17:30',
    toTime: '18:30',
    appointmentType: 'Online',
    goal: 'Weight Gaining',
    status: 'past',
    progressStatus: 'cancelled',
  },
];

const buildInitialCoachStats = (coachList = []) => {
  const stats = {};
  coachList.forEach((coach) => {
    stats[coach.id] = { average: 0, count: 0 };
  });
  return stats;
};

const STATUS_STEPS = ['pending', 'confirmed', 'completed'];
const MOBILE_NUMBER_PATTERN = /^\d{10}$/;
const PRIORITY_TAG_OPTIONS = [
  'Soon as possible',
  'Pain',
  'Injury',
  'Post-surgery recovery',
  'Limited mobility',
  'Breathing discomfort',
  'Dizziness',
  'Chest discomfort',
];
const APPOINTMENT_PRIORITY_OPTIONS = [
  {
    value: 'urgent',
    label: 'Urgent',
    helper: 'I need help as soon as possible',
    color: '#dc2626',
    bg: '#fee2e2',
  },
  {
    value: 'normal',
    label: 'Normal',
    helper: 'Standard booking, no rush',
    color: '#d97706',
    bg: '#fef3c7',
  },
  {
    value: 'low',
    label: 'Low',
    helper: 'Flexible, no rush',
    color: '#15803d',
    bg: '#dcfce7',
  },
];
const BOOKING_PROGRESS_META = {
  pending: { label: 'Pending', step: 0, color: '#16a34a' },
  confirmed: { label: 'Confirmed', step: 1, color: '#16a34a' },
  completed: { label: 'Completed', step: 2, color: '#16a34a' },
  cancelled: { label: 'Cancelled', step: -1, color: '#ef4444' },
};

const isBookingCompletedByTime = (booking) => {
  if (!booking?.date || !booking?.toTime) return false;
  const bookingEnd = new Date(`${booking.date}T${booking.toTime}:00`);
  if (Number.isNaN(bookingEnd.getTime())) return false;
  return Date.now() >= bookingEnd.getTime();
};

const getTodayDate = () => new Date().toISOString().split('T')[0];
const normalizePriority = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'low') return normalized;
  return 'normal';
};

const normalizeTimeTo24h = (rawTime) => {
  if (!rawTime) return '';
  if (rawTime.includes(':') && !rawTime.toUpperCase().includes('AM') && !rawTime.toUpperCase().includes('PM')) {
    return rawTime;
  }

  const [timePart, meridiemRaw] = rawTime.trim().split(' ');
  if (!timePart || !meridiemRaw) return '';
  const [hourRaw, minuteRaw] = timePart.split(':').map(Number);
  const meridiem = meridiemRaw.toUpperCase();

  let hour = hourRaw;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;

  const hh = String(hour).padStart(2, '0');
  const mm = String(minuteRaw || 0).padStart(2, '0');
  return `${hh}:${mm}`;
};

const toDisplayTime = (time24h) => {
  if (!time24h) return '';
  const [hRaw, mRaw] = time24h.split(':').map(Number);
  if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return '';
  const meridiem = hRaw >= 12 ? 'PM' : 'AM';
  const h12 = hRaw % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(mRaw).padStart(2, '0')} ${meridiem}`;
};

const getCoachSlotRanges = (coach) => {
  if (Array.isArray(coach?.todaySlotRanges) && coach.todaySlotRanges.length > 0) {
    return coach.todaySlotRanges.map((range) => ({
      start: normalizeTimeTo24h(range?.startTime),
      end: normalizeTimeTo24h(range?.endTime),
    }));
  }

  if (Array.isArray(coach?.slotRanges) && coach.slotRanges.length > 0) {
    return coach.slotRanges.map((range) => ({
      start: normalizeTimeTo24h(range?.startTime),
      end: normalizeTimeTo24h(range?.endTime),
    }));
  }
  return [];
};

const getCoachSlotDisplayLines = (coach) => {
  const todayIso = getTodayDate();
  const hasTodaySlots = Array.isArray(coach?.todaySlotRanges) && coach.todaySlotRanges.length > 0;
  if (!hasTodaySlots && (!coach?.slotDate || coach.slotDate !== todayIso)) return ['No slots'];

  const ranges = getCoachSlotRanges(coach)
    .map((range) => ({
      start: toDisplayTime(range.start),
      end: toDisplayTime(range.end),
    }))
    .filter((range) => range.start && range.end);

  if (!ranges.length) return ['No slots'];
  return ranges.map((range) => `Today, ${range.start} - ${range.end}`);
};

function UserCoaches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [bookingView, setBookingView] = useState('upcoming');
  const [toastState, setToastState] = useState({ open: false, message: '' });
  const [coaches, setCoaches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coachStats, setCoachStats] = useState({});
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [slotError, setSlotError] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, comment: '' });
  const [feedbackError, setFeedbackError] = useState('');
  const [submittedCoachFeedbackBookingIds, setSubmittedCoachFeedbackBookingIds] = useState(new Set());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    userName: '',
    userEmail: '',
    mobileNumber: '',
    date: '',
    fromTime: '',
    toTime: '',
    appointmentType: '',
    goal: '',
    appointmentPriority: 'normal',
    description: '',
    medicalConditions: '',
    priorityTags: [],
  });

  const getNoteValue = (notes, key) => {
    if (!notes) return '';
    const pattern = new RegExp(`${key}:\\s*([^|]+)`, 'i');
    const match = notes.match(pattern);
    return match?.[1]?.trim() || '';
  };

  const mapAppointmentToBooking = useCallback((item) => {
    const startsAt = new Date(item.startsAt);
    const endsAt = new Date(item.endsAt);
    const date = Number.isNaN(startsAt.getTime())
      ? getTodayDate()
      : startsAt.toISOString().split('T')[0];
    const fromTime = Number.isNaN(startsAt.getTime())
      ? ''
      : `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}`;
    const toTime = Number.isNaN(endsAt.getTime())
      ? ''
      : `${String(endsAt.getHours()).padStart(2, '0')}:${String(endsAt.getMinutes()).padStart(2, '0')}`;
    const coach = coaches.find((row) => String(row.id) === String(item.coachId));

    const statusMap = {
      pending: 'pending',
      approved: 'confirmed',
      completed: 'completed',
      cancelled: 'cancelled',
      rejected: 'cancelled',
    };
    const progressStatus = statusMap[item.status] || 'pending';
    const status = endsAt.getTime() < Date.now() || progressStatus === 'completed' ? 'past' : 'upcoming';

    return {
      id: item._id,
      coachId: item.coachId,
      coachName: coach?.name || String(item.coachId),
      date,
      fromTime,
      toTime,
      time: toDisplayTime(fromTime),
      appointmentType: getNoteValue(item.notes, 'Appointment Type')
        || (item.sessionType === 'training' ? 'In-person' : 'Online'),
      goal: getNoteValue(item.notes, 'Goal') || 'Weight Gaining',
      appointmentPriority: normalizePriority(item.priority),
      description: getNoteValue(item.notes, 'Description'),
      medicalConditions: getNoteValue(item.notes, 'Medical'),
      priorityTags: String(getNoteValue(item.notes, 'Priority Tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      rejectReason: getNoteValue(item.notes, 'Reject Reason') || '',
      status,
      progressStatus,
      rawStatus: item.status,
    };
  }, [coaches]);

  const loadCoachFeedbackStats = useCallback(async (coachList) => {
    const baseStats = buildInitialCoachStats(coachList);
    const coachNameToId = new Map(
      (Array.isArray(coachList) ? coachList : [])
        .map((coach) => [String(coach.name || '').trim(), String(coach.id || '')]),
    );
    try {
      const { data } = await getFeedbacks({
        subjectType: 'coach',
        page: 1,
        limit: 500,
      });
      const rows = Array.isArray(data?.data) ? data.data : [];
      rows.forEach((row) => {
        const subjectId = String(row.subjectId || '');
        const subjectName = String(row.subjectName || '').trim();
        const key = (
          (subjectId && baseStats[subjectId] && subjectId)
          || (subjectName && coachNameToId.get(subjectName))
          || ''
        );
        if (!key || !baseStats[key]) return;
        const current = baseStats[key];
        const nextCount = current.count + 1;
        const nextAverage = ((current.average * current.count) + Number(row.rating || 0)) / nextCount;
        baseStats[key] = {
          average: Number(nextAverage.toFixed(1)),
          count: nextCount,
        };
      });
      setCoachStats(baseStats);
    } catch {
      setCoachStats(baseStats);
    }
  }, []);

  const loadSubmittedCoachFeedbackBookings = useCallback(async () => {
    const ownerId = String(user?.id || '');
    if (!ownerId) {
      setSubmittedCoachFeedbackBookingIds(new Set());
      return;
    }

    try {
      const { data } = await getFeedbacks({
        subjectType: 'coach',
        ownerId,
        page: 1,
        limit: 500,
      });
      const rows = Array.isArray(data?.data) ? data.data : [];
      const nextIds = new Set(
        rows
          .map((row) => String(row.bookingId || ''))
          .filter(Boolean),
      );
      setSubmittedCoachFeedbackBookingIds(nextIds);
    } catch {
      setSubmittedCoachFeedbackBookingIds(new Set());
    }
  }, [user?.id]);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await getUserAppointments({
        userId: String(user.id),
        page: 1,
        limit: 100,
      });
      const items = Array.isArray(data?.data)
        ? data.data
            .filter((item) => item.sessionType !== 'nutrition')
            .map(mapAppointmentToBooking)
        : [];
      setBookings(items);
    } catch {
      setBookings(BOOKINGS);
    }
  }, [mapAppointmentToBooking, user]);

  const loadAvailableCoachSlots = useCallback(async (targetCoachId, targetDate) => {
    const coachId = String(targetCoachId || '').trim();
    const date = String(targetDate || '').trim();
    if (!coachId || !date) {
      setAvailableSlots([]);
      return;
    }
    try {
      setIsSlotsLoading(true);
      const { data } = await getCoachAvailableSlots(coachId, date);
      setAvailableSlots(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setIsSlotsLoading(false);
    }
  }, []);

  const loadCoaches = useCallback(async () => {
    try {
      const { data } = await getPublicCoaches();
      const items = Array.isArray(data?.data) ? data.data : [];
      setCoaches(items);
      await loadCoachFeedbackStats(items);
    } catch {
      setCoaches([]);
      setCoachStats({});
    }
  }, [loadCoachFeedbackStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCoaches();
    }, 0);
    const interval = setInterval(() => {
      void loadCoaches();
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadCoaches]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadBookings();
    }, 0);
    const interval = setInterval(() => {
      void loadBookings();
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadBookings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSubmittedCoachFeedbackBookings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSubmittedCoachFeedbackBookings]);

  useEffect(() => {
    if (!isBookingOpen) return;
    const selectedCoachId = selectedCoach?.id || selectedCoach?._id;
    if (!selectedCoachId || !bookingForm.date) {
      setAvailableSlots([]);
      return;
    }
    void loadAvailableCoachSlots(selectedCoachId, bookingForm.date);
  }, [isBookingOpen, selectedCoach, bookingForm.date, loadAvailableCoachSlots]);

  const handleOpenBooking = (coach) => {
    setSelectedCoach(coach);
    setAvailableSlots([]);
    setBookingForm({
      userName: user?.name || '',
      userEmail: user?.email || '',
      mobileNumber: user?.mobileNumber || user?.mobile || user?.phone || '',
      date: coach?.slotDate || getTodayDate(),
      fromTime: '',
      toTime: '',
      appointmentType: '',
      goal: '',
      appointmentPriority: 'normal',
      description: '',
      medicalConditions: '',
      priorityTags: [],
    });
    setEditingBookingId(null);
    setSlotError('');
    setIsBookingOpen(true);
  };

  const handleEditBooking = (booking) => {
    if (String(booking?.progressStatus || '') !== 'pending') {
      setToastState({
        open: true,
        message: 'You can reschedule only before coach approval.',
      });
      return;
    }
    const coach = coaches.find((item) => item.name === booking.coachName) || null;
    setSelectedCoach(coach);
    setAvailableSlots([]);
    setBookingForm({
      userName: user?.name || '',
      userEmail: user?.email || '',
      mobileNumber: user?.mobileNumber || user?.mobile || user?.phone || '',
      date: booking.date || getTodayDate(),
      fromTime: booking.fromTime || '',
      toTime: booking.toTime || '',
      appointmentType: booking.appointmentType?.toLowerCase() === 'in-person' ? 'inperson' : 'online',
      goal: booking.goal?.toLowerCase().includes('reducing') ? 'weight-reducing' : 'weight-gaining',
      appointmentPriority: normalizePriority(booking.appointmentPriority),
      description: booking.description || '',
      medicalConditions: booking.medicalConditions || '',
      priorityTags: Array.isArray(booking.priorityTags) ? booking.priorityTags : [],
    });
    setEditingBookingId(booking.id);
    setSlotError('');
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedCoach(null);
    setAvailableSlots([]);
    setEditingBookingId(null);
    setSlotError('');
  };

  const handleFieldChange = (field) => (event) => {
    if (field === 'mobileNumber') {
      const digitsOnly = String(event.target.value || '').replace(/\D/g, '').slice(0, 10);
      setBookingForm((prev) => ({ ...prev, mobileNumber: digitsOnly }));
      return;
    }
    if (field === 'date') {
      setBookingForm((prev) => ({ ...prev, date: event.target.value, fromTime: '', toTime: '' }));
      return;
    }
    setBookingForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePriorityTagsChange = (event) => {
    const value = event.target.value;
    setBookingForm((prev) => ({
      ...prev,
      priorityTags: Array.isArray(value)
        ? value
        : String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    }));
  };

  const handleSubmitBooking = async (event) => {
    event.preventDefault();
    const selectedCoachId = selectedCoach?.id || selectedCoach?._id;
    if (!selectedCoachId) {
      setSlotError('Selected coach is unavailable. Please refresh and try again.');
      return;
    }

    if (!bookingForm.fromTime || !bookingForm.toTime) {
      setSlotError('Unavailable at that time. Please choose an available time slot.');
      return;
    }
    const selectedSlot = availableSlots.find(
      (slot) => slot.startTime === bookingForm.fromTime && slot.endTime === bookingForm.toTime,
    );
    if (!selectedSlot || !selectedSlot.available) {
      setSlotError('Selected slot is no longer available. Please choose another slot.');
      return;
    }
    if (!MOBILE_NUMBER_PATTERN.test(String(bookingForm.mobileNumber || ''))) {
      setSlotError('Mobile number must be exactly 10 digits.');
      return;
    }

    setSlotError('');

    try {
      const startsAt = new Date(`${bookingForm.date}T${bookingForm.fromTime}:00`);
      const endsAt = new Date(`${bookingForm.date}T${bookingForm.toTime}:00`);

      const sessionTypeMap = {
        inperson: 'training',
        online: 'consultation',
      };

      const notes = [
        `CoachId: ${selectedCoachId}`,
        `Coach: ${selectedCoach?.name || ''}`,
        `User Name: ${bookingForm.userName || user?.name || ''}`,
        `User Email: ${bookingForm.userEmail || user?.email || ''}`,
        `Branch User ID: ${user?.branchUserId || '-'}`,
        `Appointment Type: ${bookingForm.appointmentType === 'inperson' ? 'In-person' : 'Online'}`,
        `Goal: ${bookingForm.goal === 'weight-gaining' ? 'Weight Gaining' : 'Weight Reducing'}`,
        bookingForm.priorityTags.length ? `Priority Tags: ${bookingForm.priorityTags.join(', ')}` : '',
        bookingForm.description ? `Description: ${bookingForm.description}` : '',
        bookingForm.medicalConditions ? `Medical: ${bookingForm.medicalConditions}` : '',
        bookingForm.mobileNumber ? `Mobile: ${bookingForm.mobileNumber}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      if (editingBookingId) {
        await updateUserAppointment(editingBookingId, {
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sessionType: sessionTypeMap[bookingForm.appointmentType] || 'consultation',
          notes,
        });
      } else {
        await bookCoachAppointment({
          userId: String(user?.id || bookingForm.userEmail || bookingForm.userName || 'guest-user'),
          coachId: String(selectedCoachId),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sessionType: sessionTypeMap[bookingForm.appointmentType] || 'consultation',
          priority: normalizePriority(bookingForm.appointmentPriority),
          notes,
        });
      }

      await loadBookings();
      handleCloseBooking();
      setToastState({
        open: true,
        message: editingBookingId ? 'Booking updated and saved to database' : 'Booking confirmed and saved to database',
      });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to save booking. Please try again.';
      setToastState({ open: true, message });
    }
  };

  const handleCloseSuccess = (_, reason) => {
    if (reason === 'clickaway') return;
    setToastState((prev) => ({ ...prev, open: false }));
  };

  const handleOpenFeedback = (booking) => {
    setFeedbackTarget(booking);
    setFeedbackForm({ rating: 0, comment: '' });
    setFeedbackError('');
    setIsFeedbackOpen(true);
  };

  const handleCloseFeedback = () => {
    setIsFeedbackOpen(false);
    setFeedbackTarget(null);
    setFeedbackError('');
  };

  const handleFeedbackFieldChange = (field) => (event) => {
    setFeedbackForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!feedbackForm.rating) {
      setFeedbackError('Please select a rating before submitting.');
      return;
    }

    const subjectId = String(feedbackTarget?.coachId || '');
    if (!subjectId) {
      setFeedbackError('Unable to identify coach for feedback.');
      return;
    }

    try {
      await createFeedback({
        ownerId: String(user?.id || ''),
        ownerName: user?.name || 'Member',
        subjectType: 'coach',
        subjectId,
        subjectName: feedbackTarget?.coachName || '',
        bookingId: String(feedbackTarget?.id || ''),
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
      });

      await loadCoachFeedbackStats(coaches);
      await loadSubmittedCoachFeedbackBookings();
      handleCloseFeedback();
      setToastState({ open: true, message: 'Feedback submitted successfully' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to submit feedback';
      setFeedbackError(message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await updateAppointmentStatus(bookingId, { status: 'cancelled' });
      await loadBookings();
      setToastState({ open: true, message: 'Booking cancelled successfully' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to cancel booking. Please try again.';
      setToastState({ open: true, message });
    }
  };

  const filteredBookings = bookings.filter((booking) => booking.status === bookingView);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        px: { xs: 2, md: 3 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 1220, mx: 'auto' }}>
        <Stack spacing={1} mb={4.5}>
          <Typography
            sx={{
              fontSize: { xs: '2rem', md: '2.6rem' },
              fontWeight: 800,
              color: theme.palette.text.primary,
            }}
          >
            Choose Your Coach
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.02rem' }}>
            Select a coach for your workout planning. Compare specialties, ratings, and available slots.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {coaches.map((coach, index) => (
            (() => {
              const coachStat = coachStats[coach.id] || { average: coach.rating, count: 0 };

              return (
            <MotionCard
              key={coach.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              onClick={() => handleOpenBooking(coach)}
              sx={{
                borderRadius: 3,
                border: `1px solid ${isDark ? '#2b3d58' : '#e5edf8'}`,
                bgcolor: theme.palette.background.paper,
                boxShadow: isDark
                  ? '0 12px 28px rgba(4, 11, 24, 0.45)'
                  : '0 12px 28px rgba(29, 58, 101, 0.11)',
                cursor: 'pointer',
              }}
            >
              <CardContent sx={{ p: 2.8 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={1.8}>
                  <Avatar sx={{ width: 54, height: 54, bgcolor: '#2b8eff', fontWeight: 700 }}>
                    {coach.avatar}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.2}>
                      <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                        {coach.name}
                      </Typography>
                      <VerifiedRoundedIcon sx={{ color: '#2b8eff', fontSize: 18 }} />
                    </Stack>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.94rem' }}>
                      {coach.specialty}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {coach.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: isDark ? '#18263c' : '#ecf4ff',
                        color: isDark ? '#bcd4f7' : '#2f4b72',
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Stack>

                <Stack spacing={1.2} mb={2.2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StarRoundedIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                    <Typography
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(
                          `${ROUTES.USER_COACH_FEEDBACKS}?coach=${encodeURIComponent(coach.name)}&coachId=${encodeURIComponent(String(coach.id || ''))}`,
                        );
                      }}
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: '0.93rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline', color: theme.palette.primary.main },
                      }}
                    >
                      {coachStat.count > 0
                        ? `Rating ${coachStat.average.toFixed(1)} (${coachStat.count})`
                        : 'No ratings yet'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FitnessCenterRoundedIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.93rem' }}>
                      Experience {coach.experience}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <AccessTimeRoundedIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                    <Stack spacing={0.2}>
                      {getCoachSlotDisplayLines(coach).map((line, lineIndex) => (
                        <Typography
                          key={`${coach.id || coach.name || 'coach'}-slot-${lineIndex}`}
                          sx={{ color: theme.palette.text.secondary, fontSize: '0.93rem' }}
                        >
                          {line}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                </Stack>

                <Stack spacing={0.8}>
                  <Typography sx={{ color: theme.palette.text.primary, fontSize: '0.92rem' }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>Qualification:</Box>{' '}
                    {coach.qualification}
                  </Typography>
                  <Typography sx={{ color: theme.palette.text.primary, fontSize: '0.92rem' }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>Certificates:</Box>{' '}
                    {coach.certificates}
                  </Typography>
                </Stack>
              </CardContent>
            </MotionCard>
              );
            })()
          ))}
        </Box>

        <Box sx={{ mt: 5.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            mb={2.2}
          >
            <Box>
              <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 800 }}>
                My Bookings
              </Typography>
              <Typography sx={{ color: theme.palette.text.secondary }}>
                Switch between upcoming and past appointments.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant={bookingView === 'upcoming' ? 'contained' : 'outlined'}
                onClick={() => setBookingView('upcoming')}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Upcoming
              </Button>
              <Button
                variant={bookingView === 'past' ? 'contained' : 'outlined'}
                onClick={() => setBookingView('past')}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Past
              </Button>
            </Stack>
          </Stack>

          <Stack spacing={1.4}>
            {filteredBookings.map((booking) => {
              const effectiveStatus = (
                booking.progressStatus !== 'cancelled' && isBookingCompletedByTime(booking)
              )
                ? 'completed'
                : booking.progressStatus;
              const progress = BOOKING_PROGRESS_META[effectiveStatus] || BOOKING_PROGRESS_META.pending;
              const isCancelled = effectiveStatus === 'cancelled';
              const isCompleted = effectiveStatus === 'completed';
              const feedbackAlreadySubmitted = submittedCoachFeedbackBookingIds.has(String(booking.id));
              const stepKeys = isCancelled ? ['pending', 'confirmed', 'cancelled'] : STATUS_STEPS;
              const displayTime = booking.fromTime && booking.toTime
                ? `${toDisplayTime(booking.fromTime)} - ${toDisplayTime(booking.toTime)}`
                : booking.time;

              return (
                <Card
                  key={booking.id}
                  sx={{
                    borderRadius: 2.5,
                    border: `1px solid ${isDark ? '#2b3d58' : '#e5edf8'}`,
                    bgcolor: theme.palette.background.paper,
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      justifyContent="space-between"
                      spacing={1.2}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                          {booking.coachName}
                        </Typography>
                        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.93rem' }}>
                          {booking.date} at {displayTime}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        <Chip label={booking.appointmentType} size="small" />
                        <Chip label={booking.goal} size="small" />
                      </Stack>
                    </Stack>

                    <Box sx={{ mt: 1.4 }}>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={1}>
                          <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, fontWeight: 600 }}>
                            Status Tracking
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" sx={{ mb: 0.8 }}>
                          {stepKeys.map((stepKey, index) => {
                            const isDone = index <= progress.step;
                            const isCancelledStep = isCancelled && stepKey === 'cancelled';
                            const circleBg = isCancelledStep
                              ? '#ef4444'
                              : (isDone ? '#16a34a' : '#d9de9e');
                            const connectorBg = isCancelled
                              ? (index === 0 ? '#16a34a' : '#ef4444')
                              : (index < progress.step ? '#16a34a' : '#d9de9e');

                            return (
                              <Stack key={stepKey} direction="row" alignItems="center" sx={{ flex: 1 }}>
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    bgcolor: circleBg,
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.92rem',
                                  }}
                                  >
                                    {isCancelledStep ? '✓' : (isDone ? '✓' : '')}
                                </Box>
                                {index < stepKeys.length - 1 && (
                                  <Box
                                    sx={{
                                      height: 4,
                                      flex: 1,
                                      mx: 0.7,
                                      borderRadius: 999,
                                      bgcolor: connectorBg,
                                    }}
                                  />
                                )}
                              </Stack>
                            );
                          })}
                        </Stack>

                        <Stack direction="row" alignItems="flex-start" sx={{ mb: 1.1 }}>
                          {stepKeys.map((stepKey, index) => {
                            const isDone = index <= progress.step;
                            const isCancelledStep = isCancelled && stepKey === 'cancelled';

                            return (
                              <Stack key={`${stepKey}-label`} direction="row" alignItems="flex-start" sx={{ flex: 1 }}>
                                <Box sx={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                                  <Typography
                                    sx={{
                                      fontSize: '0.73rem',
                                        fontWeight: (isDone || isCancelledStep) ? 700 : 600,
                                        color: isCancelledStep
                                          ? '#ef4444'
                                          : (isDone ? '#16a34a' : theme.palette.text.secondary),
                                      textTransform: 'capitalize',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {BOOKING_PROGRESS_META[stepKey].label}
                                  </Typography>
                                </Box>

                                {index < stepKeys.length - 1 && (
                                  <Box sx={{ flex: 1, mx: 0.7 }} />
                                )}
                              </Stack>
                            );
                          })}
                        </Stack>
                      </Box>
                    </Box>

                    {booking.rawStatus === 'rejected' && booking.rejectReason && (
                      <Box
                        sx={{
                          mt: 1.1,
                          px: 1.2,
                          py: 0.8,
                          borderRadius: 1.5,
                          border: '1px solid #ef444433',
                          bgcolor: '#ef444411',
                        }}
                      >
                        <Typography sx={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 700 }}>
                          Rejected Reason: {booking.rejectReason}
                        </Typography>
                      </Box>
                    )}

                    {booking.status === 'upcoming' && !isCancelled && !isCompleted && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.4 }}>
                        {effectiveStatus === 'pending' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditBooking(booking)}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleCancelBooking(booking.id)}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Cancel
                        </Button>
                        {effectiveStatus === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleEditBooking(booking)}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Reschedule
                          </Button>
                        )}
                      </Stack>
                    )}

                    {isCompleted && (
                      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.4 }}>
                        {feedbackAlreadySubmitted ? (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Feedback Submitted
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenFeedback(booking)}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Feedback
                          </Button>
                        )}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {filteredBookings.length === 0 && (
              <Card
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${isDark ? '#2b3d58' : '#e5edf8'}`,
                  bgcolor: theme.palette.background.paper,
                }}
              >
                <CardContent>
                  <Typography sx={{ color: theme.palette.text.secondary }}>
                    No {bookingView} bookings found.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      </Box>

      <Dialog
        open={isBookingOpen}
        onClose={handleCloseBooking}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmitBooking,
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingBookingId ? 'Edit Booking' : 'Book Appointment'} {selectedCoach ? `with ${selectedCoach.name}` : ''}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0.5 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Coach"
              value={selectedCoach?.name || ''}
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="User Name"
              value={bookingForm.userName}
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="User Email"
              value={bookingForm.userEmail}
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Mobile Number"
              value={bookingForm.mobileNumber}
              onChange={handleFieldChange('mobileNumber')}
              required
              placeholder="Enter your mobile number"
              error={Boolean(bookingForm.mobileNumber) && !MOBILE_NUMBER_PATTERN.test(bookingForm.mobileNumber)}
              helperText={
                bookingForm.mobileNumber && !MOBILE_NUMBER_PATTERN.test(bookingForm.mobileNumber)
                  ? 'Enter exactly 10 digits.'
                  : ' '
              }
              inputProps={{
                maxLength: 10,
                inputMode: 'numeric',
                pattern: '\\d{10}',
              }}
            />

            <TextField
              label="Date"
              type="date"
              value={bookingForm.date}
              onChange={handleFieldChange('date')}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getTodayDate() }}
              required
            />

            <Stack spacing={0.65}>
              <Typography sx={{ fontSize: '0.88rem', color: theme.palette.text.secondary, fontWeight: 700 }}>
                Select a slot
              </Typography>
              {isSlotsLoading && (
                <Typography sx={{ fontSize: '0.84rem', color: theme.palette.text.secondary }}>
                  Loading slots...
                </Typography>
              )}
              {!isSlotsLoading && availableSlots.length === 0 && (
                <Typography sx={{ fontSize: '0.84rem', color: theme.palette.text.secondary }}>
                  No available slots for this date. Try another date.
                </Typography>
              )}
              {!isSlotsLoading && availableSlots.length > 0 && (
                <Stack direction="row" spacing={0.9} useFlexGap flexWrap="wrap">
                  {availableSlots.map((slot) => {
                    const isSelected = bookingForm.fromTime === slot.startTime && bookingForm.toTime === slot.endTime;
                    return (
                      <Button
                        key={slot.slotId}
                        type="button"
                        disabled={!slot.available}
                        onClick={() =>
                          setBookingForm((prev) => ({ ...prev, fromTime: slot.startTime, toTime: slot.endTime }))
                        }
                        variant={isSelected ? 'contained' : 'outlined'}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 99,
                          fontWeight: 700,
                          borderColor: isSelected ? '#0f766e' : (slot.available ? '#0f766e' : '#9ca3af'),
                          color: isSelected ? '#ffffff' : (slot.available ? '#0f766e' : '#6b7280'),
                          backgroundColor: isSelected ? '#0f766e' : (slot.available ? '#ccfbf1' : '#e5e7eb'),
                          '&:hover': {
                            borderColor: isSelected ? '#0f766e' : (slot.available ? '#0f766e' : '#9ca3af'),
                            backgroundColor: isSelected ? '#0f766e' : (slot.available ? '#ccfbf1' : '#e5e7eb'),
                          },
                        }}
                      >
                        {slot.available ? slot.label : `${slot.label} - Booked`}
                      </Button>
                    );
                  })}
                </Stack>
              )}
            </Stack>

            {slotError && (
              <Typography sx={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                {slotError}
              </Typography>
            )}

            <FormControl fullWidth required>
              <InputLabel id="appointment-type-label">Appointment Type</InputLabel>
              <Select
                labelId="appointment-type-label"
                label="Appointment Type"
                value={bookingForm.appointmentType}
                onChange={handleFieldChange('appointmentType')}
              >
                <MenuItem value="inperson">In-person</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="goal-label">Goal</InputLabel>
              <Select
                labelId="goal-label"
                label="Goal"
                value={bookingForm.goal}
                onChange={handleFieldChange('goal')}
              >
                <MenuItem value="weight-gaining">Weight Gaining</MenuItem>
                <MenuItem value="weight-reducing">Weight Reducing</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: theme.palette.text.primary, mb: 0.75 }}>
                How urgent is this appointment?
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                {APPOINTMENT_PRIORITY_OPTIONS.map((option) => {
                  const selected = bookingForm.appointmentPriority === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selected ? 'contained' : 'outlined'}
                      disabled={Boolean(editingBookingId)}
                      onClick={() => setBookingForm((prev) => ({ ...prev, appointmentPriority: option.value }))}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        borderRadius: 99,
                        justifyContent: 'flex-start',
                        px: 1.5,
                        py: 1,
                        color: selected ? '#ffffff' : option.color,
                        borderColor: option.color,
                        backgroundColor: selected ? option.color : option.bg,
                        '&:hover': {
                          borderColor: option.color,
                          backgroundColor: selected ? option.color : option.bg,
                        },
                        '&.Mui-disabled': {
                          opacity: 0.7,
                          color: option.color,
                        },
                      }}
                    >
                      {option.label} - {option.helper}
                    </Button>
                  );
                })}
              </Stack>
              <Typography sx={{ mt: 0.7, fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                Urgent bookings are reviewed first. Please only select Urgent if genuinely needed.
              </Typography>
              {editingBookingId && (
                <Typography sx={{ mt: 0.6, fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                  Priority can be set only at booking creation.
                </Typography>
              )}
            </Box>

            <TextField
              label="Description"
              value={bookingForm.description}
              onChange={handleFieldChange('description')}
              multiline
              minRows={3}
              required
              placeholder="Share your expectations for this appointment"
            />

            <FormControl fullWidth>
              <InputLabel id="priority-tags-label">Priority Tags</InputLabel>
              <Select
                labelId="priority-tags-label"
                multiple
                value={bookingForm.priorityTags}
                onChange={handlePriorityTagsChange}
                label="Priority Tags"
                renderValue={(selected) => (
                  <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Stack>
                )}
              >
                {PRIORITY_TAG_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Medical Conditions"
              value={bookingForm.medicalConditions}
              onChange={handleFieldChange('medicalConditions')}
              multiline
              minRows={3}
              placeholder="Mention injuries, allergies, or ongoing conditions"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseBooking} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              background: 'linear-gradient(180deg, #2b91ff 0%, #0f79ed 100%)',
              '&:hover': { background: 'linear-gradient(180deg, #2386ef 0%, #0a6cd4 100%)' },
            }}
          >
            {editingBookingId ? 'Update Booking' : 'Confirm Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastState.open}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        message={toastState.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={(
          <Button color="inherit" size="small" onClick={handleCloseSuccess}>
            Close
          </Button>
        )}
      />

      <Dialog
        open={isFeedbackOpen}
        onClose={handleCloseFeedback}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          component: 'form',
          onSubmit: handleFeedbackSubmit,
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Rate Coach
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0.5 }}>
          <Stack spacing={1.8} sx={{ mt: 0.5 }}>
            <TextField
              label="Coach"
              value={feedbackTarget?.coachName || ''}
              InputProps={{ readOnly: true }}
            />

            <Box>
              <Typography sx={{ mb: 0.6, fontSize: '0.88rem', color: theme.palette.text.secondary }}>
                Rating
              </Typography>
              <Rating
                value={feedbackForm.rating}
                onChange={(_, value) => {
                  setFeedbackForm((prev) => ({ ...prev, rating: value || 0 }));
                  setFeedbackError('');
                }}
                precision={1}
              />
            </Box>

            <TextField
              label="Comment (Optional)"
              value={feedbackForm.comment}
              onChange={handleFeedbackFieldChange('comment')}
              multiline
              minRows={3}
            />

            {feedbackError && (
              <Typography sx={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                {feedbackError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseFeedback} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Give Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserCoaches;
