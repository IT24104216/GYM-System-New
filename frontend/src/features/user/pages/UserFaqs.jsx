import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  InputBase,
  Stack,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import { getFaqs } from '@/shared/api/faqs.api';

function UserFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await getFaqs({
          isActive: true,
          authorRole: 'admin',
          limit: 300,
          ...(searchQuery ? { search: searchQuery } : {}),
        });
        setFaqs(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setFaqs([]);
      }
    };
    run();
  }, [searchQuery]);

  const filteredFaqs = useMemo(() => faqs, [faqs]);

  const applySearch = () => {
    setSearchQuery(searchInput.trim());
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        px: { xs: 2, md: 4, lg: 6 },
        py: { xs: 3, md: 5 },
        bgcolor: '#efefef',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          maxWidth: 1220,
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(300px, 420px) minmax(0, 1fr)',
          },
          gap: { xs: 3, lg: 6 },
          alignItems: 'start',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 900,
              color: '#0c0c0c',
              fontSize: { xs: '2.3rem', md: '4.2rem' },
              lineHeight: 0.95,
              letterSpacing: -0.8,
              maxWidth: 460,
            }}
          >
            Frequently Asked Questions
          </Typography>

          <Typography sx={{ mt: 3.5, color: '#8f8f8f', fontSize: '1rem' }}>
            Can&apos;t find what you are looking for?
          </Typography>
          <Typography sx={{ color: '#191919', fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 }}>
            We would like to chat with you.
          </Typography>

          <Box sx={{ position: 'relative', mt: 4.3, width: 180, height: 82 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#4f8fff',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                boxShadow: '0 10px 25px rgba(57, 116, 220, 0.35)',
              }}
            >
              <QuestionAnswerRoundedIcon />
            </Box>
            <EastRoundedIcon
              sx={{
                position: 'absolute',
                left: 58,
                top: 22,
                color: '#2d2d2d',
                fontSize: 36,
                transform: 'rotate(28deg)',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: '1px dashed #bdbdbd',
              pb: 1,
              mb: 1.5,
            }}
          >
            <SearchRoundedIcon sx={{ color: '#6c6c6c', fontSize: 24 }} />
            <InputBase
              fullWidth
              placeholder="what are you looking for?"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{
                color: '#444',
                fontSize: '1.05rem',
                '& input::placeholder': {
                  color: '#9a9a9a',
                  opacity: 1,
                },
              }}
            />
            <IconButton
              type="submit"
              size="small"
              sx={{
                color: '#3b3b3b',
                border: '1px solid #c8c8c8',
                borderRadius: 2,
              }}
              aria-label="search faqs"
            >
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Stack spacing={0}>
            {filteredFaqs.map((item) => (
              <Accordion
                key={item.id}
                disableGutters
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  bgcolor: 'transparent',
                  boxShadow: 'none',
                  borderBottom: '1px solid #c6c6c6',
                  '&::before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon sx={{ color: '#707070' }} />}
                  sx={{
                    minHeight: 66,
                    '& .MuiAccordionSummary-content': {
                      my: 0.8,
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: '#141414', fontSize: '1.05rem' }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                  <Typography
                    sx={{
                      color: '#303030',
                      lineHeight: 1.75,
                      whiteSpace: 'pre-wrap',
                      fontSize: '1rem',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}

            {!filteredFaqs.length && (
              <Typography sx={{ color: '#5f5f5f', py: 2.5 }}>
                No FAQs found.
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default UserFaqs;
