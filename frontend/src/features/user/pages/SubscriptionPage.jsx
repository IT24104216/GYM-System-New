import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import { ROUTES } from '@/shared/utils/constants';
import {
  cancelMySubscription,
  createMySubscription,
  getMySubscription,
  renewMySubscription,
  toggleMySubscriptionAutoRenew,
} from '../api/user.api';

const PLAN_CATALOG = [
  {
    planType: '3month',
    title: '3 Months',
    monthlyPrice: 9461.85,
    recommended: false,
  },
  {
    planType: '6month',
    title: '6 Months',
    monthlyPrice: 7884.35,
    recommended: true,
  },
  {
    planType: '12month',
    title: '12 Months',
    monthlyPrice: 6306.85,
    recommended: false,
  },
];

const toTotal = (planType) => {
  const plan = PLAN_CATALOG.find((item) => item.planType === planType);
  const months = Number(String(planType).replace('month', '') || 0);
  const total = (Number(plan?.monthlyPrice || 0) * months);
  return Number(total.toFixed(2));
};

const formatLkr = (amount) =>
  Number(amount || 0).toLocaleString('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const normalizeCardNumber = (rawValue = '') =>
  String(rawValue || '')
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const normalizeExpiry = (rawValue = '') => {
  const digits = String(rawValue || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const calcDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getSubscriptionTone = (subscription) => {
  const status = String(subscription?.status || '').toLowerCase();
  const days = calcDaysRemaining(subscription?.endDate);
  if (status !== 'active' || days <= 0) return { label: 'Expired', color: 'error' };
  if (days <= 7) return { label: `Pro — ${days} days`, color: 'warning' };
  return { label: `Pro — ${days} days`, color: 'success' };
};

function SubscriptionPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('6month');
  const [paymentForm, setPaymentForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [formError, setFormError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const selectedPlanCard = useMemo(
    () => PLAN_CATALOG.find((item) => item.planType === selectedPlan) || PLAN_CATALOG[1],
    [selectedPlan],
  );

  const loadSubscription = async () => {
    try {
      const { data } = await getMySubscription();
      setSubscription(data?.data || null);
    } catch (error) {
      setToast({
        open: true,
        severity: 'error',
        message: error?.response?.data?.message || 'Failed to load subscription.',
      });
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSubscription();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isActive = String(subscription?.status || '') === 'active' && calcDaysRemaining(subscription?.endDate) > 0;
  const tone = getSubscriptionTone(subscription);

  const validatePayment = () => {
    const holder = String(paymentForm.cardholderName || '').trim();
    const cardDigits = String(paymentForm.cardNumber || '').replace(/\D/g, '');
    const expiryRaw = String(paymentForm.expiry || '').trim();
    const cvvDigits = String(paymentForm.cvv || '').replace(/\D/g, '');

    if (!holder) return 'Cardholder name is required.';
    if (cardDigits.length !== 16) return 'Card number must contain 16 digits.';
    if (!/^\d{2}\/\d{2}$/.test(expiryRaw)) return 'Expiry must be in MM/YY format.';
    const [mm, yy] = expiryRaw.split('/').map((item) => Number(item));
    if (!mm || mm < 1 || mm > 12) return 'Expiry month is invalid.';
    const now = new Date();
    const currentYY = Number(String(now.getFullYear()).slice(-2));
    const currentMM = now.getMonth() + 1;
    if (yy < currentYY || (yy === currentYY && mm < currentMM)) return 'Card expiry has passed.';
    if (cvvDigits.length < 3 || cvvDigits.length > 4) return 'CVV must be 3 or 4 digits.';
    return '';
  };

  const handlePay = async () => {
    const validationMessage = validatePayment();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      const last4 = String(paymentForm.cardNumber || '').replace(/\D/g, '').slice(-4);
      await createMySubscription({
        planType: selectedPlan,
        paymentMethod: 'card',
        last4,
      });
      await loadSubscription();
      setSuccessOpen(true);
      setTimeout(() => {
        navigate(ROUTES.USER_DASHBOARD, { replace: true });
      }, 900);
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Failed to activate subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (planType) => {
    try {
      setSubmitting(true);
      await renewMySubscription({
        planType,
        paymentMethod: 'card',
        last4: '4242',
      });
      await loadSubscription();
      setToast({ open: true, message: 'Subscription renewed successfully.', severity: 'success' });
    } catch (error) {
      setToast({
        open: true,
        message: error?.response?.data?.message || 'Failed to renew subscription.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      await cancelMySubscription();
      await loadSubscription();
      setToast({ open: true, message: 'Subscription cancelled.', severity: 'success' });
    } catch (error) {
      setToast({
        open: true,
        message: error?.response?.data?.message || 'Failed to cancel subscription.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAutoRenew = async (nextValue) => {
    try {
      await toggleMySubscriptionAutoRenew(nextValue);
      setSubscription((prev) => (prev ? { ...prev, autoRenew: nextValue } : prev));
      setToast({ open: true, message: 'Auto-renew updated.', severity: 'success' });
    } catch (error) {
      setToast({
        open: true,
        message: error?.response?.data?.message || 'Failed to update auto-renew.',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: 'text.secondary' }}>Loading subscription...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1080, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <WorkspacePremiumRoundedIcon color="primary" />
        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
          Subscription
        </Typography>
      </Stack>
      <Typography sx={{ color: 'text.secondary', mb: 2.2 }}>
        Choose a plan to unlock full member access across workouts, progress, coaches, and dietitian features.
      </Typography>

      {isActive ? (
        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Stack spacing={1.4}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem' }}>
                  Active Plan: {String(subscription?.planType || '').replace('month', ' Months')}
                </Typography>
                <Chip color={tone.color} label={tone.label} />
              </Stack>

              <Typography sx={{ color: 'text.secondary' }}>
                Ends on {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Total Paid for current cycle: {formatLkr(subscription?.price)}
              </Typography>

              <FormControlLabel
                control={(
                  <Switch
                    checked={Boolean(subscription?.autoRenew)}
                    onChange={(event) => handleToggleAutoRenew(event.target.checked)}
                  />
                )}
                label="Auto-renew"
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => handleRenew(subscription?.planType || '6month')}
                  disabled={submitting}
                >
                  Renew Current Plan
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel Plan
                </Button>
              </Stack>

              <Divider />

              <Typography sx={{ fontWeight: 800 }}>Payment History</Typography>
              <Stack spacing={1}>
                {(Array.isArray(subscription?.paymentHistory) ? subscription.paymentHistory : []).length === 0 && (
                  <Typography sx={{ color: 'text.secondary' }}>No payments yet.</Typography>
                )}
                {(Array.isArray(subscription?.paymentHistory) ? subscription.paymentHistory : [])
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <Box
                      key={`${entry.date}-${index}`}
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between">
                        <Typography sx={{ fontWeight: 700 }}>
                          {formatLkr(entry.amount)} via {String(entry.method || '').toUpperCase()}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                        </Typography>
                      </Stack>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        Card: **** **** **** {entry.last4}
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {subscription && (
            <Alert severity="warning">
              Your previous plan is {String(subscription.status || 'expired')}. Select a new plan to continue.
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {PLAN_CATALOG.map((plan) => {
              const isSelected = selectedPlan === plan.planType;
              return (
                <Card
                  key={plan.planType}
                  onClick={() => setSelectedPlan(plan.planType)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2.2,
                    border: '2px solid',
                    borderColor: plan.recommended
                      ? (isSelected ? '#16a34a' : '#86efac')
                      : (isSelected ? 'primary.main' : 'divider'),
                    boxShadow: isSelected ? '0 10px 26px rgba(16,185,129,0.18)' : 'none',
                  }}
                >
                  <CardContent>
                    <Stack spacing={0.6}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{plan.title}</Typography>
                        {plan.recommended && <Chip size="small" color="success" label="Recommended" />}
                      </Stack>
                      <Typography sx={{ color: 'text.secondary' }}>{formatLkr(plan.monthlyPrice)}/month</Typography>
                      <Typography sx={{ fontWeight: 800 }}>Pay {formatLkr(toTotal(plan.planType))}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Card sx={{ borderRadius: 2.2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack spacing={1.4}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CreditCardRoundedIcon color="primary" />
                  <Typography sx={{ fontWeight: 800 }}>
                    Payment Details ({selectedPlanCard?.title} - {formatLkr(toTotal(selectedPlan))})
                  </Typography>
                </Stack>

                <TextField
                  label="Cardholder Name"
                  value={paymentForm.cardholderName}
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, cardholderName: event.target.value }))}
                />
                <TextField
                  label="Card Number"
                  value={paymentForm.cardNumber}
                  onChange={(event) => setPaymentForm((prev) => ({
                    ...prev,
                    cardNumber: normalizeCardNumber(event.target.value),
                  }))}
                  placeholder="4242 4242 4242 4242"
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    label="Expiry (MM/YY)"
                    value={paymentForm.expiry}
                    onChange={(event) => setPaymentForm((prev) => ({
                      ...prev,
                      expiry: normalizeExpiry(event.target.value),
                    }))}
                    placeholder="08/28"
                    fullWidth
                  />
                  <TextField
                    label="CVV"
                    value={paymentForm.cvv}
                    onChange={(event) => setPaymentForm((prev) => ({
                      ...prev,
                      cvv: String(event.target.value || '').replace(/\D/g, '').slice(0, 4),
                    }))}
                    fullWidth
                  />
                </Stack>

                {formError && <Alert severity="error">{formError}</Alert>}

                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePay}
                  disabled={submitting}
                  sx={{ textTransform: 'none', fontWeight: 800 }}
                >
                  {submitting ? 'Processing...' : `Pay ${formatLkr(toTotal(selectedPlan))}`}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Snackbar
        open={successOpen}
        autoHideDuration={1200}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert icon={<CheckCircleRoundedIcon />} severity="success" variant="filled">
          Payment successful. Subscription activated.
        </Alert>
      </Snackbar>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SubscriptionPage;
