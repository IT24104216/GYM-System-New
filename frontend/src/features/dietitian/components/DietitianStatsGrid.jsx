import { Box, Stack, Typography } from '@mui/material';

function DietitianStatsGrid({
  stats,
  panelBg,
  panelBorder,
  subtitleColor,
  cardTitleColor,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4, minmax(0, 1fr))' },
        gap: 2,
        mb: 2.5,
      }}
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Box
            key={stat.label}
            sx={{
              background: panelBg,
              border: '1px solid',
              borderColor: panelBorder,
              borderRadius: 2,
              p: 2.2,
              minHeight: 126,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography sx={{ color: subtitleColor, fontWeight: 600, fontSize: '1.05rem' }}>
                {stat.label}
              </Typography>
              <Icon sx={{ color: '#ff3048', fontSize: 18 }} />
            </Stack>
            <Typography sx={{ color: cardTitleColor, fontWeight: 800, fontSize: '2.2rem', lineHeight: 1 }}>
              {stat.value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default DietitianStatsGrid;
