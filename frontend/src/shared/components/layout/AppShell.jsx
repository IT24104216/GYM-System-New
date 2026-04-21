import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 240;

function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const location = useLocation();
  const isUserRoute = location.pathname.startsWith('/user/');

  const handleMenuClick = () => setMobileOpen((prev) => !prev);
  const handleDrawerClose = () => setMobileOpen(false);
  const handleHideSidebar = () => setSidebarHidden(true);
  const handleShowSidebar = () => setSidebarHidden(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar
        onMenuClick={handleMenuClick}
        showSidebarButton={!isUserRoute && sidebarHidden}
        onShowSidebar={handleShowSidebar}
        sidebarHidden={sidebarHidden}
      />
      {!isUserRoute && !sidebarHidden && (
        <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerClose} onHide={handleHideSidebar} />
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isUserRoute ? 0 : 3,
          width: { sm: isUserRoute || sidebarHidden ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default AppShell;
