import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './useTelegram.js';
import {
  CreateSubscriptionInput,
  Currency,
  PresetTemplate,
  StatsResponse,
  Subscription,
  UpdateSubscriptionInput,
} from '../types/index.js';

export function useSubscriptions() {
  const { initData, haptic } = useTelegram();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [presets, setPresets] = useState<PresetTemplate[]>([]);
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (initData) {
      headers['Authorization'] = `tma ${initData}`;
    }
    return headers;
  }, [initData]);

  const fetchAll = useCallback(async (curr: Currency = currency) => {
    try {
      setLoading(true);
      setError(null);
      const headers = getHeaders();

      const [subsRes, statsRes, presetsRes] = await Promise.all([
        fetch('/api/subscriptions', { headers }),
        fetch(`/api/stats?currency=${curr}`, { headers }),
        fetch('/api/presets', { headers }),
      ]);

      if (!subsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data from RenewRadar server');
      }

      const subsData = await subsRes.json();
      const statsData = await statsRes.json();
      const presetsData = presetsRes.ok ? await presetsRes.json() : [];

      setSubscriptions(subsData);
      setStats(statsData);
      setPresets(presetsData);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, [currency, getHeaders]);

  useEffect(() => {
    fetchAll(currency);
  }, [fetchAll, currency]);

  const addSubscription = async (input: CreateSubscriptionInput): Promise<boolean> => {
    try {
      haptic('medium');
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error('Failed to create subscription');
      }

      await fetchAll(currency);
      haptic('success');
      return true;
    } catch (err: any) {
      setError(err.message);
      haptic('error');
      return false;
    }
  };

  const updateSubscription = async (id: string, input: UpdateSubscriptionInput): Promise<boolean> => {
    try {
      haptic('medium');
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error('Failed to update subscription');
      }

      await fetchAll(currency);
      haptic('success');
      return true;
    } catch (err: any) {
      setError(err.message);
      haptic('error');
      return false;
    }
  };

  const cancelSubscription = async (id: string, savedAmount?: number): Promise<boolean> => {
    try {
      haptic('warning');
      const res = await fetch(`/api/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ saved_amount: savedAmount }),
      });

      if (!res.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await fetchAll(currency);
      haptic('success');
      return true;
    } catch (err: any) {
      setError(err.message);
      haptic('error');
      return false;
    }
  };

  const reactivateSubscription = async (id: string): Promise<boolean> => {
    try {
      haptic('medium');
      const res = await fetch(`/api/subscriptions/${id}/reactivate`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      await fetchAll(currency);
      haptic('success');
      return true;
    } catch (err: any) {
      setError(err.message);
      haptic('error');
      return false;
    }
  };

  const deleteSubscription = async (id: string): Promise<boolean> => {
    try {
      haptic('heavy');
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to delete subscription');
      }

      await fetchAll(currency);
      haptic('warning');
      return true;
    } catch (err: any) {
      setError(err.message);
      haptic('error');
      return false;
    }
  };

  const changeCurrency = (newCurrency: Currency) => {
    haptic('selection');
    setCurrency(newCurrency);
  };

  const exportData = async (format: 'json' | 'csv' = 'json') => {
    try {
      haptic('light');
      const res = await fetch(`/api/export?format=${format}`, {
        headers: getHeaders(),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `renewradar_subscriptions.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      haptic('success');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const importData = async (items: CreateSubscriptionInput[]): Promise<boolean> => {
    try {
      haptic('medium');
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ subscriptions: items }),
      });

      if (!res.ok) {
        throw new Error('Import failed');
      }

      await fetchAll(currency);
      haptic('success');
      return true;
    } catch (e: any) {
      setError(e.message);
      haptic('error');
      return false;
    }
  };

  return {
    subscriptions,
    stats,
    presets,
    currency,
    loading,
    error,
    refresh: fetchAll,
    addSubscription,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    deleteSubscription,
    changeCurrency,
    exportData,
    importData,
  };
}
