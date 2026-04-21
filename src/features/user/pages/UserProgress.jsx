import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Popover,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MonitorWeightRoundedIcon from '@mui/icons-material/MonitorWeightRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { useAuth } from '@/shared/hooks/useAuth';
import { getToken } from '@/shared/utils/storage';
import {
  deleteProgressPhoto,
  getUserProgress,
  getUserWorkoutPlans,
  saveUserMeasurement,
  updatePhotoNote,
  uploadProgressPhoto,
} from '@/features/user/api/user.api';

const MotionCard = motion(Card);
const UPLOAD_WINDOW_STORAGE_KEY = 'progress.uploadWindow.v1';
const GLOBAL_UPLOAD_WINDOW_STORAGE_KEY = 'progress.uploadWindow.latest';
const PROGRESS_PHOTOS_STORAGE_KEY = 'progress.photosByDate.v1';
const GLOBAL_PROGRESS_PHOTOS_STORAGE_KEY = 'progress.photosByDate.latest';

const getTodayIso = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const formatIsoToFull = (isoDate) => new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const formatIsoToShort = (isoDate) => new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
});
const toIsoDate = (dateValue) => {
  const yyyy = dateValue.getFullYear();
  const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
  const dd = String(dateValue.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const normalizeIsoDateInput = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return toIsoDate(parsed);
};
const isUploadTokenValidForToday = (token, todayDate) => {
  if (!token || token.date !== todayDate) return false;
  if (!Number.isFinite(Number(token.expiresAt))) return false;
  return Date.now() < Number(token.expiresAt);
};
const getNextLocalMidnightTimestamp = () => {
  const now = new Date();
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0,
  );
  return nextMidnight.getTime();
};
const getUserIdFromToken = () => {
  try {
    const token = getToken();
    if (!token) return '';
    const parts = String(token).split('.');
    if (parts.length < 2) return '';
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const payload = JSON.parse(json);
    return String(payload?.sub || '').trim();
  } catch {
    return '';
  }
};
const extractCompletionDatesFromPlans = (plans = []) => {
  const extracted = new Set();
  (Array.isArray(plans) ? plans : []).forEach((plan) => {
    const sessionCompleted = normalizeIsoDateInput(plan?.session?.completedAt || '');
    if (sessionCompleted) extracted.add(sessionCompleted);
    const isCompletedSession = String(plan?.session?.status || '').toLowerCase() === 'completed';
    const isCompletedPlan = String(plan?.status || '').toLowerCase() === 'completed';
    if ((isCompletedSession || isCompletedPlan) && !sessionCompleted) {
      const completedFallback = normalizeIsoDateInput(plan?.updatedAt || plan?.createdAt || '');
      if (completedFallback) extracted.add(completedFallback);
    }
    const days = Array.isArray(plan?.programDays) ? plan.programDays : [];
    days.forEach((day) => {
      if (!day?.done) return;
      const dayDate = normalizeIsoDateInput(day?.date || '');
      if (dayDate) extracted.add(dayDate);
    });
  });
  return [...extracted].sort((left, right) => new Date(`${left}T00:00:00`) - new Date(`${right}T00:00:00`));
};

const buildCalendarDays = (visibleMonthDate) => {
  const year = visibleMonthDate.getFullYear();
  const month = visibleMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(null);
    } else {
      const dateObj = new Date(year, month, dayNumber);
      cells.push({
        dayNumber,
        iso: toIsoDate(dateObj),
      });
    }
  }
  return cells;
};

const buildSmoothPath = (points) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const current = points[index];
    const midX = (prev.x + current.x) / 2;
    path += ` Q ${midX} ${prev.y}, ${current.x} ${current.y}`;
  }
  return path;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const findNearestOnSegment = (cursor, start, end) => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = (segmentX * segmentX) + (segmentY * segmentY);

  if (segmentLengthSquared === 0) {
    const dx = cursor.x - start.x;
    const dy = cursor.y - start.y;
    return {
      x: start.x,
      y: start.y,
      t: 0,
      distance: Math.hypot(dx, dy),
    };
  }

  const t = clamp((((cursor.x - start.x) * segmentX) + ((cursor.y - start.y) * segmentY)) / segmentLengthSquared, 0, 1);
  const x = start.x + (t * segmentX);
  const y = start.y + (t * segmentY);
  const distance = Math.hypot(cursor.x - x, cursor.y - y);

  return { x, y, t, distance };
};

const findNearestChartHover = (cursor, points, threshold) => {
  if (!points.length) return null;
  if (points.length === 1) {
    const onlyPoint = points[0];
    const distance = Math.hypot(cursor.x - onlyPoint.x, cursor.y - onlyPoint.y);
    return distance <= threshold
      ? {
        x: onlyPoint.x,
        y: onlyPoint.y,
        index: 0,
        distance,
      }
      : null;
  }

  let best = null;

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const nearest = findNearestOnSegment(cursor, start, end);

    if (!best || nearest.distance < best.distance) {
      const snappedIndex = nearest.t < 0.5 ? index : index + 1;
      best = {
        x: nearest.x,
        y: nearest.y,
        index: snappedIndex,
        distance: nearest.distance,
      };
    }
  }

  return best && best.distance <= threshold ? best : null;
};

const createPhotoSlots = () => Array.from({ length: 4 }, (_, index) => ({
  id: `slot-${index + 1}`,
  imageUrl: '',
}));
const SLOT_LABELS = ['Front View', 'Back View', 'Left Side', 'Right Side'];

