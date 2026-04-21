import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Link,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROUTES } from '@/shared/utils/constants';
import UserPromotionsPopup from '@/features/user/components/UserPromotionsPopup';

const MotionBox = motion(Box);

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1761971975769-97e598bf526b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBneW0lMjBlcXVpcG1lbnQlMjB3b3Jrb3V0fGVufDF8fHx8MTc3MjkxOTI2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1687521278757-aed659b751e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwc3R1ZGlvJTIwc3RyZW5ndGglMjB0cmFpbmluZ3xlbnwxfHx8fDE3NzI5MTkyNjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1758875569414-120ebc62ada3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluZXIlMjBjb2FjaGluZyUyMHNlc3Npb258ZW58MXx8fHwxNzcyODk4OTUzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1606859191214-25806e8e2423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbnV0cml0aW9uJTIwbWVhbCUyMHByZXB8ZW58MXx8fHwxNzcyODU5OTMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1758875570256-6510adffb1de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9zc2ZpdCUyMHRyYWluaW5nJTIwZ3JvdXAlMjB3b3Jrb3V0fGVufDF8fHx8MTc3MjkxOTI2NXww&ixlib=rb-4.1.0&q=80&w=1080',
];

const SERVICES = [
  {
    title: 'Coach Booking',
    description: 'Book certified coaches for personalized workout sessions and goal-based guidance',
    image:
      'https://images.unsplash.com/photo-1574269252556-89926e7c5805?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3Jrb3V0JTIwcGxhbm5pbmclMjBmaXRuZXNzJTIwcGxhbnxlbnwxfHx8fDE3NzI5MTkyNjh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: FitnessCenterIcon,
    link: ROUTES.USER_COACHES,
  },
  {
    title: 'Nutrition Consultation',
    description: 'Expert diet plans tailored to your fitness journey',
    image:
      'https://images.unsplash.com/photo-1740560052706-fd75ee856b44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXRyaXRpb24lMjBkaWV0aWNpYW4lMjBjb25zdWx0YXRpb258ZW58MXx8fHwxNzcyOTE5MjY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: RestaurantOutlinedIcon,
    link: ROUTES.USER_DIETITIANS,
  },
  {
    title: 'Workout Planning',
    description: 'Personalized training programs designed for your goals',
    image:
      'https://images.unsplash.com/photo-1758875569414-120ebc62ada3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMHRyYWluaW5nJTIwc2Vzc2lvbiUyMGd5bXxlbnwxfHx8fDE3NzI5MTkyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: TrackChangesOutlinedIcon,
    link: ROUTES.USER_WORKOUTS,
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your fitness journey with detailed analytics',
    image:
      'https://images.unsplash.com/photo-1764313521531-8308a2395333?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib2R5JTIwY29tcG9zaXRpb24lMjBhbmFseXNpcyUyMGZpdG5lc3N8ZW58MXx8fHwxNzcyOTE5MjcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    icon: MonitorHeartOutlinedIcon,
    link: ROUTES.USER_PROGRESS,
  },
  {
    title: 'Meal Plans',
    description: 'Access dietitian meal plans and build your own daily nutrition schedule',
    image:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    icon: RestaurantOutlinedIcon,
    link: ROUTES.USER_MEAL_PLAN,
  },
  {
    title: 'Ads & Promotions',
    description: 'Explore limited-time gym discounts, personal training offers, and class deals',
    image:
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    icon: CampaignRoundedIcon,
    link: ROUTES.USER_ADS_PROMOTIONS,
  },
  {
    title: 'Book Your Locker',
    description: 'Request available lockers in your branch and get approval updates from admin.',
    image:
      'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    icon: LockRoundedIcon,
    link: ROUTES.USER_LOCKERS,
  },
];

const STATS = [
  { icon: FitnessCenterIcon, value: '500+', label: 'Premium Equipment', tone: '#84cc16' },
  { icon: GroupsOutlinedIcon, value: '50+', label: 'Expert Trainers', tone: '#14b8a6' },
  { icon: AccessTimeOutlinedIcon, value: '24/7', label: 'Access Available', tone: '#84cc16' },
  { icon: TrackChangesOutlinedIcon, value: '1000+', label: 'Success Stories', tone: '#14b8a6' },
];

