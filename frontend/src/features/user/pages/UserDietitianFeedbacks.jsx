import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { useTheme } from '@mui/material/styles';
import Rating from '@mui/material/Rating';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { deleteFeedback, getFeedbacks, updateFeedback } from '@/features/user/api/user.api';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

function UserDietitianFeedbacks() {
  const { user } = useAuth();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const dietitianName = searchParams.get('dietitian') || 'Dietitian';
  const dietitianId = searchParams.get('dietitianId') || '';
  const [feedbacks, setFeedbacks] = useState([]);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editingForm, setEditingForm] = useState({ rating: 0, comment: '' });
  const [editingError, setEditingError] = useState('');

  const loadFeedbacks = useCallback(async () => {
    try {
      const { data } = await getFeedbacks({
        subjectType: 'dietitian',
        ...(dietitianId ? { subjectId: dietitianId } : {}),
        page: 1,
        limit: 300,
      });
      const rows = Array.isArray(data?.data) ? data.data : [];
      const normalized = rows
        .filter((row) => {
          const byId = dietitianId && String(row.subjectId || '') === String(dietitianId);
          const byName = String(row.subjectName || '').trim() === dietitianName;
          return Boolean(byId || byName);
        })
        .map((row) => ({
          id: row.id,
          ownerId: String(row.ownerId),
          user: row.ownerName || 'Member',
          rating: Number(row.rating || 0),
          comment: row.comment || '',
          date: formatDate(row.createdAt),
        }));
      setFeedbacks(normalized);
    } catch {
      setFeedbacks([]);
    }
  }, [dietitianId, dietitianName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadFeedbacks();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadFeedbacks]);

  const averageRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, item) => sum + item.rating, 0);
    return (total / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await deleteFeedback(feedbackId, String(user?.id || ''));
      await loadFeedbacks();
    } catch (error) {
      setEditingError(error?.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const handleOpenEdit = (feedback) => {
    setEditingFeedback(feedback);
    setEditingForm({ rating: feedback.rating, comment: feedback.comment });
    setEditingError('');
  };

  const handleCloseEdit = () => {
    setEditingFeedback(null);
    setEditingError('');
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingForm.rating) {
      setEditingError('Please select a rating.');
      return;
    }

    try {
      await updateFeedback(editingFeedback?.id, {
        ownerId: String(user?.id || ''),
        rating: editingForm.rating,
        comment: editingForm.comment,
      });
      await loadFeedbacks();
      handleCloseEdit();
    } catch (error) {
      setEditingError(error?.response?.data?.message || 'Failed to update feedback');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        px: { xs: 2, md: 3 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Stack spacing={1} mb={3.5}>
          <Typography
            sx={{
              fontSize: { xs: '1.7rem', md: '2.2rem' },
              fontWeight: 800,
              color: theme.palette.text.primary,
            }}
          >
            {dietitianName} Feedbacks
          </Typography>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Chip label={`Average Rating ${averageRating || '0.0'}`} />
            <Chip label={`Total Feedbacks ${feedbacks.length}`} />
          </Stack>
        </Stack>

        <Stack spacing={1.4}>
          {feedbacks.map((item) => (
            <Card
              key={item.id}
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <CardContent>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                      {item.user}
                    </Typography>
                    <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                      {item.date}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={0.3} alignItems="center">
                    <StarRoundedIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 700 }}>{item.rating}.0</Typography>
                  </Stack>

                  <Typography sx={{ color: theme.palette.text.secondary }}>
                    {item.comment}
                  </Typography>

                  {item.ownerId === String(user?.id || '') && (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEdit(item)}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteFeedback(item.id)}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}

          {!feedbacks.length && (
            <Card sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography sx={{ color: theme.palette.text.secondary }}>
                  No feedbacks found for this dietitian.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      <Dialog
        open={Boolean(editingFeedback)}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          component: 'form',
          onSubmit: handleEditSubmit,
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Feedback</DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0.5 }}>
          <Stack spacing={1.8} sx={{ mt: 0.5 }}>
            <Box>
              <Typography sx={{ mb: 0.6, fontSize: '0.88rem', color: theme.palette.text.secondary }}>
                Rating
              </Typography>
              <Rating
                value={editingForm.rating}
                onChange={(_, value) => {
                  setEditingForm((prev) => ({ ...prev, rating: value || 0 }));
                  setEditingError('');
                }}
                precision={1}
              />
            </Box>

            <TextField
              label="Comment"
              value={editingForm.comment}
              onChange={(event) => setEditingForm((prev) => ({ ...prev, comment: event.target.value }))}
              multiline
              minRows={3}
            />

            {editingError && (
              <Typography sx={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                {editingError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={handleCloseEdit} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserDietitianFeedbacks;
