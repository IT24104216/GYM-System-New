import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';

function DietitianMembersPanel({
  cardBodyColor,
  cardTitleColor,
  displayedMembers,
  linkColor,
  mutedText,
  onOpenDietPlan,
  onViewAll,
  panelBg,
  panelBorder,
  savedDietPlans,
  sectionTitleColor,
}) {
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.3 }}>
        <Typography sx={{ color: sectionTitleColor, fontWeight: 700, fontSize: '1rem' }}>
          Members
        </Typography>
        <Button
          onClick={onViewAll}
          sx={{
            textTransform: 'none',
            color: linkColor,
            fontWeight: 700,
            p: 0,
            minWidth: 0,
          }}
          endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 16 }} />}
        >
          View all
        </Button>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {displayedMembers.map((member) => {
          const memberPlan = savedDietPlans[member.id];
          return (
            <Box
              key={member.id}
              sx={{
                background: panelBg,
                border: '1px solid',
                borderColor: panelBorder,
                borderRadius: 2,
                p: 2.4,
                minHeight: 330,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography sx={{ color: cardTitleColor, fontWeight: 800, fontSize: '1.85rem', mb: 0.5 }}>
                {member.name}
              </Typography>
              <Typography sx={{ color: mutedText, fontSize: '1.02rem', mb: 2.2 }}>
                Member since {member.joinedDate}
              </Typography>

              <Typography sx={{ color: cardBodyColor, fontSize: '1.03rem', lineHeight: 1.6 }}>
                Age: {member.age} years
                <br />
                Weight: {member.weight} kg
                <br />
                Height: {member.height} cm
                <br />
                Goal: {member.goal}
              </Typography>

              {memberPlan && (
                <Chip
                  label={memberPlan.isSubmitted ? 'Published' : 'Draft'}
                  size="small"
                  sx={{
                    mt: 1.2,
                    alignSelf: 'flex-start',
                    fontWeight: 800,
                    bgcolor: memberPlan.isSubmitted ? '#22c55e1f' : '#f59e0b1f',
                    color: memberPlan.isSubmitted ? '#22c55e' : '#f59e0b',
                  }}
                />
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={() => onOpenDietPlan(member)}
                sx={{
                  mt: 'auto',
                  pt: 1.9,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 1.8,
                  backgroundColor: '#f30612',
                  '&:hover': { backgroundColor: '#cf0812' },
                }}
              >
                {memberPlan ? (memberPlan.isSubmitted ? 'View Plan' : 'Edit Draft') : 'Create Diet Plan'}
              </Button>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

export default DietitianMembersPanel;
