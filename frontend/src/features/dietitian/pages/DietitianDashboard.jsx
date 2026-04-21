import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/utils/constants';
import { useAuth } from '@/shared/hooks/useAuth';
import { getToken } from '@/shared/utils/storage';
import {
  deleteMealPlan,
  createDietitianSchedulingSlot,
  deleteDietitianSchedulingSlot,
  submitMealPlan,
  upsertDietitianClientPlan,
  updateDietitianAppointmentStatus,
  updateDietitianSchedulingSlot,
} from '../api/dietitian.api';
import {
  createDietPlanForm,
  FOOD_UNIT_OPTIONS,
  getWeekdayLabel,
  mealSections,
  sanitizePlanSection,
  tabItems,
  to12Hour,
} from '../utils/dietitianDashboard.utils';
import {
  useDietitianAppointmentsData,
  useDietitianMealsAndPlans,
  useDietitianTimeSlots,
} from '../hooks/useDietitianDashboardData';
import DietitianStatsGrid from '../components/DietitianStatsGrid';
import DietitianDashboardHeaderControls from '../components/DietitianDashboardHeaderControls';
import DietitianAppointmentsTable from '../components/DietitianAppointmentsTable';
import DietitianMembersPanel from '../components/DietitianMembersPanel';
import DietitianTimeSlotsPanel from '../components/DietitianTimeSlotsPanel';

const mockMembers = [];
const mockAppointments = [];
const MEAL_CATEGORY_LABELS = {
  weight_gain: 'Weight Gaining',
  weight_loss: 'Weight Losing',
  other: 'Other',
};
const APPOINTMENT_PRIORITY_RANK = { urgent: 0, normal: 1, low: 2 };
const normalizePriority = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'low') return normalized;
  return 'normal';
};


function DietitianDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
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
  const dietitianId = String(user?.id || user?._id || user?.userId || getUserIdFromToken() || '');
  const dietitianName = String(user?.name || '').trim().toLowerCase();
  const isDark = theme.palette.mode === 'dark';
  const [activeTab, setActiveTab] = useState('Members');
  const [searchText, setSearchText] = useState('');
  const [slotForm, setSlotForm] = useState({
    date: '2026-03-08',
    startTime: '08:00',
    endTime: '08:15',
  });
  const [slotNotice, setSlotNotice] = useState({ open: false, message: '' });
  const [slotError, setSlotError] = useState('');
  const [editSlotState, setEditSlotState] = useState({
    open: false,
    id: null,
    date: '',
    startTime: '',
    endTime: '',
  });
  const [deleteSlotState, setDeleteSlotState] = useState({
    open: false,
    id: null,
    label: '',
  });
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    appointment: null,
    reason: '',
    error: '',
    isSubmitting: false,
  });
  const [dietPlanModal, setDietPlanModal] = useState({
    open: false,
    member: null,
  });
  const [dietPlanForm, setDietPlanForm] = useState(createDietPlanForm());
  const [dietPlanInitialSnapshot, setDietPlanInitialSnapshot] = useState('');
  const [isDietPlanSubmitting, setIsDietPlanSubmitting] = useState(false);

  const { timeSlots, isSlotsLoading, loadTimeSlots } = useDietitianTimeSlots(dietitianId, setSlotError);
  const { mealSuggestions, savedDietPlans, loadDietitianMealsAndPlans } = useDietitianMealsAndPlans(
    dietitianId,
    setSlotError,
  );
  const { appointments, members, loadDietitianAppointments } = useDietitianAppointmentsData(
    dietitianId,
    dietitianName,
    setSlotError,
    mockAppointments,
    mockMembers,
  );
  const pageBg = isDark
    ? 'radial-gradient(circle at 15% 10%, #1b355b 0%, #0f1e3d 60%, #0b1731 100%)'
    : 'linear-gradient(180deg, #f8fbff 0%, #edf3fb 100%)';
  const panelBg = isDark ? '#1a2a47' : '#ffffff';
  const panelBorder = isDark ? '#2b4268' : '#dbe7f6';
  const subtitleColor = isDark ? '#8ea7cb' : '#5b7398';
  const mutedText = isDark ? '#88a1c7' : '#607aa5';
  const sectionTitleColor = isDark ? '#e6f0ff' : '#0f172a';
  const inputTextColor = isDark ? '#cfe0fb' : '#334155';
  const cardTitleColor = isDark ? '#ffffff' : '#0f172a';
  const cardBodyColor = isDark ? '#b7cce8' : '#64748b';
  const linkColor = isDark ? '#93c5fd' : '#2563eb';
  const slotTitleColor = isDark ? '#dbeafe' : '#0f172a';

  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        m.name.toLowerCase().includes(searchText.trim().toLowerCase()),
      ),
    [members, searchText],
  );
  const displayedMembers = filteredMembers.slice(0, 3);
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      if (a.rawStatus === 'pending' && b.rawStatus !== 'pending') return -1;
      if (a.rawStatus !== 'pending' && b.rawStatus === 'pending') return 1;
      if (a.rawStatus === 'pending' && b.rawStatus === 'pending') {
        const rankDiff = APPOINTMENT_PRIORITY_RANK[normalizePriority(a.priority)]
          - APPOINTMENT_PRIORITY_RANK[normalizePriority(b.priority)];
        if (rankDiff !== 0) return rankDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [appointments]);

  const stats = [
    { label: 'Total Members', value: members.length, icon: GroupRoundedIcon },
    { label: 'Diet Plans', value: Object.keys(savedDietPlans).length, icon: FavoriteBorderRoundedIcon },
    { label: 'Available Slots', value: timeSlots.length, icon: AccessTimeRoundedIcon },
    { label: 'Appointments', value: appointments.length, icon: CalendarMonthRoundedIcon },
  ];

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

  const getSlotValidationMessage = ({ date, startTime, endTime }) => {
    if (!date || !startTime || !endTime) return '';

    const todayIso = toLocalIsoDate(new Date());
    if (date < todayIso) {
      return 'Please choose today or a future date.';
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    if (startMinutes < 0 || endMinutes < 0) {
      return 'Please choose a valid start and end time.';
    }
    if (endMinutes <= startMinutes) {
      return 'End time must be after start time.';
    }

    if (date === todayIso) {
      const now = new Date();
      const nowMinutes = (now.getHours() * 60) + now.getMinutes();
      if (startMinutes <= nowMinutes) {
        return 'Selected start time has already passed. Please choose a future time.';
      }
    }

    return '';
  };

  const approveAppointment = async (appointment) => {
    try {
      await updateDietitianAppointmentStatus(appointment.id, { status: 'approved' });
      await loadDietitianAppointments();
      setSlotNotice({ open: true, message: 'Appointment approved successfully!' });
      setActiveTab('Members');
      setSearchText('');
    } catch (error) {
      setSlotError(error?.response?.data?.message || 'Failed to approve appointment.');
    }
  };

  const rejectAppointment = async (appointment) => {
    setRejectDialog({
      open: true,
      appointment,
      reason: appointment?.rejectReason || '',
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

  const submitRejectedAppointment = async () => {
    const trimmedReason = rejectDialog.reason.trim();
    if (!trimmedReason) {
      setRejectDialog((prev) => ({ ...prev, error: 'Please add a reject reason.' }));
      return;
    }
    const targetAppointment = rejectDialog.appointment;
    if (!targetAppointment?.id) return;

    const existingSegments = String(targetAppointment.notes || '')
      .split('|')
      .map((segment) => segment.trim())
      .filter((segment) => segment && !/^Reject Reason\s*:/i.test(segment));
    const notesWithRejectReason = [...existingSegments, `Reject Reason: ${trimmedReason}`].join(' | ');

    setRejectDialog((prev) => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      await updateDietitianAppointmentStatus(targetAppointment.id, {
        status: 'rejected',
        notes: notesWithRejectReason,
      });
      await loadDietitianAppointments();
      setSlotNotice({ open: true, message: 'Appointment rejected successfully!' });
      closeRejectDialog();
    } catch (error) {
      setRejectDialog((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error?.response?.data?.message || 'Failed to reject appointment.',
      }));
    }
  };

  const addTimeSlot = async () => {
    if (!dietitianId) {
      setSlotError('Dietitian account is required.');
      return;
    }

    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      setSlotError('Please fill date, start time, and end time.');
      return;
    }
    const validationMessage = getSlotValidationMessage(slotForm);
    if (validationMessage) {
      setSlotError(validationMessage);
      return;
    }
    setSlotError('');
    try {
      await createDietitianSchedulingSlot(String(dietitianId), {
        date: slotForm.date,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
      });
      await loadTimeSlots();
      setSlotNotice({ open: true, message: 'Time slot created successfully!' });
    } catch (error) {
      setSlotError(error?.response?.data?.message || 'Failed to create time slot.');
    }
  };

  const openEditSlot = (slot) => {
    setEditSlotState({
      open: true,
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  };

  const saveEditedSlot = async () => {
    if (!dietitianId) {
      setSlotError('Dietitian account is required.');
      return;
    }

    const { id, date, startTime, endTime } = editSlotState;
    if (!date || !startTime || !endTime) {
      setSlotError('Please fill date, start time, and end time.');
      return;
    }
    const validationMessage = getSlotValidationMessage({ date, startTime, endTime });
    if (validationMessage) {
      setSlotError(validationMessage);
      return;
    }
    setSlotError('');
    try {
      await updateDietitianSchedulingSlot(String(dietitianId), String(id), {
        date,
        startTime,
        endTime,
      });
      await loadTimeSlots();
      setEditSlotState({ open: false, id: null, date: '', startTime: '', endTime: '' });
      setSlotNotice({ open: true, message: 'Time slot updated successfully!' });
    } catch (error) {
      setSlotError(error?.response?.data?.message || 'Failed to update time slot.');
    }
  };

  const openDeleteSlot = (slot) => {
    setDeleteSlotState({
      open: true,
      id: slot.id,
      label: `${slot.day}, ${slot.date} (${to12Hour(slot.startTime)} - ${to12Hour(slot.endTime)})`,
    });
  };

  const confirmDeleteSlot = async () => {
    if (!dietitianId) {
      setSlotError('Dietitian account is required.');
      return;
    }

    try {
      await deleteDietitianSchedulingSlot(String(dietitianId), String(deleteSlotState.id));
      await loadTimeSlots();
      setDeleteSlotState({ open: false, id: null, label: '' });
      setSlotNotice({ open: true, message: 'Time slot deleted successfully!' });
    } catch (error) {
      setSlotError(error?.response?.data?.message || 'Failed to delete time slot.');
    }
  };

  const openDietPlanModal = (member) => {
    const existingPlan = savedDietPlans[member.id]?.data;
    const nextForm = existingPlan || createDietPlanForm();
    setDietPlanForm(nextForm);
    const initialSnapshot = JSON.stringify({
      breakfast: sanitizePlanSection(nextForm.breakfast),
      lunch: sanitizePlanSection(nextForm.lunch),
      dinner: sanitizePlanSection(nextForm.dinner),
      snacks: sanitizePlanSection(nextForm.snacks),
      additionalNotes: String(nextForm.additionalNotes || '').trim(),
    });
    setDietPlanInitialSnapshot(initialSnapshot);
    setSlotError('');
    setDietPlanModal({ open: true, member });
  };

  const closeDietPlanModal = () => {
    setSlotError('');
    setDietPlanInitialSnapshot('');
    setIsDietPlanSubmitting(false);
    setDietPlanModal({ open: false, member: null });
  };

  const getDietPlanValidationMessage = (form, submitted = false) => {
    const sections = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const parseNumber = (value) => {
      const raw = String(value ?? '').trim();
      if (!raw) return null;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return Number.NaN;
      return parsed;
    };

    if (String(form?.additionalNotes || '').length > 3000) {
      return 'Additional notes are too long (max 3000 characters).';
    }

    let hasMealName = false;
    let hasCompleteOption = false;

    for (const sectionKey of sections) {
      const options = Array.isArray(form?.[sectionKey]) ? form[sectionKey] : [];
      for (const option of options) {
        const mealName = String(option?.mealName || '').trim();
        const description = String(option?.description || '');
        const vitamins = String(option?.vitamins || '');

        if (description.length > 600) return 'Description is too long (max 600 characters).';
        if (vitamins.length > 220) return 'Vitamins text is too long (max 220 characters).';

        const calories = parseNumber(option?.calories);
        const protein = parseNumber(option?.protein);
        const carbs = parseNumber(option?.carbs);
        const lipids = parseNumber(option?.lipids);
        const quantity = parseNumber(option?.quantity);
        const unit = String(option?.unit || '').trim();

        const numericValues = [calories, protein, carbs, lipids].filter((value) => value !== null);
        if (numericValues.some((value) => Number.isNaN(value) || value < 0)) {
          return 'Calories and macros must be valid non-negative numbers.';
        }
        if (quantity !== null && (Number.isNaN(quantity) || quantity < 0.1)) {
          return 'Quantity must be a valid number and at least 0.1.';
        }
        if (unit && !FOOD_UNIT_OPTIONS.includes(unit)) {
          return 'Please select a valid food unit.';
        }
        if (calories !== null && calories > 3000) return 'Calories must be between 0 and 3000.';
        if (protein !== null && protein > 500) return 'Protein must be between 0 and 500 g.';
        if (carbs !== null && carbs > 500) return 'Carbs must be between 0 and 500 g.';
        if (lipids !== null && lipids > 500) return 'Lipids must be between 0 and 500 g.';

        if (mealName) {
          hasMealName = true;
          if (
            String(option?.description || '').trim()
            || String(option?.vitamins || '').trim()
            || (calories !== null && calories > 0)
            || (protein !== null && protein > 0)
            || (carbs !== null && carbs > 0)
            || (lipids !== null && lipids > 0)
            || (quantity !== null && quantity >= 0.1)
            || Boolean(unit)
          ) {
            hasCompleteOption = true;
          }
        }
      }
    }

    if (submitted && !hasMealName) return 'Add at least one meal name before publishing.';
    if (submitted && !hasCompleteOption) return 'Please complete at least one meal option in any section before publishing.';
    return '';
  };

  const upsertAndMaybeSubmitDietPlan = async (submitted = false) => {
    const memberId = dietPlanModal.member?.id;
    if (!memberId) return;
    if (!dietitianId) {
      setSlotError('Unable to save draft. Please log in again.');
      return;
    }

    const clientValidationMessage = getDietPlanValidationMessage(dietPlanForm, submitted);
    if (clientValidationMessage) {
      setSlotError(clientValidationMessage);
      return;
    }

    const currentSnapshot = JSON.stringify({
      breakfast: sanitizePlanSection(dietPlanForm.breakfast),
      lunch: sanitizePlanSection(dietPlanForm.lunch),
      dinner: sanitizePlanSection(dietPlanForm.dinner),
      snacks: sanitizePlanSection(dietPlanForm.snacks),
      additionalNotes: String(dietPlanForm.additionalNotes || '').trim(),
    });
    if (!submitted && currentSnapshot === dietPlanInitialSnapshot) {
      setSlotNotice({ open: true, message: 'No changes to save.' });
      return;
    }

    setIsDietPlanSubmitting(true);
    try {
      const payload = {
        dietitianId,
        userId: memberId,
        memberName: dietPlanModal.member?.name || '',
        breakfast: sanitizePlanSection(dietPlanForm.breakfast),
        lunch: sanitizePlanSection(dietPlanForm.lunch),
        dinner: sanitizePlanSection(dietPlanForm.dinner),
        snacks: sanitizePlanSection(dietPlanForm.snacks),
        additionalNotes: dietPlanForm.additionalNotes,
      };
      const { data } = await upsertDietitianClientPlan(payload);
      const plan = data?.data;
      const planId = String(plan?._id || plan?.id || savedDietPlans[memberId]?.id || '');
      if (!planId) throw new Error('Plan id is missing after save');
      if (submitted) {
        await submitMealPlan(planId, dietitianId, true);
      }
      await loadDietitianMealsAndPlans();
      closeDietPlanModal();
      setSlotNotice({
        open: true,
        message: submitted ? 'Meal plan published successfully.' : 'Draft saved successfully.',
      });
    } catch (error) {
      const apiMessage = error?.response?.data?.message || '';
      if (error?.response?.status === 409) {
        setSlotError('This plan is already published and cannot be edited.');
        return;
      }
      if (error?.response?.status === 422) {
        setSlotError(apiMessage || 'Please check highlighted fields and try again.');
        return;
      }
      setSlotError(apiMessage || (submitted ? 'Failed to publish meal plan. Please try again.' : 'Failed to save draft. Please try again.'));
    } finally {
      setIsDietPlanSubmitting(false);
    }
  };

  const saveDietPlanDraft = async () => {
    await upsertAndMaybeSubmitDietPlan(false);
  };

  const publishDietPlan = async () => {
    await upsertAndMaybeSubmitDietPlan(true);
  };

  const deleteDraftDietPlan = async () => {
    const memberId = dietPlanModal.member?.id;
    const existingPlan = memberId ? savedDietPlans[memberId] : null;
    if (!existingPlan?.id || existingPlan?.isSubmitted) return;
    try {
      await deleteMealPlan(existingPlan.id, dietitianId);
      await loadDietitianMealsAndPlans();
      closeDietPlanModal();
      setSlotNotice({ open: true, message: 'Draft diet plan deleted successfully.' });
    } catch (error) {
      setSlotError(error?.response?.data?.message || 'Failed to delete draft diet plan.');
    }
  };

  const updateMealField = (sectionKey, index, field, value) => {
    setDietPlanForm((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((option, i) =>
        i === index ? { ...option, [field]: value } : option,
      ),
    }));
  };

  const applySuggestedMealToOption = (sectionKey, index, selectedMeal) => {
    if (!selectedMeal || typeof selectedMeal === 'string') return;
    setDietPlanForm((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((option, i) =>
        i === index
          ? {
            ...option,
            mealName: selectedMeal.mealName || option.mealName,
            description: selectedMeal.description ?? option.description,
            calories: selectedMeal.calories ?? option.calories,
            protein: selectedMeal.protein ?? option.protein,
            carbs: selectedMeal.carbs ?? option.carbs,
            lipids: selectedMeal.lipids ?? option.lipids,
            vitamins: selectedMeal.vitamins ?? option.vitamins,
            quantity: selectedMeal.quantity ?? option.quantity ?? '1',
            unit: selectedMeal.unit ?? option.unit ?? 'g',
          }
          : option,
      ),
    }));
  };

  const getSectionAverageCalories = (sectionKey) => {
    const calories = dietPlanForm[sectionKey]
      .map((option) => Number(option.calories))
      .filter((value) => !Number.isNaN(value) && value > 0);
    if (!calories.length) return 0;
    return Math.round(calories.reduce((sum, value) => sum + value, 0) / calories.length);
  };

  const getMealCategoryLabel = (category) =>
    MEAL_CATEGORY_LABELS[String(category || '').trim()] || 'Other';

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: 'calc(100vh - 120px)',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: panelBorder,
        background: pageBg,
      }}
    >
      <DietitianStatsGrid
        stats={stats}
        panelBg={panelBg}
        panelBorder={panelBorder}
        subtitleColor={subtitleColor}
        cardTitleColor={cardTitleColor}
      />

      <DietitianDashboardHeaderControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inputTextColor={inputTextColor}
        isDark={isDark}
        mutedText={mutedText}
        panelBg={panelBg}
        panelBorder={panelBorder}
        searchText={searchText}
        setSearchText={setSearchText}
        subtitleColor={subtitleColor}
        tabItems={tabItems}
      />

      {activeTab === 'Members' && (
        <DietitianMembersPanel
          cardBodyColor={cardBodyColor}
          cardTitleColor={cardTitleColor}
          displayedMembers={displayedMembers}
          linkColor={linkColor}
          mutedText={mutedText}
          onOpenDietPlan={openDietPlanModal}
          onViewAll={() => navigate(ROUTES.DIETITIAN_CLIENTS)}
          panelBg={panelBg}
          panelBorder={panelBorder}
          savedDietPlans={savedDietPlans}
          sectionTitleColor={sectionTitleColor}
        />
      )}

      {activeTab === 'Appointments' && (
        <DietitianAppointmentsTable
          appointments={sortedAppointments}
          mutedText={mutedText}
          onApprove={approveAppointment}
          onReject={rejectAppointment}
          panelBg={panelBg}
          panelBorder={panelBorder}
          subtitleColor={subtitleColor}
        />
      )}

      {activeTab === 'Time Slots' && (
        <DietitianTimeSlotsPanel
          addTimeSlot={addTimeSlot}
          getWeekdayLabel={getWeekdayLabel}
          isDark={isDark}
          isSlotsLoading={isSlotsLoading}
          mutedText={mutedText}
          openDeleteSlot={openDeleteSlot}
          openEditSlot={openEditSlot}
          panelBg={panelBg}
          panelBorder={panelBorder}
          sectionTitleColor={sectionTitleColor}
          setSlotForm={setSlotForm}
          slotError={slotError}
          slotForm={slotForm}
          slotTitleColor={slotTitleColor}
          subtitleColor={subtitleColor}
          timeSlots={timeSlots}
          to12Hour={to12Hour}
        />
      )}
      <Dialog open={slotNotice.open} onClose={() => setSlotNotice((prev) => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>
          <Typography>{slotNotice.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotNotice((prev) => ({ ...prev, open: false }))}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rejectDialog.open}
        onClose={closeRejectDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Appointment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1.2, color: mutedText, fontSize: '0.9rem' }}>
            Add a reason for rejecting this booking. This reason will be visible in user booking history.
          </Typography>
          <TextField
            value={rejectDialog.reason}
            onChange={(event) => setRejectDialog((prev) => ({ ...prev, reason: event.target.value, error: '' }))}
            label="Reject Reason"
            fullWidth
            required
            multiline
            minRows={3}
          />
          {rejectDialog.error && (
            <Typography sx={{ mt: 1, color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
              {rejectDialog.error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={submitRejectedAppointment}
            disabled={rejectDialog.isSubmitting}
          >
            {rejectDialog.isSubmitting ? 'Submitting...' : 'Submit Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editSlotState.open}
        onClose={() => setEditSlotState({ open: false, id: null, date: '', startTime: '', endTime: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Time Slot</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ mt: 0.5 }}>
            <TextField
              label="Date"
              type="date"
              value={editSlotState.date}
              onChange={(e) => setEditSlotState((prev) => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#d8e7ff',
                  borderRadius: 1.5,
                  background: isDark ? '#253a5d' : '#f3f8ff',
                  '& fieldset': { borderColor: panelBorder },
                },
                '& .MuiInputLabel-root': {
                  color: subtitleColor,
                  fontSize: '0.9rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.98rem',
                  fontWeight: 600,
                },
                '& input::-webkit-calendar-picker-indicator': {
                  filter: isDark ? 'invert(1) brightness(1.5)' : 'none',
                  opacity: 0.95,
                  cursor: 'pointer',
                },
              }}
            />
            <TextField
              label="Start Time"
              type="time"
              value={editSlotState.startTime}
              onChange={(e) => setEditSlotState((prev) => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#d8e7ff',
                  borderRadius: 1.5,
                  background: isDark ? '#253a5d' : '#f3f8ff',
                  '& fieldset': { borderColor: panelBorder },
                },
                '& .MuiInputLabel-root': {
                  color: subtitleColor,
                  fontSize: '0.9rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.98rem',
                  fontWeight: 600,
                },
                '& input::-webkit-calendar-picker-indicator': {
                  filter: isDark ? 'invert(1) brightness(1.5)' : 'none',
                  opacity: 0.95,
                  cursor: 'pointer',
                },
              }}
            />
            <TextField
              label="End Time"
              type="time"
              value={editSlotState.endTime}
              onChange={(e) => setEditSlotState((prev) => ({ ...prev, endTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#d8e7ff',
                  borderRadius: 1.5,
                  background: isDark ? '#253a5d' : '#f3f8ff',
                  '& fieldset': { borderColor: panelBorder },
                },
                '& .MuiInputLabel-root': {
                  color: subtitleColor,
                  fontSize: '0.9rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.98rem',
                  fontWeight: 600,
                },
                '& input::-webkit-calendar-picker-indicator': {
                  filter: isDark ? 'invert(1) brightness(1.5)' : 'none',
                  opacity: 0.95,
                  cursor: 'pointer',
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditSlotState({ open: false, id: null, date: '', startTime: '', endTime: '' })}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveEditedSlot}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteSlotState.open}
        onClose={() => setDeleteSlotState({ open: false, id: null, label: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Time Slot</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this slot?</Typography>
          <Typography sx={{ mt: 0.8, color: mutedText, fontSize: '0.9rem' }}>
            {deleteSlotState.label}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSlotState({ open: false, id: null, label: '' })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteSlot}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dietPlanModal.open}
        onClose={closeDietPlanModal}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: '#1f2f4a',
            border: '1px solid',
            borderColor: '#334d73',
            color: '#e6f0ff',
            maxHeight: '92vh',
          },
        }}
      >
        {(() => {
          const currentPlan = savedDietPlans[dietPlanModal.member?.id];
          const isSubmittedPlan = Boolean(currentPlan?.isSubmitted);
          const isDraftPlan = Boolean(currentPlan?.id) && !isSubmittedPlan;

          return (
            <>
        <DialogTitle sx={{ pr: 6 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#f8fafc' }}>
            Create Diet Plan
          </Typography>
          <Typography sx={{ color: '#9fb3cf', fontSize: '1.35rem', mt: 0.4 }}>
            Creating plan for: <Box component="span" sx={{ color: '#f8fafc', fontWeight: 700 }}>{dietPlanModal.member?.name}</Box>
          </Typography>
          <Button
            onClick={closeDietPlanModal}
            sx={{
              position: 'absolute',
              right: 10,
              top: 10,
              minWidth: 0,
              p: 0.6,
              borderRadius: 1,
              color: '#94a3b8',
            }}
          >
            <CloseRoundedIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ overflowY: 'auto', pb: 2 }}>
          <Box component="fieldset" disabled={isSubmittedPlan} sx={{ m: 0, p: 0, border: 'none' }}>
            <Stack spacing={2}>
            {mealSections.map((section) => (
              <Box key={section.key}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.1 }}>
                  <Typography sx={{ fontWeight: 800, color: '#f8fafc', fontSize: '2rem' }}>
                    <Box component="span" sx={{ mr: 1 }}>{section.icon}</Box>
                    {section.title}
                  </Typography>
                  <Typography sx={{ color: '#aac2e0', fontWeight: 700, fontSize: '1.2rem' }}>
                    Total: {getSectionAverageCalories(section.key)} cal (avg per option)
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                    gap: 1.2,
                  }}
                >
                  {dietPlanForm[section.key].map((option, index) => (
                    <Box
                      key={`${section.key}-${index}`}
                      sx={{
                        p: 1.4,
                        borderRadius: 1.7,
                        border: '1px solid',
                        borderColor: '#415a82',
                        background: '#354a6b',
                      }}
                    >
                      <Typography sx={{ color: '#f8fafc', fontWeight: 800, mb: 1, fontSize: '1.45rem' }}>
                        Option {index + 1}
                      </Typography>

                      <Autocomplete
                        freeSolo
                        options={mealSuggestions}
                        getOptionLabel={(mealOption) =>
                          typeof mealOption === 'string' ? mealOption : mealOption.mealName || ''
                        }
                        renderOption={(props, mealOption) => {
                          if (typeof mealOption === 'string') {
                            return (
                              <Box component="li" {...props}>
                                <Typography sx={{ fontSize: '0.95rem' }}>{mealOption}</Typography>
                              </Box>
                            );
                          }
                          return (
                            <Box
                              component="li"
                              {...props}
                              sx={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.95rem' }}>
                                {mealOption.mealName || ''}
                              </Typography>
                              <Chip
                                size="small"
                                label={getMealCategoryLabel(mealOption.category)}
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: '#dbeafe',
                                  color: '#1d4ed8',
                                }}
                              />
                            </Box>
                          );
                        }}
                        value={option.mealName || ''}
                        onInputChange={(_, value) =>
                          updateMealField(section.key, index, 'mealName', value)
                        }
                        onChange={(_, selected) =>
                          applySuggestedMealToOption(section.key, index, selected)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Meal Name"
                            placeholder="e.g., Grilled"
                            fullWidth
                            size="small"
                            sx={{
                              mb: 0.8,
                              '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.15rem', fontWeight: 700 },
                              '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                            }}
                          />
                        )}
                      />

                      <TextField
                        label="Description"
                        placeholder="Brief description"
                        value={option.description}
                        onChange={(e) => updateMealField(section.key, index, 'description', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{
                          mb: 0.8,
                          '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.15rem', fontWeight: 700 },
                          '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                        }}
                      />

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 0.8 }}>
                        <TextField
                          label="Quantity"
                          type="number"
                          value={option.quantity ?? '1'}
                          onChange={(e) => updateMealField(section.key, index, 'quantity', e.target.value)}
                          size="small"
                          inputProps={{ min: 0.1, step: 0.1 }}
                          sx={{
                            '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.05rem', fontWeight: 700 },
                            '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                          }}
                        />
                        <TextField
                          label="Unit"
                          select
                          value={option.unit || 'g'}
                          onChange={(e) => updateMealField(section.key, index, 'unit', e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.05rem', fontWeight: 700 },
                            '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                          }}
                        >
                          {FOOD_UNIT_OPTIONS.map((unitOption) => (
                            <MenuItem key={unitOption} value={unitOption}>
                              {unitOption}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8 }}>
                        <TextField
                          label="Calories"
                          type="number"
                          value={option.calories}
                          onChange={(e) => updateMealField(section.key, index, 'calories', e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.05rem', fontWeight: 700 },
                            '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                          }}
                        />
                        <TextField
                          label="Protein (g)"
                          type="number"
                          value={option.protein}
                          onChange={(e) => updateMealField(section.key, index, 'protein', e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.05rem', fontWeight: 700 },
                            '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                          }}
                        />
                        <TextField
                          label="Carbs (g)"
                          type="number"
                          value={option.carbs}
                          onChange={(e) => updateMealField(section.key, index, 'carbs', e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.05rem', fontWeight: 700 },
                            '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                          }}
                        />
                        <TextField
                          label="Lipids (g)"
                          type="number"
                          value={option.lipids}
                          onChange={(e) => updateMealField(section.key, index, 'lipids', e.target.value)}
                          size="small"
                          sx={{
                            '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.05rem', fontWeight: 700 },
                            '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                          }}
                        />
                      </Box>

                      <TextField
                        label="Vitamins"
                        placeholder="e.g., A, C, D"
                        value={option.vitamins}
                        onChange={(e) => updateMealField(section.key, index, 'vitamins', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{
                          mt: 0.8,
                          '& .MuiInputLabel-root': { color: '#c6d6ef', fontSize: '1.15rem', fontWeight: 700 },
                          '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#4b6286', borderRadius: 1.2 },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}

            <Box>
              <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.45rem', mb: 0.6 }}>
                Additional Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                placeholder="Any special instructions or dietary restrictions..."
                value={dietPlanForm.additionalNotes}
                onChange={(e) =>
                  setDietPlanForm((prev) => ({ ...prev, additionalNotes: e.target.value }))
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#edf5ff',
                    background: '#3d5275',
                    borderRadius: 1.3,
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#627ca4' },
                }}
              />
            </Box>
            </Stack>
          </Box>
          {slotError && (
            <Alert severity="error" sx={{ mt: 1.2 }}>
              {slotError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
            {!isSubmittedPlan && (
              <>
                <Button
                  variant="outlined"
                  onClick={saveDietPlanDraft}
                  disabled={isDietPlanSubmitting}
                  fullWidth
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.2, py: 1 }}
                >
                  {isDietPlanSubmitting ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={publishDietPlan}
                  disabled={isDietPlanSubmitting}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 1.2,
                    py: 1,
                    fontSize: '1rem',
                    backgroundColor: '#f30612',
                    '&:hover': { backgroundColor: '#cf0812' },
                  }}
                >
                  {isDietPlanSubmitting ? 'Publishing...' : 'Publish Plan'}
                </Button>
              </>
            )}
            {isSubmittedPlan && (
              <Button
                variant="contained"
                onClick={closeDietPlanModal}
                fullWidth
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.2, py: 1 }}
              >
                Close
              </Button>
            )}
            {isDraftPlan && (
              <Button
                color="error"
                variant="outlined"
                onClick={deleteDraftDietPlan}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.2, py: 1, minWidth: { sm: 150 } }}
              >
                Delete Draft
              </Button>
            )}
          </Stack>
        </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}

export default DietitianDashboard;
