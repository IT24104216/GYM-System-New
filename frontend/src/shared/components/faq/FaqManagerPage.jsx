import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { createFaq, deleteFaq, getFaqs, updateFaq } from '@/shared/api/faqs.api';
import { useAuth } from '@/shared/hooks/useAuth';

const MotionCard = motion(Card);

function FaqManagerPage({ role = 'coach', title = 'Manage FAQs', subtitle = '' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [editingId, setEditingId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const getApiErrorMessage = (apiError, fallback = 'Failed to save FAQ.') => {
    const data = apiError?.response?.data || {};
    const fieldErrors = data?.details?.fieldErrors || data?.fieldErrors || {};
    const normalized = Object.entries(fieldErrors)
      .flatMap(([field, messages]) =>
        (Array.isArray(messages) ? messages : [])
          .filter(Boolean)
          .map((message) => `${field}: ${message}`));
    return normalized[0] || data?.message || fallback;
  };

  const loadFaqs = useCallback(async () => {
    const { data } = await getFaqs({
      authorRole: role,
      authorId: String(user?.id || ''),
      isActive: true,
      limit: 200,
    });
    setFaqs(Array.isArray(data?.data) ? data.data : []);
  }, [role, user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        await loadFaqs();
      } catch {
        setError('Failed to load FAQs.');
      }
    };
    run();
  }, [loadFaqs, role, user?.id]);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return faqs;
    return faqs.filter((item) => (
      item.question.toLowerCase().includes(query)
      || item.answer.toLowerCase().includes(query)
    ));
  }, [faqs, search]);

  const resetForm = () => {
    setEditingId('');
    setForm({ question: '', answer: '' });
  };

  const handleSubmit = async () => {
    const question = form.question.trim();
    const answer = form.answer.trim();
    if (!question || !answer) {
      setError('Question and answer are required.');
      return;
    }
    if (question.length < 4) {
      setError('Question must be at least 4 characters.');
      return;
    }
    if (answer.length < 4) {
      setError('Answer must be at least 4 characters.');
      return;
    }

    try {
      const payload = {
        question,
        answer,
        authorRole: role,
        authorId: String(user?.id || ''),
        authorName: user?.name || '',
        isActive: true,
      };
      if (editingId) {
        await updateFaq(editingId, payload);
        setToast({ open: true, message: 'FAQ updated.', severity: 'success' });
      } else {
        await createFaq(payload);
        setToast({ open: true, message: 'FAQ created.', severity: 'success' });
      }
      setError('');
      await loadFaqs();
      resetForm();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Failed to save FAQ.'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFaq(id, {
        authorId: String(user?.id || ''),
        authorRole: role,
      });
      setToast({ open: true, message: 'FAQ deleted.', severity: 'success' });
      await loadFaqs();
      if (editingId === id) resetForm();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Failed to delete FAQ.'));
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({ question: row.question, answer: row.answer });
    setError('');
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ mb: 2.2 }}>
        <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, fontWeight: 900, lineHeight: 1.08 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.6 }}>
          {subtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.05fr' },
          gap: 2,
        }}
      >
        <MotionCard
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? '#0f1b34' : '#ffffff',
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.3 }}>
              <QuizRoundedIcon sx={{ color: isDark ? '#93c5fd' : '#164e96' }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
                {editingId ? 'Edit FAQ' : 'Add New FAQ'}
              </Typography>
            </Stack>

            <TextField
              label="Question"
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              fullWidth
              size="small"
              sx={{ mb: 1.2 }}
            />
            <TextField
              label="Answer"
              value={form.answer}
              onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
              fullWidth
              size="small"
              multiline
              minRows={5}
            />

            <Stack direction="row" spacing={1.1} sx={{ mt: 1.4 }}>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={handleSubmit}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                {editingId ? 'Update FAQ' : 'Create FAQ'}
              </Button>
              {editingId && (
                <Button onClick={resetForm} sx={{ textTransform: 'none', fontWeight: 700 }}>
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
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? '#0f1b34' : '#ffffff',
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" sx={{ mb: 1.2 }}>
              <TextField
                size="small"
                placeholder="Search your FAQs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: { sm: 260 } }}
              />
              <Chip label={`${filteredFaqs.length} items`} />
            </Stack>

            <Stack spacing={1}>
              {filteredFaqs.map((item) => (
                <Accordion key={item.id} disableGutters sx={{ borderRadius: '12px !important', border: '1px solid', borderColor: 'divider', background: isDark ? '#142443' : '#f8fafe', boxShadow: 'none' }}>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography sx={{ fontWeight: 700 }}>{item.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', mb: 1.2 }}>
                      {item.answer}
                    </Typography>
                    <Stack direction="row" spacing={1.2}>
                      <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => startEdit(item)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Edit
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => handleDelete(item.id)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Delete
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
              {!filteredFaqs.length && (
                <Typography variant="body2" color="text.secondary">
                  No FAQs found. Add your first FAQ.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </MotionCard>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default FaqManagerPage;
