import { useEffect, useState } from 'react';
import {
  getUserDietitianMealPlan,
  getUserFoodLogs,
  searchNutritionFoods,
} from '../api/user.api';

export function useDietitianPlan(userId) {
  const [dietitianPlan, setDietitianPlan] = useState(null);
  const [planError, setPlanError] = useState('');
  const [isPlanLoading, setIsPlanLoading] = useState(false);

  useEffect(() => {
    const loadDietitianPlan = async () => {
      if (!userId) return;
      try {
        setIsPlanLoading(true);
        setPlanError('');
        const { data } = await getUserDietitianMealPlan(userId);
        setDietitianPlan(data?.data || null);
      } catch (error) {
        setDietitianPlan(null);
        setPlanError(error?.response?.data?.message || 'Failed to load dietitian plan');
      } finally {
        setIsPlanLoading(false);
      }
    };

    loadDietitianPlan();
  }, [userId]);

  return { dietitianPlan, setDietitianPlan, planError, setPlanError, isPlanLoading };
}

export function useUserFoodLogs(userId, todayIso, planMode) {
  const [foodLogs, setFoodLogs] = useState([]);
  const [allFoodLogs, setAllFoodLogs] = useState([]);

  useEffect(() => {
    const loadFoodLogs = async () => {
      if (!userId) return;
      try {
        const { data } = await getUserFoodLogs(userId, todayIso);
        setFoodLogs(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setFoodLogs([]);
      }
    };

    loadFoodLogs();
  }, [todayIso, userId]);

  useEffect(() => {
    const loadAllFoodLogs = async () => {
      if (!userId || planMode !== 'custom') return;
      try {
        const { data } = await getUserFoodLogs(userId);
        setAllFoodLogs(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setAllFoodLogs([]);
      }
    };

    loadAllFoodLogs();
  }, [planMode, userId]);

  const refreshFoodLogs = async () => {
    if (!userId) return;
    const { data } = await getUserFoodLogs(userId, todayIso);
    setFoodLogs(Array.isArray(data?.data) ? data.data : []);
  };

  const refreshAllFoodLogs = async () => {
    if (!userId) return;
    const { data } = await getUserFoodLogs(userId);
    setAllFoodLogs(Array.isArray(data?.data) ? data.data : []);
  };

  return {
    foodLogs,
    allFoodLogs,
    setFoodLogs,
    setAllFoodLogs,
    refreshFoodLogs,
    refreshAllFoodLogs,
  };
}

export function useNutritionSuggestions(isLogDialogOpen, name) {
  const [nutritionOptions, setNutritionOptions] = useState([]);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);

  useEffect(() => {
    if (!isLogDialogOpen) return;
    const query = String(name || '').trim();
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
  }, [isLogDialogOpen, name]);

  return {
    nutritionOptions,
    setNutritionOptions,
    isNutritionLoading,
  };
}
