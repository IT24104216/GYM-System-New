import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/utils/constants';

function NotFoundPage() {
  const navigate = useNavigate();
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
      <ErrorOutlineIcon sx={{ fontSize: 72, color: 'text.disabled' }} />
      <Typography variant="h4" fontWeight={700}>
        404 — Page Not Found
      </Typography>
      <Typography color="text.secondary" textAlign="center">
        The page you are looking for doesn&apos;t exist or has been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate(ROUTES.LOGIN)}>
        Go to Home
      </Button>
    </Box>
  );
}

export default NotFoundPage;
