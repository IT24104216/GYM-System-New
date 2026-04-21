import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

function DietitianDashboardHeaderControls({
  activeTab,
  setActiveTab,
  inputTextColor,
  isDark,
  mutedText,
  panelBg,
  panelBorder,
  searchText,
  setSearchText,
  subtitleColor,
  tabItems,
}) {
  return (
    <>
      <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: { xs: '1.8rem', md: '2rem' } }}>
        Dietician Dashboard
      </Typography>
      <Typography sx={{ color: subtitleColor, fontSize: '1.05rem', mb: 2.5 }}>
        Manage diet plans and consultations
      </Typography>

      <Stack direction="row" spacing={0.4} sx={{ mb: 2.5, width: 'fit-content', background: panelBg, borderRadius: 99, p: 0.45 }}>
        {tabItems.map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            sx={{
              textTransform: 'none',
              borderRadius: 99,
              px: 1.7,
              py: 0.45,
              minWidth: 0,
              fontWeight: 600,
              color: activeTab === tab ? '#0f172a' : '#a4bad9',
              backgroundColor: activeTab === tab ? '#ffffff' : 'transparent',
            }}
          >
            {tab}
          </Button>
        ))}
      </Stack>

      <TextField
        fullWidth
        placeholder="Search member by name..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          mb: 2.1,
          '& .MuiOutlinedInput-root': {
            color: inputTextColor,
            borderRadius: 1.5,
            background: isDark ? '#1a2a47' : '#f7fbff',
            '& fieldset': { borderColor: panelBorder },
            '&:hover fieldset': { borderColor: panelBorder },
            '&.Mui-focused fieldset': { borderColor: '#4f77b6' },
          },
          '& .MuiInputBase-input::placeholder': { color: mutedText, opacity: 1 },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: mutedText, fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />
    </>
  );
}

export default DietitianDashboardHeaderControls;
