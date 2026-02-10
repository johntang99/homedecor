'use client';

import { useEffect, useState } from 'react';
import type { BookingService, BookingSettings, SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui';

interface BookingSettingsManagerProps {
  sites: SiteConfig[];
  selectedSiteId: string;
}

const DEFAULT_SETTINGS: BookingSettings = {
  timezone: 'America/New_York',
  bufferMinutes: 10,
  minNoticeHours: 12,
  maxDaysAhead: 60,
  businessHours: [
    { day: 'Mon', open: '09:00', close: '17:00' },
    { day: 'Tue', open: '09:00', close: '17:00' },
    { day: 'Wed', open: '09:00', close: '17:00' },
    { day: 'Thu', open: '09:00', close: '17:00' },
    { day: 'Fri', open: '09:00', close: '17:00' },
    { day: 'Sat', open: '10:00', close: '14:00' },
    { day: 'Sun', open: '00:00', close: '00:00', closed: true },
  ],
  blockedDates: [],
  notificationEmails: [],
  notificationPhones: [],
};

export function BookingSettingsManager({
  sites,
  selectedSiteId,
}: BookingSettingsManagerProps) {
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [settings, setSettings] = useState<BookingSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<BookingService[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadSettings = async () => {
    if (!siteId) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/booking/settings?siteId=${siteId}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to load settings');
      }
      const payload = await response.json();
      setSettings(payload.settings || DEFAULT_SETTINGS);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!siteId) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/booking/services?siteId=${siteId}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to load services');
      }
      const payload = await response.json();
      setServices(payload.services || []);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadServices();
  }, [siteId]);

  const updateSettings = (updates: Partial<BookingSettings>) => {
    setSettings((current) => ({ ...current, ...updates }));
  };

  const updateBusinessHour = (index: number, updates: Partial<BookingSettings['businessHours'][0]>) => {
    const next = [...settings.businessHours];
    next[index] = { ...next[index], ...updates };
    updateSettings({ businessHours: next });
  };

  const addService = () => {
    setServices((current) => [
      ...current,
      {
        id: `service-${Date.now()}`,
        name: 'New Service',
        durationMinutes: 30,
        price: 0,
        active: true,
      },
    ]);
  };

  const updateService = (index: number, updates: Partial<BookingService>) => {
    const next = [...services];
    next[index] = { ...next[index], ...updates };
    setServices(next);
  };

  const removeService = (index: number) => {
    const next = [...services];
    next.splice(index, 1);
    setServices(next);
  };

  const saveAll = async () => {
    setStatus(null);
    const settingsResponse = await fetch('/api/admin/booking/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, settings }),
    });
    if (!settingsResponse.ok) {
      const payload = await settingsResponse.json();
      setStatus(payload.message || 'Failed to save settings');
      return;
    }

    const servicesResponse = await fetch('/api/admin/booking/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, services }),
    });
    if (!servicesResponse.ok) {
      const payload = await servicesResponse.json();
      setStatus(payload.message || 'Failed to save services');
      return;
    }
    setStatus('Saved');
  };

  const handleImport = async () => {
    if (!siteId) return;
    const confirmed = window.confirm(
      'Import booking settings, services, and bookings from JSON files into the database?'
    );
    if (!confirmed) return;
    setImporting(true);
    setStatus(null);
    try {
      const response = await fetch('/api/admin/booking/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Import failed');
      }
      setStatus(
        `Imported services: ${payload.servicesImported || 0}, settings: ${
          payload.settingsImported || 0
        }, bookings: ${payload.bookingsImported || 0}.`
      );
      await loadSettings();
      await loadServices();
    } catch (error: any) {
      setStatus(error?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Booking Settings</h1>
          <p className="text-sm text-gray-600">Configure services, hours, and booking rules.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500">Site</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing…' : 'Import from JSON'}
          </Button>
        </div>
      </div>

      {status && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="text-sm font-semibold text-gray-900">Business Hours</div>
            <div className="space-y-3">
              {settings.businessHours.map((hour, index) => (
                <div
                  key={`${hour.day}-${index}`}
                  className="grid gap-3 md:grid-cols-4 items-center"
                >
                  <div className="text-sm font-medium text-gray-700">{hour.day}</div>
                  <input
                    type="time"
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={hour.open}
                    onChange={(event) =>
                      updateBusinessHour(index, { open: event.target.value })
                    }
                    disabled={hour.closed}
                  />
                  <input
                    type="time"
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={hour.close}
                    onChange={(event) =>
                      updateBusinessHour(index, { close: event.target.value })
                    }
                    disabled={hour.closed}
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(hour.closed)}
                      onChange={(event) =>
                        updateBusinessHour(index, { closed: event.target.checked })
                      }
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="text-sm font-semibold text-gray-900">Services</div>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={`service-${index}`} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-700">
                      Service {index + 1}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => removeService(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Service name"
                      value={service.name}
                      onChange={(event) => updateService(index, { name: event.target.value })}
                    />
                    <input
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Service ID"
                      value={service.id}
                      onChange={(event) => updateService(index, { id: event.target.value })}
                    />
                    <input
                      type="number"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Duration (minutes)"
                      value={service.durationMinutes}
                      onChange={(event) =>
                        updateService(index, { durationMinutes: Number(event.target.value) })
                      }
                    />
                    <input
                      type="number"
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Price"
                      value={service.price ?? ''}
                      onChange={(event) =>
                        updateService(index, {
                          price: event.target.value === '' ? undefined : Number(event.target.value),
                        })
                      }
                    />
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={service.active !== false}
                        onChange={(event) =>
                          updateService(index, { active: event.target.checked })
                        }
                      />
                      Active
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" onClick={addService}>
              Add Service
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="text-sm font-semibold text-gray-900">Rules</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Timezone</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={settings.timezone}
                  onChange={(event) => updateSettings({ timezone: event.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Buffer (minutes)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={settings.bufferMinutes}
                  onChange={(event) =>
                    updateSettings({ bufferMinutes: Number(event.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Minimum notice (hours)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={settings.minNoticeHours}
                  onChange={(event) =>
                    updateSettings({ minNoticeHours: Number(event.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Max days ahead</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={settings.maxDaysAhead}
                  onChange={(event) =>
                    updateSettings({ maxDaysAhead: Number(event.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Blocked Dates (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={settings.blockedDates.join(', ')}
                  onChange={(event) =>
                    updateSettings({
                      blockedDates: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">
                  Notification Emails (comma separated)
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={(settings.notificationEmails || []).join(', ')}
                  onChange={(event) =>
                    updateSettings({
                      notificationEmails: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">
                  Notification Phones (comma separated, E.164)
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={(settings.notificationPhones || []).join(', ')}
                  onChange={(event) =>
                    updateSettings({
                      notificationPhones: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Button type="button" onClick={saveAll} disabled={loading}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
