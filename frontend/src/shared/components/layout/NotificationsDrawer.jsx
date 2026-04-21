import { motion as Motion } from 'framer-motion';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function NotificationsDrawer({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
  onNotificationClick,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: '100vw', sm: 420 },
          height: '100%',
          p: 2,
          background: isDark
            ? 'radial-gradient(circle at 10% 0%, #1b355b 0%, #0f1e3d 60%, #0b1731 100%)'
            : 'linear-gradient(180deg, #f8fbff 0%, #edf3fb 100%)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, fontSize: '1.25rem' }}>
              Notifications
            </Typography>
            <Typography sx={{ color: isDark ? '#9fb3cf' : '#607aa5', fontSize: '0.85rem' }}>
              {unreadCount} unread
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: isDark ? '#cbd5e1' : '#334155' }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ color: isDark ? '#d7e6fb' : '#334155', fontWeight: 700, fontSize: '0.9rem' }}>
            Recent Updates
          </Typography>
          <Button
            onClick={onMarkAllRead}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: '#14b8a6',
              p: 0,
              minWidth: 0,
            }}
          >
            Mark all as read
          </Button>
        </Stack>

        <Motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Stack spacing={1.2}>
            {notifications.map((notif) => (
              <Motion.div key={notif.id} variants={itemVariants}>
                {(() => {
                  const isHomepagePromotionLink = (
                    notif.type === 'promotion'
                    && notif.entityType === 'promotion-homepage'
                    && notif.actionUrl
                  );
                  return (
                <Box
                  onClick={() => (onNotificationClick ? onNotificationClick(notif) : onMarkRead(notif.id))}
                  sx={{
                    p: 1.3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: notif.read ? (isDark ? '#2b4268' : '#dbe7f6') : '#2dd4bf55',
                    background: notif.read
                      ? (isDark ? '#1a2a47' : '#ffffff')
                      : (isDark ? '#153350' : '#e6fffa'),
                    cursor: isHomepagePromotionLink ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.2}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: notif.read ? '#64748b33' : '#14b8a633',
                        color: notif.read ? '#94a3b8' : '#2dd4bf',
                        flexShrink: 0,
                      }}
                    >
                      <NotificationsRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                        <Typography
                          sx={{
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                          }}
                        >
                          {notif.title}
                        </Typography>
                        <Stack direction="row" spacing={0.4} alignItems="center">
                          <AccessTimeRoundedIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                            {notif.time}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Typography
                        sx={{
                          mt: 0.35,
                          color: isDark ? '#b3c5de' : '#64748b',
                          fontSize: '0.8rem',
                          lineHeight: 1.35,
                        }}
                      >
                        {notif.message}
                      </Typography>
                      {isHomepagePromotionLink && (
                        <Typography
                          sx={{
                            mt: 0.5,
                            color: '#14b8a6',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          Tap to view offer
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
                  );
                })()}
              </Motion.div>
            ))}
          </Stack>
        </Motion.div>
      </Box>
    </Drawer>
  );
}

export default NotificationsDrawer;