const METRIC_CARD_META = [
  {
    id: 'weight',
    label: 'Current Weight',
    icon: MonitorWeightRoundedIcon,
    tone: '#2563eb',
  },
  {
    id: 'fat',
    label: 'Body Fat %',
    icon: TrendingUpRoundedIcon,
    tone: '#9333ea',
  },
  {
    id: 'streak',
    label: 'Workout Streak',
    icon: EmojiEventsRoundedIcon,
    tone: '#d97706',
  },
];

const MEASUREMENT_LABELS = {
  chest: 'Chest',
  waist: 'Waist',
  arms: 'Arms',
  thighs: 'Thighs',
};

const getPreviousIsoDate = (isoDate) => {
  const dateObj = new Date(`${isoDate}T00:00:00`);
  dateObj.setDate(dateObj.getDate() - 1);
  return toIsoDate(dateObj);
};

const getConsecutiveWorkoutStreak = (completionDates, todayIso) => {
  if (!completionDates.length) return 0;

  const dateSet = new Set(completionDates);
  const latestDate = completionDates[completionDates.length - 1];
  const yesterdayIso = getPreviousIsoDate(todayIso);

  // Strict streak: only active when the chain reaches today or yesterday.
  if (latestDate !== todayIso && latestDate !== yesterdayIso) {
    return 0;
  }

  let streak = 0;
  let cursorDate = latestDate;
  while (dateSet.has(cursorDate)) {
    streak += 1;
    cursorDate = getPreviousIsoDate(cursorDate);
  }

  return streak;
};

