import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PageHeader from '@/shared/components/ui/PageHeader';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  createMealLibraryItem,
  deleteMealLibraryItem,
  getMealLibraryItems,
  searchNutritionFoods,
  updateMealLibraryItem,
} from '../api/dietitian.api';

const CATEGORY_OPTIONS = [
  { value: 'weight_gain', label: 'Weight Gaining' },
  { value: 'weight_loss', label: 'Weight Losing' },
  { value: 'other', label: 'Other' },
];
const FOOD_UNIT_OPTIONS = ['g', 'ml', 'cups', 'tbsp', 'tsp', 'piece'];
const NUTRITION_NUMERIC_FIELDS = ['calories', 'protein', 'carbs', 'lipids'];

const emptyMealForm = {
  category: 'weight_gain',
  mealName: '',
  calories: '',
  protein: '',
  carbs: '',
  lipids: '',
  vitamins: '',
  quantity: '1',
  unit: 'g',
  description: '',
};

const formatSuggestionSource = (source) => {
  const value = String(source || '').trim().toLowerCase();
  if (!value) return 'Unknown';
  if (value === 'usda') return 'USDA';
  if (value.includes('sri-lanka') || value.includes('local')) return 'Local DB';
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwo = (value) => Math.round(value * 100) / 100;

const scaleNutritionValuesByQuantity = (form, nextQuantityRaw) => {
  const prevQuantity = toFiniteNumber(form?.quantity);
  const nextQuantity = toFiniteNumber(nextQuantityRaw);
  if (!prevQuantity || prevQuantity <= 0 || !nextQuantity || nextQuantity <= 0) {
    return { ...form, quantity: nextQuantityRaw };
  }

  const ratio = nextQuantity / prevQuantity;
  const nextForm = { ...form, quantity: nextQuantityRaw };

  NUTRITION_NUMERIC_FIELDS.forEach((field) => {
    const current = toFiniteNumber(form?.[field]);
    if (current === null) return;
    nextForm[field] = roundToTwo(current * ratio);
  });

  return nextForm;
};

function DietitianMealPlans() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const panelBg = isDark ? '#1a2a47' : '#ffffff';
  const panelBorder = isDark ? '#2b4268' : '#dbe7f6';
  const mutedText = isDark ? '#88a1c7' : '#607aa5';
  const sectionTitleColor = isDark ? '#e6f0ff' : '#0f172a';
  const mealTitleColor = isDark ? '#f8fafc' : '#0f172a';
  const mealMetaColor = isDark ? '#cfe0fb' : '#475569';
  const tagColor = isDark ? '#93c5fd' : '#1d4ed8';
  const tagBg = isDark ? '#2563eb1f' : '#dbeafe';

  const [activeCategory, setActiveCategory] = useState('weight_gain');
  const { user } = useAuth();
  const dietitianId = String(user?.id || user?._id || '');
  const [meals, setMeals] = useState([]);
  const [mealForm, setMealForm] = useState(emptyMealForm);
  const [editState, setEditState] = useState({ open: false, meal: null });
  const [deleteState, setDeleteState] = useState({ open: false, meal: null });
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionOptions, setNutritionOptions] = useState([]);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);

  const mealsByCategory = useMemo(
    () => meals.filter((meal) => meal.category === activeCategory),
    [meals, activeCategory],
  );

  const mealSuggestionLibrary = useMemo(() => nutritionOptions, [nutritionOptions]);

  const normalizeSuggestion = (selected) => {
    if (!selected) return null;
    const mealName = selected.mealName || selected.name || '';
    return {
      mealName,
      category: selected.category,
      calories: selected.calories ?? 0,
      protein: selected.protein ?? 0,
      carbs: selected.carbs ?? 0,
      lipids: selected.lipids ?? selected.fat ?? 0,
      vitamins: selected.vitamins ?? '',
      quantity: selected.quantity ?? 1,
      unit: selected.unit ?? 'g',
      description: selected.description ?? selected.notes ?? '',
    };
  };

  const loadMeals = useCallback(async () => {
    if (!dietitianId) return;
    setIsLoading(true);
    try {
      const { data } = await getMealLibraryItems({ dietitianId });
      setMeals(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setFeedback({
        open: true,
        message: error?.response?.data?.message || 'Failed to load meals.',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dietitianId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMeals();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadMeals]);

  useEffect(() => {
    const query = String(mealForm.mealName || '').trim();
    if (query.length < 2) {
      setNutritionOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsNutritionLoading(true);
        const { data } = await searchNutritionFoods(query);
        setNutritionOptions(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setNutritionOptions([]);
      } finally {
        setIsNutritionLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [mealForm.mealName]);

  useEffect(() => {
    const query = String(editState.meal?.mealName || '').trim();
    if (!editState.open || query.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        setIsNutritionLoading(true);
        const { data } = await searchNutritionFoods(query);
        setNutritionOptions(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setNutritionOptions([]);
      } finally {
        setIsNutritionLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editState.meal?.mealName, editState.open]);

  const handleAddMeal = async () => {
    if (!dietitianId) {
      setFeedback({
        open: true,
        message: 'Dietitian account is required.',
        severity: 'error',
      });
      return;
    }

    if (!mealForm.mealName.trim() || !mealForm.calories || !mealForm.protein) {
      setFeedback({
        open: true,
        message: 'Meal name, calories, and protein are required.',
        severity: 'warning',
      });
      return;
    }
    const quantityValue = Number(mealForm.quantity);
    if (!Number.isFinite(quantityValue) || quantityValue < 0.1) {
      setFeedback({
        open: true,
        message: 'Quantity must be at least 0.1.',
        severity: 'warning',
      });
      return;
    }

    try {
      const payload = {
        ...mealForm,
        dietitianId,
      };
      const { data } = await createMealLibraryItem(payload);
      setMeals((prev) => [data?.data, ...prev]);
      setMealForm({ ...emptyMealForm, category: mealForm.category });
      setFeedback({ open: true, message: 'Meal added successfully.', severity: 'success' });
    } catch (error) {
      setFeedback({
        open: true,
        message: error?.response?.data?.message || 'Failed to add meal.',
        severity: 'error',
      });
    }
  };

  const openEditMeal = (meal) => {
    setEditState({ open: true, meal: { ...meal } });
  };

  const applySuggestionToAddForm = (selected) => {
    const suggestion = normalizeSuggestion(selected);
    if (!suggestion) return;
    setMealForm((prev) => ({
      ...prev,
      mealName: suggestion.mealName,
      category: suggestion.category || prev.category,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      lipids: suggestion.lipids,
      vitamins: suggestion.vitamins,
      quantity: suggestion.quantity,
      unit: suggestion.unit,
      description: suggestion.description,
    }));
  };

  const applySuggestionToEditForm = (selected) => {
    const suggestion = normalizeSuggestion(selected);
    if (!suggestion || !editState.meal) return;
    setEditState((prev) => ({
      ...prev,
      meal: {
        ...prev.meal,
        mealName: suggestion.mealName,
        category: suggestion.category || prev.meal.category,
        calories: suggestion.calories,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        lipids: suggestion.lipids,
        vitamins: suggestion.vitamins,
        quantity: suggestion.quantity,
        unit: suggestion.unit,
        description: suggestion.description,
      },
    }));
  };

  const saveEditedMeal = async () => {
    if (!editState.meal?.mealName?.trim() || !dietitianId) return;
    const quantityValue = Number(editState.meal?.quantity);
    if (!Number.isFinite(quantityValue) || quantityValue < 0.1) {
      setFeedback({
        open: true,
        message: 'Quantity must be at least 0.1.',
        severity: 'warning',
      });
      return;
    }
    try {
      const { data } = await updateMealLibraryItem(
        editState.meal._id || editState.meal.id,
        editState.meal,
        dietitianId,
      );
      setMeals((prev) =>
        prev.map((meal) =>
          String(meal._id || meal.id) === String(data?.data?._id || data?.data?.id) ? data.data : meal),
      );
      setEditState({ open: false, meal: null });
      setFeedback({ open: true, message: 'Meal updated successfully.', severity: 'success' });
    } catch (error) {
      setFeedback({
        open: true,
        message: error?.response?.data?.message || 'Failed to update meal.',
        severity: 'error',
      });
    }
  };

  const deleteMeal = async () => {
    if (!deleteState.meal) return;
    try {
      const id = deleteState.meal._id || deleteState.meal.id;
      await deleteMealLibraryItem(id, dietitianId);
      setMeals((prev) => prev.filter((meal) => String(meal._id || meal.id) !== String(id)));
      setDeleteState({ open: false, meal: null });
      setFeedback({ open: true, message: 'Meal deleted successfully.', severity: 'success' });
    } catch (error) {
      setFeedback({
        open: true,
        message: error?.response?.data?.message || 'Failed to delete meal.',
        severity: 'error',
      });
    }
  };

  const getCategoryLabel = (value) =>
    CATEGORY_OPTIONS.find((option) => option.value === value)?.label || 'Other';

  return (
    <Box sx={{ pb: 3 }}>
      <PageHeader
        title="Meal Plans"
        subtitle="Add, edit, and delete meals with calories, protein, and macro details across categories."
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {CATEGORY_OPTIONS.map((category) => (
          <Button
            key={category.value}
            onClick={() => setActiveCategory(category.value)}
            variant={activeCategory === category.value ? 'contained' : 'outlined'}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {category.label}
          </Button>
        ))}
      </Stack>

      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: panelBorder,
          borderRadius: 2,
          background: panelBg,
          mb: 2,
        }}
      >
        <Typography sx={{ color: sectionTitleColor, fontWeight: 800, fontSize: '1.05rem', mb: 1.2 }}>
          Add Meal
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          <TextField
            select
            label="Category"
            value={mealForm.category}
            onChange={(e) => setMealForm((prev) => ({ ...prev, category: e.target.value }))}
            size="small"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
          <Autocomplete
            freeSolo
            options={mealSuggestionLibrary}
            loading={isNutritionLoading}
            noOptionsText="No suggestions found"
            loadingText="Loading suggestions..."
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.mealName || option.name || ''
            }
            renderOption={(props, option) => {
              if (typeof option === 'string') {
                return (
                  <Box component="li" {...props} sx={{ width: '100%' }}>
                    <Typography sx={{ fontSize: '0.92rem' }}>{option}</Typography>
                  </Box>
                );
              }
              const name = option?.mealName || option?.name || '';
              return (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Typography sx={{ fontSize: '0.92rem' }}>{name}</Typography>
                  <Chip
                    size="small"
                    label={formatSuggestionSource(option?.source)}
                    sx={{
                      ml: 1,
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      bgcolor: '#dcfce7',
                      color: '#166534',
                    }}
                  />
                </Box>
              );
            }}
            value={mealForm.mealName}
            onInputChange={(_, value) =>
              setMealForm((prev) => ({ ...prev, mealName: value }))
            }
            onChange={(_, selected) => applySuggestionToAddForm(selected)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Meal Name"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isNutritionLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Calories"
            type="number"
            value={mealForm.calories}
            onChange={(e) => setMealForm((prev) => ({ ...prev, calories: e.target.value }))}
            size="small"
          />
          <TextField
            label="Protein (g)"
            type="number"
            value={mealForm.protein}
            onChange={(e) => setMealForm((prev) => ({ ...prev, protein: e.target.value }))}
            size="small"
          />
          <TextField
            label="Carbs (g)"
            type="number"
            value={mealForm.carbs}
            onChange={(e) => setMealForm((prev) => ({ ...prev, carbs: e.target.value }))}
            size="small"
          />
          <TextField
            label="Lipids (g)"
            type="number"
            value={mealForm.lipids}
            onChange={(e) => setMealForm((prev) => ({ ...prev, lipids: e.target.value }))}
            size="small"
          />
          <TextField
            label="Vitamins"
            value={mealForm.vitamins}
            onChange={(e) => setMealForm((prev) => ({ ...prev, vitamins: e.target.value }))}
            size="small"
          />
          <TextField
            label="Quantity"
            type="number"
            value={mealForm.quantity}
            onChange={(e) =>
              setMealForm((prev) => scaleNutritionValuesByQuantity(prev, e.target.value))
            }
            size="small"
            inputProps={{ min: 0.1, step: 0.1 }}
          />
          <TextField
            label="Unit"
            select
            value={mealForm.unit}
            onChange={(e) => setMealForm((prev) => ({ ...prev, unit: e.target.value }))}
            size="small"
          >
            {FOOD_UNIT_OPTIONS.map((unitOption) => (
              <MenuItem key={unitOption} value={unitOption}>{unitOption}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            value={mealForm.description}
            onChange={(e) => setMealForm((prev) => ({ ...prev, description: e.target.value }))}
            size="small"
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleAddMeal}
          sx={{
            mt: 1.3,
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 1.5,
            backgroundColor: '#f30612',
            '&:hover': { backgroundColor: '#cf0812' },
          }}
        >
          Add Meal
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
          gap: 1.5,
        }}
      >
        {isLoading && (
          <Typography sx={{ color: mutedText, mb: 1 }}>Loading meals...</Typography>
        )}
        {mealsByCategory.map((meal) => (
          <Box
            key={meal._id || meal.id}
            sx={{
              p: 1.7,
              border: '1px solid',
              borderColor: panelBorder,
              borderRadius: 2,
              background: panelBg,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
              <Typography sx={{ color: mealTitleColor, fontWeight: 800, fontSize: '1.05rem' }}>
                {meal.mealName}
              </Typography>
              <Chip
                size="small"
                label={getCategoryLabel(meal.category)}
                sx={{ bgcolor: tagBg, color: tagColor, fontWeight: 700 }}
              />
            </Stack>
            <Typography sx={{ color: mutedText, fontSize: '0.9rem', mb: 1 }}>
              {meal.description || 'No description added.'}
            </Typography>
            <Typography sx={{ color: mealMetaColor, fontSize: '0.88rem', lineHeight: 1.7 }}>
              Calories: {meal.calories || 0}
              <br />
              Protein: {meal.protein || 0} g
              <br />
              Carbs: {meal.carbs || 0} g
              <br />
              Lipids: {meal.lipids || 0} g
              <br />
              Vitamins: {meal.vitamins || '-'}
              <br />
              Quantity: {Number(meal.quantity || 1)} {String(meal.unit || 'g')}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                onClick={() => openEditMeal(meal)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />}
                onClick={() => setDeleteState({ open: true, meal })}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Delete
              </Button>
            </Stack>
          </Box>
        ))}
      </Box>

      <Dialog open={editState.open} onClose={() => setEditState({ open: false, meal: null })} fullWidth maxWidth="sm">
        <DialogTitle>Edit Meal</DialogTitle>
        <DialogContent>
          <Stack spacing={1.1} sx={{ mt: 0.7 }}>
            <TextField
              select
              label="Category"
              value={editState.meal?.category || 'weight_gain'}
              onChange={(e) =>
                setEditState((prev) => ({ ...prev, meal: { ...prev.meal, category: e.target.value } }))
              }
              size="small"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <Autocomplete
              freeSolo
              options={mealSuggestionLibrary}
              loading={isNutritionLoading}
              noOptionsText="No suggestions found"
              loadingText="Loading suggestions..."
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.mealName || option.name || ''
              }
              renderOption={(props, option) => {
                if (typeof option === 'string') {
                  return (
                    <Box component="li" {...props} sx={{ width: '100%' }}>
                      <Typography sx={{ fontSize: '0.92rem' }}>{option}</Typography>
                    </Box>
                  );
                }
                const name = option?.mealName || option?.name || '';
                return (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography sx={{ fontSize: '0.92rem' }}>{name}</Typography>
                    <Chip
                      size="small"
                      label={formatSuggestionSource(option?.source)}
                      sx={{
                        ml: 1,
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        bgcolor: '#dcfce7',
                        color: '#166534',
                      }}
                    />
                  </Box>
                );
              }}
              value={editState.meal?.mealName || ''}
              onInputChange={(_, value) =>
                setEditState((prev) => ({ ...prev, meal: { ...prev.meal, mealName: value } }))
              }
              onChange={(_, selected) => applySuggestionToEditForm(selected)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Meal Name"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isNutritionLoading ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              label="Description"
              value={editState.meal?.description || ''}
              onChange={(e) =>
                setEditState((prev) => ({ ...prev, meal: { ...prev.meal, description: e.target.value } }))
              }
              size="small"
              multiline
              minRows={2}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <TextField
                label="Calories"
                type="number"
                value={editState.meal?.calories || ''}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, meal: { ...prev.meal, calories: e.target.value } }))
                }
                size="small"
              />
              <TextField
                label="Protein (g)"
                type="number"
                value={editState.meal?.protein || ''}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, meal: { ...prev.meal, protein: e.target.value } }))
                }
                size="small"
              />
              <TextField
                label="Carbs (g)"
                type="number"
                value={editState.meal?.carbs || ''}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, meal: { ...prev.meal, carbs: e.target.value } }))
                }
                size="small"
              />
              <TextField
                label="Lipids (g)"
                type="number"
                value={editState.meal?.lipids || ''}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, meal: { ...prev.meal, lipids: e.target.value } }))
                }
                size="small"
              />
              <TextField
                label="Quantity"
                type="number"
                value={editState.meal?.quantity || ''}
                onChange={(e) =>
                  setEditState((prev) => ({
                    ...prev,
                    meal: scaleNutritionValuesByQuantity(prev.meal || {}, e.target.value),
                  }))
                }
                size="small"
                inputProps={{ min: 0.1, step: 0.1 }}
              />
              <TextField
                label="Unit"
                select
                value={editState.meal?.unit || 'g'}
                onChange={(e) =>
                  setEditState((prev) => ({ ...prev, meal: { ...prev.meal, unit: e.target.value } }))
                }
                size="small"
              >
                {FOOD_UNIT_OPTIONS.map((unitOption) => (
                  <MenuItem key={unitOption} value={unitOption}>{unitOption}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Vitamins"
              value={editState.meal?.vitamins || ''}
              onChange={(e) =>
                setEditState((prev) => ({ ...prev, meal: { ...prev.meal, vitamins: e.target.value } }))
              }
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditState({ open: false, meal: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveEditedMeal}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteState.open} onClose={() => setDeleteState({ open: false, meal: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Meal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteState.meal?.mealName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteState({ open: false, meal: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteMeal}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={2500}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback.severity}
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

export default DietitianMealPlans;
