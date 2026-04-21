import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import {
  createLocker,
  deleteLocker,
  getLockerBookings,
  getLockers,
  updateLocker,
  updateLockerBookingStatus,
} from '@/features/admin/api/admin.api';
import { BRANCH_OPTIONS } from '@/shared/utils/branches';

const INITIAL_FORM = {
  branch: BRANCH_OPTIONS[0],
  code: '',
  section: '',
  status: 'available',
  notes: '',
};

function AdminLockers() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [lockers, setLockers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [filterBranch, setFilterBranch] = useState('All');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const cardBg = isDark ? '#0f1b34' : '#ffffff';
  const panelBg = isDark ? '#142443' : '#f7f9ff';
  const borderColor = theme.palette.divider;

  const loadData = async () => {
    const [lockersRes, requestsRes] = await Promise.all([
      getLockers(),
      getLockerBookings({ status: 'pending', limit: 100 }),
    ]);
    setLockers(Array.isArray(lockersRes?.data?.data) ? lockersRes.data.data : []);
    setRequests(Array.isArray(requestsRes?.data?.data) ? requestsRes.data.data : []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadData();
      } catch {
        setError('Failed to load lockers data.');
      }
    };
    run();
  }, []);

  const filteredLockers = useMemo(() => lockers.filter((locker) => (
    filterBranch === 'All' ? true : locker.branch === filterBranch
  )), [filterBranch, lockers]);

  const handleFormChange = (field) => (event) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setEditingId('');
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async () => {
    if (!form.branch || !form.code.trim()) {
      setError('Branch and locker code are required.');
      return;
    }

    try {
      const payload = {
        branch: form.branch,
        code: form.code.trim().toUpperCase(),
        section: form.section.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };
      if (editingId) {
        await updateLocker(editingId, payload);
        setFeedback({ open: true, message: 'Locker updated successfully.', severity: 'success' });
      } else {
        await createLocker(payload);
        setFeedback({ open: true, message: 'Locker added successfully.', severity: 'success' });
      }
      await loadData();
      resetForm();
      setError('');
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Unable to save locker.');
    }
  };

  const handleEdit = (locker) => {
    setEditingId(locker.id);
    setForm({
      branch: locker.branch,
      code: locker.code,
      section: locker.section || '',
      status: locker.status,
      notes: locker.notes || '',
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteLocker(id);
      await loadData();
      setFeedback({ open: true, message: 'Locker deleted.', severity: 'success' });
      if (editingId === id) resetForm();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Unable to delete locker.');
    }
  };

  const handleRequestStatus = async (requestId, status) => {
    try {
      const payload = {
        status,
        adminMessage: status === 'approved'
          ? 'Locker booking approved. Get your keys from reception when you go to the gym.'
          : 'Request rejected by admin.',
      };
      await updateLockerBookingStatus(requestId, payload);
      await loadData();
      setFeedback({
        open: true,
        message: status === 'approved' ? 'Locker request approved.' : 'Locker request rejected.',
        severity: 'success',
      });
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Unable to update request.');
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1, md: 2 },
        borderRadius: 3,
        background: isDark
          ? 'linear-gradient(180deg, #0a142a 0%, #0d1a32 100%)'
          : 'linear-gradient(180deg, #f7f9ff 0%, #f1f4fb 100%)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(460px, 0.95fr) minmax(520px, 1.05fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Card sx={{ borderRadius: 3, border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
          <CardContent sx={{ p: { xs: 1.6, md: 2.2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.6 }}>
              <LockRoundedIcon sx={{ color: isDark ? '#93c5fd' : '#12306d' }} />
              <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.9rem' }, fontWeight: 900 }}>
                Manage Lockers
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.2,
              }}
            >
              <FormControl size="small" fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select label="Branch" value={form.branch} onChange={handleFormChange('branch')}>
                  {BRANCH_OPTIONS.map((branch) => (
                    <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Locker Code *"
                value={form.code}
                onChange={handleFormChange('code')}
                fullWidth
                size="small"
              />

              <TextField
                label="Section"
                value={form.section}
                onChange={handleFormChange('section')}
                fullWidth
                size="small"
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status} onChange={handleFormChange('status')}>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="unavailable">Unavailable</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Notes"
                value={form.notes}
                onChange={handleFormChange('notes')}
                fullWidth
                size="small"
                multiline
                minRows={2}
                sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 2' } }}
              />
            </Box>

            <Stack direction="row" spacing={1.2} sx={{ mt: 1.4 }}>
              <Button variant="contained" onClick={handleSubmit} sx={{ textTransform: 'none', fontWeight: 700 }}>
                {editingId ? 'Update Locker' : 'Add Locker'}
              </Button>
              {editingId && (
                <Button variant="text" onClick={resetForm} sx={{ textTransform: 'none', fontWeight: 700 }}>
                  Cancel
                </Button>
              )}
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 1.2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Stack spacing={1.2}>
          <Card sx={{ borderRadius: 3, border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
            <CardContent sx={{ p: { xs: 1.2, md: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                <Typography sx={{ fontWeight: 800 }}>Locker List</Typography>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Filter Branch</InputLabel>
                  <Select label="Filter Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                    <MenuItem value="All">All</MenuItem>
                    {BRANCH_OPTIONS.map((branch) => (
                      <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack spacing={1}>
                {filteredLockers.map((locker) => (
                  <Card key={locker.id} sx={{ borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: panelBg, boxShadow: 'none' }}>
                    <CardContent sx={{ p: 1.2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{locker.code}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {locker.branch} {locker.section ? `| ${locker.section}` : ''}
                          </Typography>
                          {locker.bookedByName && (
                            <Typography variant="body2" sx={{ mt: 0.3 }}>
                              Booked by: {locker.bookedByName}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={locker.status}
                          size="small"
                          color={locker.status === 'available' ? 'success' : 'default'}
                        />
                      </Stack>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Typography onClick={() => handleEdit(locker)} sx={{ cursor: 'pointer', color: '#0ea5e9', fontWeight: 700 }}>Edit</Typography>
                        <Typography onClick={() => handleDelete(locker.id)} sx={{ cursor: 'pointer', color: '#ef4444', fontWeight: 700 }}>Delete</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
                {!filteredLockers.length && (
                  <Typography variant="body2" color="text.secondary">No lockers found.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, border: `1px solid ${borderColor}`, bgcolor: cardBg }}>
            <CardContent sx={{ p: { xs: 1.2, md: 1.5 } }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Pending Booking Requests</Typography>
              <Stack spacing={1}>
                {requests.map((req) => (
                  <Card key={req.id} sx={{ borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: panelBg, boxShadow: 'none' }}>
                    <CardContent sx={{ p: 1.2 }}>
                      <Typography sx={{ fontWeight: 800 }}>{req.userName} requested {req.lockerCode}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {req.branch} {req.message ? `| ${req.message}` : ''}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EventAvailableRoundedIcon />}
                          variant="contained"
                          color="success"
                          onClick={() => handleRequestStatus(req.id, 'approved')}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          startIcon={<BlockRoundedIcon />}
                          variant="outlined"
                          color="error"
                          onClick={() => handleRequestStatus(req.id, 'rejected')}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
                {!requests.length && (
                  <Typography variant="body2" color="text.secondary">No pending requests.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Snackbar
        open={feedback.open}
        autoHideDuration={2600}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminLockers;
