import { Box, CircularProgress } from '@mui/material';

function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress color="secondary" size={48} />
    </Box>
  );
}

export default LoadingSpinner;
