'use client';

import { Box, Button, Link, Paper, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type Ga4ConsentChoice, getGa4ConsentChoice, isGa4Configured, setGa4ConsentChoice, startGa4AfterConsent, stopGa4AfterRevocation, trackGa4PageView } from '@/shared/lib';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [configured, setConfigured] = useState(false);
  const [choice, setChoice] = useState<Ga4ConsentChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isGa4Configured()) return;
    setConfigured(true);
    const savedChoice = getGa4ConsentChoice();
    setChoice(savedChoice);
    if (savedChoice === 'granted') startGa4AfterConsent();
  }, []);

  useEffect(() => {
    if (configured && choice === 'granted') trackGa4PageView(pathname);
  }, [configured, choice, pathname]);

  function chooseConsent(nextChoice: Ga4ConsentChoice) {
    setGa4ConsentChoice(nextChoice);
    setChoice(nextChoice);
    if (nextChoice === 'granted') startGa4AfterConsent();
    else stopGa4AfterRevocation();
    setSettingsOpen(false);
  }

  if (!configured) return null;

  const showChoices = choice === null || settingsOpen;

  return (
    <Paper
      component="aside"
      aria-label="Настройки Google Analytics"
      elevation={6}
      sx={{
        position: 'fixed',
        zIndex: 1400,
        left: 12,
        bottom: 12,
        width: { xs: 'calc(100vw - 24px)', sm: 390 },
        p: 1.5,
      }}
    >
      {showChoices ? (
        <Box>
          <Typography
            variant="body2"
            sx={{ mb: 1.25 }}
          >
            Google Analytics собирает статистику посещений, просмотров товаров и действий с корзиной и заявкой. Поля формы, имя, телефон и email в Google Analytics не передаются.
            Согласие относится только к Google Analytics. <Link href="/juristic/policy">Политика обработки персональных данных</Link>.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => chooseConsent('granted')}
            >
              Разрешить Google Analytics
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => chooseConsent('denied')}
            >
              Не разрешать Google Analytics
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          size="small"
          onClick={() => setSettingsOpen(true)}
          aria-expanded={settingsOpen}
        >
          Настройки Google Analytics
        </Button>
      )}
    </Paper>
  );
}