function UserProgress() {
  const { user } = useAuth();
  const location = useLocation();
  const tokenUserId = getUserIdFromToken();
  const userId = String(user?.id || user?._id || user?.userId || tokenUserId || '');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const todayIso = getTodayIso();
  const completedWorkoutDateFromState = normalizeIsoDateInput(location.state?.completedWorkoutDate || '');
  const openedFromWorkoutFinish = Boolean(location.state?.openedFromWorkoutFinish);

  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(todayIso));
  const [photosByDate, setPhotosByDate] = useState(() => {
    try {
      const raw = localStorage.getItem(GLOBAL_PROGRESS_PHOTOS_STORAGE_KEY);
      if (!raw) {
        return {
          [todayIso]: createPhotoSlots(),
        };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return {
          [todayIso]: createPhotoSlots(),
        };
      }
      return parsed;
    } catch {
      return {
        [todayIso]: createPhotoSlots(),
      };
    }
  });
  const [photos, setPhotos] = useState([]);
  const [photoToast, setPhotoToast] = useState({ open: false, message: '' });
  const [editingPhotoIndex, setEditingPhotoIndex] = useState(null);
  const [slotLoadingByIndex, setSlotLoadingByIndex] = useState({});
  const [slotErrorsByIndex, setSlotErrorsByIndex] = useState({});
  const [photoNotesBySlot, setPhotoNotesBySlot] = useState({});
  const [isMeasurementDialogOpen, setIsMeasurementDialogOpen] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    chest: '',
    waist: '',
    arms: '',
    thighs: '',
    bodyFat: '',
    weight: '',
  });
  const uploadInputRef = useRef(null);
  const hasAutoUploadPromptedRef = useRef(false);
  const chartSvgRef = useRef(null);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);
  const [weightHistoryByDate, setWeightHistoryByDate] = useState({});
  const [measurementsByDate, setMeasurementsByDate] = useState({});
  const [completionDate, setCompletionDate] = useState('');
  const [workoutCompletionDates, setWorkoutCompletionDates] = useState([]);
  const [workoutCompletionDatesFromPlans, setWorkoutCompletionDatesFromPlans] = useState([]);
  const uploadWindowDateFromStorage = useMemo(() => {
    const possibleIds = [...new Set(
      [user?.id, user?._id, user?.userId, tokenUserId]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    )];
    if (!possibleIds.length) return '';
    try {
      for (const idKey of possibleIds) {
        const raw = localStorage.getItem(`${UPLOAD_WINDOW_STORAGE_KEY}.${idKey}`);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const normalized = normalizeIsoDateInput(parsed?.date || '');
        const token = { ...parsed, date: normalized };
        if (!isUploadTokenValidForToday(token, todayIso)) {
          localStorage.removeItem(`${UPLOAD_WINDOW_STORAGE_KEY}.${idKey}`);
          continue;
        }
        return normalized;
      }
      return '';
    } catch {
      return '';
    }
  }, [todayIso, tokenUserId, user?.id, user?._id, user?.userId]);
  const uploadWindowDateFromGlobalStorage = useMemo(() => {
    try {
      const raw = localStorage.getItem(GLOBAL_UPLOAD_WINDOW_STORAGE_KEY);
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      const normalized = normalizeIsoDateInput(parsed?.date || '');
      const token = { ...parsed, date: normalized };
      if (!isUploadTokenValidForToday(token, todayIso)) {
        localStorage.removeItem(GLOBAL_UPLOAD_WINDOW_STORAGE_KEY);
        return '';
      }
      return normalized;
    } catch {
      return '';
    }
  }, [todayIso]);
  const mergedCompletionDates = useMemo(() => {
    const merged = new Set(Array.isArray(workoutCompletionDates) ? workoutCompletionDates : []);
    if (completedWorkoutDateFromState) merged.add(completedWorkoutDateFromState);
    if (uploadWindowDateFromStorage) merged.add(uploadWindowDateFromStorage);
    if (uploadWindowDateFromGlobalStorage) merged.add(uploadWindowDateFromGlobalStorage);
    (Array.isArray(workoutCompletionDatesFromPlans) ? workoutCompletionDatesFromPlans : []).forEach((date) => merged.add(date));
    return [...merged].sort((left, right) => new Date(`${left}T00:00:00`) - new Date(`${right}T00:00:00`));
  }, [
    workoutCompletionDates,
    completedWorkoutDateFromState,
    uploadWindowDateFromStorage,
    uploadWindowDateFromGlobalStorage,
    workoutCompletionDatesFromPlans,
  ]);
  const latestCompletionDate = mergedCompletionDates.length
    ? mergedCompletionDates[mergedCompletionDates.length - 1]
    : '';
  const hasTodayCompletionEvidence = (
    mergedCompletionDates.includes(todayIso)
    || completedWorkoutDateFromState === todayIso
    || uploadWindowDateFromStorage === todayIso
    || uploadWindowDateFromGlobalStorage === todayIso
  );
  const effectiveCompletionDate = completionDate || latestCompletionDate || (hasTodayCompletionEvidence ? todayIso : '');
  const completionDateFull = effectiveCompletionDate ? formatIsoToFull(effectiveCompletionDate) : '';
  const selectedDateFull = formatIsoToFull(selectedDate);
  const selectedDateShort = formatIsoToShort(selectedDate);
  const visibleMonthLabel = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const canUploadToday = selectedDate === todayIso && hasTodayCompletionEvidence;
  const canUploadSelectedDate = canUploadToday || mergedCompletionDates.includes(selectedDate);
  const selectedDatePhotos = photosByDate[selectedDate] || createPhotoSlots();
  const backendPhotoBySlot = useMemo(
    () => new Map((Array.isArray(photos) ? photos : []).map((photo) => [Number(photo.slot), photo])),
    [photos],
  );
  const visiblePhotoSlots = useMemo(() => (
    Array.from({ length: 4 }, (_, index) => {
      const slot = index + 1;
      const backendPhoto = backendPhotoBySlot.get(slot);
      const fallbackPhoto = selectedDatePhotos[index] || { id: `slot-${slot}`, imageUrl: '' };
      const imageUrl = backendPhoto?.base64Image || fallbackPhoto.imageUrl || '';
      return {
        slot,
        index,
        id: backendPhoto ? `backend-slot-${slot}` : fallbackPhoto.id,
        imageUrl,
        note: String(photoNotesBySlot[slot] ?? backendPhoto?.note ?? ''),
        label: backendPhoto?.label || SLOT_LABELS[index] || `PHOTO ${slot}`,
        fromBackend: Boolean(backendPhoto),
      };
    })
  ), [backendPhotoBySlot, photoNotesBySlot, selectedDatePhotos]);
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const isCalendarOpen = Boolean(calendarAnchorEl);

  const loadProgressData = useCallback(async () => {
    if (!userId) return;
    const [progressResult, workoutPlansResult] = await Promise.allSettled([
      getUserProgress(userId),
      getUserWorkoutPlans(userId),
    ]);

    if (progressResult.status === 'fulfilled') {
      const payload = progressResult.value?.data?.data || {};
      const nextWeightHistory = payload.weightHistoryByDate || {};
      const nextMeasurements = payload.measurementsByDate || {};

      setWeightHistoryByDate(nextWeightHistory);
      setMeasurementsByDate(nextMeasurements);
      setWorkoutCompletionDates(
        Array.isArray(payload.workoutCompletionDates)
          ? payload.workoutCompletionDates.map((date) => normalizeIsoDateInput(date)).filter(Boolean)
          : [],
      );
      setCompletionDate(normalizeIsoDateInput(payload.completionDate || ''));
      const nextPhotos = Array.isArray(payload.photos) ? payload.photos : [];
      setPhotos(nextPhotos);
      setPhotoNotesBySlot(
        nextPhotos.reduce((acc, photo) => {
          const slot = Number(photo?.slot || 0);
          if ([1, 2, 3, 4].includes(slot)) acc[slot] = String(photo?.note || '');
          return acc;
        }, {}),
      );
    }

    if (workoutPlansResult.status === 'fulfilled') {
      const plansPayload = Array.isArray(workoutPlansResult.value?.data?.data)
        ? workoutPlansResult.value.data.data
        : [];
      setWorkoutCompletionDatesFromPlans(extractCompletionDatesFromPlans(plansPayload));
    }

    if (progressResult.status === 'rejected' && workoutPlansResult.status === 'rejected') {
      const progressMessage = progressResult.reason?.response?.data?.message;
      const plansMessage = workoutPlansResult.reason?.response?.data?.message;
      setPhotoToast({
        open: true,
        message: progressMessage || plansMessage || 'Failed to load progress data.',
      });
    }
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProgressData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProgressData]);

  useEffect(() => {
    const possibleIds = [...new Set(
      [user?.id, user?._id, user?.userId, tokenUserId]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    )];
    if (!possibleIds.length) return;
    try {
      const serialized = JSON.stringify(photosByDate);
      possibleIds.forEach((idKey) => {
        localStorage.setItem(`${PROGRESS_PHOTOS_STORAGE_KEY}.${idKey}`, serialized);
      });
      localStorage.setItem(GLOBAL_PROGRESS_PHOTOS_STORAGE_KEY, serialized);
    } catch {
      // ignore storage failures
    }
  }, [photosByDate, tokenUserId, user?.id, user?._id, user?.userId]);

  useEffect(() => {
    if (!hasTodayCompletionEvidence) return;
    try {
      const token = JSON.stringify({
        date: todayIso,
        expiresAt: getNextLocalMidnightTimestamp(),
      });
      const possibleIds = [...new Set(
        [user?.id, user?._id, user?.userId, tokenUserId]
          .map((value) => String(value || '').trim())
          .filter(Boolean),
      )];
      possibleIds.forEach((idKey) => {
        localStorage.setItem(`${UPLOAD_WINDOW_STORAGE_KEY}.${idKey}`, token);
      });
      localStorage.setItem(GLOBAL_UPLOAD_WINDOW_STORAGE_KEY, token);
    } catch {
      // ignore storage failures
    }
  }, [hasTodayCompletionEvidence, todayIso, tokenUserId, user?.id, user?._id, user?.userId]);

  useEffect(() => {
    if (!completedWorkoutDateFromState) return;
    const timer = setTimeout(() => {
      setSelectedDate(completedWorkoutDateFromState);
      setVisibleMonth(new Date(`${completedWorkoutDateFromState}T00:00:00`));
      setCompletionDate((prev) => prev || completedWorkoutDateFromState);
    }, 0);
    return () => clearTimeout(timer);
  }, [completedWorkoutDateFromState]);

  useEffect(() => {
    if (!openedFromWorkoutFinish) return;
    if (!completedWorkoutDateFromState) return;
    if (hasAutoUploadPromptedRef.current) return;
    if (!canUploadSelectedDate) return;

    hasAutoUploadPromptedRef.current = true;
    const timer = setTimeout(() => {
      setPhotoToast({
        open: true,
        message: `Workout completed. Upload your progress photo for ${formatIsoToShort(completedWorkoutDateFromState)}.`,
      });
      // Best-effort auto-open; some browsers may block without direct user click.
      uploadInputRef.current?.click();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    canUploadSelectedDate,
    completedWorkoutDateFromState,
    openedFromWorkoutFinish,
  ]);

  const chartData = useMemo(() => {
    const weightHistory = Object.entries(weightHistoryByDate)
      .map(([isoDate, weight]) => ({
        isoDate,
        date: formatIsoToShort(isoDate),
        weight,
      }))
      .sort((left, right) => new Date(`${left.isoDate}T00:00:00`) - new Date(`${right.isoDate}T00:00:00`));

    const labels = weightHistory.map((item) => item.date);
    const values = weightHistory.map((item) => item.weight);
    if (!values.length) {
      return {
        weightHistory: [],
        points: [],
        labels: [],
        yTop: 0,
        yMiddle: 0,
        yBottom: 0,
        linePath: '',
        areaPath: '',
      };
    }
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const yTop = Math.ceil(maxValue + 2);
    const yBottom = Math.floor(minValue - 2);
    const yMiddle = Math.round((yTop + yBottom) / 2);
    const width = 620;
    const height = 220;

    const points = values.map((value, index) => {
      const x = values.length > 1 ? (index / (values.length - 1)) * width : width / 2;
      const normalized = (value - yBottom) / Math.max(1, yTop - yBottom);
      const y = height - (normalized * height);
      return {
        x: 70 + x,
        y: 24 + y,
      };
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPath = points.length
      ? `${buildSmoothPath(points)} L ${lastPoint.x} 244 L ${firstPoint.x} 244 Z`
      : '';

    return {
      weightHistory,
      points,
      labels,
      yTop,
      yMiddle,
      yBottom,
      linePath: buildSmoothPath(points),
      areaPath,
    };
  }, [weightHistoryByDate]);

  const metricCards = useMemo(() => {
    const sortedWeightHistory = Object.entries(weightHistoryByDate)
      .map(([isoDate, weight]) => ({ isoDate, weight: Number(weight) }))
      .sort((left, right) => new Date(`${left.isoDate}T00:00:00`) - new Date(`${right.isoDate}T00:00:00`));

    if (!sortedWeightHistory.length) {
      return METRIC_CARD_META.map((item) => ({
        ...item,
        value: '--',
        unit: '',
        change: 'No data',
        changeColor: '#94a3b8',
      }));
    }

    const baseline = sortedWeightHistory[0];
    const latest = sortedWeightHistory[sortedWeightHistory.length - 1];
    const weightDelta = latest.weight - baseline.weight;

    const sortedBodyFatHistory = Object.entries(measurementsByDate)
      .filter(([, values]) => Number.isFinite(Number(values?.bodyFat)))
      .map(([isoDate, values]) => ({
        isoDate,
        bodyFat: Number(values.bodyFat),
      }))
      .sort((left, right) => new Date(`${left.isoDate}T00:00:00`) - new Date(`${right.isoDate}T00:00:00`));

    const hasBodyFatData = sortedBodyFatHistory.length > 0;
    const baselineBodyFat = hasBodyFatData ? sortedBodyFatHistory[0].bodyFat : null;
    const currentBodyFat = hasBodyFatData ? sortedBodyFatHistory[sortedBodyFatHistory.length - 1].bodyFat : null;
    const bodyFatDelta = hasBodyFatData ? Number((currentBodyFat - baselineBodyFat).toFixed(1)) : null;

    const streak = getConsecutiveWorkoutStreak(mergedCompletionDates, todayIso);

    return METRIC_CARD_META.map((item) => {
      if (item.id === 'weight') {
        return {
          ...item,
          value: latest.weight.toFixed(1),
          unit: 'lbs',
          change: `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} lbs`,
          changeColor: weightDelta <= 0 ? '#10b981' : '#ef4444',
        };
      }

      if (item.id === 'fat') {
        if (!hasBodyFatData) {
          return {
            ...item,
            value: '--',
            unit: '',
            change: 'No body-fat data',
            changeColor: '#94a3b8',
          };
        }

        return {
          ...item,
          value: `${currentBodyFat.toFixed(1)}%`,
          unit: '',
          change: `${bodyFatDelta > 0 ? '+' : ''}${bodyFatDelta.toFixed(1)}%`,
          changeColor: bodyFatDelta <= 0 ? '#10b981' : '#ef4444',
        };
      }

      return {
        ...item,
        value: `${streak} Days`,
        unit: '',
        change: streak >= 7 ? 'On Fire!' : 'Keep Going!',
        changeColor: '#f59e0b',
      };
    });
  }, [measurementsByDate, mergedCompletionDates, todayIso, weightHistoryByDate]);

  const hoveredPoint = hoveredChartPoint;
  const hoveredItem = hoveredChartPoint ? chartData.weightHistory[hoveredChartPoint.index] : null;
  const tooltipX = hoveredPoint ? Math.min(Math.max(hoveredPoint.x + 14, 86), 508) : 0;
  const tooltipY = hoveredPoint ? Math.min(Math.max(hoveredPoint.y - 80, 34), 176) : 0;

  const measurementRows = useMemo(() => {
    const sortedDates = Object.keys(measurementsByDate)
      .sort((left, right) => new Date(`${left}T00:00:00`) - new Date(`${right}T00:00:00`));

    const selectedMeasurements = measurementsByDate[selectedDate] || { chest: 0, waist: 0, arms: 0, thighs: 0 };
    const previousDate = [...sortedDates]
      .reverse()
      .find((dateValue) => new Date(`${dateValue}T00:00:00`) < new Date(`${selectedDate}T00:00:00`));
    const previousMeasurements = previousDate ? measurementsByDate[previousDate] : null;

    return Object.keys(MEASUREMENT_LABELS).map((key) => {
      const currentValue = Number(selectedMeasurements[key] || 0);
      const previousValue = Number(previousMeasurements?.[key] || currentValue);
      const diff = currentValue - previousValue;
      const trend = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'flat');
      const deltaText = `${diff > 0 ? '+' : ''}${diff.toFixed(1)}"`;

      return {
        id: key,
        area: MEASUREMENT_LABELS[key],
        value: `${currentValue.toFixed(1)}"`,
        delta: deltaText,
        trend,
      };
    });
  }, [measurementsByDate, selectedDate]);

  const handleOpenMeasurementDialog = () => {
    const selectedMeasurements = measurementsByDate[selectedDate] || {
      chest: '',
      waist: '',
      arms: '',
      thighs: '',
      bodyFat: '',
    };
    setMeasurementForm({
      chest: selectedMeasurements.chest === '' ? '' : String(selectedMeasurements.chest),
      waist: selectedMeasurements.waist === '' ? '' : String(selectedMeasurements.waist),
      arms: selectedMeasurements.arms === '' ? '' : String(selectedMeasurements.arms),
      thighs: selectedMeasurements.thighs === '' ? '' : String(selectedMeasurements.thighs),
      bodyFat: selectedMeasurements.bodyFat === '' ? '' : String(selectedMeasurements.bodyFat),
      weight: weightHistoryByDate[selectedDate] ? String(weightHistoryByDate[selectedDate]) : '',
    });
    setIsMeasurementDialogOpen(true);
  };

  const handleCloseMeasurementDialog = () => {
    setIsMeasurementDialogOpen(false);
  };

  const handleMeasurementFieldChange = (field) => (event) => {
    setMeasurementForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmitMeasurements = async (event) => {
    event.preventDefault();

    const chestValue = Number(measurementForm.chest);
    const waistValue = Number(measurementForm.waist);
    const armsValue = Number(measurementForm.arms);
    const thighsValue = Number(measurementForm.thighs);
    const bodyFatValue = Number(measurementForm.bodyFat);
    const weightValue = Number(measurementForm.weight);

    if ([chestValue, waistValue, armsValue, thighsValue, bodyFatValue, weightValue].some((value) => Number.isNaN(value) || value <= 0)) {
      setPhotoToast({ open: true, message: 'Please enter valid measurement and weight values.' });
      return;
    }

    setMeasurementsByDate((prev) => ({
      ...prev,
      [selectedDate]: {
        chest: chestValue,
        waist: waistValue,
        arms: armsValue,
        thighs: thighsValue,
        bodyFat: bodyFatValue,
      },
    }));

    setWeightHistoryByDate((prev) => ({
      ...prev,
      [selectedDate]: weightValue,
    }));

    if (userId) {
      try {
        const { data } = await saveUserMeasurement(userId, {
          date: selectedDate,
          chest: chestValue,
          waist: waistValue,
          arms: armsValue,
          thighs: thighsValue,
          bodyFat: bodyFatValue,
          weight: weightValue,
        });
        const payload = data?.data || {};
        if (payload.weightHistoryByDate) setWeightHistoryByDate(payload.weightHistoryByDate);
        if (payload.measurementsByDate) setMeasurementsByDate(payload.measurementsByDate);
        if (Array.isArray(payload.workoutCompletionDates)) setWorkoutCompletionDates(payload.workoutCompletionDates);
        if (typeof payload.completionDate === 'string') setCompletionDate(payload.completionDate);
      } catch (error) {
        setPhotoToast({
          open: true,
          message: error?.response?.data?.message || 'Failed to save progress data.',
        });
        return;
      }
    }

    setIsMeasurementDialogOpen(false);
    setPhotoToast({ open: true, message: `Measurements, body fat, and weight saved for ${selectedDateFull}.` });
  };

  const handleUploadClick = () => {
    if (!mergedCompletionDates.length) {
      setPhotoToast({ open: true, message: 'Complete a workout session first to upload progress photos.' });
      return;
    }
    if (!canUploadSelectedDate) {
      setPhotoToast({
        open: true,
        message: `Photo upload is available for completed workout dates only (latest: ${completionDateFull || 'N/A'}).`,
      });
      return;
    }
    uploadInputRef.current?.click();
  };

  const syncLocalPhotoSlot = useCallback((slot, imageUrl) => {
    setPhotosByDate((prev) => {
      const dayPhotos = prev[selectedDate] || createPhotoSlots();
      const nextDayPhotos = dayPhotos.map((item, itemIndex) => (
        itemIndex === slot - 1
          ? { id: `p-${Date.now()}`, imageUrl: imageUrl || '' }
          : item
      ));
      return {
        ...prev,
        [selectedDate]: nextDayPhotos,
      };
    });
  }, [selectedDate]);

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const targetIndex = editingPhotoIndex !== null
      ? editingPhotoIndex
      : visiblePhotoSlots.findIndex((item) => !item.imageUrl);
    const safeIndex = targetIndex < 0 ? 0 : targetIndex;
    const selectedSlot = safeIndex + 1;

    setSlotErrorsByIndex((prev) => ({ ...prev, [safeIndex]: '' }));

    if (!file.type.startsWith('image/')) {
      setSlotErrorsByIndex((prev) => ({
        ...prev,
        [safeIndex]: 'Invalid file type. Please upload an image.',
      }));
      event.target.value = '';
      return;
    }
    if (file.size > (5 * 1024 * 1024)) {
      setSlotErrorsByIndex((prev) => ({
        ...prev,
        [safeIndex]: 'File too large. Max 5MB allowed.',
      }));
      event.target.value = '';
      return;
    }

    setSlotLoadingByIndex((prev) => ({ ...prev, [safeIndex]: true }));
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      try {
        const response = await uploadProgressPhoto({
          slot: selectedSlot,
          base64Image,
          fileName: file.name,
          fileSize: file.size,
          label: SLOT_LABELS[selectedSlot - 1] || `PHOTO ${selectedSlot}`,
          note: '',
          uploadedAt: selectedDate,
        });
        const nextPhotos = Array.isArray(response?.data?.photos) ? response.data.photos : [];
        setPhotos(nextPhotos);
        setPhotoNotesBySlot((prev) => ({
          ...prev,
          [selectedSlot]: '',
        }));
        syncLocalPhotoSlot(selectedSlot, String(base64Image || ''));
        setPhotoToast({ open: true, message: `Progress photo uploaded for ${selectedDateShort}.` });
      } catch {
        setSlotErrorsByIndex((prev) => ({
          ...prev,
          [safeIndex]: 'Upload failed. Please try again.',
        }));
      } finally {
        setSlotLoadingByIndex((prev) => ({ ...prev, [safeIndex]: false }));
        setEditingPhotoIndex(null);
      }
    };
    reader.onerror = () => {
      setSlotLoadingByIndex((prev) => ({ ...prev, [safeIndex]: false }));
      setSlotErrorsByIndex((prev) => ({
        ...prev,
        [safeIndex]: 'Could not read file. Please try again.',
      }));
    };

    event.target.value = '';
  };

  const handleEditPhoto = (index) => {
    setEditingPhotoIndex(index);
    setSlotErrorsByIndex((prev) => ({ ...prev, [index]: '' }));
    uploadInputRef.current?.click();
  };

  const handleDeletePhoto = (index) => {
    const slot = index + 1;
    const backendPhoto = backendPhotoBySlot.get(slot);
    if (backendPhoto) {
      deleteProgressPhoto(slot)
        .then((response) => {
          const nextPhotos = Array.isArray(response?.data?.photos) ? response.data.photos : [];
          setPhotos(nextPhotos);
          setPhotoNotesBySlot((prev) => ({ ...prev, [slot]: '' }));
          syncLocalPhotoSlot(slot, '');
          setPhotoToast({ open: true, message: 'Photo deleted from selected date.' });
        })
        .catch((error) => {
          setSlotErrorsByIndex((prev) => ({
            ...prev,
            [index]: error?.response?.data?.message || 'Failed to delete photo. Please try again.',
          }));
        });
      return;
    }

    syncLocalPhotoSlot(slot, '');
    setPhotoToast({ open: true, message: 'Photo deleted from selected date.' });
  };

  const handlePhotoNoteChange = (slot, nextNote) => {
    setPhotoNotesBySlot((prev) => ({
      ...prev,
      [slot]: nextNote,
    }));
  };

  const handlePhotoNoteBlur = (slot) => {
    const backendPhoto = backendPhotoBySlot.get(slot);
    if (!backendPhoto) return;
    const note = String(photoNotesBySlot[slot] || '');
    updatePhotoNote(slot, note)
      .then((response) => {
        const nextPhotos = Array.isArray(response?.data?.photos) ? response.data.photos : [];
        setPhotos(nextPhotos);
      })
      .catch((error) => {
        setSlotErrorsByIndex((prev) => ({
          ...prev,
          [slot - 1]: error?.response?.data?.message || 'Failed to save note. Please try again.',
        }));
      });
  };

  const handleClosePhotoToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setPhotoToast((prev) => ({ ...prev, open: false }));
  };

  const handleOpenCalendar = (event) => {
    setCalendarAnchorEl(event.currentTarget);
    setVisibleMonth(new Date(`${selectedDate}T00:00:00`));
  };

  const handleCloseCalendar = () => {
    setCalendarAnchorEl(null);
  };

  const handlePickCalendarDate = (isoDate) => {
    setSelectedDate(isoDate);
    setCalendarAnchorEl(null);
  };

  const handlePrevMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleChartMouseMove = (event) => {
    if (!chartData.points.length) return;

    const svgElement = chartSvgRef.current;
    if (!svgElement || !svgElement.getScreenCTM()) return;

    const svgPoint = svgElement.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;

    const localPoint = svgPoint.matrixTransform(svgElement.getScreenCTM().inverse());
    const hoverHit = findNearestChartHover(
      { x: localPoint.x, y: localPoint.y },
      chartData.points,
      26,
    );

    setHoveredChartPoint(hoverHit);
  };

  const handleChartMouseLeave = () => {
    setHoveredChartPoint(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1240, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems={{ xs: 'flex-start', md: 'flex-end' }} justifyContent="space-between" mb={2.3}>
          <Stack spacing={0.8}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.45rem', md: '1.78rem' }, color: theme.palette.text.primary }}>
              Progress Tracking
            </Typography>
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.94rem' }}>
              Track body changes, workout consistency, and visual transformation over time.
            </Typography>
          </Stack>

          <Button
            onClick={handleOpenCalendar}
            variant="outlined"
            startIcon={<CalendarMonthRoundedIcon />}
            sx={{
              minWidth: { xs: '100%', md: 260 },
              justifyContent: 'flex-start',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              color: theme.palette.text.primary,
              borderColor: isDark ? '#314561' : '#d4deeb',
              bgcolor: isDark ? '#0f1b2f' : '#fff',
            }}
          >
            {selectedDateFull}
          </Button>
        </Stack>

        <Popover
          open={isCalendarOpen}
          anchorEl={calendarAnchorEl}
          onClose={handleCloseCalendar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ sx: { borderRadius: 2.2, p: 1.2, mt: 0.5, width: 290 } }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <IconButton size="small" onClick={handlePrevMonth}>
              <ChevronLeftRoundedIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 800 }}>{visibleMonthLabel}</Typography>
            <IconButton size="small" onClick={handleNextMonth}>
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.6,
            }}
          >
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((name) => (
              <Typography key={name} sx={{ textAlign: 'center', fontSize: '0.76rem', color: theme.palette.text.secondary, fontWeight: 700 }}>
                {name}
              </Typography>
            ))}

            {calendarDays.map((cell, index) => (
              cell ? (
                <Button
                  key={`${cell.iso}-${index}`}
                  size="small"
                  onClick={() => handlePickCalendarDate(cell.iso)}
                  sx={{
                    minWidth: 0,
                    width: 34,
                    height: 34,
                    mx: 'auto',
                    borderRadius: '50%',
                    p: 0,
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    bgcolor: selectedDate === cell.iso ? (isDark ? '#1e3a8a' : '#dbeafe') : 'transparent',
                  }}
                >
                  {cell.dayNumber}
                </Button>
              ) : (
                <Box key={`empty-${index}`} sx={{ width: 34, height: 34, mx: 'auto' }} />
              )
            ))}
          </Box>
        </Popover>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 1.6,
            mb: 2,
          }}
        >
          {metricCards.map((item, index) => {
            const Icon = item.icon;
            return (
              <MotionCard
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                sx={{
                  borderRadius: 2.4,
                  border: `1px solid ${isDark ? '#263851' : '#e3eaf2'}`,
                  boxShadow: isDark ? '0 12px 26px rgba(3, 10, 22, 0.45)' : '0 12px 26px rgba(18, 31, 53, 0.07)',
                }}
              >
                <CardContent sx={{ py: 1.6 }}>
                  <Stack direction="row" spacing={1.3} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2,
                        bgcolor: isDark ? '#1b2a40' : '#edf4ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ color: item.tone }} />
                    </Box>
                    <Box>
                      <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <Typography sx={{ fontSize: '1.7rem', fontWeight: 900, lineHeight: 1.1 }}>
                          {item.value}
                        </Typography>
                        {item.unit && <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>{item.unit}</Typography>}
                        <Typography sx={{ color: item.changeColor, fontWeight: 800 }}>
                          {item.change}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </MotionCard>
            );
          })}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 1.6,
            mb: 2,
          }}
        >
          <Card sx={{ borderRadius: 2.4, border: `1px solid ${isDark ? '#263851' : '#e3eaf2'}` }}>
            <CardContent>
              <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', mb: 1.2 }}>Weight History</Typography>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <svg
                  ref={chartSvgRef}
                  viewBox="0 0 680 280"
                  width="100%"
                  height="280"
                  role="img"
                  aria-label="Weight history chart"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  style={{ cursor: 'crosshair' }}
                >
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity="0.2" />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <line x1="70" y1="24" x2="650" y2="24" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="70" y1="144" x2="650" y2="144" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="70" y1="244" x2="650" y2="244" stroke="#F1F5F9" strokeDasharray="3 3" />

                  <text x="34" y="30" fill="#94a3b8" fontSize="16">{chartData.yTop}</text>
                  <text x="34" y="150" fill="#94a3b8" fontSize="16">{chartData.yMiddle}</text>
                  <text x="34" y="250" fill="#94a3b8" fontSize="16">{chartData.yBottom}</text>

                  <path
                    d={chartData.areaPath}
                    fill="url(#colorWeight)"
                    stroke="none"
                  />

                  <path
                    d={chartData.linePath}
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {chartData.points.map((point, index) => (
                    <circle
                      key={`point-${chartData.labels[index] || index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#0d9488"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ))}

                  {hoveredPoint && hoveredItem && (
                    <>
                      <line
                        x1={hoveredPoint.x}
                        y1="24"
                        x2={hoveredPoint.x}
                        y2="244"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />

                      <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="8" fill="rgba(13,148,136,0.22)" />
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4.5" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />

                      <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                        <rect width="126" height="66" rx="12" fill="#ffffff" stroke="#e2e8f0" />
                        <text x="14" y="25" fill="#111827" fontSize="12" fontWeight="700">{hoveredItem.date}</text>
                        <text x="14" y="46" fill="#0d9488" fontSize="18" fontWeight="800">weight : {hoveredItem.weight}</text>
                      </g>
                    </>
                  )}

                  {chartData.labels.map((label, index) => {
                    const x = chartData.points[index]?.x ?? 380;
                    return <text key={label} x={x - 18} y="268" fill="#94a3b8" fontSize="14">{label}</text>;
                  })}
                </svg>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2.4, border: `1px solid ${isDark ? '#263851' : '#e3eaf2'}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.2}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.5rem' }}>Body Measurements</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleOpenMeasurementDialog}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#0f172a',
                    '&:hover': { bgcolor: '#111827' },
                  }}
                >
                  Add
                </Button>
              </Stack>
              <Stack spacing={1.05}>
                {measurementRows.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      borderRadius: 2,
                      p: 1.35,
                      bgcolor: isDark ? '#14233a' : '#f7f9fc',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 1.1,
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        border: `1px solid ${isDark ? '#334c70' : '#e5ebf3'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <StraightenRoundedIcon sx={{ color: '#9aa7bd' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.25rem' }}>{item.area}</Typography>
                      <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1rem' }}>
                        Last measured: {selectedDateFull}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.75rem', lineHeight: 1 }}>{item.value}</Typography>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: item.trend === 'up' ? '#10b981' : (item.trend === 'down' ? '#10b981' : '#94a3b8'),
                        }}
                      >
                        {item.trend === 'up' ? '↗' : (item.trend === 'down' ? '↘' : '−')} {item.delta}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ borderRadius: 2.4, border: `1px solid ${isDark ? '#263851' : '#e3eaf2'}` }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.3}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.55rem' }}>Progress Photos</Typography>
              <>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="contained"
                  startIcon={<AddAPhotoRoundedIcon />}
                  onClick={handleUploadClick}
                  disabled={!canUploadSelectedDate}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#0f172a',
                    '&:hover': { bgcolor: '#111827' },
                  }}
                >
                  Add Photo
                </Button>
              </>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1.2}>
              <Chip
                label={effectiveCompletionDate ? `Workout Completion Date: ${completionDateFull}` : 'Workout Completion Date: Not available yet'}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Viewing Date: ${selectedDateFull}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={canUploadSelectedDate ? 'Upload Window: Open for selected date' : 'Upload Window: Closed'}
                color={canUploadSelectedDate ? 'success' : 'default'}
                sx={{ fontWeight: 700 }}
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                gap: 1.2,
              }}
            >
              {visiblePhotoSlots.map((photo, index) => (
                <MotionCard
                  key={`${selectedDate}-${photo.id}-${index}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  sx={{
                    minHeight: 320,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: isDark ? '#101b2f' : '#f2f4f8',
                  }}
                >
                  {slotLoadingByIndex[index] ? (
                    <Box
                      sx={{
                        width: '100%',
                        minHeight: 320,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CircularProgress size={28} />
                    </Box>
                  ) : photo.imageUrl ? (
                    <>
                      <Box
                        component="img"
                        src={photo.imageUrl}
                        alt={photo.label || `Progress ${index + 1}`}
                        sx={{ width: '100%', height: 220, objectFit: 'cover' }}
                      />
                      <Stack direction="row" spacing={0.8} sx={{ px: 1.2, pt: 1, pb: 0.8, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleEditPhoto(index)}
                          sx={{
                            minWidth: 'auto',
                            px: 1.2,
                            py: 0.3,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: 'rgba(15, 23, 42, 0.8)',
                            '&:hover': { bgcolor: 'rgba(2, 6, 23, 0.9)' },
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleDeletePhoto(index)}
                          sx={{
                            minWidth: 'auto',
                            px: 1.2,
                            py: 0.3,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: 'rgba(185, 28, 28, 0.85)',
                            '&:hover': { bgcolor: 'rgba(127, 29, 29, 0.95)' },
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                      <Box sx={{ px: 1.2, pb: 1.2 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Add a note..."
                          value={photo.note}
                          onChange={(event) => handlePhotoNoteChange(photo.slot, event.target.value)}
                          onBlur={() => handlePhotoNoteBlur(photo.slot)}
                        />
                      </Box>
                    </>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        minHeight: 320,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ fontWeight: 900, color: '#c2c8d2', fontSize: '1.7rem' }}>
                        PHOTO {index + 1}
                      </Typography>
                    </Box>
                  )}
                  {slotErrorsByIndex[index] && (
                    <Typography sx={{ px: 1.2, pb: 1, color: '#ef4444', fontSize: '0.78rem', fontWeight: 700 }}>
                      {slotErrorsByIndex[index]}
                    </Typography>
                  )}
                </MotionCard>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={photoToast.open}
        onClose={handleClosePhotoToast}
        autoHideDuration={2600}
        message={photoToast.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />

      <Dialog
        open={isMeasurementDialogOpen}
        onClose={handleCloseMeasurementDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmitMeasurements,
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.1rem' }}>Add Measurements</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0.5 }}>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField size="small" label="Chest" value={measurementForm.chest} onChange={handleMeasurementFieldChange('chest')} required />
            <TextField size="small" label="Waist" value={measurementForm.waist} onChange={handleMeasurementFieldChange('waist')} required />
            <TextField size="small" label="Arms" value={measurementForm.arms} onChange={handleMeasurementFieldChange('arms')} required />
            <TextField size="small" label="Thighs" value={measurementForm.thighs} onChange={handleMeasurementFieldChange('thighs')} required />
            <TextField size="small" label="Body Fat %" value={measurementForm.bodyFat} onChange={handleMeasurementFieldChange('bodyFat')} required />
            <TextField size="small" label="Weight" value={measurementForm.weight} onChange={handleMeasurementFieldChange('weight')} required />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseMeasurementDialog} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserProgress;
