import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Chip,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  MenuItem,
  Typography,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PageHeader from '@/shared/components/ui/PageHeader';
import { useAuth } from '@/shared/hooks/useAuth';
import { getToken } from '@/shared/utils/storage';
import {
  deleteMealPlan,
  getDietitianAppointments,
  getDietitianClientPlans,
  getMealLibraryItems,
  submitMealPlan,
  upsertDietitianClientPlan,
} from '@/features/dietitian/api/dietitian.api';

const CLIENTS_PER_PAGE = 6;

const mealSections = [
  { key: 'breakfast', title: 'Breakfast Options', icon: 'B' },
  { key: 'lunch', title: 'Lunch Options', icon: 'L' },
  { key: 'dinner', title: 'Dinner Options', icon: 'D' },
  { key: 'snacks', title: 'Snacks Options', icon: 'S' },
];
const MEAL_CATEGORY_LABELS = {
  weight_gain: 'Weight Gaining',
  weight_loss: 'Weight Losing',
  other: 'Other',
};
const FOOD_UNIT_OPTIONS = ['g', 'ml', 'cups', 'tbsp', 'tsp', 'piece'];

const createMealOption = () => ({
  mealName: '',
  description: '',
  calories: '',
  protein: '',
  carbs: '',
  lipids: '',
  vitamins: '',
  quantity: '1',
  unit: 'g',
});

const createDietPlanForm = () => ({
  breakfast: [createMealOption(), createMealOption(), createMealOption()],
  lunch: [createMealOption(), createMealOption(), createMealOption()],
  dinner: [createMealOption(), createMealOption(), createMealOption()],
  snacks: [createMealOption(), createMealOption(), createMealOption()],
  additionalNotes: '',
});

const sanitizePlanSection = (section = []) =>
  (Array.isArray(section) ? section : []).map((item) => {
    const toNumericOrZero = (value) => {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return 0;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    };
    return {
      mealName: String(item?.mealName || '').trim(),
      description: String(item?.description || '').trim(),
      calories: toNumericOrZero(item?.calories),
      protein: toNumericOrZero(item?.protein),
      carbs: toNumericOrZero(item?.carbs),
      lipids: toNumericOrZero(item?.lipids),
      vitamins: String(item?.vitamins || '').trim(),
      quantity: (() => {
        const parsed = Number(item?.quantity);
        if (!Number.isFinite(parsed) || parsed < 0.1) return 1;
        return parsed;
      })(),
      unit: FOOD_UNIT_OPTIONS.includes(String(item?.unit || '').trim())
        ? String(item?.unit || '').trim()
        : 'g',
    };
  });

