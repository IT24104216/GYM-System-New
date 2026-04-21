import { Routes, Route, Navigate } from 'react-router-dom';
import { ROLES, ROUTES } from '@/shared/utils/constants';

// Layout
import AppShell from '@/shared/components/layout/AppShell';
import ProtectedRoute from './ProtectedRoute';

// Public pages
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import NotFoundPage from '@/pages/errors/NotFoundPage';
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage';

// User pages
import UserDashboard from '@/features/user/pages/UserDashboard';
import UserCoaches from '@/features/user/pages/UserCoaches';
import UserDietitians from '@/features/user/pages/UserDietitians';
import UserCoachFeedbacks from '@/features/user/pages/UserCoachFeedbacks';
import UserDietitianFeedbacks from '@/features/user/pages/UserDietitianFeedbacks';
import UserWorkouts from '@/features/user/pages/UserWorkouts';
import UserMealPlan from '@/features/user/pages/UserMealPlan';
import UserProgress from '@/features/user/pages/UserProgress';
import UserAdsPromotions from '@/features/user/pages/UserAdsPromotions';
import UserLockers from '@/features/user/pages/UserLockers';
import UserFaqs from '@/features/user/pages/UserFaqs';
import UserProfile from '@/features/user/pages/UserProfile';
import SubscriptionPage from '@/features/user/pages/SubscriptionPage';

// Admin pages
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import AdminUsers from '@/features/admin/pages/AdminUsers';
import AdminReports from '@/features/admin/pages/AdminReports';
import AdminPromotions from '@/features/admin/pages/AdminPromotions';
import AdminLockers from '@/features/admin/pages/AdminLockers';
import AdminFaqs from '@/features/admin/pages/AdminFaqs';
import AdminSettings from '@/features/admin/pages/AdminSettings';

// Dietitian pages
import DietitianDashboard from '@/features/dietitian/pages/DietitianDashboard';
import DietitianClients from '@/features/dietitian/pages/DietitianClients';
import DietitianMealPlans from '@/features/dietitian/pages/DietitianMealPlans';

// Coach pages
import CoachDashboard from '@/features/coach/pages/CoachDashboard';
import CoachClients from '@/features/coach/pages/CoachClients';
import CoachScheduling from '@/features/coach/pages/CoachScheduling';
import CoachWorkoutPlans from '@/features/coach/pages/CoachWorkoutPlans';

function AppRouter() {
  return (
    <Routes>
      {/* ── Root redirect ─────────────────────────────────────── */}
      <Route index element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* ── Public routes (no layout, no auth) ───────────────── */}
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* ── Protected routes (shared AppShell layout) ─────────── */}
      <Route element={<AppShell />}>
        {/* User */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.USER]} />}>
          <Route path={ROUTES.USER_DASHBOARD} element={<UserDashboard />} />
          <Route path={ROUTES.USER_COACHES} element={<UserCoaches />} />
          <Route path={ROUTES.USER_DIETITIANS} element={<UserDietitians />} />
          <Route path={ROUTES.USER_COACH_FEEDBACKS} element={<UserCoachFeedbacks />} />
          <Route path={ROUTES.USER_DIETITIAN_FEEDBACKS} element={<UserDietitianFeedbacks />} />
          <Route path={ROUTES.USER_WORKOUTS} element={<UserWorkouts />} />
          <Route path={ROUTES.USER_MEAL_PLAN} element={<UserMealPlan />} />
          <Route path={ROUTES.USER_PROGRESS} element={<UserProgress />} />
          <Route path={ROUTES.USER_ADS_PROMOTIONS} element={<UserAdsPromotions />} />
          <Route path={ROUTES.USER_LOCKERS} element={<UserLockers />} />
          <Route path={ROUTES.USER_FAQS} element={<UserFaqs />} />
          <Route path={ROUTES.USER_PROFILE} element={<UserProfile />} />
          <Route path={ROUTES.USER_SUBSCRIPTION} element={<SubscriptionPage />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
          <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReports />} />
          <Route path={ROUTES.ADMIN_PROMOTIONS} element={<AdminPromotions />} />
          <Route path={ROUTES.ADMIN_LOCKERS} element={<AdminLockers />} />
          <Route path={ROUTES.ADMIN_FAQS} element={<AdminFaqs />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />
        </Route>

        {/* Dietitian */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.DIETITIAN]} />}>
          <Route path={ROUTES.DIETITIAN_DASHBOARD} element={<DietitianDashboard />} />
          <Route path={ROUTES.DIETITIAN_CLIENTS} element={<DietitianClients />} />
          <Route path={ROUTES.DIETITIAN_MEAL_PLANS} element={<DietitianMealPlans />} />
        </Route>

        {/* Coach */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.COACH]} />}>
          <Route path={ROUTES.COACH_DASHBOARD} element={<CoachDashboard />} />
          <Route path={ROUTES.COACH_CLIENTS} element={<CoachClients />} />
          <Route path={ROUTES.COACH_SCHEDULING} element={<CoachScheduling />} />
          <Route path={ROUTES.COACH_WORKOUT_PLANS} element={<CoachWorkoutPlans />} />
        </Route>
      </Route>

      {/* ── Catch-all 404 ─────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
