import { useCallback, useEffect, useState } from 'react';
import {
  getDietitianAppointments,
  getDietitianClientPlans,
  getDietitianSchedulingSlots,
  getMealLibraryItems,
} from '../api/dietitian.api';
import {
  createDietPlanForm,
  FOOD_UNIT_OPTIONS,
  createMealOption,
  getNoteValue,
  getWeekdayLabel,
} from '../utils/dietitianDashboard.utils';

const priorityRank = { urgent: 0, normal: 1, low: 2 };
const normalizePriority = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'low') return normalized;
  return 'normal';
};

export function useDietitianTimeSlots(dietitianId, setSlotError) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);

  const loadTimeSlots = useCallback(async () => {
    if (!dietitianId) return;
    setIsSlotsLoading(true);
    setSlotError('');
    try {
      const { data } = await getDietitianSchedulingSlots(String(dietitianId));
      const items = Array.isArray(data?.data) ? data.data : [];
      setTimeSlots(items.map((slot) => ({
        id: slot._id,
        date: slot.date,
        day: getWeekdayLabel(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime,
      })));
    } catch (error) {
      setSlotError(error?.response?.data?.message || 'Failed to load time slots');
    } finally {
      setIsSlotsLoading(false);
    }
  }, [dietitianId, setSlotError]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!isMounted) return;
      await loadTimeSlots();
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [loadTimeSlots]);

  return { timeSlots, isSlotsLoading, loadTimeSlots };
}

export function useDietitianMealsAndPlans(dietitianId, setSlotError) {
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [savedDietPlans, setSavedDietPlans] = useState({});

  const normalizeSection = useCallback((section = []) =>
    (Array.isArray(section) ? section : []).map((item) => ({
      ...createMealOption(),
      ...item,
      quantity: (() => {
        const parsed = Number(item?.quantity);
        if (!Number.isFinite(parsed) || parsed < 0.1) return '1';
        return String(parsed);
      })(),
      unit: FOOD_UNIT_OPTIONS.includes(String(item?.unit || '').trim())
        ? String(item?.unit || '').trim()
        : 'g',
    })), []);

  const toClientPlanForm = useCallback((plan) => ({
    breakfast: Array.isArray(plan?.breakfast) ? normalizeSection(plan.breakfast) : [createMealOption(), createMealOption(), createMealOption()],
    lunch: Array.isArray(plan?.lunch) ? normalizeSection(plan.lunch) : [createMealOption(), createMealOption(), createMealOption()],
    dinner: Array.isArray(plan?.dinner) ? normalizeSection(plan.dinner) : [createMealOption(), createMealOption(), createMealOption()],
    snacks: Array.isArray(plan?.snacks) ? normalizeSection(plan.snacks) : [createMealOption(), createMealOption(), createMealOption()],
    additionalNotes: plan?.additionalNotes || '',
  }), [normalizeSection]);

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
      const nextPlans = {};
      plans.forEach((plan) => {
        if (!plan?.userId) return;
        nextPlans[String(plan.userId)] = {
          id: String(plan._id),
          isSubmitted: Boolean(plan.isSubmitted),
          data: toClientPlanForm(plan),
        };
      });
      setSavedDietPlans(nextPlans);
    } catch (error) {
      setMealSuggestions([]);
      setSavedDietPlans({});
      setSlotError(error?.response?.data?.message || 'Failed to load diet plans.');
    }
  }, [dietitianId, setSlotError, toClientPlanForm]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!isMounted) return;
      await loadDietitianMealsAndPlans();
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [loadDietitianMealsAndPlans]);

  return { mealSuggestions, savedDietPlans, loadDietitianMealsAndPlans };
}

export function useDietitianAppointmentsData(dietitianId, dietitianName, setSlotError, mockAppointments, mockMembers) {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [members, setMembers] = useState(mockMembers);
  const isMealPlanningGoal = (goalValue) => {
    const normalized = String(goalValue || '').trim().toLowerCase();
    if (!normalized) return true;
    return normalized.includes('meal planning');
  };

  const mapAppointmentRow = (item) => {
    const startsAt = new Date(item.startsAt);
    const date = Number.isNaN(startsAt.getTime())
      ? ''
      : startsAt.toISOString().split('T')[0];
    const time = Number.isNaN(startsAt.getTime())
      ? ''
      : startsAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const statusLabelByValue = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };

    return {
      id: item._id,
      userId: item.userId,
      member: getNoteValue(item.notes, 'User Name') || `User ${String(item.userId).slice(0, 6)}`,
      date,
      time,
      goal: getNoteValue(item.notes, 'Goal') || 'Meal Planning',
      status: statusLabelByValue[item.status] || 'Pending',
      rawStatus: item.status,
      email: getNoteValue(item.notes, 'User Email') || '-',
      phone: getNoteValue(item.notes, 'Mobile') || '-',
      rejectReason: getNoteValue(item.notes, 'Reject Reason') || '',
      notes: item.notes || '',
      priority: normalizePriority(item.priority),
      createdAt: item.createdAt,
    };
  };

  const loadDietitianAppointments = useCallback(async () => {
    if (!dietitianId) return;
    try {
      const { data } = await getDietitianAppointments({
        sessionType: 'nutrition',
        page: 1,
        limit: 500,
      });

      const allNutritionItems = Array.isArray(data?.data) ? data.data : [];
      const items = allNutritionItems.filter((item) => {
        const byId = String(item.dietitianId || '') === String(dietitianId);
        const byNoteId = String(getNoteValue(item.notes, 'DietitianId') || '') === String(dietitianId);
        const byName = getNoteValue(item.notes, 'Dietitian').trim().toLowerCase() === dietitianName;
        return byId || byNoteId || byName;
      });
      const mapped = items.map(mapAppointmentRow)
        .sort((a, b) => {
          if (a.rawStatus === 'pending' && b.rawStatus !== 'pending') return -1;
          if (a.rawStatus !== 'pending' && b.rawStatus === 'pending') return 1;
          if (a.rawStatus === 'pending' && b.rawStatus === 'pending') {
            const rankDiff = priorityRank[a.priority] - priorityRank[b.priority];
            if (rankDiff !== 0) return rankDiff;
            return new Date(a.createdAt) - new Date(b.createdAt);
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      setAppointments(mapped);

      const approvedMembersMap = new Map();
      mapped
        .filter((item) => (
          (item.rawStatus === 'approved' || item.rawStatus === 'completed')
          && isMealPlanningGoal(item.goal)
        ))
        .forEach((item) => {
          if (!approvedMembersMap.has(item.userId)) {
            approvedMembersMap.set(item.userId, {
              id: String(item.userId),
              name: item.member,
              joinedDate: item.date || new Date().toISOString().split('T')[0],
              age: 27,
              weight: 70,
              height: 170,
              goal: item.goal || 'Meal Planning',
            });
          }
        });

      setMembers(Array.from(approvedMembersMap.values()));
    } catch (error) {
      setAppointments(mockAppointments);
      setMembers(mockMembers);
      setSlotError(error?.response?.data?.message || 'Failed to load dietitian appointments.');
    }
  }, [dietitianId, dietitianName, mockAppointments, mockMembers, setSlotError]);

  useEffect(() => {
    let isMounted = true;
    const tick = async () => {
      if (!isMounted) return;
      await loadDietitianAppointments();
    };
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, [loadDietitianAppointments]);

  return { appointments, members, loadDietitianAppointments };
}

export const defaultDietPlanState = {
  dietPlanForm: createDietPlanForm(),
};