function DietitianClients() {
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
  const [allClients, setAllClients] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [dietPlanModal, setDietPlanModal] = useState({ open: false, client: null });
  const [dietPlanForm, setDietPlanForm] = useState(createDietPlanForm());
  const [dietPlanInitialSnapshot, setDietPlanInitialSnapshot] = useState('');
  const [savedPlans, setSavedPlans] = useState({});
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, client: null });
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [page, setPage] = useState(1);
  const [isDietPlanSubmitting, setIsDietPlanSubmitting] = useState(false);
  const isMealPlanningGoal = (goalValue) => {
    const normalized = String(goalValue || '').trim().toLowerCase();
    if (!normalized) return true;
    return normalized.includes('meal planning');
  };

  const loadApprovedClients = useCallback(async () => {
    if (!dietitianId) return;
    const getNoteValue = (notes, key) => {
      if (!notes) return '';
      const pattern = new RegExp(`${key}:\\s*([^|]+)`, 'i');
      const match = notes.match(pattern);
      return match?.[1]?.trim() || '';
    };
    try {
      const { data } = await getDietitianAppointments({
        sessionType: 'nutrition',
        page: 1,
        limit: 300,
      });

      const items = Array.isArray(data?.data) ? data.data : [];
      const ownItems = items.filter((item) => {
        const byId = String(item.dietitianId || '') === dietitianId;
        const byNoteId = String(getNoteValue(item.notes, 'DietitianId') || '') === dietitianId;
        const byName = getNoteValue(item.notes, 'Dietitian').trim().toLowerCase() === dietitianName;
        return byId || byNoteId || byName;
      });
      const mapByUser = new Map();
      ownItems
        .filter((item) => item.status === 'approved' || item.status === 'completed')
        .forEach((item) => {
          const goal = getNoteValue(item.notes, 'Goal') || 'Meal Planning';
          if (!isMealPlanningGoal(goal)) return;
          if (!mapByUser.has(item.userId)) {
            const startsAt = new Date(item.startsAt);
            mapByUser.set(item.userId, {
              id: String(item.userId),
              name: getNoteValue(item.notes, 'User Name') || `User ${String(item.userId).slice(0, 6)}`,
              joinedDate: Number.isNaN(startsAt.getTime())
                ? new Date().toISOString().split('T')[0]
                : startsAt.toISOString().split('T')[0],
              age: 27,
              weight: 70,
              height: 170,
              goal,
            });
          }
        });

      const approvedClients = Array.from(mapByUser.values());
      // Dashboard shows first 3; clients page shows the remaining records.
      setAllClients(approvedClients.slice(3));
    } catch {
      setAllClients([]);
    }
  }, [dietitianId, dietitianName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadApprovedClients();
    }, 0);
    const interval = setInterval(() => {
      void loadApprovedClients();
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadApprovedClients]);

  const loadDietitianMealsAndPlans = useCallback(async () => {
    if (!dietitianId) return;
    try {
      const [{ data: mealsData }, { data: plansData }] = await Promise.all([
        getMealLibraryItems({ dietitianId }),
        getDietitianClientPlans({ dietitianId }),
      ]);
      const meals = Array.isArray(mealsData?.data) ? mealsData.data : [];
      setMealSuggestions(meals);

      const plans = Array.isArray(plansData?.data) ? plansData.data : [];
      const planMap = {};
      plans.forEach((plan) => {
        if (!plan?.userId) return;
        planMap[String(plan.userId)] = {
          id: String(plan._id),
          isSubmitted: Boolean(plan.isSubmitted),
          data: {
            breakfast: Array.isArray(plan.breakfast) ? plan.breakfast : [createMealOption(), createMealOption(), createMealOption()],
            lunch: Array.isArray(plan.lunch) ? plan.lunch : [createMealOption(), createMealOption(), createMealOption()],
            dinner: Array.isArray(plan.dinner) ? plan.dinner : [createMealOption(), createMealOption(), createMealOption()],
            snacks: Array.isArray(plan.snacks) ? plan.snacks : [createMealOption(), createMealOption(), createMealOption()],
            additionalNotes: plan.additionalNotes || '',
          },
        };
      });
      setSavedPlans(planMap);
    } catch {
      setMealSuggestions([]);
      setSavedPlans({});
    }
  }, [dietitianId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDietitianMealsAndPlans();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDietitianMealsAndPlans]);

  const panelBg = isDark ? '#1a2a47' : '#ffffff';
  const panelBorder = isDark ? '#2b4268' : '#dbe7f6';
  const mutedText = isDark ? '#88a1c7' : '#607aa5';
  const inputTextColor = isDark ? '#cfe0fb' : '#334155';
  const cardTitleColor = isDark ? '#ffffff' : '#0f172a';
  const cardBodyColor = isDark ? '#b7cce8' : '#64748b';

  const visibleClients = useMemo(
    () =>
      allClients.filter((client) =>
        client.name.toLowerCase().includes(searchText.trim().toLowerCase()),
      ),
    [allClients, searchText],
  );

  const totalPages = Math.max(1, Math.ceil(visibleClients.length / CLIENTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * CLIENTS_PER_PAGE;
    return visibleClients.slice(start, start + CLIENTS_PER_PAGE);
  }, [visibleClients, currentPage]);

  const openDietPlanModal = (client) => {
    const existing = savedPlans[client.id]?.data;
    const nextForm = existing || createDietPlanForm();
    setDietPlanForm(nextForm);
    const initialSnapshot = JSON.stringify({
      breakfast: sanitizePlanSection(nextForm.breakfast),
      lunch: sanitizePlanSection(nextForm.lunch),
      dinner: sanitizePlanSection(nextForm.dinner),
      snacks: sanitizePlanSection(nextForm.snacks),
      additionalNotes: String(nextForm.additionalNotes || '').trim(),
    });
    setDietPlanInitialSnapshot(initialSnapshot);
    setDietPlanModal({ open: true, client });
  };

  const closeDietPlanModal = () => {
    setDietPlanInitialSnapshot('');
    setIsDietPlanSubmitting(false);
    setDietPlanModal({ open: false, client: null });
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

  const upsertAndMaybeSubmitDietPlan = async (submitted = false) => {
    const clientId = dietPlanModal.client?.id;
    if (!clientId) return;
    if (!dietitianId) {
      setFeedback({ open: true, message: 'Unable to save draft. Please log in again.', severity: 'error' });
      return;
    }
    const clientValidationMessage = getDietPlanValidationMessage(dietPlanForm, submitted);
    if (clientValidationMessage) {
      setFeedback({ open: true, message: clientValidationMessage, severity: 'error' });
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
      setFeedback({ open: true, message: 'No changes to save.', severity: 'info' });
      return;
    }

    setIsDietPlanSubmitting(true);
    try {
      const payload = {
        dietitianId,
        userId: clientId,
        memberName: dietPlanModal.client?.name || '',
        breakfast: sanitizePlanSection(dietPlanForm.breakfast),
        lunch: sanitizePlanSection(dietPlanForm.lunch),
        dinner: sanitizePlanSection(dietPlanForm.dinner),
        snacks: sanitizePlanSection(dietPlanForm.snacks),
        additionalNotes: dietPlanForm.additionalNotes,
      };
      const { data } = await upsertDietitianClientPlan(payload);
      const plan = data?.data;
      const planId = String(plan?._id || plan?.id || savedPlans[clientId]?.id || '');
      if (!planId) throw new Error('Plan id is missing after save');
      if (submitted) {
        await submitMealPlan(planId, dietitianId, true);
      }
      await loadDietitianMealsAndPlans();
      setDietPlanModal({ open: false, client: null });
      setFeedback({
        open: true,
        message: submitted ? 'Meal plan published successfully.' : 'Draft saved successfully.',
        severity: 'success',
      });
    } catch (error) {
      if (error?.response?.status === 409) {
        setFeedback({
          open: true,
          message: 'This plan is already published and cannot be edited.',
          severity: 'error',
        });
        return;
      }
      if (error?.response?.status === 422) {
        setFeedback({
          open: true,
          message: error?.response?.data?.message || 'Please check highlighted fields and try again.',
          severity: 'error',
        });
        return;
      }
      setFeedback({
        open: true,
        message: error?.response?.data?.message || (submitted ? 'Failed to publish meal plan. Please try again.' : 'Failed to save draft. Please try again.'),
        severity: 'error',
      });
    } finally {
      setIsDietPlanSubmitting(false);
    }
  };

  const getMealCategoryLabel = (category) =>
    MEAL_CATEGORY_LABELS[String(category || '').trim()] || 'Other';

  const saveDietPlanDraft = async () => {
    await upsertAndMaybeSubmitDietPlan(false);
  };

  const publishDietPlan = async () => {
    await upsertAndMaybeSubmitDietPlan(true);
  };

  const deleteDietPlan = async () => {
    const clientId = confirmDelete.client?.id;
    if (!clientId) return;
    try {
      const planId = savedPlans[clientId]?.id;
      if (!planId) return;
      await deleteMealPlan(planId, dietitianId);
      await loadDietitianMealsAndPlans();
      setConfirmDelete({ open: false, client: null });
      setFeedback({ open: true, message: 'Diet plan deleted successfully.', severity: 'success' });
    } catch (error) {
      setFeedback({
        open: true,
        message: error?.response?.data?.message || 'Failed to delete diet plan.',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <PageHeader title="My Clients" subtitle="View all assigned members with the same dashboard card format." />

      <TextField
        fullWidth
        placeholder="Search client by name..."
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          setPage(1);
        }}
        sx={{
          mb: 2.1,
          '& .MuiOutlinedInput-root': {
            color: inputTextColor,
            borderRadius: 1.5,
            background: isDark ? '#1a2a47' : '#f7fbff',
            '& fieldset': { borderColor: panelBorder },
            '&:hover fieldset': { borderColor: panelBorder },
            '&.Mui-focused fieldset': { borderColor: '#4f77b6' },
          },
          '& .MuiInputBase-input::placeholder': { color: mutedText, opacity: 1 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: mutedText, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {paginatedClients.map((client) => (
          <Box
            key={client.id}
            sx={{
              background: panelBg,
              border: '1px solid',
              borderColor: panelBorder,
              borderRadius: 2,
              p: 2.4,
              minHeight: 330,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography sx={{ color: cardTitleColor, fontWeight: 800, fontSize: '1.85rem', mb: 0.5 }}>
              {client.name}
            </Typography>
            <Typography sx={{ color: mutedText, fontSize: '1.02rem', mb: 2.2 }}>
              Member since {client.joinedDate}
            </Typography>

            <Typography sx={{ color: cardBodyColor, fontSize: '1.03rem', lineHeight: 1.6 }}>
              Age: {client.age} years
              <br />
              Weight: {client.weight} kg
              <br />
              Height: {client.height} cm
              <br />
              Goal: {client.goal}
            </Typography>

            {savedPlans[client.id] && (
              <Chip
                label={savedPlans[client.id].isSubmitted ? 'Published' : 'Draft'}
                size="small"
                sx={{
                  mt: 1.2,
                  alignSelf: 'flex-start',
                  fontWeight: 800,
                  bgcolor: savedPlans[client.id].isSubmitted ? '#22c55e1f' : '#f59e0b1f',
                  color: savedPlans[client.id].isSubmitted ? '#22c55e' : '#f59e0b',
                }}
              />
            )}

            {savedPlans[client.id] ? (
              <Stack direction="row" spacing={0.9} sx={{ mt: 'auto' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openDietPlanModal(client)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#5e789f',
                    color: '#d4e2f8',
                  }}
                >
                  {savedPlans[client.id].isSubmitted ? 'View' : 'Edit'}
                </Button>
                {!savedPlans[client.id].isSubmitted && (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => setConfirmDelete({ open: true, client })}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Delete
                  </Button>
                )}
              </Stack>
            ) : (
              <Button
                variant="contained"
                fullWidth
                onClick={() => openDietPlanModal(client)}
                sx={{
                  mt: 'auto',
                  pt: 1.9,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 1.8,
                  backgroundColor: '#f30612',
                  '&:hover': { backgroundColor: '#cf0812' },
                }}
              >
                Create Diet Plan
              </Button>
            )}
          </Box>
        ))}
      </Box>

      {visibleClients.length > CLIENTS_PER_PAGE && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 2.4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            siblingCount={0}
            boundaryCount={1}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#d4e2f8',
                borderColor: panelBorder,
                backgroundColor: isDark ? '#1a2a47' : '#ffffff',
                fontWeight: 700,
              },
              '& .Mui-selected': {
                backgroundColor: '#2563eb !important',
                color: '#ffffff !important',
              },
            }}
          />
        </Stack>
      )}

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
          const currentPlan = savedPlans[dietPlanModal.client?.id];
          const isSubmittedPlan = Boolean(currentPlan?.isSubmitted);
          return (
            <>
        <DialogTitle sx={{ pr: 6 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#f8fafc' }}>
            Create Diet Plan
          </Typography>
          <Typography sx={{ color: '#9fb3cf', fontSize: '1.35rem', mt: 0.4 }}>
            Creating plan for: <Box component="span" sx={{ color: '#f8fafc', fontWeight: 700 }}>{dietPlanModal.client?.name}</Box>
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
                      <Typography sx={{ color: '#c6d6ef', fontSize: '0.85rem', mb: 0.8 }}>
                        {String(option.mealName || '').trim()
                          ? `${String(option.mealName || '').trim()} - ${String(option.quantity || '1').trim() || '1'} ${String(option.unit || 'g').trim() || 'g'}`
                          : 'Meal summary appears here'}
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

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8 }}>
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
          </Stack>
        </DialogActions>
            </>
          );
        })()}
      </Dialog>

      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, client: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Diet Plan</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete plan for <strong>{confirmDelete.client?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, client: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteDietPlan}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={2500}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback.severity || 'success'}
          variant="filled"
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DietitianClients;
