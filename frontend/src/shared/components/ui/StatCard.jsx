import { createElement } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

/**
 * @param {{
 *   icon: React.ElementType,
 *   label: string,
 *   value: string | number,
 *   trend?: 'up' | 'down',
 *   trendLabel?: string,
 *   color?: string,
 * }} props
 */
function StatCard({ icon: Icon, label, value, trend, trendLabel, color = 'primary.main' }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: `${color}18`,
              color,
              mr: 1.5,
            }}
          >
            {createElement(Icon, { fontSize: 'small' })}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
        {trend && trendLabel && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
            {trend === 'up' ? (
              <TrendingUpIcon fontSize="small" color="success" />
            ) : (
              <TrendingDownIcon fontSize="small" color="error" />
            )}
            <Typography variant="caption" color={trend === 'up' ? 'success.main' : 'error.main'}>
              {trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
