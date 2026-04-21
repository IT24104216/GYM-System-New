import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { useAppTheme } from '@/shared/hooks/useAppTheme';
import { ROUTES, ROLES } from '@/shared/utils/constants';
import {
  getUserNotifications,
  getNotificationPreferences as getNotificationPreferencesApi,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  updateNotificationPreferences as updateNotificationPreferencesApi,
} from '@/shared/api/notifications.api';
import {
  deleteCoachProfile as deleteCoachProfileApi,
  getCoachProfile as getCoachProfileApi,
  upsertCoachProfile as upsertCoachProfileApi,
} from '@/features/coach/api/coach.api';
import {
  deleteDietitianProfile as deleteDietitianProfileApi,
  getDietitianProfile as getDietitianProfileApi,
  upsertDietitianProfile as upsertDietitianProfileApi,
} from '@/features/dietitian/api/dietitian.api';
import { getMySubscription } from '@/features/user/api/user.api';
import NotificationsDrawer from './NotificationsDrawer';

const DRAWER_WIDTH = 240;
const USER_PROFILE_STORAGE_KEY = 'user.profile.v1';
const MOBILE_NUMBER_PATTERN = /^\d{10}$/;

const defaultDietitianProfile = {
  qualifications: '',
  specialization: '',
  experienceYears: '0',
  licenseNumber: '',
  phone: '',
  joinDate: '',
};

const defaultUserProfile = {
  age: '',
  gender: '',
  phone: '',
  heightCm: '',
  weightKg: '',
  fitnessGoal: '',
  emergencyContact: '',
  joinedDate: '',
};

const defaultCoachProfile = {
  specialization: '',
  experienceYears: '',
  certifications: '',
  phone: '',
  preferredTrainingType: '',
  coachingStyle: '',
  joinedDate: '',
};

const roleToApiRole = {
  [ROLES.USER]: 'user',
  [ROLES.COACH]: 'coach',
  [ROLES.DIETITIAN]: 'dietitian',
  [ROLES.ADMIN]: 'admin',
};

const isExternalUrl = (value = '') => /^https?:\/\//i.test(String(value || '').trim());

const toRelativeTime = (input) => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diffMs = Math.max(Date.now() - date.getTime(), 0);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const hasProfileData = (profile) =>
  Boolean(
    profile?.qualifications
      || profile?.specialization
      || profile?.experienceYears
      || profile?.licenseNumber
      || profile?.phone
      || profile?.joinDate,
  );

const hasUserProfileData = (profile) =>
  Boolean(
    profile?.age
      || profile?.gender
      || profile?.phone
      || profile?.heightCm
      || profile?.weightKg
      || profile?.fitnessGoal
      || profile?.emergencyContact
      || profile?.joinedDate,
  );

const hasCoachProfileData = (profile) =>
  Boolean(
    profile?.specialization
      || profile?.experienceYears
      || profile?.certifications
      || profile?.phone
      || profile?.preferredTrainingType
      || profile?.coachingStyle
      || profile?.joinedDate,
  );

const getDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diff = parsed.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

