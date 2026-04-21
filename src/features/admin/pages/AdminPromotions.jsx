import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  updatePromotion,
} from '@/features/admin/api/admin.api';

const INITIAL_FORM = {
  title: '',
  placement: 'Dashboard Hero',
  target: 'All Members',
  status: 'ACTIVE',
  budget: '',
  startDate: '',
  endDate: '',
  link: '',
  description: '',
  image: '',
};

const PLACEMENTS = [
  'Dashboard Hero',
  'Promotions Page',
];
const TARGETS = [
  'All Members',
  'New Signups (0-30 days)',
  'Inactive Members',
  'PT Clients',
  'Weight Loss Program',
  'Strength Program',
];
const STATUSES = ['ACTIVE', 'DRAFT', 'PAUSED'];

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'Date not set';
  return `${startDate} to ${endDate}`;
}

export default function AdminPromotions() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const surfaceBg = isDark ? '#0f1b34' : '#ffffff';
  const sectionBg = isDark ? '#142443' : '#f7f9ff';
  const borderColor = theme.palette.divider;
  const inputBorderDefault = isDark ? 'rgba(148, 163, 184, 0.38)' : borderColor;
  const inputBorderHover = isDark ? 'rgba(148, 163, 184, 0.62)' : theme.palette.text.secondary;
  const inputBorderFocus = isDark ? '#93c5fd' : theme.palette.primary.main;
  const fieldIconColor = isDark ? '#cbd5e1' : theme.palette.action.active;
  const primaryText = theme.palette.text.primary;
  const secondaryText = theme.palette.text.secondary;

  const [campaigns, setCampaigns] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const activeCount = useMemo(() => campaigns.filter((item) => item.status === 'ACTIVE').length, [campaigns]);
  const totalBudget = useMemo(() => campaigns.reduce((sum, item) => sum + Number(item.budget || 0), 0), [campaigns]);

  const loadCampaigns = async () => {
    const { data } = await getPromotions();
    setCampaigns(Array.isArray(data?.data) ? data.data : []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadCampaigns();
      } catch {
        setCampaigns([]);
      }
    };
    run();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setError('');
    setForm(INITIAL_FORM);
  };

  const updateField = (field) => (event) => {
    setError('');
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new window.FileReader();
    reader.onload = (e) => {
      setForm((prev) => ({ ...prev, image: e.target?.result || '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.budget || !form.startDate || !form.endDate) {
      setError('Please fill title, budget, start date, and end date.');
      return;
    }

    if (Number(form.budget) <= 0) {
      setError('Budget should be greater than zero.');
      return;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      setError('End date must be after start date.');
      return;
    }

    const cleanLink = form.link.trim();
    const cleanImage = form.image.trim();
    if (cleanLink) {
      try {
        new URL(cleanLink);
      } catch {
        setError('Campaign link must be a valid URL.');
        return;
      }
    }

    if (cleanImage && !cleanImage.startsWith('data:image/')) {
      try {
        new URL(cleanImage);
      } catch {
        setError('Image link must be a valid URL.');
        return;
      }
    }

    const payload = {
      ...form,
      title: form.title.trim(),
      budget: Number(form.budget),
      description: form.description.trim(),
      link: cleanLink,
      image: cleanImage,
    };

    try {
      if (editingId) {
        await updatePromotion(editingId, payload);
        setToast({ open: true, message: 'Ad/Promotion updated successfully.', severity: 'success' });
      } else {
        await createPromotion(payload);
        setToast({ open: true, message: 'Ad/Promotion submitted successfully.', severity: 'success' });
      }
      await loadCampaigns();
      resetForm();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to save promotion.');
    }
  };

  const handleEdit = (campaign) => {
    setEditingId(campaign.id);
    setError('');
    setForm({
      title: campaign.title || '',
      placement: campaign.placement || 'Dashboard Hero',
      target: campaign.target || 'All Members',
      status: campaign.status || 'ACTIVE',
      budget: campaign.budget || '',
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      link: campaign.link || '',
      description: campaign.description || '',
      image: campaign.image || '',
    });
  };

  const handleDelete = async (id) => {
    try {
      await deletePromotion(id);
      await loadCampaigns();
      setToast({ open: true, message: 'Campaign removed.', severity: 'success' });
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to delete promotion.');
    }
  };

  const closeToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
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
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(520px, 1.05fr) minmax(420px, 0.95fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Card sx={{ borderRadius: 3, border: `1px solid ${borderColor}`, bgcolor: surfaceBg, boxShadow: '0 10px 30px rgba(15,28,56,0.06)' }}>
          <CardContent sx={{ p: { xs: 1.6, md: 2.2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.6 }}>
              <CampaignRoundedIcon sx={{ color: isDark ? '#93c5fd' : '#12306d' }} />
              <Typography sx={{ fontSize: { xs: '1.4rem', md: '2rem' }, fontWeight: 900, color: primaryText }}>
                Ads & Promotions
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 1.2,
                '& .MuiFormLabel-root': { color: secondaryText },
                '& .MuiInputLabel-root.Mui-focused': { color: primaryText },
                '& .MuiOutlinedInput-root': {
                  color: primaryText,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: inputBorderDefault,
                    borderWidth: isDark ? 1.2 : 1,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: inputBorderHover,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: inputBorderFocus,
                    borderWidth: 1.6,
                  },
                },
                '& .MuiSelect-icon': {
                  color: fieldIconColor,
                  opacity: 1,
                },
                '& .MuiSvgIcon-root': {
                  color: fieldIconColor,
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  opacity: isDark ? 1 : 0.74,
                  filter: isDark ? 'invert(0.92) saturate(0) brightness(1.15)' : 'none',
                  cursor: 'pointer',
                },
              }}
            >
              <TextField
                label="Promotion Title *"
                value={form.title}
                onChange={updateField('title')}
                placeholder="e.g., Summer PT Starter Offer"
                fullWidth
                size="small"
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Placement</InputLabel>
                <Select label="Placement" value={form.placement} onChange={updateField('placement')}>
                  {PLACEMENTS.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Target Group</InputLabel>
                <Select label="Target Group" value={form.target} onChange={updateField('target')}>
                  {TARGETS.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status} onChange={updateField('status')}>
                  {STATUSES.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Budget (Rs)"
                type="number"
                value={form.budget}
                onChange={updateField('budget')}
                placeholder="e.g., 1200"
                fullWidth
                size="small"
              />

              <TextField
                label="Offer URL"
                value={form.link}
                onChange={updateField('link')}
                fullWidth
                size="small"
                placeholder="https://gympro.com/offers/pt-starter"
              />

              <TextField
                label="Image Link URL"
                value={form.image}
                onChange={updateField('image')}
                fullWidth
                size="small"
                placeholder="https://images.example.com/promo-banner.jpg"
              />

              <TextField
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={updateField('startDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />

              <TextField
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={updateField('endDate')}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />

              <TextField
                label="Promotion Description"
                value={form.description}
                onChange={updateField('description')}
                multiline
                minRows={4}
                fullWidth
                size="small"
                placeholder="Highlight the membership, PT, class, or nutrition offer details."
                sx={{ gridColumn: { xs: '1 / -1', md: '1 / span 2' } }}
              />
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mt: 1.4 }}
            >
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternateRoundedIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor, color: primaryText }}
              >
                Upload Creative
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </Button>

              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2.2,
                  bgcolor: '#ef6c5e',
                  '&:hover': { bgcolor: '#de5648' },
                }}
              >
                {editingId ? 'Update Campaign' : 'Launch Campaign'}
              </Button>

              {editingId && (
                <Button variant="text" onClick={resetForm} sx={{ textTransform: 'none', fontWeight: 700, color: primaryText }}>
                  Cancel Edit
                </Button>
              )}
            </Stack>

            {form.image && (
              <Box sx={{ mt: 1.3, borderRadius: 2, overflow: 'hidden', border: `1px solid ${borderColor}`, maxWidth: 280, height: 120 }}>
                <img src={form.image} alt="Campaign creative" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 1.2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Stack spacing={1.2}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 1,
            }}
          >
            <Card sx={{ borderRadius: 2.4, border: `1px solid ${borderColor}`, bgcolor: sectionBg, boxShadow: 'none' }}>
              <CardContent sx={{ p: 1.2 }}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <LocalOfferRoundedIcon sx={{ color: '#ef6c5e', fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: secondaryText }}>Total</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 900, color: primaryText }}>{campaigns.length}</Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.4, border: `1px solid ${borderColor}`, bgcolor: sectionBg, boxShadow: 'none' }}>
              <CardContent sx={{ p: 1.2 }}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <CampaignRoundedIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: secondaryText }}>Active</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 900, color: primaryText }}>{activeCount}</Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2.4, border: `1px solid ${borderColor}`, bgcolor: sectionBg, boxShadow: 'none' }}>
              <CardContent sx={{ p: 1.2 }}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <TrendingUpRoundedIcon sx={{ color: '#1565c0', fontSize: 18 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: secondaryText }}>Budget</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 900, color: primaryText }}>Rs {totalBudget}</Typography>
              </CardContent>
            </Card>
          </Box>

          <Card sx={{ borderRadius: 3, border: `1px solid ${borderColor}`, bgcolor: surfaceBg, boxShadow: '0 10px 30px rgba(15,28,56,0.06)' }}>
            <CardContent sx={{ p: { xs: 1.2, md: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.1 }}>
                <Typography sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, fontWeight: 800, color: primaryText }}>
                  Live Ads & Promotions
                </Typography>
                <Chip label={`${campaigns.length} items`} size="small" sx={{ fontWeight: 700, bgcolor: isDark ? '#1f2f50' : undefined, color: primaryText }} />
              </Stack>

              {!campaigns.length && (
                <Box sx={{ py: 3, border: `1px dashed ${borderColor}`, borderRadius: 2.2, textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 800, color: primaryText }}>No campaigns yet</Typography>
                  <Typography sx={{ fontSize: '0.84rem', color: secondaryText, mt: 0.4 }}>
                    Create your first promotion from the composer.
                  </Typography>
                </Box>
              )}

              <Stack spacing={1}>
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} sx={{ borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: sectionBg, boxShadow: 'none' }}>
                    <CardContent sx={{ p: 1.2 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: primaryText }}>{campaign.title}</Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: secondaryText }}>
                            {campaign.placement} | {campaign.target}
                          </Typography>
                        </Box>
                        <Chip
                          label={campaign.status}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: campaign.status === 'ACTIVE' ? '#e8f5e9' : '#eef2ff',
                            color: campaign.status === 'ACTIVE' ? '#1b5e20' : '#243b8f',
                          }}
                        />
                      </Stack>

                      {campaign.image && (
                        <Box sx={{ mt: 0.9, borderRadius: 1.5, overflow: 'hidden', height: 92, border: `1px solid ${borderColor}` }}>
                          <img src={campaign.image} alt={campaign.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      )}

                      {!!campaign.description && (
                        <Typography sx={{ mt: 0.8, fontSize: '0.82rem', color: secondaryText }}>
                          {campaign.description}
                        </Typography>
                      )}

                      <Typography sx={{ mt: 0.6, fontSize: '0.78rem', color: secondaryText }}>
                        {formatDateRange(campaign.startDate, campaign.endDate)} | Budget Rs {campaign.budget}
                      </Typography>

                      <Divider sx={{ my: 0.8 }} />

                      <Stack direction="row" spacing={2}>
                        <Typography onClick={() => handleEdit(campaign)} sx={{ color: '#ef6c5e', cursor: 'pointer', fontWeight: 700 }}>
                          Edit
                        </Typography>
                        <Typography onClick={() => handleDelete(campaign.id)} sx={{ color: '#ef6c5e', cursor: 'pointer', fontWeight: 700 }}>
                          Delete
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={2600} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={closeToast} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
