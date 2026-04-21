import { motion } from 'framer-motion';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

const MotionCard = motion(Card);

function MealPlanRiskMonitorCard({
  isDark,
  theme,
  riskMonitor,
  onSwitchToDietitian,
  onBookDietitian,
}) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: riskMonitor.today.level === 'red'
          ? ['0 0 0 rgba(239,68,68,0.00)', '0 0 0 8px rgba(239,68,68,0.16)', '0 0 0 rgba(239,68,68,0.00)']
          : 'none',
      }}
      transition={{
        duration: riskMonitor.today.level === 'red' ? 1.2 : 0.35,
        repeat: riskMonitor.today.level === 'red' ? Infinity : 0,
      }}
      sx={{
        mb: 2,
        borderRadius: 2.4,
        border: `1px solid ${
          riskMonitor.today.level === 'green'
            ? '#16a34a55'
            : riskMonitor.today.level === 'yellow'
              ? '#f59e0b66'
              : riskMonitor.today.level === 'red'
                ? '#ef444466'
                : (isDark ? '#27384f' : '#e7edf6')
        }`,
        bgcolor: riskMonitor.today.level === 'green'
          ? (isDark ? '#0d2a1d' : '#ecfdf5')
          : riskMonitor.today.level === 'yellow'
            ? (isDark ? '#2f230b' : '#fffbeb')
            : riskMonitor.today.level === 'red'
              ? (isDark ? '#311315' : '#fef2f2')
              : theme.palette.background.paper,
      }}
    >
      <CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.08rem' }}>
              My Plan Safety Monitor
            </Typography>
            <Typography sx={{ mt: 0.4, color: theme.palette.text.secondary, fontSize: '0.92rem' }}>
              {riskMonitor.today.message}
            </Typography>
          </Box>
          <Chip
            label={riskMonitor.today.level === 'neutral' ? 'No data yet' : `${riskMonitor.today.label} • Score ${riskMonitor.today.score}`}
            sx={{
              alignSelf: { xs: 'flex-start', md: 'center' },
              fontWeight: 800,
              borderRadius: 2,
              bgcolor: riskMonitor.today.level === 'green'
                ? '#16a34a'
                : riskMonitor.today.level === 'yellow'
                  ? '#f59e0b'
                  : riskMonitor.today.level === 'red'
                    ? '#ef4444'
                    : (isDark ? '#334155' : '#e2e8f0'),
              color: '#fff',
            }}
          />
        </Stack>

        {riskMonitor.today.reasons?.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {riskMonitor.today.reasons.slice(0, 3).map((reason, idx) => (
              <Typography key={`risk-reason-${idx}`} sx={{ fontSize: '0.88rem', color: theme.palette.text.secondary, mt: 0.35 }}>
                • {reason}
              </Typography>
            ))}
          </Box>
        )}

        {riskMonitor.goodStreak >= 3 && (
          <Typography sx={{ mt: 1.1, fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>
            Great job. You have maintained a balanced meal pattern for {riskMonitor.goodStreak} day(s) continuously.
          </Typography>
        )}

        {riskMonitor.riskStreak >= 3 && (
          <Box sx={{ mt: 1.2 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>
              Warning: risk has continued for {riskMonitor.riskStreak} day(s). It is safer to switch to a dietitian-guided plan.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                onClick={onSwitchToDietitian}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.8, bgcolor: '#0D9488', '&:hover': { bgcolor: '#0f766e' } }}
              >
                Switch to Dietitian Plan
              </Button>
              <Button
                variant="outlined"
                onClick={onBookDietitian}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.8 }}
              >
                Book Appointment
              </Button>
            </Stack>
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );
}

export default MealPlanRiskMonitorCard;
