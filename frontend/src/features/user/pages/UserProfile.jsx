import { Box, Typography } from '@mui/material';
import PageHeader from '@/shared/components/ui/PageHeader';

function UserProfile() {
  return (
    <Box>
      <PageHeader title="My Profile" subtitle="View and update your personal information." />
      <Typography color="text.secondary">
        Profile details will be shown here.
      </Typography>
    </Box>
  );
}

export default UserProfile;
