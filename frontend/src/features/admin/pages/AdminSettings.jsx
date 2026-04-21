import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
  Snackbar,
} from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import { useAuth } from '@/features/auth/model/AuthContext';
import {
  changeAdminPassword as changeAdminPasswordApi,
  getAdminSettings as getAdminSettingsApi,
  updateAdminSettings as updateAdminSettingsApi,
} from '@/features/admin/api/admin.api';

const MotionBox = motion.create(Box);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

function AdminSettings() {
  const { user } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    fullName: '',
    email: '',
    emailNotifications: true,
    pushNotifications: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardBg = isDark ? alpha(theme.palette.background.paper, 0.9) : '#ffffff';
  const cardBorder = isDark ? alpha(theme.palette.common.white, 0.14) : '#e6e9ee';
  const labelColor = isDark ? alpha(theme.palette.common.white, 0.72) : '#64748b';
  const inputBg = isDark ? alpha(theme.palette.common.white, 0.06) : '#f8fafc';
  const inputBorder = isDark ? alpha(theme.palette.common.white, 0.18) : '#e2e8f0';
  const inputBorderHover = isDark ? alpha(theme.palette.common.white, 0.34) : '#cbd5e1';
  const sectionTitleColor = isDark ? theme.palette.common.white : '#111827';
  const headingColor = isDark ? theme.palette.common.white : '#0f172a';

  const adminId = user?.id || '';

  const isSubmitDisabled = useMemo(() => {
    return (
      !passwordForm.currentPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmPassword.trim()
    );
  }, [passwordForm]);

  useEffect(() => {
    if (!adminId) return;

    let isMounted = true;

    const loadSettings = async () => {
      try {
        const { data } = await getAdminSettingsApi(adminId);
        const nextData = data?.data || {};
        if (!isMounted) return;
        setSettingsForm({
          fullName: nextData.fullName || '',
          email: nextData.email || '',
          emailNotifications: Boolean(nextData.emailNotifications),
          pushNotifications: Boolean(nextData.pushNotifications),
        });
      } catch (error) {
        if (!isMounted) return;
        setToast({
          open: true,
          severity: 'error',
          message: error?.response?.data?.message || 'Failed to load admin settings.',
        });
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [adminId]);

  const handleOpenPasswordDialog = () => {
    setPasswordError('');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
  };

  const handlePasswordFieldChange = (field) => (event) => {
    setPasswordError('');
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleProfileFieldChange = (field) => (event) => {
    const value = event.target.value;
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (field) => (_event, checked) => {
    setSettingsForm((prev) => ({ ...prev, [field]: checked }));
  };

  const handleSaveSettings = async () => {
    if (!adminId) {
      setToast({
        open: true,
        severity: 'error',
        message: 'Admin account is not available.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        adminId,
        fullName: settingsForm.fullName.trim(),
        email: settingsForm.email.trim(),
        emailNotifications: settingsForm.emailNotifications,
        pushNotifications: settingsForm.pushNotifications,
      };
      const { data } = await updateAdminSettingsApi(payload);
      const nextData = data?.data || payload;
      setSettingsForm({
        fullName: nextData.fullName || payload.fullName,
        email: nextData.email || payload.email,
        emailNotifications: Boolean(nextData.emailNotifications),
        pushNotifications: Boolean(nextData.pushNotifications),
      });
      setToast({
        open: true,
        severity: 'success',
        message: data?.message || 'Settings saved successfully.',
      });
    } catch (error) {
      setToast({
        open: true,
        severity: 'error',
        message: error?.response?.data?.message || 'Failed to save settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPasswordChange = async () => {
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (!adminId) {
      setPasswordError('Admin account is not available.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { data } = await changeAdminPasswordApi({
        adminId,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setIsPasswordDialogOpen(false);
      setToast({
        open: true,
        severity: 'success',
        message: data?.message || 'Password updated successfully.',
      });
    } catch (error) {
      const responseMessage = error?.response?.data?.message;
      const detailMessage = error?.response?.data?.details?.fieldErrors
        ? Object.values(error.response.data.details.fieldErrors).flat().join(' ')
        : '';
      setPasswordError(responseMessage || detailMessage || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCloseToast = (_event, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        maxWidth: 920,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        pb: 2,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: headingColor,
        }}
      >
        Settings
      </Typography>

      <MotionBox variants={itemVariants}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: `1px solid ${cardBorder}`,
            backgroundColor: cardBg,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
            <PersonOutlineRoundedIcon sx={{ color: '#17a398', fontSize: 20 }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: sectionTitleColor }}>
              Profile Information
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: labelColor, mb: 0.75 }}>
                Full Name
              </Typography>
              <TextField
                fullWidth
                value={settingsForm.fullName}
                onChange={handleProfileFieldChange('fullName')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    backgroundColor: inputBg,
                    fontSize: '0.875rem',
                    color: isDark ? alpha(theme.palette.common.white, 0.82) : 'inherit',
                    '& fieldset': {
                      borderColor: inputBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: inputBorderHover,
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: labelColor, mb: 0.75 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                value={settingsForm.email}
                onChange={handleProfileFieldChange('email')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    backgroundColor: inputBg,
                    fontSize: '0.875rem',
                    color: isDark ? alpha(theme.palette.common.white, 0.82) : 'inherit',
                    '& fieldset': {
                      borderColor: inputBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: inputBorderHover,
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </Paper>
      </MotionBox>

      <MotionBox variants={itemVariants}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: `1px solid ${cardBorder}`,
            backgroundColor: cardBg,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
            <NotificationsNoneRoundedIcon sx={{ color: '#17a398', fontSize: 20 }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: sectionTitleColor }}>
              Notifications
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography sx={{ fontWeight: 600, color: sectionTitleColor, fontSize: '0.875rem' }}>
                  Email Notifications
                </Typography>
                <Typography sx={{ color: labelColor, fontSize: '0.75rem' }}>
                  Receive daily summaries and alerts
                </Typography>
              </Box>
              <Switch
                checked={settingsForm.emailNotifications}
                onChange={handleNotificationToggle('emailNotifications')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ffffff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#17a398',
                    opacity: 1,
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: isDark ? alpha(theme.palette.common.white, 0.25) : '#cbd5e1',
                    opacity: 1,
                  },
                }}
              />
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography sx={{ fontWeight: 600, color: sectionTitleColor, fontSize: '0.875rem' }}>
                  Push Notifications
                </Typography>
                <Typography sx={{ color: labelColor, fontSize: '0.75rem' }}>
                  Receive real-time updates on your device
                </Typography>
              </Box>
              <Switch
                checked={settingsForm.pushNotifications}
                onChange={handleNotificationToggle('pushNotifications')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ffffff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#17a398',
                    opacity: 1,
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: isDark ? alpha(theme.palette.common.white, 0.25) : '#cbd5e1',
                    opacity: 1,
                  },
                }}
              />
            </Stack>
          </Stack>
        </Paper>
      </MotionBox>

      <MotionBox variants={itemVariants}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: `1px solid ${cardBorder}`,
            backgroundColor: cardBg,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
            <ShieldOutlinedIcon sx={{ color: '#17a398', fontSize: 20 }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: sectionTitleColor }}>
              Security
            </Typography>
          </Stack>

          <Button
            variant="text"
            startIcon={<LockOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={handleOpenPasswordDialog}
            sx={{
              p: 0,
              minWidth: 0,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#17a398',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            Change Password
          </Button>
        </Paper>
      </MotionBox>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          disabled={isSaving}
          sx={{
            px: 3.5,
            py: 1.2,
            borderRadius: 2.5,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 800,
            backgroundColor: isDark ? '#e5e7eb' : '#0f172a',
            color: isDark ? '#111827' : '#ffffff',
            boxShadow: isDark
              ? '0 10px 22px rgba(0, 0, 0, 0.32)'
              : '0 10px 22px rgba(15, 23, 42, 0.18)',
            '&:hover': {
              backgroundColor: isDark ? '#f3f4f6' : '#111827',
            },
          }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Dialog
        open={isPasswordDialogOpen}
        onClose={handleClosePasswordDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: isDark
              ? alpha(theme.palette.background.paper, 0.95)
              : theme.palette.background.paper,
            border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.14) : '#e6e9ee'}`,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.25, fontWeight: 800, color: sectionTitleColor }}>
          Change Password
        </DialogTitle>

        <DialogContent sx={{ pt: '12px !important' }}>
          <Stack spacing={1.5}>
            <TextField
              type="password"
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordFieldChange('currentPassword')}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRoundedIcon sx={{ color: labelColor, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              type="password"
              label="New Password"
              value={passwordForm.newPassword}
              onChange={handlePasswordFieldChange('newPassword')}
              fullWidth
              size="small"
              helperText="Minimum 8 characters"
            />

            <TextField
              type="password"
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordFieldChange('confirmPassword')}
              fullWidth
              size="small"
              error={Boolean(passwordError)}
              helperText={passwordError || ' '}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleClosePasswordDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isSubmitDisabled}
            onClick={handleSubmitPasswordChange}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#17a398',
              '&:hover': {
                backgroundColor: '#129185',
              },
            }}
          >
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </MotionBox>
  );
}

export default AdminSettings;
