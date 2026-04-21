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
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  bookDietitianAppointment,
  createFeedback,
  getFeedbacks,
  getPublicDietitians,
  getUserAppointments,
  updateAppointmentStatus,
  updateUserAppointment,
} from '@/features/user/api/user.api';
import { getDietitianAvailableSlots } from '@/features/dietitian/api/dietitian.api';
import { ROUTES } from '@/shared/utils/constants';

const MotionCard = motion(Card);

const DIETITIANS = [
  {
    id: 'd1',
    name: 'Olivia Martin',
    specialty: 'Clinical Nutrition and Weight Management',
    experience: '7 years',
    rating: 4.9,
    slots: 'Mon - Fri, 8:00 AM - 12:00 PM',
    qualification: 'BSc Human Nutrition and Dietetics',
    certificates: 'CDE, Sports Nutrition Specialist',
    avatar: 'OM',
    tags: ['Weight Loss', 'PCOS', 'Meal Planning'],
  },
  {
    id: 'd2',
    name: 'Daniel Perera',
    specialty: 'Sports and Performance Nutrition',
    experience: '6 years',
    rating: 4.8,
    slots: 'Mon - Sat, 2:00 PM - 7:00 PM',
    qualification: 'MSc Sports Nutrition',
    certificates: 'ISSN-Certified, Precision Nutrition L2',
    avatar: 'DP',
    tags: ['Muscle Gain', 'Endurance', 'Supplements'],
  },
  {
    id: 'd3',
    name: 'Ayesha Fernando',
    specialty: 'Lifestyle and Therapeutic Diet Plans',
    experience: '5 years',
    rating: 4.7,
    slots: 'Tue - Sun, 9:00 AM - 3:00 PM',
    qualification: 'BSc Nutrition and Food Science',
    certificates: 'Diabetes Educator, Clinical Dietetics',
    avatar: 'AF',
    tags: ['Diabetes', 'Heart Health', 'Balanced Diet'],
  },
  {
    id: 'd4',
    name: 'Michael Silva',
    specialty: 'Gut Health and Medical Nutrition Therapy',
    experience: '8 years',
    rating: 5.0,
    slots: 'Mon - Fri, 4:00 PM - 9:00 PM',
    qualification: 'MSc Clinical Dietetics',
    certificates: 'GI Nutrition Specialist, Renal Nutrition',
    avatar: 'MS',
    tags: ['Gut Health', 'Hormonal Balance', 'Medical Diet'],
  },
];

const BOOKINGS = [];

const buildInitialDietitianStats = (dietitians = []) => {
  const stats = {};
  dietitians.forEach((dietitian) => {
    stats[dietitian.id] = { average: 0, count: 0 };
  });
  return stats;
};

const STATUS_STEPS = ['pending', 'confirmed', 'completed'];
const BOOKING_PROGRESS_META = {
  pending: { label: 'Pending', step: 0 },
  confirmed: { label: 'Confirmed', step: 1 },
  completed: { label: 'Completed', step: 2 },
  cancelled: { label: 'Cancelled', step: -1 },
};

const getTodayDate = () => new Date().toISOString().split('T')[0];
const MOBILE_NUMBER_PATTERN = /^\d{10}$/;
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

const getDietitianSlotRanges = (dietitian) => {
  if (Array.isArray(dietitian?.todaySlotRanges) && dietitian.todaySlotRanges.length > 0) {
    return dietitian.todaySlotRanges.map((range) => ({
      start: normalizeTimeTo24h(range?.startTime),
      end: normalizeTimeTo24h(range?.endTime),
    }));
  }

  if (Array.isArray(dietitian?.slotRanges) && dietitian.slotRanges.length > 0) {
    return dietitian.slotRanges.map((range) => ({
      start: normalizeTimeTo24h(range?.startTime),
      end: normalizeTimeTo24h(range?.endTime),
    }));
  }
  return [];
};

