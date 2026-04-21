import { Box, Typography } from '@mui/material';

function CalorieTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload || {};

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 2,
        px: 1.5,
        py: 1.1,
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)',
      }}
    >
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
        {point.fullDate || label}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: '0.88rem', fontWeight: 800, color: '#84cc16', lineHeight: 1.2 }}>
        cals : {payload[0].value}
      </Typography>
      {Number(point.mealCount || 0) > 0 && (
        <Typography sx={{ mt: 0.35, fontSize: '0.78rem', fontWeight: 700, color: '#334155', lineHeight: 1.2 }}>
          meals: {point.mealCount} | P {point.protein || 0}g | C {point.carbs || 0}g | F {point.fat || 0}g
        </Typography>
      )}
    </Box>
  );
}

export default CalorieTooltip;
