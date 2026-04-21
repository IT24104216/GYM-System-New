import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';

function DietitianTimeSlotsPanel({
  addTimeSlot,
  getWeekdayLabel,
  isDark,
  isSlotsLoading,
  mutedText,
  openDeleteSlot,
  openEditSlot,
  panelBg,
  panelBorder,
  sectionTitleColor,
  setSlotForm,
  slotError,
  slotForm,
  slotTitleColor,
  subtitleColor,
  timeSlots,
  to12Hour,
}) {
  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          background: panelBg,
          border: '1px solid',
          borderColor: panelBorder,
          borderRadius: 2,
          p: { xs: 1.8, md: 2.3 },
        }}
      >
        <Typography
          sx={{
            color: sectionTitleColor,
            fontWeight: 800,
            fontSize: { xs: '1.35rem', md: '1.75rem' },
          }}
        >
          Create Consultation Time Slot
        </Typography>
        <Typography sx={{ color: subtitleColor, fontSize: { xs: '0.98rem', md: '1.1rem' }, mb: 2.1 }}>
          Available all week
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 1.6,
          }}
        >
          <TextField
            label="Date"
            type="date"
            value={slotForm.date}
            onChange={(e) => setSlotForm((prev) => ({ ...prev, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#d8e7ff',
                borderRadius: 1.5,
                background: isDark ? '#253a5d' : '#f3f8ff',
                '& fieldset': { borderColor: panelBorder },
              },
              '& .MuiInputLabel-root': {
                color: subtitleColor,
                fontSize: '0.9rem',
              },
              '& .MuiInputBase-input': {
                fontSize: '0.98rem',
                fontWeight: 600,
              },
              '& input::-webkit-calendar-picker-indicator': {
                filter: isDark ? 'invert(1) brightness(1.5)' : 'none',
                opacity: 0.95,
                cursor: 'pointer',
              },
            }}
          />
          <TextField
            label="Start Time"
            type="time"
            value={slotForm.startTime}
            onChange={(e) => setSlotForm((prev) => ({ ...prev, startTime: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#d8e7ff',
                borderRadius: 1.5,
                background: isDark ? '#253a5d' : '#f3f8ff',
                '& fieldset': { borderColor: panelBorder },
              },
              '& .MuiInputLabel-root': {
                color: subtitleColor,
                fontSize: '0.9rem',
              },
              '& .MuiInputBase-input': {
                fontSize: '0.98rem',
                fontWeight: 600,
              },
              '& input::-webkit-calendar-picker-indicator': {
                filter: isDark ? 'invert(1) brightness(1.5)' : 'none',
                opacity: 0.95,
                cursor: 'pointer',
              },
            }}
          />
          <TextField
            label="End Time"
            type="time"
            value={slotForm.endTime}
            onChange={(e) => setSlotForm((prev) => ({ ...prev, endTime: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#d8e7ff',
                borderRadius: 1.5,
                background: isDark ? '#253a5d' : '#f3f8ff',
                '& fieldset': { borderColor: panelBorder },
              },
              '& .MuiInputLabel-root': {
                color: subtitleColor,
                fontSize: '0.9rem',
              },
              '& .MuiInputBase-input': {
                fontSize: '0.98rem',
                fontWeight: 600,
              },
              '& input::-webkit-calendar-picker-indicator': {
                filter: isDark ? 'invert(1) brightness(1.5)' : 'none',
                opacity: 0.95,
                cursor: 'pointer',
              },
            }}
          />
        </Box>

        <Typography sx={{ color: subtitleColor, fontSize: '0.98rem', mt: 0.8 }}>
          {getWeekdayLabel(slotForm.date)}
        </Typography>

        {!!slotError && (
          <Typography sx={{ color: '#f87171', mt: 0.8, fontSize: '0.92rem' }}>
            {slotError}
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={addTimeSlot}
          sx={{
            mt: 1.5,
            textTransform: 'none',
            fontWeight: 800,
            borderRadius: 1.4,
            px: 2,
            py: 0.8,
            fontSize: '0.98rem',
            backgroundColor: '#f30612',
            '&:hover': { backgroundColor: '#cf0812' },
          }}
        >
          Add Time Slot
        </Button>
      </Box>

      <Box>
        <Typography sx={{ color: sectionTitleColor, fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, mb: 1.2 }}>
          Your Time Slots
        </Typography>
        <Box
          sx={{
            border: '1px solid',
            borderColor: panelBorder,
            borderRadius: 2,
            background: panelBg,
            p: 2,
            minHeight: 92,
          }}
        >
          {isSlotsLoading ? (
            <Typography sx={{ color: mutedText, textAlign: 'center', mt: 2, fontSize: '1rem' }}>
              Loading time slots...
            </Typography>
          ) : timeSlots.length === 0 ? (
            <Typography sx={{ color: mutedText, textAlign: 'center', mt: 2, fontSize: '1rem' }}>
              No time slots created yet. Add one to get started!
            </Typography>
          ) : (
            <Stack spacing={1.1}>
              {timeSlots.map((slot) => (
                <Box
                  key={slot.id}
                  sx={{
                    border: '1px solid',
                    borderColor: panelBorder,
                    borderRadius: 1.5,
                    p: 1.2,
                    background: isDark ? '#203456' : '#f8fbff',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Box>
                      <Typography sx={{ color: slotTitleColor, fontWeight: 700, fontSize: '1.05rem' }}>
                        {slot.day}, {slot.date}
                      </Typography>
                      <Typography sx={{ color: mutedText, fontSize: '0.95rem' }}>
                        {to12Hour(slot.startTime)} - {to12Hour(slot.endTime)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.8}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                        onClick={() => openEditSlot(slot)}
                        sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0, px: 1.1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />}
                        onClick={() => openDeleteSlot(slot)}
                        sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0, px: 1.1 }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

export default DietitianTimeSlotsPanel;