function Topbar({ onMenuClick, showSidebarButton = false, onShowSidebar, sidebarHidden = false }) {
  const { user, logout, updateUser } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [deleteFeedbackOpen, setDeleteFeedbackOpen] = useState(false);
  const [userProfileDetailsOpen, setUserProfileDetailsOpen] = useState(false);
  const [userProfileFormOpen, setUserProfileFormOpen] = useState(false);
  const [userFeedbackOpen, setUserFeedbackOpen] = useState(false);
  const [userDeleteFeedbackOpen, setUserDeleteFeedbackOpen] = useState(false);
  const [coachProfileDetailsOpen, setCoachProfileDetailsOpen] = useState(false);
  const [coachProfileFormOpen, setCoachProfileFormOpen] = useState(false);
  const [coachFeedbackOpen, setCoachFeedbackOpen] = useState(false);
  const [coachDeleteFeedbackOpen, setCoachDeleteFeedbackOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [memberSubscription, setMemberSubscription] = useState(null);
  const [notificationPrefSaving, setNotificationPrefSaving] = useState(false);
  const [dietitianProfile, setDietitianProfile] = useState(defaultDietitianProfile);
  const [editDietitianProfile, setEditDietitianProfile] = useState(defaultDietitianProfile);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [editUserProfile, setEditUserProfile] = useState(defaultUserProfile);
  const [coachProfile, setCoachProfile] = useState(defaultCoachProfile);
  const [editCoachProfile, setEditCoachProfile] = useState(defaultCoachProfile);
  const [profileFormErrors, setProfileFormErrors] = useState({
    user: '',
    coach: '',
    dietitian: '',
  });
  const isUserRoute = location.pathname.startsWith('/user/');
  const isDietitian = user?.role === ROLES.DIETITIAN;
  const isMemberUser = user?.role === ROLES.USER;
  const isCoach = user?.role === ROLES.COACH;
  const userProfileStorageKey = `${USER_PROFILE_STORAGE_KEY}.${user?.id || 'guest'}`;
  const notificationRole = roleToApiRole[user?.role] || 'user';
  const notificationsEnabled = user?.notificationPreferences?.push !== false;
  const subscriptionDaysRemaining = getDaysRemaining(memberSubscription?.endDate);
  const subscriptionStatusText = (() => {
    const status = String(memberSubscription?.status || '').toLowerCase();
    if (status !== 'active' || subscriptionDaysRemaining <= 0) return 'Expired';
    return `Pro — ${subscriptionDaysRemaining} days`;
  })();
  const subscriptionChipColors = (() => {
    const status = String(memberSubscription?.status || '').toLowerCase();
    if (status !== 'active' || subscriptionDaysRemaining <= 0) {
      return { bg: '#ef444422', color: '#ef4444' };
    }
    if (subscriptionDaysRemaining <= 7) {
      return { bg: '#f59e0b22', color: '#f59e0b' };
    }
    return { bg: '#16a34a22', color: '#16a34a' };
  })();

  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      if (user?.role !== ROLES.USER) {
        if (isMounted) setMemberSubscription(null);
        return;
      }
      try {
        const { data } = await getMySubscription();
        if (!isMounted) return;
        setMemberSubscription(data?.data || null);
      } catch {
        if (isMounted) setMemberSubscription(null);
      }
    };

    loadSubscription();
    const intervalId = setInterval(loadSubscription, 60000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.role, user?.id]);

  useEffect(() => {
    let isMounted = true;
    const userId = String(user?.id || '');

    const loadNotifications = async () => {
      if (!userId || !notificationsEnabled) {
        if (isMounted) setNotifications([]);
        return;
      }
      try {
        const { data } = await getUserNotifications({
          userId,
          role: notificationRole,
          limit: 80,
        });
        if (!isMounted) return;
        const rows = Array.isArray(data?.data) ? data.data : [];
        setNotifications(rows.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          time: toRelativeTime(item.time || item.createdAt),
          read: Boolean(item.read),
          type: item.type || 'system',
          entityType: item.entityType || '',
          actionUrl: item.actionUrl || '',
        })));
      } catch {
        if (isMounted) setNotifications([]);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 15000);
    return () => {
      clearInterval(intervalId);
      isMounted = false;
    };
  }, [user?.id, notificationRole, notificationsEnabled]);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate(ROUTES.LOGIN, { replace: true, state: { from: null, postLogout: true } });
  };

  const openDietitianProfile = async () => {
    handleMenuClose();
    try {
      const { data } = await getDietitianProfileApi(String(user?.id || ''));
      const parsed = data?.data?.profile
        ? { ...defaultDietitianProfile, ...data.data.profile, experienceYears: String(data.data.profile.experienceYears ?? '') }
        : defaultDietitianProfile;
      setDietitianProfile(parsed);
    } catch {
      setDietitianProfile(defaultDietitianProfile);
    }
    setProfileDetailsOpen(true);
  };

  const openUserProfile = () => {
    handleMenuClose();
    try {
      const saved = localStorage.getItem(userProfileStorageKey);
      const parsed = saved ? { ...defaultUserProfile, ...JSON.parse(saved) } : defaultUserProfile;
      setUserProfile(parsed);
    } catch {
      setUserProfile(defaultUserProfile);
    }
    setUserProfileDetailsOpen(true);
  };

  const openCoachProfile = async () => {
    handleMenuClose();
    try {
      const { data } = await getCoachProfileApi(String(user?.id || ''));
      const parsed = data?.data?.profile
        ? { ...defaultCoachProfile, ...data.data.profile, experienceYears: String(data.data.profile.experienceYears ?? '') }
        : defaultCoachProfile;
      setCoachProfile(parsed);
    } catch {
      setCoachProfile(defaultCoachProfile);
    }
    setCoachProfileDetailsOpen(true);
  };

  const openProfileSettingsForm = () => {
    setProfileFormErrors((prev) => ({ ...prev, dietitian: '' }));
    setEditDietitianProfile(dietitianProfile);
    setProfileDetailsOpen(false);
    setProfileFormOpen(true);
  };

  const closeDietitianProfileDetails = () => {
    setProfileDetailsOpen(false);
  };

  const closeProfileSettingsForm = () => {
    setProfileFormErrors((prev) => ({ ...prev, dietitian: '' }));
    setProfileFormOpen(false);
  };

  const saveDietitianProfile = async () => {
    const trimmedQualifications = String(editDietitianProfile.qualifications || '').trim();
    const experienceValue = Number(editDietitianProfile.experienceYears || 0);
    const phoneValue = String(editDietitianProfile.phone || '').trim();

    if (!trimmedQualifications) {
      setProfileFormErrors((prev) => ({ ...prev, dietitian: 'Qualifications are required.' }));
      return;
    }
    if (!experienceValue || experienceValue <= 0) {
      setProfileFormErrors((prev) => ({ ...prev, dietitian: 'Experience is required.' }));
      return;
    }
    if (phoneValue && !MOBILE_NUMBER_PATTERN.test(phoneValue)) {
      setProfileFormErrors((prev) => ({ ...prev, dietitian: 'Mobile number must be exactly 10 digits.' }));
      return;
    }

    try {
      const payload = {
        ...editDietitianProfile,
        qualifications: trimmedQualifications,
        phone: phoneValue,
        experienceYears: experienceValue,
      };
      const { data } = await upsertDietitianProfileApi(String(user?.id || ''), payload);
      const savedProfile = data?.data?.profile
        ? { ...defaultDietitianProfile, ...data.data.profile, experienceYears: String(data.data.profile.experienceYears ?? '') }
        : editDietitianProfile;
      setDietitianProfile(savedProfile);
      setProfileFormErrors((prev) => ({ ...prev, dietitian: '' }));
      setProfileFormOpen(false);
      setProfileDetailsOpen(true);
      setFeedbackOpen(true);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || 'Failed to save profile.';
      setProfileFormErrors((prev) => ({ ...prev, dietitian: backendMessage }));
    }
  };

  const deleteDietitianProfile = async () => {
    try {
      await deleteDietitianProfileApi(String(user?.id || ''));
      setDietitianProfile(defaultDietitianProfile);
      setEditDietitianProfile(defaultDietitianProfile);
      setDeleteFeedbackOpen(true);
    } catch {
      // keep existing UI behavior
    }
  };

  const openUserProfileForm = () => {
    setProfileFormErrors((prev) => ({ ...prev, user: '' }));
    setEditUserProfile(userProfile);
    setUserProfileDetailsOpen(false);
    setUserProfileFormOpen(true);
  };

  const closeUserProfileDetails = () => {
    setUserProfileDetailsOpen(false);
  };

  const closeUserProfileForm = () => {
    setProfileFormErrors((prev) => ({ ...prev, user: '' }));
    setUserProfileFormOpen(false);
  };

  const saveUserProfile = () => {
    const phoneValue = String(editUserProfile.phone || '').trim();
    if (phoneValue && !MOBILE_NUMBER_PATTERN.test(phoneValue)) {
      setProfileFormErrors((prev) => ({ ...prev, user: 'Mobile number must be exactly 10 digits.' }));
      return;
    }

    setProfileFormErrors((prev) => ({ ...prev, user: '' }));
    setUserProfile(editUserProfile);
    localStorage.setItem(userProfileStorageKey, JSON.stringify(editUserProfile));
    setUserProfileFormOpen(false);
    setUserProfileDetailsOpen(true);
    setUserFeedbackOpen(true);
  };

  const deleteUserProfile = () => {
    setUserProfile(defaultUserProfile);
    setEditUserProfile(defaultUserProfile);
    localStorage.removeItem(userProfileStorageKey);
    setUserDeleteFeedbackOpen(true);
  };

  const openCoachProfileForm = () => {
    setProfileFormErrors((prev) => ({ ...prev, coach: '' }));
    setEditCoachProfile(coachProfile);
    setCoachProfileDetailsOpen(false);
    setCoachProfileFormOpen(true);
  };

  const closeCoachProfileDetails = () => {
    setCoachProfileDetailsOpen(false);
  };

  const closeCoachProfileForm = () => {
    setProfileFormErrors((prev) => ({ ...prev, coach: '' }));
    setCoachProfileFormOpen(false);
  };

  const saveCoachProfile = async () => {
    const trimmedCertifications = String(editCoachProfile.certifications || '').trim();
    const experienceValue = Number(editCoachProfile.experienceYears || 0);
    const phoneValue = String(editCoachProfile.phone || '').trim();

    if (!trimmedCertifications) {
      setProfileFormErrors((prev) => ({ ...prev, coach: 'Qualifications/Certifications are required.' }));
      return;
    }
    if (!experienceValue || experienceValue <= 0) {
      setProfileFormErrors((prev) => ({ ...prev, coach: 'Experience is required.' }));
      return;
    }
    if (phoneValue && !MOBILE_NUMBER_PATTERN.test(phoneValue)) {
      setProfileFormErrors((prev) => ({ ...prev, coach: 'Mobile number must be exactly 10 digits.' }));
      return;
    }

    try {
      const payload = {
        ...editCoachProfile,
        certifications: trimmedCertifications,
        phone: phoneValue,
        experienceYears: experienceValue,
      };
      const { data } = await upsertCoachProfileApi(String(user?.id || ''), payload);
      const savedProfile = data?.data?.profile
        ? { ...defaultCoachProfile, ...data.data.profile, experienceYears: String(data.data.profile.experienceYears ?? '') }
        : editCoachProfile;
      setCoachProfile(savedProfile);
      setProfileFormErrors((prev) => ({ ...prev, coach: '' }));
      setCoachProfileFormOpen(false);
      setCoachProfileDetailsOpen(true);
      setCoachFeedbackOpen(true);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || 'Failed to save profile.';
      setProfileFormErrors((prev) => ({ ...prev, coach: backendMessage }));
    }
  };

  const deleteCoachProfile = async () => {
    try {
      await deleteCoachProfileApi(String(user?.id || ''));
      setCoachProfile(defaultCoachProfile);
      setEditCoachProfile(defaultCoachProfile);
      setCoachDeleteFeedbackOpen(true);
    } catch {
      // keep existing UI behavior; fail silently like current dialogs
    }
  };

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const markAllNotificationsRead = async () => {
    const userId = String(user?.id || '');
    if (!userId) return;
    try {
      await markAllNotificationsAsRead({
        userId,
        role: notificationRole,
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // keep existing UI behavior
    }
  };

  const markNotificationRead = async (id) => {
    const userId = String(user?.id || '');
    if (!userId) return;
    try {
      await markNotificationAsRead(id, {
        userId,
        role: notificationRole,
      });
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      );
    } catch {
      // keep existing UI behavior
    }
  };

  const setNotificationsEnabled = async (enabled) => {
    const userId = String(user?.id || '');
    if (!userId || notificationPrefSaving) return;
    setNotificationPrefSaving(true);
    try {
      const { data } = await updateNotificationPreferencesApi({
        userId,
        role: notificationRole,
        push: enabled,
      });

      const nextPrefs = {
        email: data?.data?.email ?? user?.notificationPreferences?.email ?? true,
        push: data?.data?.push ?? enabled,
      };
      updateUser({
        ...user,
        notificationPreferences: nextPrefs,
      });
      if (!nextPrefs.push) {
        setNotifications([]);
      }
    } catch {
      // keep existing UI behavior
    } finally {
      setNotificationPrefSaving(false);
    }
  };

  useEffect(() => {
    const userId = String(user?.id || '');
    if (!userId) return;
    if (user?.notificationPreferences?.push !== undefined && user?.notificationPreferences?.email !== undefined) return;

    const syncPreferences = async () => {
      try {
        const { data } = await getNotificationPreferencesApi({
          userId,
          role: notificationRole,
        });
        const nextPrefs = {
          email: data?.data?.email ?? true,
          push: data?.data?.push ?? true,
        };
        updateUser({
          ...user,
          notificationPreferences: nextPrefs,
        });
      } catch {
        // keep existing UI behavior
      }
    };

    syncPreferences();
  }, [notificationRole, updateUser, user]);

  const handleNotificationClick = async (notif) => {
    if (!notif?.id) return;
    await markNotificationRead(notif.id);

    const canOpenPromotionLink = (
      notif.type === 'promotion'
      && notif.entityType === 'promotion-homepage'
      && notif.actionUrl
    );
    if (!canOpenPromotionLink) return;

    if (isExternalUrl(notif.actionUrl)) {
      window.open(notif.actionUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(notif.actionUrl);
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        width: { sm: isUserRoute || sidebarHidden ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { sm: isUserRoute || sidebarHidden ? 0 : `${DRAWER_WIDTH}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: isUserRoute ? 'none' : { sm: 'none' } }}
          aria-label="open sidebar"
        >
          <MenuIcon />
        </IconButton>

        {!isUserRoute && showSidebarButton && (
          <IconButton
            edge="start"
            onClick={onShowSidebar}
            sx={{ mr: 1.5, display: { xs: 'none', sm: 'inline-flex' } }}
            aria-label="reopen sidebar"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          noWrap
          component="button"
          onClick={() => navigate(ROUTES.USER_DASHBOARD)}
          sx={{
            flexGrow: 1,
            border: 0,
            p: 0,
            m: 0,
            background: 'transparent',
            textAlign: 'left',
            fontWeight: 700,
            color: 'text.primary',
            cursor: 'pointer',
          }}
        >
          GymPro
        </Typography>

        <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton onClick={toggleTheme} color="inherit">
            {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton onClick={() => setNotificationsOpen(true)} sx={{ ml: 0.3 }} color="inherit">
            <Badge
              badgeContent={unreadNotifications}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  minWidth: 16,
                  height: 16,
                },
              }}
            >
              <NotificationsRoundedIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Account">
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ ml: 1 }}>
            {isMemberUser && (
              <Chip
                label={subscriptionStatusText}
                size="small"
                onClick={() => navigate(ROUTES.USER_SUBSCRIPTION)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 700,
                  bgcolor: subscriptionChipColors.bg,
                  color: subscriptionChipColors.color,
                  border: `1px solid ${subscriptionChipColors.color}55`,
                }}
              />
            )}
            <IconButton onClick={handleAvatarClick}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Avatar>
            </IconButton>
          </Stack>
        </Tooltip>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem disabled>
            <Box>
              <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
          </MenuItem>
          {isDietitian && (
            <MenuItem onClick={openDietitianProfile}>Dietician Profile</MenuItem>
          )}
          {isMemberUser && (
            <MenuItem onClick={openUserProfile}>My Profile</MenuItem>
          )}
          {isCoach && (
            <MenuItem onClick={openCoachProfile}>My Profile</MenuItem>
          )}
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>

        <Dialog
          open={profileDetailsOpen}
          onClose={closeDietitianProfileDetails}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: '#1f2f4a',
              border: '1px solid',
              borderColor: '#334d73',
              color: '#e6f0ff',
            },
          }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, color: '#f8fafc' }}>
              Dietician Profile
            </Typography>
            <Typography sx={{ color: '#9fb3cf', fontSize: '1rem', mt: 0.4 }}>
              Profile details
            </Typography>
            <IconButton
              onClick={closeDietitianProfileDetails}
              sx={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#94a3b8',
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={1}>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Name:</strong> {user?.name || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Email:</strong> {user?.email || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Qualifications:</strong> {dietitianProfile.qualifications || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Specialization:</strong> {dietitianProfile.specialization || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Experience:</strong> {dietitianProfile.experienceYears || '0'} years
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>License Number:</strong> {dietitianProfile.licenseNumber || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Phone:</strong> {dietitianProfile.phone || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Join Date:</strong> {dietitianProfile.joinDate || '-'}
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.2 }}>
            {!hasProfileData(dietitianProfile) ? (
              <Button
                variant="contained"
                onClick={openProfileSettingsForm}
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
                Add
              </Button>
            ) : (
              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  onClick={openProfileSettingsForm}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 1.2,
                    py: 1,
                    fontSize: '1rem',
                    color: '#dbeafe',
                    borderColor: '#4f668f',
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={deleteDietitianProfile}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 1.2,
                    py: 1,
                    fontSize: '1rem',
                  }}
                >
                  Delete
                </Button>
              </Stack>
            )}
          </DialogActions>
        </Dialog>

        <Dialog
          open={profileFormOpen}
          onClose={closeProfileSettingsForm}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: '#1f2f4a',
              border: '1px solid',
              borderColor: '#334d73',
              color: '#e6f0ff',
            },
          }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#f8fafc' }}>
              Dietician Profile
            </Typography>
            <Typography sx={{ color: '#9fb3cf', fontSize: { xs: '1rem', md: '1.15rem' }, mt: 0.4 }}>
              Update your professional information
            </Typography>
            <IconButton
              onClick={closeProfileSettingsForm}
              sx={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#94a3b8',
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.2,
                pt: 0.6,
                '& .MuiInputLabel-shrink': {
                  color: '#d9e8ff',
                  backgroundColor: '#1f2f4a',
                  px: 0.45,
                  borderRadius: 0.4,
                  transform: 'translate(14px, -7px) scale(0.75)',
                },
              }}
            >
              <TextField
                label="Qualifications"
                placeholder="e.g., MSc in Nutrition"
                value={editDietitianProfile.qualifications}
                onChange={(e) =>
                  setEditDietitianProfile((prev) => ({ ...prev, qualifications: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Specialization"
                placeholder="e.g., Sports Nutrition"
                value={editDietitianProfile.specialization}
                onChange={(e) =>
                  setEditDietitianProfile((prev) => ({ ...prev, specialization: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Experience (Years)"
                type="number"
                value={editDietitianProfile.experienceYears}
                onChange={(e) =>
                  setEditDietitianProfile((prev) => ({ ...prev, experienceYears: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="License Number"
                placeholder="LIC12345"
                value={editDietitianProfile.licenseNumber}
                onChange={(e) =>
                  setEditDietitianProfile((prev) => ({ ...prev, licenseNumber: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Phone"
                placeholder="07XXXXXXXX"
                value={editDietitianProfile.phone}
                onChange={(e) =>
                  setEditDietitianProfile((prev) => ({
                    ...prev,
                    phone: String(e.target.value || '').replace(/\D/g, '').slice(0, 10),
                  }))
                }
                fullWidth
                size="small"
                error={Boolean(editDietitianProfile.phone) && !MOBILE_NUMBER_PATTERN.test(editDietitianProfile.phone)}
                helperText={
                  editDietitianProfile.phone && !MOBILE_NUMBER_PATTERN.test(editDietitianProfile.phone)
                    ? 'Enter exactly 10 digits.'
                    : ' '
                }
                inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '\\d{10}' }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Join Date"
                type="date"
                value={editDietitianProfile.joinDate}
                onChange={(e) =>
                  setEditDietitianProfile((prev) => ({ ...prev, joinDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1) brightness(1.6)',
                    opacity: 1,
                    cursor: 'pointer',
                  },
                }}
              />
            </Box>
            {profileFormErrors.dietitian && (
              <Alert severity="error" sx={{ mt: 1.2 }}>
                {profileFormErrors.dietitian}
              </Alert>
            )}

            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1.5,
                background: '#3b4f70',
                border: '1px solid',
                borderColor: '#4f668f',
              }}
            >
              <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.05rem', mb: 1 }}>
                Working Days
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip label="Saturday" sx={{ bgcolor: '#2563eb', color: '#eaf2ff', fontWeight: 700 }} />
                <Chip label="Sunday" sx={{ bgcolor: '#2563eb', color: '#eaf2ff', fontWeight: 700 }} />
              </Stack>
              <Typography sx={{ color: '#afc2de', fontSize: '0.95rem', mt: 1.1 }}>
                You can only create consultation slots on Saturday and Sunday
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.2 }}>
            <Button
              variant="contained"
              onClick={saveDietitianProfile}
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
              Save Profile
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={feedbackOpen}
          autoHideDuration={2500}
          onClose={() => setFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setFeedbackOpen(false)}
            sx={{ width: '100%' }}
          >
            Profile saved successfully.
          </Alert>
        </Snackbar>

        <Snackbar
          open={deleteFeedbackOpen}
          autoHideDuration={2500}
          onClose={() => setDeleteFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setDeleteFeedbackOpen(false)}
            sx={{ width: '100%' }}
          >
            Profile deleted successfully.
          </Alert>
        </Snackbar>

        <Dialog
          open={userProfileDetailsOpen}
          onClose={closeUserProfileDetails}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: '#1f2f4a',
              border: '1px solid',
              borderColor: '#334d73',
              color: '#e6f0ff',
            },
          }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, color: '#f8fafc' }}>
              My Profile
            </Typography>
            <Typography sx={{ color: '#9fb3cf', fontSize: '1rem', mt: 0.4 }}>
              Personal details
            </Typography>
            <IconButton
              onClick={closeUserProfileDetails}
              sx={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#94a3b8',
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={1}>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Name:</strong> {user?.name || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Email:</strong> {user?.email || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Branch:</strong> {user?.branch || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Age:</strong> {userProfile.age || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Gender:</strong> {userProfile.gender || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Phone:</strong> {userProfile.phone || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Height:</strong> {userProfile.heightCm ? `${userProfile.heightCm} cm` : '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Weight:</strong> {userProfile.weightKg ? `${userProfile.weightKg} kg` : '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Fitness Goal:</strong> {userProfile.fitnessGoal || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Emergency Contact:</strong> {userProfile.emergencyContact || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Joined Date:</strong> {userProfile.joinedDate || '-'}
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.2 }}>
            <Stack spacing={1} sx={{ width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.4,
                  py: 1,
                  borderRadius: 1.4,
                  border: '1px solid',
                  borderColor: '#4f668f',
                  backgroundColor: '#2a3d5e',
                }}
              >
                <Box>
                  <Typography sx={{ color: '#e6f0ff', fontSize: '0.92rem', fontWeight: 800 }}>
                    Notifications
                  </Typography>
                  <Typography sx={{ color: '#9fb3cf', fontSize: '0.78rem' }}>
                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>

                <Switch
                  checked={notificationsEnabled}
                  onChange={(event) => setNotificationsEnabled(event.target.checked)}
                  disabled={notificationPrefSaving}
                  inputProps={{ 'aria-label': 'toggle notifications' }}
                  sx={{
                    width: 46,
                    height: 26,
                    p: 0,
                    '& .MuiSwitch-switchBase': {
                      p: 0.5,
                      transitionDuration: '200ms',
                      '&.Mui-checked': {
                        transform: 'translateX(20px)',
                        color: '#fff',
                        '& + .MuiSwitch-track': {
                          backgroundColor: '#22c55e',
                          opacity: 1,
                          border: 0,
                        },
                      },
                    },
                    '& .MuiSwitch-thumb': {
                      width: 22,
                      height: 22,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    },
                    '& .MuiSwitch-track': {
                      borderRadius: 26 / 2,
                      backgroundColor: '#64748b',
                      opacity: 1,
                    },
                  }}
                />
              </Box>

              {!hasUserProfileData(userProfile) ? (
                <Button
                  variant="contained"
                  onClick={openUserProfileForm}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 1.2,
                    py: 1,
                    fontSize: '1rem',
                    backgroundColor: '#2563eb',
                    '&:hover': { backgroundColor: '#1d4ed8' },
                  }}
                >
                  Add
                </Button>
              ) : (
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <Button
                    variant="outlined"
                    onClick={openUserProfileForm}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: 1.2,
                      py: 1,
                      fontSize: '1rem',
                      color: '#dbeafe',
                      borderColor: '#4f668f',
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={deleteUserProfile}
                    fullWidth
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: 1.2,
                      py: 1,
                      fontSize: '1rem',
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              )}
            </Stack>
          </DialogActions>
        </Dialog>

        <Dialog
          open={userProfileFormOpen}
          onClose={closeUserProfileForm}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: '#1f2f4a',
              border: '1px solid',
              borderColor: '#334d73',
              color: '#e6f0ff',
            },
          }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#f8fafc' }}>
              My Profile
            </Typography>
            <Typography sx={{ color: '#9fb3cf', fontSize: { xs: '1rem', md: '1.15rem' }, mt: 0.4 }}>
              Update your personal information
            </Typography>
            <IconButton
              onClick={closeUserProfileForm}
              sx={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#94a3b8',
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.2,
                pt: 0.6,
                '& .MuiInputLabel-shrink': {
                  color: '#d9e8ff',
                  backgroundColor: '#1f2f4a',
                  px: 0.45,
                  borderRadius: 0.4,
                  transform: 'translate(14px, -7px) scale(0.75)',
                },
              }}
            >
              <TextField
                label="Age"
                type="number"
                value={editUserProfile.age}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, age: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Gender"
                placeholder="e.g., Male"
                value={editUserProfile.gender}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, gender: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Phone"
                placeholder="07XXXXXXXX"
                value={editUserProfile.phone}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({
                    ...prev,
                    phone: String(e.target.value || '').replace(/\D/g, '').slice(0, 10),
                  }))
                }
                fullWidth
                size="small"
                error={Boolean(editUserProfile.phone) && !MOBILE_NUMBER_PATTERN.test(editUserProfile.phone)}
                helperText={
                  editUserProfile.phone && !MOBILE_NUMBER_PATTERN.test(editUserProfile.phone)
                    ? 'Enter exactly 10 digits.'
                    : ' '
                }
                inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '\\d{10}' }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Emergency Contact"
                placeholder="+1234567890"
                value={editUserProfile.emergencyContact}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, emergencyContact: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Height (cm)"
                type="number"
                value={editUserProfile.heightCm}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, heightCm: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Weight (kg)"
                type="number"
                value={editUserProfile.weightKg}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, weightKg: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Joined Date"
                type="date"
                value={editUserProfile.joinedDate}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, joinedDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1) brightness(1.6)',
                    opacity: 1,
                    cursor: 'pointer',
                  },
                }}
              />
              <TextField
                label="Fitness Goal"
                placeholder="e.g., Build lean muscle"
                value={editUserProfile.fitnessGoal}
                onChange={(e) =>
                  setEditUserProfile((prev) => ({ ...prev, fitnessGoal: e.target.value }))
                }
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
            </Box>
            {profileFormErrors.user && (
              <Alert severity="error" sx={{ mt: 1.2 }}>
                {profileFormErrors.user}
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.2 }}>
            <Button
              variant="contained"
              onClick={saveUserProfile}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: 1.2,
                py: 1,
                fontSize: '1rem',
                backgroundColor: '#2563eb',
                '&:hover': { backgroundColor: '#1d4ed8' },
              }}
            >
              Save Profile
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={userFeedbackOpen}
          autoHideDuration={2500}
          onClose={() => setUserFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setUserFeedbackOpen(false)}
            sx={{ width: '100%' }}
          >
            User profile saved successfully.
          </Alert>
        </Snackbar>

        <Snackbar
          open={userDeleteFeedbackOpen}
          autoHideDuration={2500}
          onClose={() => setUserDeleteFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setUserDeleteFeedbackOpen(false)}
            sx={{ width: '100%' }}
          >
            User profile deleted successfully.
          </Alert>
        </Snackbar>

        <Dialog
          open={coachProfileDetailsOpen}
          onClose={closeCoachProfileDetails}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: '#1f2f4a',
              border: '1px solid',
              borderColor: '#334d73',
              color: '#e6f0ff',
            },
          }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.8rem' }, color: '#f8fafc' }}>
              Coach Profile
            </Typography>
            <Typography sx={{ color: '#9fb3cf', fontSize: '1rem', mt: 0.4 }}>
              Professional details
            </Typography>
            <IconButton
              onClick={closeCoachProfileDetails}
              sx={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#cbd5e1',
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={1}>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Name:</strong> {user?.name || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Email:</strong> {user?.email || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Specialization:</strong> {coachProfile.specialization || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Experience:</strong> {coachProfile.experienceYears ? `${coachProfile.experienceYears} years` : '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Certifications:</strong> {coachProfile.certifications || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Phone:</strong> {coachProfile.phone || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Preferred Training:</strong> {coachProfile.preferredTrainingType || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Coaching Style:</strong> {coachProfile.coachingStyle || '-'}
              </Typography>
              <Typography sx={{ color: '#d7e6fb', fontSize: '0.95rem' }}>
                <strong>Joined Date:</strong> {coachProfile.joinedDate || '-'}
              </Typography>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.2 }}>
            {!hasCoachProfileData(coachProfile) ? (
              <Button
                variant="contained"
                onClick={openCoachProfileForm}
                fullWidth
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 1.2,
                  py: 1,
                  fontSize: '1rem',
                  backgroundColor: '#0ea5a2',
                  '&:hover': { backgroundColor: '#0f8d8b' },
                }}
              >
                Add
              </Button>
            ) : (
              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  onClick={openCoachProfileForm}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 1.2,
                    py: 1,
                    fontSize: '1rem',
                    color: '#dbeafe',
                    borderColor: '#4f668f',
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={deleteCoachProfile}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 800,
                    borderRadius: 1.2,
                    py: 1,
                    fontSize: '1rem',
                  }}
                >
                  Delete
                </Button>
              </Stack>
            )}
          </DialogActions>
        </Dialog>

        <Dialog
          open={coachProfileFormOpen}
          onClose={closeCoachProfileForm}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 2,
              background: '#1f2f4a',
              border: '1px solid',
              borderColor: '#334d73',
              color: '#e6f0ff',
            },
          }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#f8fafc' }}>
              Coach Profile
            </Typography>
            <Typography sx={{ color: '#9fb3cf', fontSize: { xs: '1rem', md: '1.15rem' }, mt: 0.4 }}>
              Update your coaching profile
            </Typography>
            <IconButton
              onClick={closeCoachProfileForm}
              sx={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#cbd5e1',
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.2,
                pt: 0.6,
                '& .MuiInputLabel-shrink': {
                  color: '#d9e8ff',
                  backgroundColor: '#1f2f4a',
                  px: 0.45,
                  borderRadius: 0.4,
                  transform: 'translate(14px, -7px) scale(0.75)',
                },
              }}
            >
              <TextField
                label="Specialization"
                placeholder="e.g., Strength & Conditioning"
                value={editCoachProfile.specialization}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({ ...prev, specialization: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Experience (Years)"
                type="number"
                value={editCoachProfile.experienceYears}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({ ...prev, experienceYears: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Phone"
                placeholder="07XXXXXXXX"
                value={editCoachProfile.phone}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({
                    ...prev,
                    phone: String(e.target.value || '').replace(/\D/g, '').slice(0, 10),
                  }))
                }
                fullWidth
                size="small"
                error={Boolean(editCoachProfile.phone) && !MOBILE_NUMBER_PATTERN.test(editCoachProfile.phone)}
                helperText={
                  editCoachProfile.phone && !MOBILE_NUMBER_PATTERN.test(editCoachProfile.phone)
                    ? 'Enter exactly 10 digits.'
                    : ' '
                }
                inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '\\d{10}' }}
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Preferred Training Type"
                placeholder="e.g., Weight Loss / Hypertrophy"
                value={editCoachProfile.preferredTrainingType}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({ ...prev, preferredTrainingType: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Joined Date"
                type="date"
                value={editCoachProfile.joinedDate}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({ ...prev, joinedDate: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1) brightness(1.7)',
                    opacity: 1,
                    cursor: 'pointer',
                  },
                }}
              />
              <TextField
                label="Certifications"
                placeholder="e.g., ACE CPT, NASM"
                value={editCoachProfile.certifications}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({ ...prev, certifications: e.target.value }))
                }
                fullWidth
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
              <TextField
                label="Coaching Style"
                placeholder="How you coach your clients..."
                value={editCoachProfile.coachingStyle}
                onChange={(e) =>
                  setEditCoachProfile((prev) => ({ ...prev, coachingStyle: e.target.value }))
                }
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={{
                  '& .MuiInputLabel-root': { color: '#c6d6ef', fontWeight: 700 },
                  '& .MuiOutlinedInput-root': { color: '#edf5ff', background: '#3b4f70', borderRadius: 1.2 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#6f86aa' },
                }}
              />
            </Box>
            {profileFormErrors.coach && (
              <Alert severity="error" sx={{ mt: 1.2 }}>
                {profileFormErrors.coach}
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.2 }}>
            <Button
              variant="contained"
              onClick={saveCoachProfile}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: 1.2,
                py: 1,
                fontSize: '1rem',
                backgroundColor: '#0ea5a2',
                '&:hover': { backgroundColor: '#0f8d8b' },
              }}
            >
              Save Profile
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={coachFeedbackOpen}
          autoHideDuration={2500}
          onClose={() => setCoachFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setCoachFeedbackOpen(false)}
            sx={{ width: '100%' }}
          >
            Coach profile saved successfully.
          </Alert>
        </Snackbar>

        <Snackbar
          open={coachDeleteFeedbackOpen}
          autoHideDuration={2500}
          onClose={() => setCoachDeleteFeedbackOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setCoachDeleteFeedbackOpen(false)}
            sx={{ width: '100%' }}
          >
            Coach profile deleted successfully.
          </Alert>
        </Snackbar>

        <NotificationsDrawer
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={markAllNotificationsRead}
          onMarkRead={markNotificationRead}
          onNotificationClick={handleNotificationClick}
        />
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;



