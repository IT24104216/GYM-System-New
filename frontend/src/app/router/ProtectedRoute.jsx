import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/utils/constants';
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner';
import { getMySubscription } from '@/features/user/api/user.api';

/**
 * Wraps a group of routes with authentication + optional role-based access control.
 *
 * @param {{ allowedRoles?: string[] }} props
 */
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [isSubscriptionChecking, setIsSubscriptionChecking] = useState(false);
  const [subscriptionAllowed, setSubscriptionAllowed] = useState(true);

  const isMemberScope = Array.isArray(allowedRoles) && allowedRoles.includes('user') && user?.role === 'user';
  const isSubscriptionRoute = location.pathname === ROUTES.USER_SUBSCRIPTION;

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!isAuthenticated || !isMemberScope || isSubscriptionRoute) {
        if (isMounted) {
          setSubscriptionAllowed(true);
          setIsSubscriptionChecking(false);
        }
        return;
      }

      setIsSubscriptionChecking(true);
      try {
        const { data } = await getMySubscription();
        const sub = data?.data;
        const status = String(sub?.status || '').toLowerCase();
        const end = sub?.endDate ? new Date(sub.endDate) : null;
        const isExpiredByDate = !end || Number.isNaN(end.getTime()) || end.getTime() <= Date.now();
        const hasActivePlan = status === 'active' && !isExpiredByDate;

        if (isMounted) setSubscriptionAllowed(hasActivePlan);
      } catch {
        if (isMounted) setSubscriptionAllowed(false);
      } finally {
        if (isMounted) setIsSubscriptionChecking(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isMemberScope, isSubscriptionRoute, location.pathname]);

  // While rehydrating from localStorage, show a spinner to avoid a flash redirect
  if (isLoading) return <LoadingSpinner />;

  // Not authenticated → redirect to login, storing the attempted path
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  // Authenticated but wrong role → redirect to 403 page
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  if (isSubscriptionChecking) return <LoadingSpinner />;

  if (isMemberScope && !isSubscriptionRoute && !subscriptionAllowed) {
    return <Navigate to={ROUTES.USER_SUBSCRIPTION} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
