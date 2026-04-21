import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Backdrop,
  Box,
  IconButton,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import { getPublicPromotions } from '@/features/user/api/user.api';
import { ROUTES } from '@/shared/utils/constants';

const MotionBox = motion(Box);

function UserPromotionsPopup({ open, onClose, placement = 'Dashboard Hero' }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    if (!open) return undefined;
    const loadPromotions = async () => {
      try {
        const { data } = await getPublicPromotions({ limit: 3, placement });
        const rows = Array.isArray(data?.data) ? data.data : [];
        setSlides(rows.map((item) => ({
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
        setSlides([]);
      }
    };
    loadPromotions();
    return undefined;
  }, [open, placement]);

  useEffect(() => {
    if (!open || slides.length <= 1) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [open, slides.length]);

  if (!slides.length) return null;

  const activeIndex = index >= slides.length ? 0 : index;
  const activeSlide = slides[activeIndex];

  const handleNavigate = () => {
    navigate(activeSlide.link);
    onClose();
  };

  const prev = () => setIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
  const next = () => setIndex((prevIndex) => (prevIndex + 1) % slides.length);

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: 'rgba(2, 8, 20, 0.72)',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: 'min(1040px, 96vw)',
          borderRadius: 3.2,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.45)',
          position: 'relative',
          bgcolor: '#0b1220',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 3,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.35)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <IconButton
          onClick={prev}
          sx={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.28)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.44)' },
          }}
        >
          <KeyboardArrowLeftRoundedIcon />
        </IconButton>
        <IconButton
          onClick={next}
          sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.28)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.44)' },
          }}
        >
          <KeyboardArrowRightRoundedIcon />
        </IconButton>

        <AnimatePresence mode="wait">
          <MotionBox
            key={activeSlide.id}
            initial={{ opacity: 0.2, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            sx={{
              minHeight: { xs: 360, md: 460 },
              backgroundImage: `url(${activeSlide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(90deg, rgba(16,24,40,0.8) 0%, rgba(16,24,40,0.34) 45%, rgba(16,24,40,0.25) 100%)',
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 2, p: { xs: 2, md: 4 }, maxWidth: 560 }}>
              <Typography
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.6,
                  py: 0.45,
                  borderRadius: 1.2,
                  bgcolor: 'rgba(255,255,255,0.88)',
                  color: '#111827',
                  fontWeight: 800,
                  fontSize: { xs: '0.76rem', md: '0.86rem' },
                  mb: 1.8,
                }}
              >
                {activeSlide.badge}
              </Typography>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: { xs: '1.65rem', md: '2.8rem' }, lineHeight: 1.05 }}>
                {activeSlide.title}
              </Typography>
              <Typography sx={{ color: '#f8fafc', fontWeight: 900, fontSize: { xs: '1.15rem', md: '2rem' }, mt: 0.5 }}>
                {activeSlide.subtitle}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.92)', mt: 1.2, mb: 2.2, fontSize: { xs: '0.94rem', md: '1.08rem' } }}>
                {activeSlide.description}
              </Typography>
              <Button
                onClick={handleNavigate}
                variant="contained"
                sx={{
                  borderRadius: 10,
                  textTransform: 'none',
                  fontWeight: 800,
                  px: 2.6,
                  py: 1.05,
                  bgcolor: '#f472b6',
                  '&:hover': { bgcolor: '#ec4899' },
                }}
              >
                {activeSlide.cta}
              </Button>
            </Box>
          </MotionBox>
        </AnimatePresence>

        <Stack
          direction="row"
          spacing={0.9}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
          }}
        >
          {slides.map((item, dotIndex) => (
            <Box
              key={item.id}
              component="button"
              type="button"
              onClick={() => setIndex(dotIndex)}
              sx={{
                width: dotIndex === activeIndex ? 24 : 9,
                height: 9,
                borderRadius: 99,
                border: 0,
                p: 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                bgcolor: dotIndex === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.48)',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Backdrop>
  );
}

export default UserPromotionsPopup;
