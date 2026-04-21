import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { getPublicPromotions } from '@/features/user/api/user.api';
import { ROUTES } from '@/shared/utils/constants';

const MotionBox = motion(Box);
const ITEMS_PER_PAGE = 6;

function UserAdsPromotions() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [promotions, setPromotions] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const { data } = await getPublicPromotions({ limit: 10, placement: 'Promotions Page' });
        const rows = Array.isArray(data?.data) ? data.data : [];
        setPromotions(rows.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.status === 'ACTIVE' ? 'LIMITED OFFER' : 'SPECIAL DEAL',
          description: item.description || '',
          cta: 'View Offer',
          badge: item.target || 'Live',
          image: item.image || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
          link: item.link || ROUTES.USER_ADS_PROMOTIONS,
        })));
      } catch {
        setPromotions([]);
      }
    };

    loadPromotions();
  }, []);

  const pageCount = Math.max(1, Math.ceil(promotions.length / ITEMS_PER_PAGE));
  const activePage = Math.min(page, pageCount);
  const visiblePromotions = promotions.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );

  return (
    <Box sx={{ px: { xs: 1.5, md: 2.2 }, py: { xs: 1.4, md: 2.2 } }}>
      <MotionBox
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42 }}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3.2,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(120deg, rgba(236,72,153,0.16) 0%, rgba(168,85,247,0.08) 42%, rgba(56,189,248,0.16) 100%)',
          mb: 2.2,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} justifyContent="space-between" alignItems={{ md: 'center' }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocalOfferRoundedIcon sx={{ color: '#ec4899' }} />
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', md: '2.15rem' } }}>
                Ads & Promotions
              </Typography>
            </Stack>
            <Typography sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 680 }}>
              Discover exclusive gym offers, class discounts, and nutrition bundles curated for your goals.
            </Typography>
          </Box>
          <Chip
            icon={<BoltRoundedIcon />}
            label="Live Offers"
            sx={{ fontWeight: 800, bgcolor: 'rgba(244,114,182,0.18)', color: '#be185d', alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        </Stack>
      </MotionBox>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        {visiblePromotions.map((item, index) => (
          <MotionBox
            key={item.id}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: index * 0.08 }}
            whileHover={{ y: -8 }}
          >
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box sx={{ position: 'relative', height: 210 }}>
                <Box
                  component="img"
                  src={item.image}
                  alt={item.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)',
                  }}
                />
                <Chip
                  label={item.badge}
                  sx={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    fontWeight: 700,
                    bgcolor: isDark ? 'rgba(248, 250, 252, 0.94)' : 'rgba(255,255,255,0.86)',
                    color: isDark ? '#0f172a' : '#111827',
                    border: isDark ? '1px solid rgba(148, 163, 184, 0.65)' : '1px solid rgba(17, 24, 39, 0.08)',
                  }}
                />
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '1.35rem' }}>{item.title}</Typography>
                <Typography sx={{ fontWeight: 800, color: '#ec4899', mt: 0.35 }}>{item.subtitle}</Typography>
                <Typography sx={{ color: 'text.secondary', mt: 1.1, minHeight: 56 }}>{item.description}</Typography>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    mt: 1.4,
                    borderRadius: 99,
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#ec4899',
                    '&:hover': { bgcolor: '#db2777' },
                  }}
                >
                  {item.cta}
                </Button>
              </CardContent>
            </Card>
          </MotionBox>
        ))}
      </Box>

      {promotions.length > ITEMS_PER_PAGE && (
        <Stack sx={{ mt: 2.5 }} alignItems="center">
          <Pagination
            count={pageCount}
            page={activePage}
            onChange={(_, value) => setPage(value)}
            shape="rounded"
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
              },
            }}
          />
        </Stack>
      )}
    </Box>
  );
}

export default UserAdsPromotions;
