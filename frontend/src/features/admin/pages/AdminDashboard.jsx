import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
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
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { getAllUsers, getPlatformStats } from '@/features/admin/api/admin.api';

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

const stats = [
  {
    key: 'users',
    label: 'Total Users',
    value: '3,247',
    change: '+127 this month',
    trend: '+4.1%',
    gradient: 'linear-gradient(135deg, #84CC16 0%, #0D9488 100%)',
    icon: PeopleAltRoundedIcon,
  },
  {
    key: 'coaches',
    label: 'Active Coaches',
    value: '48',
    change: '+3 this month',
    trend: '+6.7%',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #0284C7 100%)',
    icon: FitnessCenterRoundedIcon,
  },
  {
    key: 'mealPlans',
    label: 'Meal Plans',
    value: '892',
    change: '+54 this month',
    trend: '+6.4%',
    gradient: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
    icon: MenuBookRoundedIcon,
  },
  {
    key: 'reviews',
    label: 'Pending Reviews',
    value: '12',
    change: 'Needs attention',
    trend: 'Urgent',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
    icon: WarningAmberRoundedIcon,
    urgent: true,
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

const filterToRole = {
  Members: 'Member',
  Coaches: 'Coach',
  Dieticians: 'Dietician',
  Admins: 'Admin',
};

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsResponse, usersResponse] = await Promise.all([
          getPlatformStats(),
          getAllUsers(),
        ]);

        setStatsData(statsResponse?.data?.data || null);
        const userRows = Array.isArray(usersResponse?.data?.data) ? usersResponse.data.data : [];
        setUsers(userRows);
      } catch {
        setStatsData(null);
        setUsers([]);
      }
    };

    loadData();
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const roleMatch = filter === 'All' ? true : user.role === filterToRole[filter];
    const query = search.trim().toLowerCase();
    const searchMatch = !query
      || user.name.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query);
    return roleMatch && searchMatch;
  }), [users, filter, search]);

  const filters = ['All', 'Members', 'Coaches', 'Dieticians', 'Admins'];

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ pb: 2 }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 1.8,
        }}
      >
        {stats.map((item) => {
          const Icon = item.icon;
          const liveValue = statsData
            ? {
              users: statsData.total,
              coaches: statsData.activeCoaches,
              mealPlans: statsData.mealPlans,
              reviews: statsData.pendingReviews,
            }[item.key]
            : item.value;
          return (
            <MotionCard
              key={item.key}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              sx={{
                borderRadius: 2.2,
                overflow: 'hidden',
                position: 'relative',
                color: '#fff',
                background: item.gradient,
                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.16)',
                minHeight: 176,
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.1, '&:last-child': { pb: 2.1 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.05}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.7, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,0.22)' }}>
                    <Icon sx={{ fontSize: 20 }} />
                  </Box>
                  {item.urgent ? (
                    <Chip label="Urgent" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.24)', color: '#fff', fontWeight: 700, height: 24 }} />
                  ) : (
                    <Chip
                      icon={<TrendingUpRoundedIcon sx={{ color: '#fff !important', fontSize: '15px !important' }} />}
                      label={item.trend}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.24)', color: '#fff', fontWeight: 700, height: 24 }}
                    />
                  )}
                </Stack>

                <Typography sx={{ fontWeight: 900, fontSize: '2.05rem', lineHeight: 1.05 }}>{liveValue}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.9)', mt: 0.3 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.82)', mt: 0.45 }}>{item.change}</Typography>
              </CardContent>
              <Box sx={{ position: 'absolute', right: -18, top: -18, width: 96, height: 96, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ position: 'absolute', right: -10, bottom: -38, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
            </MotionCard>
          );
        })}
      </Box>

      <MotionCard variants={itemVariants} sx={{ borderRadius: 2.2, border: '1px solid #e5edf6', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)' }}>
        <Box sx={{ p: { xs: 1.7, md: 2.1 }, borderBottom: '1px solid #edf2f7' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.3}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', md: '1.52rem' } }}>
              Recent Users
            </Typography>

            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { xs: 1, sm: 250 }, '& .MuiOutlinedInput-root': { borderRadius: 2, height: 42 } }}
              />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} mt={1.6} useFlexGap flexWrap="wrap">
            {filters.map((item) => (
              <Chip
                key={item}
                label={item}
                clickable
                onClick={() => setFilter(item)}
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
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#94a3b8' }}>JOINED</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.slice(0, 5).map((user, index) => {
                const role = roleStyles[user.role] || roleStyles.Member;
                const status = statusStyles[user.status] || statusStyles.Inactive;

                return (
                  <TableRow
                    key={user.id}
                    component={motion.tr}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.045 }}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, fontWeight: 800, fontSize: '0.9rem', bgcolor: '#22c55e' }}>{user.avatar}</Avatar>
                        <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: role.bg,
                          color: role.color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: status.dot }} />
                        <Typography sx={{ color: status.color, fontWeight: 700, fontSize: '0.9rem' }}>{user.status}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{user.joined}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </MotionCard>
    </MotionBox>
  );
}

export default AdminDashboard;
