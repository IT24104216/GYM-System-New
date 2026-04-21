import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignIcon from '@mui/icons-material/Campaign';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SportsIcon from '@mui/icons-material/Sports';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { ROLES, ROUTES } from '@/shared/utils/constants';

export const NAV_CONFIG = {
  [ROLES.USER]: [
    { label: 'Dashboard', path: ROUTES.USER_DASHBOARD, icon: DashboardIcon },
    { label: 'Ads & Promotions', path: ROUTES.USER_ADS_PROMOTIONS, icon: CampaignIcon },
    { label: 'Workouts', path: ROUTES.USER_WORKOUTS, icon: FitnessCenterIcon },
    { label: 'Lockers', path: ROUTES.USER_LOCKERS, icon: LockRoundedIcon },
    { label: 'FAQs', path: ROUTES.USER_FAQS, icon: QuizRoundedIcon },
    { label: 'Subscription', path: ROUTES.USER_SUBSCRIPTION, icon: WorkspacePremiumRoundedIcon },
    { label: 'Profile', path: ROUTES.USER_PROFILE, icon: PersonIcon },
  ],
  [ROLES.ADMIN]: [
    { label: 'Overview', path: ROUTES.ADMIN_DASHBOARD, icon: DashboardIcon },
    { label: 'Users', path: ROUTES.ADMIN_USERS, icon: GroupIcon },
    { label: 'Reports', path: ROUTES.ADMIN_REPORTS, icon: AssessmentIcon },
    { label: 'Promotions', path: ROUTES.ADMIN_PROMOTIONS, icon: CampaignIcon },
    { label: 'Lockers', path: ROUTES.ADMIN_LOCKERS, icon: LockRoundedIcon },
    { label: 'FAQs', path: ROUTES.ADMIN_FAQS, icon: QuizRoundedIcon },
    { label: 'Settings', path: ROUTES.ADMIN_SETTINGS, icon: SettingsIcon },
  ],
  [ROLES.DIETITIAN]: [
    { label: 'Dashboard', path: ROUTES.DIETITIAN_DASHBOARD, icon: DashboardIcon },
    { label: 'Clients', path: ROUTES.DIETITIAN_CLIENTS, icon: GroupIcon },
    { label: 'Meal Plans', path: ROUTES.DIETITIAN_MEAL_PLANS, icon: RestaurantMenuIcon },
  ],
  [ROLES.COACH]: [
    { label: 'Dashboard', path: ROUTES.COACH_DASHBOARD, icon: DashboardIcon },
    { label: 'Clients', path: ROUTES.COACH_CLIENTS, icon: GroupIcon },
    { label: 'Scheduling', path: ROUTES.COACH_SCHEDULING, icon: ScheduleIcon },
    { label: 'Workout Plans', path: ROUTES.COACH_WORKOUT_PLANS, icon: SportsIcon },
  ],
};
