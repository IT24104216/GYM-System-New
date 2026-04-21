import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CircularProgress,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  deleteUser as deleteUserApi,
  getAllUsers,
  getPlatformStats,
  getUserSubscription as getUserSubscriptionApi,
  grantSubscription as grantSubscriptionApi,
  updateUser as updateUserApi,
} from '@/features/admin/api/admin.api';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const summaryCards = [
  {
    id: 'total',
    label: 'Total Accounts',
    value: '3,247',
    delta: '+127 this month',
    trend: '+4.1%',
    gradient: 'linear-gradient(135deg, #84CC16 0%, #0D9488 100%)',
    icon: PeopleAltRoundedIcon,
  },
  {
    id: 'staff',
    label: 'Staff Members',
    value: '156',
    delta: '+8 this month',
    trend: '+3.9%',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #0284C7 100%)',
    icon: FitnessCenterRoundedIcon,
  },
  {
    id: 'diet',
    label: 'Dietitian Accounts',
    value: '42',
    delta: '+3 this month',
    trend: '+6.2%',
    gradient: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
    icon: MenuBookRoundedIcon,
  },
  {
    id: 'verified',
    label: 'Verified Profiles',
    value: '2,986',
    delta: '91.9% verified',
    trend: '+2.1%',
    gradient: 'linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)',
    icon: VerifiedUserRoundedIcon,
  },
];

const roleStyles = {
  Member: { bg: 'rgba(132, 204, 22, 0.14)', color: '#65A30D' },
  Coach: { bg: 'rgba(13, 148, 136, 0.14)', color: '#0F766E' },
  Dietician: { bg: 'rgba(245, 158, 11, 0.14)', color: '#B45309' },
  Admin: { bg: 'rgba(139, 92, 246, 0.14)', color: '#7C3AED' },
};

const statusStyles = {
  Active: { color: '#10B981', dot: '#10B981' },
  Inactive: { color: '#94A3B8', dot: '#94A3B8' },
  Suspended: { color: '#EF4444', dot: '#EF4444' },
};

const displayToAuthRole = {
  Member: 'user',
  Coach: 'coach',
  Dietician: 'dietitian',
  Admin: 'admin',
};

const filterToRole = {
  Members: 'Member',
  Coaches: 'Coach',
  Dieticians: 'Dietician',
  Admins: 'Admin',
};

