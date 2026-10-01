'use client';

import { Box, Button, Link, Paper, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  GA4_SETTINGS_OPEN_EVENT,
  type Ga4ConsentChoice,
  getGa4ConsentChoice,
  isGa4Configured,
  setGa4ConsentChoice,
  startGa4AfterConsent,
  stopGa4AfterRevocation,
  trackGa4PageView,
} from '@/shared/lib';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [configured, setConfigured] = useState(false);
  const [choice, setChoice] = useState<Ga4ConsentChoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLElement | null>(null);
  const firstChoiceRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    if (!configured) return;

    function handleSettingsOpen() {
      const activeElement = document.activeElement;
      settingsTriggerRef.current = activeElement instanceof HTMLElement ? activeElement : null;
      setSettingsOpen(true);
    }

    window.addEventListener(GA4_SETTINGS_OPEN_EVENT, handleSettingsOpen);
    return () => window.removeEventListener(GA4_SETTINGS_OPEN_EVENT, handleSettingsOpen);
  }, [configured]);

  useEffect(() => {
    if (!settingsOpen) return;
    firstChoiceRef.current?.focus();
  }, [settingsOpen]);

  function chooseConsent(nextChoice: Ga4ConsentChoice) {
    setGa4ConsentChoice(nextChoice);
    setChoice(nextChoice);
    if (nextChoice === 'granted') startGa4AfterConsent();
    else stopGa4AfterRevocation();
    setSettingsOpen(false);
  }

  function closeSettings() {
    setSettingsOpen(false);
    requestAnimationFrame(() => settingsTriggerRef.current?.focus());
  }

  if (!configured) return null;

  const openedFromFooter = choice !== null && settingsOpen;
  const shouldRenderPanel = choice === null || settingsOpen;

  if (!configured || !shouldRenderPanel) return null;

  return (
    <Paper
      component="aside"
      aria-label="Настройки Google Analytics"
      elevation={2}
      sx={{
        position: 'fixed',
        zIndex: 1400,
        left: 12,
        bottom: 12,
        width: 'calc(100vw - 24px)',
        maxWidth: 320,
        boxSizing: 'border-box',
        p: 1.25,
      }}
    >
      <Box>
        <Typography
          variant="body2"
          sx={{ mb: 1.25, fontSize: 13, lineHeight: 1.4 }}
        >
          Google Analytics помогает улучшать сайт. Разрешить сбор статистики? <Link href="/juristic/policy">Подробнее</Link>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            ref={firstChoiceRef}
            size="small"
            variant="outlined"
            sx={{ flex: 1, minWidth: 0, textTransform: 'none' }}
            onClick={() => chooseConsent('granted')}
          >
            Разрешить
          </Button>
          <Button
            size="small"
            variant="outlined"
            sx={{ flex: 1, minWidth: 0, textTransform: 'none' }}
            onClick={() => chooseConsent('denied')}
          >
            Не разрешать
          </Button>
        </Box>
        {openedFromFooter ? (
          <Button
            size="small"
            sx={{ display: 'block', mx: 'auto', mt: 0.75, minHeight: 28, textTransform: 'none' }}
            onClick={closeSettings}
          >
            Закрыть
          </Button>
        ) : null}
      </Box>
    </Paper>
  );
}
