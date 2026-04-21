import { createElement } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { NAV_CONFIG } from '@/shared/config/navConfig';
import { ROLE_HOME } from '@/shared/utils/constants';

const DRAWER_WIDTH = 240;

function SidebarContent({ onHide }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const navItems = NAV_CONFIG[user?.role] || [];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: isDark ? '#0d1627' : '#ffffff',
      }}
    >
      {/* Brand */}
      <Toolbar
        sx={{ cursor: 'pointer' }}
        onClick={() => navigate(ROLE_HOME[user?.role])}
      >
        <FitnessCenterIcon sx={{ color: isDark ? '#ec4899' : 'secondary.main', mr: 1 }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: isDark ? '#93c5fd' : 'primary.main', flexGrow: 1 }}>
          GymPro
        </Typography>
        {onHide && (
          <IconButton
            size="small"
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: isDark ? '#9fb5d8' : 'text.secondary' }}
            onClick={(event) => {
              event.stopPropagation();
              onHide();
            }}
            aria-label="hide sidebar"
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Toolbar>

      {/* Nav links */}
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  color: isDark ? '#dbe7ff' : 'text.primary',
                  '& .MuiListItemIcon-root': {
                    color: isDark ? '#9fb5d8' : 'text.secondary',
                  },
                  '&:hover': {
                    bgcolor: isDark ? '#16243a' : '#f8fafc',
                  },
                  '&.Mui-selected': {
                    bgcolor: isDark ? '#7cbcf0' : 'primary.main',
                    color: isDark ? '#0f172a' : 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: isDark ? '#0f172a' : 'primary.contrastText' },
                    '&:hover': { bgcolor: isDark ? '#6eb2e9' : 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {createElement(Icon, { fontSize: 'small' })}
                </ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

function Sidebar({ mobileOpen, onClose, onHide }) {
  return (
    <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        <SidebarContent onHide={onHide} />
      </Drawer>
    </Box>
  );
}

export default Sidebar;