const coachRoleBadge = {
  head: { label: 'HEAD', fg: '#0f766e', bg: '#ccfbf1' },
  sub: { label: 'SUB', fg: '#7c2d12', bg: '#ffedd5' },
};

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [nextRole, setNextRole] = useState('Member');
  const [nextCoachRole, setNextCoachRole] = useState('head');
  const [nextHeadCoachId, setNextHeadCoachId] = useState('');
  const [toast, setToast] = useState({ open: false, message: '' });
  const [detailsUser, setDetailsUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSubscription, setDetailsSubscription] = useState(null);
  const [grantPlanType, setGrantPlanType] = useState('6month');
  const [grantLoading, setGrantLoading] = useState(false);

  const filters = ['All', 'Members', 'Coaches', 'Dieticians', 'Admins'];

  const filteredUsers = useMemo(() => users.filter((user) => {
    const roleMatch = filter === 'All' ? true : user.role === filterToRole[filter];
    const query = search.trim().toLowerCase();
    const searchMatch = !query
      || user.name.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query)
      || String(user.branchUserId || '').toLowerCase().includes(query);
    return roleMatch && searchMatch;
  }), [users, filter, search]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);
  const roleOptions = ['Member', 'Coach', 'Dietician', 'Admin'];
  const headCoachOptions = useMemo(
    () =>
      users.filter((item) =>
        item.role === 'Coach'
        && String(item.coachRole || 'head').toLowerCase() === 'head'
        && item.id !== editingUser?.id),
    [editingUser?.id, users],
  );

  const loadUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to load users' });
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await getPlatformStats();
      setStats(data?.data || null);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
      void loadStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenEditRole = (user) => {
    setEditingUser(user);
    setNextRole(user.role);
    setNextCoachRole(String(user.coachRole || 'head').toLowerCase() === 'sub' ? 'sub' : 'head');
    setNextHeadCoachId(String(user.headCoachId || ''));
  };

  const handleCloseEditRole = () => {
    setEditingUser(null);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      const payload = { role: displayToAuthRole[nextRole] || 'user' };
      const isCoachRole = (displayToAuthRole[nextRole] || 'user') === 'coach';
      if (isCoachRole) {
        payload.coachRole = nextCoachRole === 'sub' ? 'sub' : 'head';
        payload.headCoachId = nextCoachRole === 'sub' ? String(nextHeadCoachId || '') : null;
      }
      const { data } = await updateUserApi(editingUser.id, payload);
      await loadUsers();
      await loadStats();
      const changedAt = data?.data?.roleChangedAtLabel;
      const timeSuffix = changedAt ? ` at ${changedAt}` : '';
      setToast({ open: true, message: `${editingUser.name} updated to ${nextRole}${timeSuffix}.` });
      setEditingUser(null);
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to update role' });
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateUserApi(user.id, { status: nextStatus.toLowerCase() });
      await loadUsers();
      await loadStats();
      setToast({ open: true, message: `${user.name} marked as ${nextStatus}.` });
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to update status' });
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.status !== 'Inactive') {
      setToast({ open: true, message: 'Only inactive users can be deleted.' });
      return;
    }

    try {
      await deleteUserApi(user.id);
      await loadUsers();
      await loadStats();
      setToast({ open: true, message: `${user.name} deleted.` });
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to delete user' });
    }
  };

  const handleCloseToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const openDetails = async (user) => {
    setDetailsUser(user);
    setDetailsSubscription(null);
    if (user.role !== 'Member') return;
    setDetailsLoading(true);
    try {
      const { data } = await getUserSubscriptionApi(user.id);
      setDetailsSubscription(data?.data || null);
    } catch {
      setDetailsSubscription(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsUser(null);
    setDetailsLoading(false);
    setDetailsSubscription(null);
    setGrantPlanType('6month');
    setGrantLoading(false);
  };

  const handleGrantSubscription = async () => {
    if (!detailsUser?.id || detailsUser.role !== 'Member') return;
    setGrantLoading(true);
    try {
      await grantSubscriptionApi(detailsUser.id, grantPlanType);
      const { data } = await getUserSubscriptionApi(detailsUser.id);
      setDetailsSubscription(data?.data || null);
      setToast({ open: true, message: `Granted ${grantPlanType} plan to ${detailsUser.name}.` });
    } catch (error) {
      setToast({ open: true, message: error?.response?.data?.message || 'Failed to grant subscription.' });
    } finally {
      setGrantLoading(false);
    }
  };

  return (
    <MotionBox variants={containerVariants} initial="hidden" animate="visible" sx={{ pb: 2.5 }}>
      <MotionBox variants={itemVariants} mb={1.6}>
        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.45rem', md: '1.72rem' } }}>
          Users & Staff Management
        </Typography>
        <Typography sx={{ color: '#64748b', mt: 0.4 }}>
          Manage platform members, coaches, dieticians, and admin staff.
        </Typography>
      </MotionBox>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 1.9,
        }}
      >
        {summaryCards.map((item) => {
          const Icon = item.icon;
          const liveValue = stats
            ? {
              total: stats.total,
              staff: stats.staff,
              diet: stats.diet,
              verified: stats.verified,
            }[item.id]
            : item.value;
          return (
            <MotionCard
              key={item.id}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.01 }}
              sx={{
                borderRadius: 2.2,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                background: item.gradient,
              }}
            >
              <CardContent sx={{ p: 2.1, '&:last-child': { pb: 2.1 }, position: 'relative', zIndex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.95}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.7, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.22)' }}>
                    <Icon sx={{ fontSize: 20 }} />
                  </Box>
                  <Chip
                    icon={<TrendingUpRoundedIcon sx={{ color: '#fff !important', fontSize: '15px !important' }} />}
                    label={item.trend}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.24)', color: '#fff', fontWeight: 700, height: 24 }}
                  />
                </Stack>

                <Typography sx={{ fontWeight: 900, fontSize: '2rem', lineHeight: 1.05 }}>{liveValue}</Typography>
                <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.9)', mt: 0.3 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.82)', mt: 0.45 }}>{item.delta}</Typography>
              </CardContent>
              <Box sx={{ position: 'absolute', right: -15, top: -16, width: 86, height: 86, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ position: 'absolute', right: -12, bottom: -35, width: 76, height: 76, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
            </MotionCard>
          );
        })}
      </Box>

      <MotionCard variants={itemVariants} sx={{ borderRadius: 2.2, border: '1px solid #e5edf6', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)' }}>
        <Box sx={{ p: { xs: 1.7, md: 2.1 }, borderBottom: '1px solid #edf2f7' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.3}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', md: '1.5rem' } }}>
              User Directory
            </Typography>

            <TextField
              size="small"
              placeholder="Search users..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: { xs: 1, sm: 250 }, '& .MuiOutlinedInput-root': { borderRadius: 2, height: 42 } }}
            />
          </Stack>

          <Stack direction="row" spacing={1} mt={1.6} useFlexGap flexWrap="wrap">
            {filters.map((item) => (
              <Chip
                key={item}
                label={item}
                clickable
                onClick={() => {
                  setFilter(item);
                  setPage(1);
                }}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  bgcolor: filter === item ? '#22c55e' : '#f1f5f9',
                  color: filter === item ? '#fff' : '#64748b',
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>USER</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>BRANCH ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>JOINED</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedUsers.map((user, index) => {
                const role = roleStyles[user.role] || roleStyles.Member;
                const status = statusStyles[user.status] || statusStyles.Inactive;
                return (
                  <TableRow
                    key={user.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, fontWeight: 800, fontSize: '0.9rem', bgcolor: '#22c55e' }}>{user.avatar}</Avatar>
                        <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 700 }}>
                      {user.branchUserId || '-'}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{user.email}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.6} alignItems="center" useFlexGap flexWrap="wrap">
                        <Chip size="small" label={user.role} sx={{ fontWeight: 700, bgcolor: role.bg, color: role.color }} />
                        {user.role === 'Coach' && (
                          <Chip
                            size="small"
                            label={coachRoleBadge[String(user.coachRole || 'head').toLowerCase()]?.label || 'HEAD'}
                            sx={{
                              fontWeight: 800,
                              bgcolor: coachRoleBadge[String(user.coachRole || 'head').toLowerCase()]?.bg || '#ccfbf1',
                              color: coachRoleBadge[String(user.coachRole || 'head').toLowerCase()]?.fg || '#0f766e',
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: status.dot }} />
                        <Typography sx={{ color: status.color, fontWeight: 700, fontSize: '0.9rem' }}>{user.status}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{user.joined}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.8} justifyContent="flex-end" useFlexGap flexWrap="wrap">
                        <Button
                          size="small"
                          onClick={() => {
                            void openDetails(user);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            minWidth: 'auto',
                            px: 1.1,
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleOpenEditRole(user)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            minWidth: 'auto',
                            px: 1.1,
                          }}
                        >
                          Edit Role
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleToggleStatus(user)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            minWidth: 'auto',
                            px: 1.1,
                            color: user.status === 'Active' ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {user.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.status !== 'Inactive'}
                          color="error"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            minWidth: 'auto',
                            px: 1.1,
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.1, py: 1.35, borderTop: '1px solid #edf2f7' }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Showing {pagedUsers.length} of {filteredUsers.length} users
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="Prev"
              clickable
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }}
            />
            <Typography sx={{ fontWeight: 800, color: '#334155', minWidth: 36, textAlign: 'center' }}>{safePage}</Typography>
            <Chip
              label="Next"
              clickable
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              sx={{ fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }}
            />
          </Stack>
        </Stack>
      </MotionCard>

      <Dialog open={Boolean(editingUser)} onClose={handleCloseEditRole} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Edit User Role</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748b', mb: 1.2 }}>
            Select new role for {editingUser?.name}.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="admin-user-role-label">Role</InputLabel>
            <Select
              labelId="admin-user-role-label"
              label="Role"
              value={nextRole}
              onChange={(event) => setNextRole(event.target.value)}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {nextRole === 'Coach' && (
            <Stack spacing={1.2} sx={{ mt: 1.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="admin-user-coach-role-label">Coach Role</InputLabel>
                <Select
                  labelId="admin-user-coach-role-label"
                  label="Coach Role"
                  value={nextCoachRole}
                  onChange={(event) => {
                    const value = String(event.target.value || 'head');
                    setNextCoachRole(value);
                    if (value !== 'sub') setNextHeadCoachId('');
                  }}
                >
                  <MenuItem value="head">Head Coach</MenuItem>
                  <MenuItem value="sub">Sub-Coach</MenuItem>
                </Select>
              </FormControl>
              {nextCoachRole === 'sub' && (
                <FormControl fullWidth size="small">
                  <InputLabel id="admin-user-head-coach-label">Reports to</InputLabel>
                  <Select
                    labelId="admin-user-head-coach-label"
                    label="Reports to"
                    value={nextHeadCoachId}
                    onChange={(event) => setNextHeadCoachId(event.target.value)}
                  >
                    {headCoachOptions.map((coach) => (
                      <MenuItem key={coach.id} value={coach.id}>{coach.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseEditRole} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveRole}
            variant="contained"
            disabled={nextRole === 'Coach' && nextCoachRole === 'sub' && !nextHeadCoachId}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save Role
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(detailsUser)} onClose={closeDetails} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          User Details
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.1} sx={{ mt: 0.5 }}>
            <Typography><strong>Name:</strong> {detailsUser?.name || '-'}</Typography>
            <Typography><strong>Email:</strong> {detailsUser?.email || '-'}</Typography>
            <Typography><strong>Role:</strong> {detailsUser?.role || '-'}</Typography>
            <Typography><strong>Status:</strong> {detailsUser?.status || '-'}</Typography>
            {detailsUser?.role === 'Member' && (
              <>
                <Divider sx={{ my: 0.8 }} />
                <Typography sx={{ fontWeight: 800 }}>Subscription</Typography>
                {detailsLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography sx={{ color: '#64748b' }}>Loading subscription...</Typography>
                  </Stack>
                ) : (
                  <>
                    <Typography>
                      <strong>Status:</strong> {String(detailsSubscription?.status || 'none')}
                    </Typography>
                    <Typography>
                      <strong>Plan:</strong> {detailsSubscription?.planType || '-'}
                    </Typography>
                    <Typography>
                      <strong>End Date:</strong> {detailsSubscription?.endDate ? new Date(detailsSubscription.endDate).toLocaleDateString() : '-'}
                    </Typography>
                    <Typography>
                      <strong>Auto Renew:</strong> {detailsSubscription ? (detailsSubscription.autoRenew ? 'Enabled' : 'Disabled') : '-'}
                    </Typography>
                  </>
                )}
                <Divider sx={{ my: 0.8 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="grant-plan-type-label">Grant Plan</InputLabel>
                    <Select
                      labelId="grant-plan-type-label"
                      label="Grant Plan"
                      value={grantPlanType}
                      onChange={(event) => setGrantPlanType(event.target.value)}
                    >
                      <MenuItem value="3month">3month</MenuItem>
                      <MenuItem value="6month">6month</MenuItem>
                      <MenuItem value="12month">12month</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleGrantSubscription}
                    disabled={grantLoading}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    {grantLoading ? 'Granting...' : 'Grant Subscription'}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={closeDetails} variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        onClose={handleCloseToast}
        autoHideDuration={2200}
        message={toast.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </MotionBox>
  );
}

export default AdminUsers;
