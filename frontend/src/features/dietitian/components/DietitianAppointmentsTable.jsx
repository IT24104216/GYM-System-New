import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

function DietitianAppointmentsTable({
  appointments,
  mutedText,
  onApprove,
  onReject,
  panelBg,
  panelBorder,
  subtitleColor,
}) {
  const priorityMeta = {
    urgent: { label: 'URGENT', fg: '#dc2626', bg: '#fee2e2' },
    normal: { label: 'NORMAL', fg: '#d97706', bg: '#fef3c7' },
    low: { label: 'LOW', fg: '#15803d', bg: '#dcfce7' },
  };
  return (
    <Box
      sx={{
        p: 1.2,
        border: '1px solid',
        borderColor: panelBorder,
        borderRadius: 2,
        background: panelBg,
      }}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }}>Member</TableCell>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }}>Date</TableCell>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }}>Time</TableCell>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }}>Goal</TableCell>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }}>Priority</TableCell>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }}>Status</TableCell>
              <TableCell sx={{ color: subtitleColor, borderBottomColor: panelBorder }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ color: '#e7f0ff', borderBottomColor: panelBorder, fontWeight: 600 }}>
                  {row.member}
                </TableCell>
                <TableCell sx={{ color: mutedText, borderBottomColor: panelBorder }}>{row.date}</TableCell>
                <TableCell sx={{ color: mutedText, borderBottomColor: panelBorder }}>{row.time}</TableCell>
                <TableCell sx={{ color: mutedText, borderBottomColor: panelBorder }}>{row.goal}</TableCell>
                <TableCell sx={{ borderBottomColor: panelBorder }}>
                  <Chip
                    size="small"
                    label={priorityMeta[row.priority]?.label || 'NORMAL'}
                    sx={{
                      fontWeight: 800,
                      color: priorityMeta[row.priority]?.fg || '#d97706',
                      bgcolor: priorityMeta[row.priority]?.bg || '#fef3c7',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ borderBottomColor: panelBorder }}>
                  <Chip
                    size="small"
                    label={row.status}
                    sx={{
                      fontWeight: 700,
                      color:
                        row.status === 'Approved'
                          ? '#22c55e'
                          : row.status === 'Rejected'
                            ? '#ef4444'
                            : '#f59e0b',
                      bgcolor:
                        row.status === 'Approved'
                          ? '#22c55e1a'
                          : row.status === 'Rejected'
                            ? '#ef44441a'
                            : '#f59e0b1a',
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ borderBottomColor: panelBorder }}>
                  {row.rawStatus === 'pending' ? (
                    <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onApprove(row)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          minWidth: 84,
                          bgcolor: '#16a34a',
                          '&:hover': { bgcolor: '#15803d' },
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => onReject(row)}
                        sx={{ textTransform: 'none', fontWeight: 700, minWidth: 76 }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  ) : (
                    <Box sx={{ color: mutedText, fontSize: '0.82rem', textAlign: 'right', pr: 0.4 }}>
                      -
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default DietitianAppointmentsTable;
