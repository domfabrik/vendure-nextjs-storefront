'use client';

import { GA4_SETTINGS_OPEN_EVENT, isGa4Configured } from '@/shared/lib';

export function AnalyticsSettingsTrigger() {
  if (!isGa4Configured()) return null;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.focus();
        window.dispatchEvent(new Event(GA4_SETTINGS_OPEN_EVENT));
      }}
      style={{
        appearance: 'none',
        background: 'none',
        border: 0,
        color: 'inherit',
        cursor: 'pointer',
        font: 'inherit',
        lineHeight: 'inherit',
        padding: 0,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }}
    >
      Настройки аналитики
    </button>
  );
}
