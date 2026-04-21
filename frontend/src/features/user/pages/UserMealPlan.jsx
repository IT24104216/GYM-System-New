import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Autocomplete,
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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/utils/constants';
import {
  RISK_WINDOW_DAYS,
  buildDailySummaries,
  evaluateMealQuality,
} from '../utils/mealRiskScoring';
import { createUserFoodLog, deleteUserFoodLog, updateUserFoodLog } from '../api/user.api';
import CalorieTooltip from '../components/CalorieTooltip';
import MealPlanRiskMonitorCard from '../components/MealPlanRiskMonitorCard';
import { useDietitianPlan, useNutritionSuggestions, useUserFoodLogs } from '../hooks/useUserMealPlanData';
import {
  containerVariants,
  formatSuggestionSource,
  itemVariants,
  mealSectionConfig,
  mealSectionOrder,
  shiftIsoDate,
  toIsoDate,
  yAxisTicks,
} from '../utils/userMealPlan.utils';

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const FOOD_UNIT_OPTIONS = ['g', 'ml', 'cups', 'tbsp', 'tsp', 'piece'];

function UserMealPlan() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = String(user?.id || user?._id || '');
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [planMode, setPlanMode] = useState('dietitian');
  const { dietitianPlan, planError, setPlanError, isPlanLoading } = useDietitianPlan(userId);
  const { foodLogs, allFoodLogs, refreshFoodLogs, refreshAllFoodLogs } = useUserFoodLogs(
    userId,
    todayIso,
    planMode,
  );
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [logForm, setLogForm] = useState({
    mealType: 'breakfast',
    name: '',
    quantity: '1',
    unit: 'g',
  });
  const [logNutrition, setLogNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    notes: '',
  });
  const { nutritionOptions, setNutritionOptions, isNutritionLoading } = useNutritionSuggestions(
    isLogDialogOpen,
    logForm.name,
  );
  const [customTrendDate, setCustomTrendDate] = useState(todayIso);
  const [customTrendRange, setCustomTrendRange] = useState(7);

  const meals = useMemo(() => {
    const sectionByKey = new Map();
    (dietitianPlan?.sections || []).forEach((section) => {
      const key = String(section?.key || '').toLowerCase();
      if (!mealSectionOrder.includes(key)) return;
      sectionByKey.set(key, Array.isArray(section.items) ? section.items : []);
    });

    return mealSectionOrder.map((mealType) => {
      const config = mealSectionConfig[mealType];
      const planItems = (sectionByKey.get(mealType) || []).map((item) => ({
        name: item.name,
        quantity: Number(item.quantity || 1),
        unit: String(item.unit || 'g'),
        cals: Number(item.cals || 0),
        p: Number(item.p || 0),
        c: Number(item.c || 0),
        f: Number(item.f || 0),
        notes: item.description || '',
        isLogged: false,
      }));
      const items = [...planItems];

      return {
        key: mealType,
        type: config.label,
        icon: config.icon || RestaurantRoundedIcon,
        tone: config.tone,
        bg: config.bg,
        items,
        total: items.reduce((sum, item) => sum + Number(item.cals || 0), 0),
      };
    });
  }, [dietitianPlan]);

  const myPlanMeals = useMemo(
    () =>
      mealSectionOrder.map((mealType) => {
        const config = mealSectionConfig[mealType];
        const items = foodLogs
          .filter((log) => log.mealType === mealType)
          .map((log) => ({
            id: String(log._id),
            name: log.name,
            quantity: Number(log.quantity || 1),
            unit: String(log.unit || 'g'),
            cals: Number(log.calories || 0),
            p: Number(log.protein || 0),
            c: Number(log.carbs || 0),
            f: Number(log.fat || 0),
            notes: log.notes || '',
            isLogged: true,
          }));
        return {
          key: mealType,
          type: config.label,
          icon: config.icon || RestaurantRoundedIcon,
          tone: config.tone,
          bg: config.bg,
          items,
          total: items.reduce((sum, item) => sum + Number(item.cals || 0), 0),
        };
      }),
    [foodLogs],
  );

  const macroData = useMemo(() => {
    if (!meals.length) {
      return [
        { name: 'Protein', value: 0, color: '#0D9488' },
        { name: 'Carbs', value: 0, color: '#F59E0B' },
        { name: 'Fat', value: 0, color: '#8B5CF6' },
      ];
    }
    const totals = meals.reduce(
      (acc, meal) => {
        meal.items.forEach((item) => {
          acc.protein += Number(item.p || 0);
          acc.carbs += Number(item.c || 0);
          acc.fat += Number(item.f || 0);
        });
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 },
    );
    return [
      { name: 'Protein', value: Number(totals.protein || 0), color: '#0D9488' },
      { name: 'Carbs', value: Number(totals.carbs || 0), color: '#F59E0B' },
      { name: 'Fat', value: Number(totals.fat || 0), color: '#8B5CF6' },
    ];
  }, [meals]);

  const weeklyCals = useMemo(() => {
    const total = meals.reduce((sum, meal) => sum + Number(meal.total || 0), 0);
    if (!total) {
      return [
        { day: 'M', cals: 0 },
        { day: 'T', cals: 0 },
        { day: 'W', cals: 0 },
        { day: 'T', cals: 0 },
        { day: 'F', cals: 0 },
        { day: 'S', cals: 0 },
        { day: 'S', cals: 0 },
      ];
    }
    const base = Math.round(total);
    return [
      { day: 'M', cals: Math.max(0, base - 180) },
      { day: 'T', cals: Math.max(0, base - 60) },
      { day: 'W', cals: Math.max(0, base - 220) },
      { day: 'T', cals: Math.max(0, base + 40) },
      { day: 'F', cals: Math.max(0, base - 80) },
      { day: 'S', cals: Math.max(0, base + 120) },
      { day: 'S', cals: Math.max(0, base - 30) },
    ];
  }, [meals]);

  const myPlanMacroData = useMemo(() => {
    const totals = myPlanMeals.reduce(
      (acc, meal) => {
        meal.items.forEach((item) => {
          acc.protein += Number(item.p || 0);
          acc.carbs += Number(item.c || 0);
          acc.fat += Number(item.f || 0);
        });
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0 },
    );
    return [
      { name: 'Protein', value: Number(totals.protein || 0), color: '#0D9488' },
      { name: 'Carbs', value: Number(totals.carbs || 0), color: '#F59E0B' },
      { name: 'Fat', value: Number(totals.fat || 0), color: '#8B5CF6' },
    ];
  }, [myPlanMeals]);

  const myPlanRangeCals = useMemo(() => {
    const grouped = new Map();
    allFoodLogs.forEach((log) => {
      const dateKey = String(log?.logDate || '').slice(0, 10);
      if (!dateKey) return;
      const prev = grouped.get(dateKey) || { cals: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      grouped.set(dateKey, {
        cals: prev.cals + Number(log?.calories || 0),
        protein: prev.protein + Number(log?.protein || 0),
        carbs: prev.carbs + Number(log?.carbs || 0),
        fat: prev.fat + Number(log?.fat || 0),
        count: prev.count + 1,
      });
    });

    const endIso = toIsoDate(customTrendDate) || todayIso;
    const range = [1, 7, 30].includes(Number(customTrendRange)) ? Number(customTrendRange) : 7;
    const items = Array.from({ length: range }).map((_, idx) => {
      const offset = idx - (range - 1);
      const iso = shiftIsoDate(endIso, offset);
      const entry = grouped.get(iso) || { cals: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      const parsed = new Date(`${iso}T00:00:00`);
      const label = range === 30
        ? parsed.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
        : parsed.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      return {
        day: label,
        fullDate: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        cals: Math.round(entry.cals),
        protein: Math.round(entry.protein),
        carbs: Math.round(entry.carbs),
        fat: Math.round(entry.fat),
        mealCount: entry.count,
      };
    });

    return items;
  }, [allFoodLogs, customTrendDate, customTrendRange, todayIso]);

  const displayMeals = planMode === 'dietitian' ? meals : myPlanMeals;
  const displayMacroData = planMode === 'dietitian' ? macroData : myPlanMacroData;
  const displayWeeklyCals = planMode === 'dietitian' ? weeklyCals : myPlanRangeCals;
  const trendLabel = planMode === 'dietitian'
    ? 'Last 7 Days'
    : (Number(customTrendRange) === 1 ? '1 Day' : `${customTrendRange} Days`);

  const totalConsumed = useMemo(
    () => displayMeals.reduce((sum, meal) => sum + Number(meal.total || 0), 0),
    [displayMeals],
  );

  const riskMonitor = useMemo(() => {
    const merged = [...allFoodLogs];
    foodLogs.forEach((item) => {
      const id = String(item?._id || '');
      if (id && merged.some((x) => String(x?._id || '') === id)) return;
      merged.push(item);
    });

    const daily = buildDailySummaries(merged, todayIso, RISK_WINDOW_DAYS);
    const evaluated = daily.map((entry) => ({
      ...entry,
      evaluation: evaluateMealQuality(entry),
    }));
    const today = evaluated[evaluated.length - 1] || {
      evaluation: {
        level: 'neutral',
        score: 0,
        label: 'No logs yet',
        message: 'Add your meals to get personalized safety feedback for your My Plan.',
        reasons: [],
      },
    };

    let riskStreak = 0;
    for (let i = evaluated.length - 1; i >= 0; i -= 1) {
      const level = evaluated[i]?.evaluation?.level;
      if (level === 'yellow' || level === 'red') riskStreak += 1;
      else break;
    }

    let goodStreak = 0;
    for (let i = evaluated.length - 1; i >= 0; i -= 1) {
      if (evaluated[i]?.evaluation?.level === 'green') goodStreak += 1;
      else break;
    }

    return {
      today: today.evaluation,
      riskStreak,
      goodStreak,
    };
  }, [allFoodLogs, foodLogs, todayIso]);

  const resetLogForm = (mealType = 'breakfast') => {
    setLogForm({
      mealType,
      name: '',
      quantity: '1',
      unit: 'g',
    });
    setLogNutrition({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: '',
    });
    setEditingLogId(null);
    setNutritionOptions([]);
  };

  const openCreateLogDialog = (mealType = 'breakfast') => {
    resetLogForm(mealType);
    setIsLogDialogOpen(true);
  };

  const openEditLogDialog = (logItem, mealType) => {
    setEditingLogId(logItem.id);
    setLogForm({
      mealType,
      name: logItem.name || '',
      quantity: String(logItem.quantity || 1),
      unit: String(logItem.unit || 'g'),
    });
    setLogNutrition({
      calories: Number(logItem.cals || 0),
      protein: Number(logItem.p || 0),
      carbs: Number(logItem.c || 0),
      fat: Number(logItem.f || 0),
      notes: logItem.notes || '',
    });
    setIsLogDialogOpen(true);
  };

  const closeLogDialog = () => {
    setIsLogDialogOpen(false);
    resetLogForm();
  };

  const handleLogFormChange = (field) => (event) => {
    setLogForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNutritionSelect = (_event, option) => {
    if (!option) return;
    setLogForm((prev) => ({
      ...prev,
      name: option.name || prev.name,
    }));
    setLogNutrition({
      calories: Number(option.calories || 0),
      protein: Number(option.protein || 0),
      carbs: Number(option.carbs || 0),
      fat: Number(option.fat || 0),
      notes: option.notes || '',
    });
  };

  const handleSaveLog = async () => {
    try {
      if (planMode !== 'custom') return;
      if (!String(logForm.name || '').trim()) {
        setPlanError('Food name is required');
        return;
      }
      let effectiveNutrition = { ...logNutrition };
      if (!effectiveNutrition.calories && !effectiveNutrition.protein && !effectiveNutrition.carbs && !effectiveNutrition.fat) {
        const exact = nutritionOptions.find(
          (item) => String(item?.name || '').toLowerCase() === String(logForm.name || '').trim().toLowerCase(),
        );
        if (exact) {
          effectiveNutrition = {
            calories: Number(exact.calories || 0),
            protein: Number(exact.protein || 0),
            carbs: Number(exact.carbs || 0),
            fat: Number(exact.fat || 0),
            notes: exact.notes || '',
          };
        }
      }
      const payload = {
        userId,
        logDate: todayIso,
        mealType: logForm.mealType,
        name: logForm.name.trim(),
        quantity: Number(logForm.quantity || 1),
        unit: String(logForm.unit || 'g'),
        calories: Number(effectiveNutrition.calories || 0),
        protein: Number(effectiveNutrition.protein || 0),
        carbs: Number(effectiveNutrition.carbs || 0),
        fat: Number(effectiveNutrition.fat || 0),
        notes: String(effectiveNutrition.notes || '').trim(),
      };

      if (editingLogId) {
        await updateUserFoodLog(editingLogId, userId, payload);
      } else {
        await createUserFoodLog(payload);
      }

      await Promise.all([refreshFoodLogs(), refreshAllFoodLogs()]);
      closeLogDialog();
      setPlanError('');
    } catch (error) {
      setPlanError(error?.response?.data?.message || 'Failed to save food log');
    }
  };

  const handleDeleteLog = async (logId) => {
    if (planMode !== 'custom') return;
    if (!logId || !userId) return;
    try {
      await deleteUserFoodLog(logId, userId);
      await Promise.all([refreshFoodLogs(), refreshAllFoodLogs()]);
      setPlanError('');
    } catch (error) {
      setPlanError(error?.response?.data?.message || 'Failed to delete food log');
    }
  };

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1240, mx: 'auto' }}>
        <MotionBox variants={itemVariants} mb={2.2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.2}>
            <Box>
              <Typography sx={{ fontSize: { xs: '1.6rem', md: '1.95rem' }, fontWeight: 900, color: theme.palette.text.primary }}>
                Meal Plan Hub
              </Typography>
              <Typography sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                View dietitian recommendations or build your own daily meal plan.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                label="Dietitian Plan"
                clickable
                onClick={() => setPlanMode('dietitian')}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  bgcolor: planMode === 'dietitian' ? '#84cc16' : (isDark ? '#17253a' : '#eef2f7'),
                  color: planMode === 'dietitian' ? '#0f172a' : theme.palette.text.primary,
                }}
              />
              <Chip
                label="My Plan"
                clickable
                onClick={() => setPlanMode('custom')}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  bgcolor: planMode === 'custom' ? '#0D9488' : (isDark ? '#17253a' : '#eef2f7'),
                  color: planMode === 'custom' ? '#ffffff' : theme.palette.text.primary,
                }}
              />
            </Stack>
          </Stack>
        </MotionBox>

        {planMode === 'custom' && (
          <MealPlanRiskMonitorCard
            isDark={isDark}
            theme={theme}
            riskMonitor={riskMonitor}
            onSwitchToDietitian={() => setPlanMode('dietitian')}
            onBookDietitian={() => navigate(ROUTES.USER_DIETITIANS)}
          />
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 1.8, mb: 2.4 }}>
          <MotionCard variants={itemVariants} sx={{ borderRadius: 2.4, border: `1px solid ${isDark ? '#27384f' : '#e7edf6'}` }}>
            <CardContent>
              <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', mb: 2 }}>Daily Summary</Typography>
              <Stack alignItems="center" spacing={2}>
                <MotionBox
                  initial={{ opacity: 0, scale: 0.92, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  sx={{
                    width: 200,
                    height: 200,
                    position: 'relative',
                    mb: 0.5,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayMacroData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={4}
                        stroke="none"
                        isAnimationActive
                        animationDuration={900}
                      >
                        {displayMacroData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <Box
                    sx={{
                      width: 128,
                      height: 128,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      bgcolor: theme.palette.background.paper,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 900, fontSize: '2.2rem', lineHeight: 1 }}
                    >
                      {totalConsumed.toLocaleString()}
                    </Typography>
                    <Typography
                      sx={{ color: theme.palette.text.secondary, fontSize: '0.82rem' }}
                    >
                      kcal consumed
                    </Typography>
                  </Box>
                </MotionBox>

                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 1,
                  }}
                >
                  {displayMacroData.map((item) => (
                    <Stack key={item.name} alignItems="center" spacing={0.3} sx={{ minWidth: 0 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{item.name}</Typography>
                      <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.86rem' }}>{item.value}g</Typography>
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>

          <MotionCard variants={itemVariants} sx={{ borderRadius: 2.4, border: `1px solid ${isDark ? '#27384f' : '#e7edf6'}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.6}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.2rem' }}>Calorie Trend</Typography>
                {planMode === 'custom' ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      type="date"
                      size="small"
                      value={customTrendDate}
                      onChange={(event) => setCustomTrendDate(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ width: 156 }}
                    />
                    <TextField
                      select
                      size="small"
                      value={customTrendRange}
                      onChange={(event) => setCustomTrendRange(Number(event.target.value))}
                      sx={{ width: 96 }}
                    >
                      <MenuItem value={1}>1 Day</MenuItem>
                      <MenuItem value={7}>7 Days</MenuItem>
                      <MenuItem value={30}>30 Days</MenuItem>
                    </TextField>
                  </Stack>
                ) : (
                  <Chip label={trendLabel} sx={{ borderRadius: 1.8, fontWeight: 700 }} />
                )}
              </Stack>

              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <Box sx={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayWeeklyCals} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#cbd5e1" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 14 }}
                      />
                      <YAxis
                        domain={[0, 2600]}
                        ticks={[0, ...yAxisTicks]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 14 }}
                        width={46}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={<CalorieTooltip />}
                        wrapperStyle={{ outline: 'none' }}
                      />
                      <Bar
                        dataKey="cals"
                        fill="#84cc16"
                        radius={[8, 8, 0, 0]}
                        barSize={planMode === 'custom' ? (customTrendRange === 30 ? 12 : (customTrendRange === 1 ? 52 : 34)) : 52}
                        isAnimationActive
                        animationDuration={650}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </CardContent>
          </MotionCard>
        </Box>

        {planMode === 'dietitian' && (
          <MotionCard
            variants={itemVariants}
            sx={{
              mb: 2.2,
              borderRadius: 2.2,
              border: `1px solid ${isDark ? '#27384f' : '#e7edf6'}`,
              background: isDark
                ? 'linear-gradient(135deg, #13213a 0%, #0f1b31 100%)'
                : 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%)',
            }}
          >
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.4}>
                <Stack direction="row" spacing={1.1} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#84cc16',
                      color: '#0f172a',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <VerifiedRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.05rem' }}>Dietitian Plan</Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem' }}>
                      {dietitianPlan
                        ? `Assigned by ${dietitianPlan?.dietitian?.name || 'Dietitian'}`
                        : 'No submitted plan yet'}
                    </Typography>
                  </Box>
                </Stack>
                {dietitianPlan && (
                  <Chip
                    label={`${Number(dietitianPlan?.summary?.totalCalories || 0)} kcal/day`}
                    sx={{ borderRadius: 2, fontWeight: 800, bgcolor: '#84cc16', color: '#0f172a' }}
                  />
                )}
              </Stack>

              {!dietitianPlan && (
                <Typography sx={{ mt: 1.1, color: planError ? '#ef4444' : theme.palette.text.secondary, fontSize: '0.92rem' }}>
                  {isPlanLoading
                    ? 'Loading dietitian plan...'
                    : (planError || 'Your dietitian has not submitted a meal plan yet.')}
                </Typography>
              )}

              {dietitianPlan && (
                <>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.4} sx={{ mt: 1.2 }}>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.92rem' }}>
                      Focus: <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>{dietitianPlan?.dietitian?.specialization || 'Nutrition'}</Box>
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.92rem' }}>
                      Updated: <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                        {dietitianPlan?.submittedAt ? new Date(dietitianPlan.submittedAt).toLocaleDateString() : '-'}
                      </Box>
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      mt: 0.9,
                      color: theme.palette.text.secondary,
                      fontSize: '0.92rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    Dietitian Notes:{' '}
                    <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                      {dietitianPlan?.additionalNotes?.trim() || '-'}
                    </Box>
                  </Typography>
                </>
              )}
            </CardContent>
          </MotionCard>
        )}

        <MotionBox variants={itemVariants}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.3}>
            <Typography sx={{ fontSize: '1.45rem', fontWeight: 900, color: theme.palette.text.primary }}>
              {planMode === 'dietitian' ? "Today's Meals" : 'My Meal Builder'}
            </Typography>
            {planMode === 'custom' && (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => openCreateLogDialog('breakfast')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 800,
                  bgcolor: '#0f172a',
                  '&:hover': { bgcolor: '#111827' },
                }}
              >
                Create Meal
              </Button>
            )}
          </Stack>

          <Stack spacing={1.3}>
            {planMode === 'dietitian' && !isPlanLoading && displayMeals.length === 0 && (
              <MotionCard variants={itemVariants} sx={{ borderRadius: 2.2, border: `1px solid ${isDark ? '#27384f' : '#e7edf6'}` }}>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ color: theme.palette.text.secondary }}>
                    No dietitian meals available yet.
                  </Typography>
                </Box>
              </MotionCard>
            )}
            {displayMeals.map((meal, index) => {
              const Icon = meal.icon;
              return (
                <MotionCard
                  key={meal.type}
                  variants={itemVariants}
                  transition={{ delay: index * 0.03 }}
                  sx={{ borderRadius: 2.2, border: `1px solid ${isDark ? '#27384f' : '#e7edf6'}` }}
                >
                  <Box sx={{ p: 1.5, bgcolor: isDark ? '#121f34' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#27384f' : '#edf2f7'}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <Box sx={{ width: 40, height: 40, borderRadius: 1.4, bgcolor: meal.bg, color: meal.tone, display: 'grid', placeItems: 'center' }}>
                          <Icon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{meal.type}</Typography>
                      </Stack>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: theme.palette.text.secondary }}>{meal.total} kcal</Typography>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 1.2 }}>
                    {meal.items.map((item, idx) => (
                      <Stack key={`${item.name}-${idx}`} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.2, borderRadius: 1.5, '&:hover': { bgcolor: isDark ? '#13233a' : '#f8fafc' } }}>
                        <Box>
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <Typography sx={{ fontWeight: 700 }}>{`${item.name} - ${Number(item.quantity || 1)} ${String(item.unit || 'g')} - ${item.cals} kcal`}</Typography>
                            {item.isLogged && (
                              <Chip label="Logged" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={0.9} sx={{ mt: 0.3 }}>
                            <Typography sx={{ color: '#0D9488' }}>{item.p}g P</Typography>
                            <Typography sx={{ color: '#F59E0B' }}>{item.c}g C</Typography>
                            <Typography sx={{ color: '#8B5CF6' }}>{item.f}g F</Typography>
                          </Stack>
                        </Box>
                        {planMode === 'custom' && item.isLogged ? (
                          <Stack direction="row" spacing={0.6}>
                            <Button
                              size="small"
                              onClick={() => openEditLogDialog(item, meal.key)}
                              sx={{ minWidth: 0, px: 1, textTransform: 'none', fontWeight: 700 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteLog(item.id)}
                              sx={{ minWidth: 0, px: 1, textTransform: 'none', fontWeight: 700 }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        ) : (
                          <ChevronRightRoundedIcon sx={{ color: '#9ca3af' }} />
                        )}
                      </Stack>
                    ))}

                    {planMode === 'custom' && (
                      <Button
                        fullWidth
                        startIcon={<AddRoundedIcon />}
                        onClick={() => openCreateLogDialog(meal.key)}
                        sx={{
                          mt: 0.6,
                          color: '#64748b',
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 1.5,
                          '&:hover': {
                            bgcolor: isDark ? '#15253c' : '#ecfeff',
                            color: '#0D9488',
                          },
                        }}
                      >
                        Add Food
                      </Button>
                    )}
                  </Box>
                </MotionCard>
              );
            })}
          </Stack>
        </MotionBox>

        <Dialog
          open={isLogDialogOpen}
          onClose={closeLogDialog}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2.2,
              border: `1px solid ${isDark ? '#314764' : '#d5deea'}`,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 900 }}>
            {editingLogId ? 'Edit Food Log' : 'Add Food Log'}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={1.25} sx={{ mt: 0.5 }}>
              <TextField
                select
                label="Meal Type"
                value={logForm.mealType}
                onChange={handleLogFormChange('mealType')}
                fullWidth
                size="small"
              >
                {mealSectionOrder.map((mealType) => (
                  <MenuItem key={mealType} value={mealType}>
                    {mealSectionConfig[mealType].label}
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                freeSolo
                options={nutritionOptions}
                loading={isNutritionLoading}
                noOptionsText="No suggestions found"
                loadingText="Loading suggestions..."
                getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
                renderOption={(props, option) => {
                  if (typeof option === 'string') {
                    return (
                      <Box component="li" {...props} sx={{ width: '100%' }}>
                        <Typography sx={{ fontSize: '0.92rem' }}>{option}</Typography>
                      </Box>
                    );
                  }
                  return (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography sx={{ fontSize: '0.92rem' }}>{option?.name || ''}</Typography>
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
                filterOptions={(x) => x}
                inputValue={logForm.name}
                onInputChange={(_event, value) => {
                  setLogForm((prev) => ({ ...prev, name: value }));
                  setLogNutrition((prev) => ({
                    ...prev,
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    notes: '',
                  }));
                }}
                onChange={handleNutritionSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Food Name"
                    fullWidth
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  label="Quantity"
                  type="number"
                  size="small"
                  value={logForm.quantity}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  inputProps={{ min: 0.1, step: 0.1 }}
                  fullWidth
                />
                <TextField
                  select
                  label="Unit"
                  size="small"
                  value={logForm.unit}
                  onChange={(event) => setLogForm((prev) => ({ ...prev, unit: event.target.value }))}
                  fullWidth
                >
                  {FOOD_UNIT_OPTIONS.map((unitOption) => (
                    <MenuItem key={unitOption} value={unitOption}>
                      {unitOption}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Typography sx={{ fontSize: '0.86rem', color: theme.palette.text.secondary }}>
                Nutrition is auto-filled from selected food suggestion and shown in the meal card.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeLogDialog} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLog}
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.8 }}
            >
              {editingLogId ? 'Update Food' : 'Add Food'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MotionBox>
  );
}

export default UserMealPlan;
