import FreeBreakfastRoundedIcon from '@mui/icons-material/FreeBreakfastRounded';
import LunchDiningRoundedIcon from '@mui/icons-material/LunchDiningRounded';
import DinnerDiningRoundedIcon from '@mui/icons-material/DinnerDiningRounded';
import IcecreamRoundedIcon from '@mui/icons-material/IcecreamRounded';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const yAxisTicks = [650, 1300, 1950, 2600];

export const toIsoDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const shiftIsoDate = (isoDate, offsetDays) => {
  const base = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return isoDate;
  base.setDate(base.getDate() + Number(offsetDays || 0));
  return toIsoDate(base);
};

export const mealSectionConfig = {
  breakfast: { label: 'Breakfast', icon: FreeBreakfastRoundedIcon, tone: '#d97706', bg: '#fef3c7' },
  lunch: { label: 'Lunch', icon: LunchDiningRoundedIcon, tone: '#059669', bg: '#d1fae5' },
  dinner: { label: 'Dinner', icon: DinnerDiningRoundedIcon, tone: '#2563eb', bg: '#dbeafe' },
  snacks: { label: 'Snacks', icon: IcecreamRoundedIcon, tone: '#7c3aed', bg: '#ede9fe' },
};

export const mealSectionOrder = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const formatSuggestionSource = (source) => {
  const value = String(source || '').trim().toLowerCase();
  if (!value) return 'Unknown';
  if (value === 'usda') return 'USDA';
  if (value.includes('sri-lanka') || value.includes('local')) return 'Local DB';
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};
