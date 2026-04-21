import { Box, Button, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROLE_HOME } from '@/shared/utils/constants';

function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user?.role) {
      navigate(ROLE_HOME[user.role], { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <LockIcon sx={{ fontSize: 72, color: 'error.light' }} />
      <Typography variant="h4" fontWeight={700}>
        403 — Access Denied
      </Typography>
      <Typography color="text.secondary" textAlign="center">
        You do not have permission to view this page.
      </Typography>
      <Button variant="contained" onClick={handleGoHome}>
        Go Back
      </Button>
    </Box>
  );
}

export default UnauthorizedPage;
