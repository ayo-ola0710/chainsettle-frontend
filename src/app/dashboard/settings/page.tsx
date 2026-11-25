'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Clock, Copy, Globe, LogOut, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  useAuthStore,
  type DateDisplayMode,
  type NotificationPreferences,
} from '@/lib/hooks/use-auth-store';
import { useWalletBalance } from '@/lib/hooks/use-wallet-balance';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { FormattedDate } from '@/components/FormattedDate';
import { getBrowserTimeZone, getSupportedTimeZones } from '@/lib/utils';
import {
  LOCALE_COOKIE,
  getLocaleDirection,
  localeLabels,
  locales,
  type Locale,
} from '@/i18n/config';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const {
    address,
    user,
    displayName,
    notificationPreferences,
    datePreferences,
    logout,
    setDisplayName,
    setNotificationPreferences,
    setDatePreferences,
  } = useAuthStore();
  const [name, setName] = useState(displayName ?? '');
  const [permission, setPermission] = useState<PermissionState>('default');
  const { balances, loading, error } = useWalletBalance(address);
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const timezones = useMemo(() => getSupportedTimeZones(), []);
  const previewIso = useMemo(() => new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), []);

  const handleLocaleChange = (nextLocale: Locale) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = getLocaleDirection(nextLocale);
    }
    router.refresh();
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  const handleDisconnect = () => {
    logout();
    router.push('/auth/login');
  };

  const updatePreference = (key: keyof NotificationPreferences) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    });
  };

  const desktopNotificationsEnabled =
    permission === 'granted' && notificationPreferences.desktopNotifications;

  const toggleDesktopNotifications = async () => {
    if (permission === 'unsupported' || permission === 'denied') return;

    if (desktopNotificationsEnabled) {
      setNotificationPreferences({
        ...notificationPreferences,
        desktopNotifications: false,
      });
      return;
    }

    let nextPermission = permission;
    if (permission !== 'granted') {
      nextPermission = (await Notification.requestPermission()) as PermissionState;
      setPermission(nextPermission);
    }

    if (nextPermission === 'granted') {
      setNotificationPreferences({
        ...notificationPreferences,
        desktopNotifications: true,
      });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      <section className="card p-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{t('walletProfile')}</h2>
            <p className="text-xs text-gray-500">{user?.role ?? t('connectedAccount')}</p>
          </div>
        </div>

        <div className="space-y-4 pt-5">
          <div>
            <label htmlFor="display-name" className="label">{t('displayName')}</label>
            <div className="flex items-center gap-2">
              <input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="input"
              />
              <button type="button" onClick={() => setDisplayName(name)} className="btn-primary whitespace-nowrap">
                {t('saveName')}
              </button>
            </div>
          </div>

          <div>
            <p className="label">{t('notificationPreferences')}</p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {([
                ['shipmentUpdates', 'shipmentUpdates', 'shipmentUpdatesDescription'],
                ['milestoneUpdates', 'milestoneUpdates', 'milestoneUpdatesDescription'],
                ['systemAlerts', 'systemAlerts', 'systemAlertsDescription'],
              ] as const).map(([key, titleKey, descriptionKey]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{t(titleKey)}</span>
                    <span className="block text-xs text-gray-500">{t(descriptionKey)}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={notificationPreferences[key]}
                    onChange={() => updatePreference(key)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </label>
              ))}

              <label
                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                  permission === 'denied' || permission === 'unsupported'
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <span className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      {t('desktopNotifications')}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {permission === 'denied'
                        ? t('desktopNotificationsDenied')
                        : permission === 'unsupported'
                          ? t('desktopNotificationsUnsupported')
                          : t('desktopNotificationsDescription')}
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={desktopNotificationsEnabled}
                  disabled={permission === 'denied' || permission === 'unsupported'}
                  onChange={toggleDesktopNotifications}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="label flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              {t('dateTimePreferences')}
            </p>
            <div className="space-y-3 rounded-xl border border-gray-100 p-4">
              <div>
                <label htmlFor="timezone-select" className="block text-xs font-medium text-gray-700 mb-1">
                  {t('timezoneLabel')}
                </label>
                <select
                  id="timezone-select"
                  value={datePreferences.timezone}
                  onChange={(event) =>
                    setDatePreferences({
                      ...datePreferences,
                      timezone: event.target.value,
                    })
                  }
                  className="input text-sm"
                >
                  <option value="auto">
                    {t('timezoneAuto', { timezone: browserTimeZone })}
                  </option>
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-700 mb-1.5">
                  {t('dateFormatLabel')}
                </span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('dateFormatLabel')}>
                  {([
                    ['relative', t('dateFormatRelative')],
                    ['absolute', t('dateFormatAbsolute')],
                  ] as [DateDisplayMode, string][]).map(([mode, label]) => {
                    const selected = datePreferences.displayMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setDatePreferences({
                            ...datePreferences,
                            displayMode: mode,
                          })
                        }
                        className={`rounded-xl border px-3 py-2 text-start text-xs font-medium transition-colors ${
                          selected
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                <span className="text-gray-500">{t('datePreviewLabel')}</span>
                <FormattedDate date={previewIso} className="font-medium text-gray-800 underline decoration-dotted" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="locale-select" className="label flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              {t('languageLabel')}
            </label>
            <select
              id="locale-select"
              value={locale}
              onChange={(event) => handleLocaleChange(event.target.value as Locale)}
              className="input text-sm"
            >
              {locales.map((loc) => (
                <option key={loc} value={loc}>
                  {localeLabels[loc]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="label">{t('stellarAddress')}</p>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate rounded-xl bg-gray-50 px-3.5 py-2.5 font-mono text-xs text-gray-600">
                {address ?? t('notConnected')}
              </p>
              {address && (
                <button
                  type="button"
                  title={t('copyAddress')}
                  aria-label={t('copyAddress')}
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="btn-secondary px-3"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="label">{t('walletBalance')}</p>
            <div className="grid grid-cols-2 gap-3">
              {['USDC', 'XLM'].map((asset) => (
                <div key={asset} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">{asset}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {loading ? '...' : error ? '--' : Number(asset === 'USDC' ? balances?.usdc : balances?.xlm ?? 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{t('balanceUnavailable')}</p>}
          </div>

          <button type="button" onClick={handleDisconnect} className="btn-secondary text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            {t('disconnectWallet')}
          </button>
        </div>
      </section>

      <TemplateManager owner={address} />
    </div>
  );
}