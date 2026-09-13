import { useEffect, useMemo } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export function useTelegram() {
  const tg = useMemo(() => {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  }, []);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
  }, [tg]);

  const user = useMemo(() => {
    if (tg?.initDataUnsafe?.user) {
      return tg.initDataUnsafe.user;
    }
    // Sandbox fallback for desktop browser testing
    return {
      id: 999999999,
      first_name: 'Operator',
      last_name: '',
      username: 'demo_user',
    };
  }, [tg]);

  const initData = tg?.initData || '';

  const haptic = (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error') => {
    if (!tg?.HapticFeedback) return;
    try {
      if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else if (['success', 'warning', 'error'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch (e) {
      // Haptic feedback not supported on current platform
    }
  };

  const closeApp = () => {
    if (tg) {
      tg.close();
    }
  };

  return {
    tg,
    user,
    initData,
    haptic,
    closeApp,
    isTelegram: Boolean(tg && tg.initData),
  };
}