const getDietitianSlotDisplayLines = (dietitian) => {
  const todayIso = getTodayDate();
  const hasTodaySlots = Array.isArray(dietitian?.todaySlotRanges) && dietitian.todaySlotRanges.length > 0;
  if (!hasTodaySlots && (!dietitian?.slotDate || dietitian.slotDate !== todayIso)) return ['No slots'];

  const ranges = getDietitianSlotRanges(dietitian)
    .map((range) => ({
      start: toDisplayTime(range.start),
      end: toDisplayTime(range.end),
    }))
    .filter((range) => range.start && range.end);

  if (!ranges.length) return ['No slots'];
  return ranges.map((range) => `Today, ${range.start} - ${range.end}`);
};

const isBookingCompletedByTime = (booking) => {
  if (!booking?.date || !booking?.toTime) return false;
  const bookingEnd = new Date(`${booking.date}T${booking.toTime}:00`);
  if (Number.isNaN(bookingEnd.getTime())) return false;
  return Date.now() >= bookingEnd.getTime();
};

const getNoteValue = (notes, key) => {
  if (!notes) return '';
  const pattern = new RegExp(`${key}:\\s*([^|]+)`, 'i');
  const match = notes.match(pattern);
  return match?.[1]?.trim() || '';
};

function UserDietitians() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDietitian, setSelectedDietitian] = useState(null);
  const [bookingView, setBookingView] = useState('upcoming');
  const [bookings, setBookings] = useState(BOOKINGS);
  const [dietitians, setDietitians] = useState([]);
  const [dietitianStats, setDietitianStats] = useState({});
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [toastState, setToastState] = useState({ open: false, message: '' });

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, comment: '' });
  const [feedbackError, setFeedbackError] = useState('');
  const [submittedDietitianFeedbackBookingIds, setSubmittedDietitianFeedbackBookingIds] = useState(new Set());
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
  });


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

    const providerId = item.dietitianId || item.coachId;
    const dietitian = dietitians.find((row) => String(row.id) === String(providerId));
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
      dietitianId: providerId,
      dietitianName: dietitian?.name || getNoteValue(item.notes, 'Dietitian') || String(providerId),
      date,
      fromTime,
      toTime,
      appointmentType: getNoteValue(item.notes, 'Appointment Type') || 'In-person',
      goal: getNoteValue(item.notes, 'Goal') || 'Meal Planning',
      appointmentPriority: normalizePriority(item.priority),
      description: getNoteValue(item.notes, 'Description') || '',
      medicalConditions: getNoteValue(item.notes, 'Medical') || '',
      status,
      progressStatus,
      rawStatus: item.status,
      rejectReason: getNoteValue(item.notes, 'Reject Reason') || '',
    };
  }, [dietitians]);

  const loadDietitianFeedbackStats = useCallback(async (dietitianList) => {
    const baseStats = buildInitialDietitianStats(dietitianList);
    const dietitianNameToId = new Map(
      (Array.isArray(dietitianList) ? dietitianList : [])
        .map((dietitian) => [String(dietitian.name || '').trim(), String(dietitian.id || '')]),
    );
    try {
      const { data } = await getFeedbacks({
        subjectType: 'dietitian',
        page: 1,
        limit: 500,
      });
      const rows = Array.isArray(data?.data) ? data.data : [];
      rows.forEach((row) => {
        const subjectId = String(row.subjectId || '');
        const subjectName = String(row.subjectName || '').trim();
        const key = (
          (subjectId && baseStats[subjectId] && subjectId)
          || (subjectName && dietitianNameToId.get(subjectName))
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
      setDietitianStats(baseStats);
    } catch {
      setDietitianStats(baseStats);
    }
  }, []);

  const loadSubmittedDietitianFeedbackBookings = useCallback(async () => {
    const ownerId = String(user?.id || '');
    if (!ownerId) {
      setSubmittedDietitianFeedbackBookingIds(new Set());
      return;
    }

    try {
      const { data } = await getFeedbacks({
        subjectType: 'dietitian',
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
      setSubmittedDietitianFeedbackBookingIds(nextIds);
    } catch {
      setSubmittedDietitianFeedbackBookingIds(new Set());
    }
  }, [user?.id]);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await getUserAppointments({
        userId: String(user.id),
        sessionType: 'nutrition',
        page: 1,
        limit: 100,
      });
      const items = Array.isArray(data?.data) ? data.data.map(mapAppointmentToBooking) : [];
      setBookings(items);
    } catch {
      setBookings(BOOKINGS);
    }
  }, [mapAppointmentToBooking, user]);

  const loadAvailableDietitianSlots = useCallback(async (targetDietitianId, targetDate) => {
    const dietitianId = String(targetDietitianId || '').trim();
    const date = String(targetDate || '').trim();
    if (!dietitianId || !date) {
      setAvailableSlots([]);
      return;
    }
    try {
      setIsSlotsLoading(true);
      const { data } = await getDietitianAvailableSlots(dietitianId, date);
      setAvailableSlots(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setIsSlotsLoading(false);
    }
  }, []);

  const loadDietitiansWithStats = useCallback(async () => {
    try {
      const { data } = await getPublicDietitians();
      const items = Array.isArray(data?.data) ? data.data : [];
      setDietitians(items);
      await loadDietitianFeedbackStats(items);
    } catch {
      setDietitians(DIETITIANS);
      setDietitianStats(buildInitialDietitianStats(DIETITIANS));
    }
  }, [loadDietitianFeedbackStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDietitiansWithStats();
    }, 0);
    const interval = setInterval(() => {
      void loadDietitiansWithStats();
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadDietitiansWithStats]);

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
      void loadSubmittedDietitianFeedbackBookings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSubmittedDietitianFeedbackBookings]);

  useEffect(() => {
    if (!isBookingOpen) return;
    const selectedDietitianId = selectedDietitian?.id || selectedDietitian?._id;
    if (!selectedDietitianId || !bookingForm.date) {
      setAvailableSlots([]);
      return;
    }
    void loadAvailableDietitianSlots(selectedDietitianId, bookingForm.date);
  }, [isBookingOpen, selectedDietitian, bookingForm.date, loadAvailableDietitianSlots]);

  const handleOpenBooking = (dietitian) => {
    setSelectedDietitian(dietitian);
    setAvailableSlots([]);
    setBookingForm({
      userName: user?.name || '',
      userEmail: user?.email || '',
      mobileNumber: user?.mobileNumber || user?.mobile || user?.phone || '',
      date: dietitian?.slotDate || getTodayDate(),
      fromTime: '',
      toTime: '',
      appointmentType: '',
      goal: '',
      appointmentPriority: 'normal',
      description: '',
      medicalConditions: '',
    });
    setEditingBookingId(null);
    setAvailabilityError('');
    setIsBookingOpen(true);
  };

  const handleEditBooking = (booking) => {
    if (String(booking?.progressStatus || '') !== 'pending') {
      setToastState({
        open: true,
        message: 'You can reschedule only before dietitian approval.',
      });
      return;
    }
    const dietitian = dietitians.find((item) => String(item.id) === String(booking.dietitianId))
      || dietitians.find((item) => item.name === booking.dietitianName)
      || null;
    setSelectedDietitian(dietitian);
    setAvailableSlots([]);
    setBookingForm({
      userName: user?.name || '',
      userEmail: user?.email || '',
      mobileNumber: user?.mobileNumber || user?.mobile || user?.phone || '',
      date: booking.date || getTodayDate(),
      fromTime: booking.fromTime || '',
      toTime: booking.toTime || '',
      appointmentType: booking.appointmentType?.toLowerCase() === 'in-person' ? 'inperson' : 'online',
      goal: booking.goal?.toLowerCase().includes('health') ? 'health-consultation' : 'meal-planning',
      appointmentPriority: normalizePriority(booking.appointmentPriority),
      description: booking.description || '',
      medicalConditions: booking.medicalConditions || '',
    });
    setEditingBookingId(booking.id);
    setAvailabilityError('');
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedDietitian(null);
    setAvailableSlots([]);
    setEditingBookingId(null);
    setAvailabilityError('');
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

  const handleSubmitBooking = async (event) => {
    event.preventDefault();

    if (!bookingForm.fromTime || !bookingForm.toTime) {
      setAvailabilityError('Unavailable at selected time. Please choose another available time slot.');
      return;
    }
    const selectedSlot = availableSlots.find(
      (slot) => slot.startTime === bookingForm.fromTime && slot.endTime === bookingForm.toTime,
    );
    if (!selectedSlot || !selectedSlot.available) {
      setAvailabilityError('Selected slot is no longer available. Please choose another slot.');
      return;
    }

    const selectedDietitianId = selectedDietitian?.id || selectedDietitian?._id;
    if (!selectedDietitianId) {
      setAvailabilityError('Selected dietitian is unavailable. Please refresh and try again.');
      return;
    }
    if (!MOBILE_NUMBER_PATTERN.test(String(bookingForm.mobileNumber || ''))) {
      setAvailabilityError('Mobile number must be exactly 10 digits.');
      return;
    }

    try {
      const startsAt = new Date(`${bookingForm.date}T${bookingForm.fromTime}:00`);
      const endsAt = new Date(`${bookingForm.date}T${bookingForm.toTime}:00`);
      const notes = [
        `DietitianId: ${selectedDietitianId}`,
        `Dietitian: ${selectedDietitian?.name || ''}`,
        `User Name: ${bookingForm.userName || user?.name || ''}`,
        `User Email: ${bookingForm.userEmail || user?.email || ''}`,
        `Appointment Type: ${bookingForm.appointmentType === 'inperson' ? 'In-person' : 'Online'}`,
        `Goal: ${bookingForm.goal === 'health-consultation' ? 'Health Consultation' : 'Meal Planning'}`,
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
          sessionType: 'nutrition',
          notes,
        });
      } else {
        await bookDietitianAppointment({
          userId: String(user?.id || bookingForm.userEmail || bookingForm.userName || 'guest-user'),
          dietitianId: String(selectedDietitianId),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          sessionType: 'nutrition',
          priority: normalizePriority(bookingForm.appointmentPriority),
          notes,
        });
      }

      await loadBookings();
      setAvailabilityError('');
      handleCloseBooking();
      setToastState({
        open: true,
        message: editingBookingId ? 'Dietitian booking updated successfully' : 'Dietitian appointment booked successfully',
      });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to save booking. Please try again.';
      setToastState({ open: true, message });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await updateAppointmentStatus(bookingId, { status: 'cancelled' });
      await loadBookings();
      setToastState({ open: true, message: 'Dietitian booking cancelled successfully' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to cancel booking. Please try again.';
      setToastState({ open: true, message });
    }
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

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!feedbackForm.rating) {
      setFeedbackError('Please select a rating before submitting.');
      return;
    }

    const subjectId = String(feedbackTarget?.dietitianId || '');
    if (!subjectId) {
      setFeedbackError('Unable to identify dietitian for feedback.');
      return;
    }

    try {
      await createFeedback({
        ownerId: String(user?.id || ''),
        ownerName: user?.name || 'Member',
        subjectType: 'dietitian',
        subjectId,
        subjectName: feedbackTarget?.dietitianName || '',
        bookingId: String(feedbackTarget?.id || ''),
        rating: feedbackForm.rating,
        comment: feedbackForm.comment,
      });

      await loadDietitianFeedbackStats(dietitians);
      await loadSubmittedDietitianFeedbackBookings();
      handleCloseFeedback();
      setToastState({ open: true, message: 'Feedback submitted successfully' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to submit feedback';
      setFeedbackError(message);
    }
  };

  const handleCloseToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToastState((prev) => ({ ...prev, open: false }));
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
            Choose Your Dietitian
          </Typography>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.02rem' }}>
            Select a dietitian for your nutrition planning. Compare specialties, ratings, and available slots.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {dietitians.map((dietitian, index) => {
            const dietitianStat = dietitianStats[dietitian.id] || { average: dietitian.rating, count: 0 };

            return (
            <MotionCard
              key={dietitian.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              onClick={() => handleOpenBooking(dietitian)}
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
                    {dietitian.avatar}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.2}>
                      <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                        {dietitian.name}
                      </Typography>
                      <VerifiedRoundedIcon sx={{ color: '#2b8eff', fontSize: 18 }} />
                    </Stack>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.94rem' }}>
                      {dietitian.specialty}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {dietitian.tags.map((tag) => (
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
                          `${ROUTES.USER_DIETITIAN_FEEDBACKS}?dietitian=${encodeURIComponent(dietitian.name)}&dietitianId=${encodeURIComponent(String(dietitian.id || ''))}`,
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
                      {dietitianStat.count > 0
                        ? `Rating ${dietitianStat.average.toFixed(1)} (${dietitianStat.count})`
                        : 'No ratings yet'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RestaurantMenuRoundedIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.93rem' }}>
                      Experience {dietitian.experience}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <AccessTimeRoundedIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                    <Stack spacing={0.2}>
                      {getDietitianSlotDisplayLines(dietitian).map((line, lineIndex) => (
                        <Typography
                          key={`${dietitian.id || dietitian.name || 'dietitian'}-slot-${lineIndex}`}
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
                    {dietitian.qualification}
                  </Typography>
                  <Typography sx={{ color: theme.palette.text.primary, fontSize: '0.92rem' }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>Certificates:</Box>{' '}
                    {dietitian.certificates}
                  </Typography>
                </Stack>
              </CardContent>
            </MotionCard>
            );
          })}
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
              ) ? 'completed' : booking.progressStatus;

              const progress = BOOKING_PROGRESS_META[effectiveStatus] || BOOKING_PROGRESS_META.pending;
              const isCancelled = effectiveStatus === 'cancelled';
              const isCompleted = effectiveStatus === 'completed';
              const feedbackAlreadySubmitted = submittedDietitianFeedbackBookingIds.has(String(booking.id));
              const stepKeys = isCancelled ? ['pending', 'confirmed', 'cancelled'] : STATUS_STEPS;

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
                          {booking.dietitianName}
                        </Typography>
                        <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.93rem' }}>
                          {booking.date} at {toDisplayTime(booking.fromTime)} - {toDisplayTime(booking.toTime)}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        <Chip label={booking.appointmentType} size="small" />
                        <Chip label={booking.goal} size="small" />
                      </Stack>
                    </Stack>

                    <Box sx={{ mt: 1.4 }}>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, fontWeight: 600 }}>
                          Status Tracking
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" sx={{ mb: 0.8 }}>
                        {stepKeys.map((stepKey, index) => {
                          const isDone = index <= progress.step;
                          const isCancelledStep = isCancelled && stepKey === 'cancelled';
                          const circleBg = isCancelledStep ? '#ef4444' : (isDone ? '#16a34a' : '#d9de9e');
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
          {editingBookingId ? 'Edit Booking' : 'Book Appointment'} {selectedDietitian ? `with ${selectedDietitian.name}` : ''}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0.5 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Coach"
              value={selectedDietitian?.name || ''}
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
              <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary, fontWeight: 700 }}>
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

            {availabilityError && (
              <Typography sx={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 700 }}>
                {availabilityError}
              </Typography>
            )}

            <FormControl fullWidth required>
              <InputLabel id="dietitian-appointment-type-label">Appointment Type</InputLabel>
              <Select
                labelId="dietitian-appointment-type-label"
                label="Appointment Type"
                value={bookingForm.appointmentType}
                onChange={handleFieldChange('appointmentType')}
              >
                <MenuItem value="inperson">In-person</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="dietitian-goal-label">Goal</InputLabel>
              <Select
                labelId="dietitian-goal-label"
                label="Goal"
                value={bookingForm.goal}
                onChange={handleFieldChange('goal')}
              >
                <MenuItem value="meal-planning">Meal Planning</MenuItem>
                <MenuItem value="health-consultation">Health Consultation</MenuItem>
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
            />

            <TextField
              label="Medical Conditions"
              value={bookingForm.medicalConditions}
              onChange={handleFieldChange('medicalConditions')}
              multiline
              minRows={3}
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
        <DialogTitle sx={{ fontWeight: 800 }}>Rate Dietitian</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0.5 }}>
          <Stack spacing={1.8} sx={{ mt: 0.5 }}>
            <TextField
              label="Dietitian"
              value={feedbackTarget?.dietitianName || ''}
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
              onChange={(event) => setFeedbackForm((prev) => ({ ...prev, comment: event.target.value }))}
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

      <Snackbar
        open={toastState.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
        message={toastState.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={(
          <Button color="inherit" size="small" onClick={handleCloseToast}>
            Close
          </Button>
        )}
      />
    </Box>
  );
}

export default UserDietitians;