function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPromotionsPopupOpen, setIsPromotionsPopupOpen] = useState(false);
  const promoPopupSessionKey = `gympro.promoPopupSeen.${String(user?.id || 'guest')}`;

  const colors = {
    pageBg: theme.palette.background.default,
    sectionBg: isDark ? '#0d1627' : '#f6f8fc',
    cardBg: theme.palette.background.paper,
    cardBorder: isDark ? '#24334b' : '#edf2fa',
    heading: theme.palette.text.primary,
    body: theme.palette.text.secondary,
    softShadow: isDark
      ? '0 14px 34px rgba(1, 8, 20, 0.55)'
      : '0 14px 34px rgba(19, 31, 53, 0.12)',
    imageShadow: isDark
      ? '0 24px 48px rgba(0, 0, 0, 0.58)'
      : '0 24px 48px rgba(20, 37, 66, 0.22)',
    floatingBg: isDark ? '#13213a' : '#ffffff',
    footerBg: isDark ? '#070d19' : '#0f1727',
    footerMuted: isDark ? '#8fa0bd' : '#9ca8be',
    footerSoft: isDark ? '#8597b5' : '#93a0b5',
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.role !== 'user') return undefined;
    try {
      if (sessionStorage.getItem(promoPopupSessionKey) === '1') return undefined;
    } catch {
      // ignore storage read issues
    }

    const timeout = setTimeout(() => {
      setIsPromotionsPopupOpen(true);
      try {
        sessionStorage.setItem(promoPopupSessionKey, '1');
      } catch {
        // ignore storage write issues
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [user?.role, promoPopupSessionKey]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (
      prevIndex === 0 ? HERO_IMAGES.length - 1 : prevIndex - 1
    ));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
  };

  const closePromotionsPopup = () => {
    setIsPromotionsPopupOpen(false);
  };

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: colors.pageBg }}>
      <Box sx={{ position: 'relative', height: { xs: '62vh', md: '70vh' }, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <MotionBox
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ position: 'absolute', inset: 0 }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${HERO_IMAGES[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)' }} />
              <Stack
                sx={{
                  position: 'relative',
                  height: '100%',
                  px: 3,
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <MotionBox
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Typography
                    sx={{
                      color: '#ffffff',
                      fontWeight: 800,
                      lineHeight: 1,
                      fontSize: { xs: '2.2rem', md: '4.6rem' },
                      mb: 2.3,
                      letterSpacing: 0.5,
                    }}
                  >
                    TRANSFORM YOUR BODY
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      maxWidth: 850,
                      mx: 'auto',
                      mb: 3.8,
                      fontSize: { xs: '1rem', md: '1.45rem' },
                    }}
                  >
                    Welcome back, {user?.name || 'Member'}. Train with state-of-the-art
                    equipment and expert guidance built around your goals.
                  </Typography>
                  <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => navigate(ROUTES.USER_WORKOUTS)}
                      variant="contained"
                      sx={{
                        bgcolor: '#84cc16',
                        px: 4.2,
                        py: 1.5,
                        borderRadius: 2,
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1.03rem',
                        '&:hover': { bgcolor: '#65a30d' },
                      }}
                    >
                      Book Your Session
                    </Button>
                  </MotionBox>
                </MotionBox>
              </Stack>
            </Box>
          </MotionBox>
        </AnimatePresence>

        <IconButton
          onClick={handlePrevImage}
          sx={{
            position: 'absolute',
            left: { xs: 8, md: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(255,255,255,0.22)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.34)' },
          }}
        >
          <KeyboardArrowLeftRoundedIcon />
        </IconButton>
        <IconButton
          onClick={handleNextImage}
          sx={{
            position: 'absolute',
            right: { xs: 8, md: 16 },
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(255,255,255,0.22)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.34)' },
          }}
        >
          <KeyboardArrowRightRoundedIcon />
        </IconButton>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {HERO_IMAGES.map((_, index) => (
            <Box
              key={index}
              component="button"
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              sx={{
                border: 0,
                cursor: 'pointer',
                width: index === currentImageIndex ? 30 : 12,
                height: 12,
                borderRadius: 20,
                transition: 'all 0.25s ease',
                bgcolor: index === currentImageIndex ? '#84cc16' : 'rgba(255,255,255,0.6)',
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 8, md: 12 } }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          sx={{ textAlign: 'center', mb: 6.5 }}
        >
          <Typography sx={{ fontSize: { xs: '2rem', md: '3.2rem' }, fontWeight: 800, mb: 1.4 }}>
            Our Services
          </Typography>
          <Typography sx={{ color: colors.body, fontSize: { xs: '1rem', md: '1.28rem' }, maxWidth: 760, mx: 'auto' }}>
            Comprehensive fitness solutions designed to help you achieve your goals
          </Typography>
        </MotionBox>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <MotionBox
                key={service.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                whileHover={{ y: -8, scale: 1.01 }}
                onClick={() => {
                  if (service.link) {
                    navigate(service.link);
                  }
                }}
                sx={{
                  cursor: service.link ? 'pointer' : 'default',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: colors.softShadow,
                  border: `1px solid ${colors.cardBorder}`,
                  bgcolor: colors.cardBg,
                  position: 'relative',
                }}
              >
                <Box sx={{ position: 'relative', height: 260, overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
                    }}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.68) 100%)',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#84cc16',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                    }}
                  >
                    <Icon />
                  </Box>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: '1.55rem', fontWeight: 800, mb: 1, color: colors.heading }}>
                    {service.title}
                  </Typography>
                  <Typography sx={{ color: colors.body, lineHeight: 1.6 }}>
                    {service.description}
                  </Typography>
                </CardContent>

                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    height: 4,
                    width: '100%',
                    bgcolor: '#84cc16',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '.MuiBox-root:hover > &': { opacity: 1 },
                  }}
                />
              </MotionBox>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ bgcolor: colors.sectionBg, py: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            maxWidth: 1240,
            mx: 'auto',
            px: { xs: 2, md: 3 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 4.5, md: 6 },
            alignItems: 'center',
          }}
        >
          <MotionBox
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <Typography sx={{ fontSize: { xs: '2rem', md: '3.1rem' }, fontWeight: 800, lineHeight: 1.15, mb: 2.2 }}>
              Why Choose <Box component="span" sx={{ color: '#84cc16' }}>GymPro Coach</Box>?
            </Typography>
            <Typography sx={{ color: colors.body, fontSize: '1.06rem', lineHeight: 1.85, mb: 2.2 }}>
              At GymPro Coach, we believe fitness is more than just exercise, it is a lifestyle.
              Our state-of-the-art facilities, expert trainers, and personalized programs are
              designed to help you reach peak performance.
            </Typography>
            <Typography sx={{ color: colors.body, fontSize: '1.06rem', lineHeight: 1.85, mb: 3.5 }}>
              Whether you are starting out or pushing your limits, our approach combines strength
              training, nutrition guidance, and ongoing support to ensure long-term progress.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2.4,
              }}
            >
              {STATS.map((item) => {
                const Icon = item.icon;
                return (
                  <Stack key={item.label} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        mt: 0.2,
                        width: 38,
                        height: 38,
                        borderRadius: 1.5,
                        bgcolor: item.tone,
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: 21 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.28rem', color: colors.heading }}>{item.value}</Typography>
                      <Typography sx={{ color: colors.body, fontSize: '0.94rem' }}>{item.label}</Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            sx={{ position: 'relative' }}
          >
            <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: colors.imageShadow }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1687521278757-aed659b751e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwc3R1ZGlvJTIwc3RyZW5ndGglMjB0cmFpbmluZ3xlbnwxfHx8fDE3NzI5MTkyNjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Gym interior"
                loading="lazy"
                sx={{ width: '100%', height: { xs: 360, md: 500 }, objectFit: 'cover', display: 'block' }}
              />
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.56) 100%)' }} />
            </Card>

            <MotionBox
              initial={{ y: 16, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.5 }}
              sx={{
                position: 'absolute',
                left: { xs: 12, md: -28 },
                bottom: { xs: -24, md: -30 },
                bgcolor: colors.floatingBg,
                p: 2.4,
                borderRadius: 2.5,
                boxShadow: isDark ? '0 16px 30px rgba(0, 0, 0, 0.45)' : '0 16px 30px rgba(24, 47, 86, 0.18)',
              }}
            >
              <Stack direction="row" spacing={1.4} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#84cc16',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <MonitorHeartOutlinedIcon sx={{ fontSize: 30 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: colors.heading }}>98%</Typography>
                  <Typography sx={{ color: colors.body }}>Member Satisfaction</Typography>
                </Box>
              </Stack>
            </MotionBox>
          </MotionBox>
        </Box>
      </Box>

      <Box component="footer" sx={{ bgcolor: colors.footerBg, color: '#fff', py: { xs: 8, md: 10 } }}>
        <Box sx={{ maxWidth: 1240, mx: 'auto', px: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1fr 1fr 1.2fr' },
              gap: 5,
              mb: 6,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: '#84cc16', mb: 1.8 }}>
                GymPro Coach
              </Typography>
              <Typography sx={{ color: colors.footerMuted, mb: 2.5, lineHeight: 1.7 }}>
                Your fitness destination for achieving peak performance and long-term wellness.
              </Typography>
              <Stack direction="row" spacing={1.2}>
                {[FacebookRoundedIcon, InstagramIcon, XIcon].map((Icon, index) => (
                  <MotionBox key={index} whileHover={{ scale: 1.08, y: -2 }}>
                    <Box
                      component="a"
                      href="#"
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: isDark ? '#1a2740' : '#1f2939',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        '&:hover': { bgcolor: '#84cc16' },
                      }}
                    >
                      <Icon sx={{ fontSize: 19 }} />
                    </Box>
                  </MotionBox>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>Quick Links</Typography>
              <Stack spacing={1.2}>
                {['About Us', 'Services', 'Pricing', 'Careers'].map((item) => (
                  <Link key={item} href="#" underline="none" sx={{ color: colors.footerMuted, '&:hover': { color: '#84cc16' } }}>
                    {item}
                  </Link>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>Support</Typography>
              <Stack spacing={1.2}>
                {[
                  { label: 'Help Center', route: '' },
                  { label: 'FAQs', route: ROUTES.USER_FAQS },
                  { label: 'Privacy Policy', route: '' },
                  { label: 'Terms of Service', route: '' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href="#"
                    onClick={(e) => {
                      if (!item.route) return;
                      e.preventDefault();
                      navigate(item.route);
                    }}
                    underline="none"
                    sx={{ color: colors.footerMuted, '&:hover': { color: '#84cc16' } }}
                  >
                    {item.label}
                  </Link>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>Contact Us</Typography>
              <Stack spacing={1.6}>
                <Stack direction="row" spacing={1.2} alignItems="flex-start">
                  <LocationOnOutlinedIcon sx={{ color: '#84cc16', mt: 0.2 }} />
                  <Typography sx={{ color: colors.footerMuted }}>
                    123 Fitness Street, Health City, HC 12345
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <PhoneOutlinedIcon sx={{ color: '#84cc16' }} />
                  <Typography sx={{ color: colors.footerMuted }}>+1 (555) 123-4567</Typography>
                </Stack>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <MailOutlineIcon sx={{ color: '#84cc16' }} />
                  <Typography sx={{ color: colors.footerMuted }}>info@gymprocoach.com</Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: `1px solid ${isDark ? '#2a3a57' : '#263246'}`,
              pt: 3.3,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.8,
            }}
          >
            <Typography sx={{ color: colors.footerSoft, fontSize: '0.9rem' }}>
              © 2026 GymPro Coach. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              {['Privacy', 'Terms', 'Cookies'].map((item) => (
                <Link key={item} href="#" underline="none" sx={{ color: colors.footerSoft, fontSize: '0.9rem', '&:hover': { color: '#84cc16' } }}>
                  {item}
                </Link>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>

      <UserPromotionsPopup
        open={isPromotionsPopupOpen}
        onClose={closePromotionsPopup}
        placement="Dashboard Hero"
      />
    </Box>
  );
}

export default UserDashboard;
