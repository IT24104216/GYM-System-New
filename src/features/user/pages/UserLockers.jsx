import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  createLockerBookingRequest,
  getUserLockerBookings,
  getUserLockers,
} from '@/features/user/api/user.api';
import { BRANCH_OPTIONS } from '@/shared/utils/branches';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

function UserLockers() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const [lockers, setLockers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [requestMessageByLocker, setRequestMessageByLocker] = useState({});
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    const branch = String(user?.branch || BRANCH_OPTIONS[0]).trim();
    const [lockersRes, requestsRes] = await Promise.all([
      getUserLockers({ branch, status: 'available' }),
      getUserLockerBookings({ userId: String(user?.id || ''), limit: 100 }),
    ]);
    setLockers(Array.isArray(lockersRes?.data?.data) ? lockersRes.data.data : []);
    setMyRequests(Array.isArray(requestsRes?.data?.data) ? requestsRes.data.data : []);
  }, [user?.branch, user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        await loadData();
      } catch {
        setError('Unable to load lockers.');
      }
    };
    run();
  }, [loadData, user?.id]);

  const pendingByLockerId = useMemo(() => {
    const set = new Set();
    myRequests
      .filter((item) => item.status === 'pending' || item.status === 'approved')
      .forEach((item) => set.add(String(item.lockerId)));
    return set;
  }, [myRequests]);

  const approvedLockerBooking = useMemo(
    () => myRequests.find((item) => item.status === 'approved') || null,
    [myRequests],
  );

  const handleRequest = async (locker) => {
    try {
      setError('');
      await createLockerBookingRequest({
        lockerId: locker.id,
        userId: String(user?.id || ''),
        userName: user?.name || 'Member',
        userEmail: user?.email || '',
        message: String(requestMessageByLocker[locker.id] || '').trim(),
      });
      setToast({ open: true, message: 'Locker request sent successfully.', severity: 'success' });
      setRequestMessageByLocker((prev) => ({ ...prev, [locker.id]: '' }));
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Unable to send request.');
    }
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      sx={{ pt: 1.2, px: { xs: 0.2, md: 0.6 } }}
    >
      <Box
        sx={{
          mb: 2.1,
          px: { xs: 1.4, md: 1.8 },
          py: { xs: 1.2, md: 1.4 },
          borderRadius: 2.6,
          border: `1px solid ${isDark ? '#2b4268' : '#d7e4f5'}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(20, 46, 84, 0.8) 0%, rgba(14, 32, 61, 0.75) 100%)'
            : 'linear-gradient(135deg, #f7fbff 0%, #eff6ff 100%)',
          boxShadow: isDark
            ? '0 10px 24px rgba(4, 11, 22, 0.45)'
            : '0 8px 20px rgba(28, 66, 122, 0.12)',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '1.9rem', md: '2.2rem' },
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: 0.2,
            color: isDark ? '#eaf3ff' : '#10284a',
          }}
        >
          Book Your Locker
        </Typography>
        <Typography
          sx={{
            mt: 0.4,
            fontSize: { xs: '0.98rem', md: '1.06rem' },
            color: isDark ? '#9fc2eb' : '#3c5f91',
          }}
        >
          Showing lockers for {user?.branch || BRANCH_OPTIONS[0]}.
        </Typography>
      </Box>

      {approvedLockerBooking && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You already have locker <strong>{approvedLockerBooking.lockerCode}</strong> approved.
          New locker booking is disabled.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
          gap: 2,
        }}
      >
        <MotionCard
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? '#0f1b34' : '#ffffff',
          }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
              <LockRoundedIcon sx={{ color: isDark ? '#9ad3ff' : '#0f4c9b' }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>Available Lockers</Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.2,
              }}
            >
              {lockers.map((locker, index) => {
                const hasRequested = pendingByLockerId.has(String(locker.id));
                return (
                  <MotionCard
                    key={locker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: index * 0.05 }}
                    whileHover={{ y: -3 }}
                    sx={{
                      borderRadius: 2.2,
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: isDark ? '#142443' : '#f8fafe',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 1.4 }}>
                      <Typography sx={{ fontWeight: 800 }}>{locker.code}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {locker.branch} {locker.section ? `| ${locker.section}` : ''}
                      </Typography>
                      <Chip label="Available" color="success" size="small" sx={{ mt: 0.8 }} />

                      <TextField
                        label="Request Message (optional)"
                        size="small"
                        fullWidth
                        value={requestMessageByLocker[locker.id] || ''}
                        onChange={(e) => setRequestMessageByLocker((prev) => ({ ...prev, [locker.id]: e.target.value }))}
                        sx={{ mt: 1.1 }}
                        disabled={Boolean(approvedLockerBooking)}
                      />

                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 1.1, textTransform: 'none', fontWeight: 700 }}
                        onClick={() => handleRequest(locker)}
                        disabled={hasRequested || Boolean(approvedLockerBooking)}
                      >
                        {approvedLockerBooking
                          ? 'Already Has Approved Locker'
                          : hasRequested
                            ? 'Request Sent'
                            : 'Send Booking Request'}
                      </Button>
                    </CardContent>
                  </MotionCard>
                );
              })}

              {!lockers.length && (
                <Typography variant="body2" color="text.secondary">
                  No available lockers in your branch right now.
                </Typography>
              )}
            </Box>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          sx={{
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? '#0f1b34' : '#ffffff',
          }}
        >
          <CardContent>
            <Typography sx={{ fontWeight: 800, mb: 1.2, fontSize: '1.15rem' }}>
              My Locker Requests
            </Typography>

            <Stack spacing={1}>
              {myRequests.map((item, index) => (
                <MotionCard
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, delay: index * 0.04 }}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: isDark ? '#142443' : '#f8fafe',
                    boxShadow: 'none',
                  }}
                >
                  <CardContent sx={{ p: 1.2 }}>
                    <Typography sx={{ fontWeight: 800 }}>{item.lockerCode}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.branch}</Typography>
                    <Chip
                      size="small"
                      label={item.status}
                      color={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'}
                      sx={{ mt: 0.6 }}
                    />
                    {item.adminMessage && (
                      <Typography variant="body2" sx={{ mt: 0.7 }}>
                        {item.adminMessage}
                      </Typography>
                    )}
                  </CardContent>
                </MotionCard>
              ))}
              {!myRequests.length && (
                <Typography variant="body2" color="text.secondary">
                  You have not requested a locker yet.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </MotionCard>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </MotionBox>
  );
}

export default UserLockers;
