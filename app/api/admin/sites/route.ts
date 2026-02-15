import { NextRequest, NextResponse } from 'next/server';
import { createSite, getSiteById, getSites } from '@/lib/sites';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { getDefaultFooter } from '@/lib/footer';
import type { BookingSettings, BookingService } from '@/lib/types';
import type { SiteConfig } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';
import {
  canUseContentDb,
  listContentEntriesForSite,
  upsertContentEntry,
} from '@/lib/contentDb';
import { saveBookingServicesDb, saveBookingSettingsDb } from '@/lib/booking/db';
import { filterSitesForUser, isSuperAdmin } from '@/lib/admin/permissions';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const sites = await getSites();
  const visible = filterSitesForUser(sites, session.user);
  return NextResponse.json(visible);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  if (!isSuperAdmin(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const payload = (await request.json()) as Partial<SiteConfig> & {
    cloneFrom?: string;
  };
  if (!payload.id || !payload.name) {
    return NextResponse.json({ message: 'ID and name are required' }, { status: 400 });
  }

  try {
    const created = await createSite({
      id: payload.id,
      name: payload.name,
      domain: payload.domain,
      enabled: payload.enabled ?? true,
      defaultLocale: payload.defaultLocale ?? 'en',
      supportedLocales: payload.supportedLocales ?? ['en', 'zh'],
    });

    if (payload.cloneFrom) {
      const source = await getSiteById(payload.cloneFrom);
      if (!source) {
        return NextResponse.json({ message: 'Clone source not found' }, { status: 404 });
      }

      if (canUseContentDb()) {
        const entries = await listContentEntriesForSite(source.id);
        await Promise.all(
          entries.map((entry) =>
            upsertContentEntry({
              siteId: created.id,
              locale: entry.locale,
              path: entry.path,
              data: entry.data,
              updatedBy: session.user.id,
            })
          )
        );
      } else {
        const contentRoot = path.join(process.cwd(), 'content');
        const sourceDir = path.join(contentRoot, source.id);
        const targetDir = path.join(contentRoot, created.id);

        await fs.cp(sourceDir, targetDir, { recursive: true, errorOnExist: false });

        const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
        const sourceUploads = path.join(uploadsRoot, source.id);
        const targetUploads = path.join(uploadsRoot, created.id);
        await fs.cp(sourceUploads, targetUploads, { recursive: true, errorOnExist: false });
      }
    }

    const ensureSeoFiles = async () => {
      const locales = created.supportedLocales?.length ? created.supportedLocales : ['en'];
      await Promise.all(
        locales.map(async (locale) => {
          const seoPayload = {
            title: created.name,
            description: '',
            home: {
              title: '',
              description: '',
            },
          };
          if (canUseContentDb()) {
            await upsertContentEntry({
              siteId: created.id,
              locale,
              path: 'seo.json',
              data: seoPayload,
              updatedBy: session.user.id,
            });
            return;
          }

          const seoPath = path.join(process.cwd(), 'content', created.id, locale, 'seo.json');
          try {
            await fs.access(seoPath);
          } catch (error) {
            await fs.mkdir(path.dirname(seoPath), { recursive: true });
            await fs.writeFile(seoPath, JSON.stringify(seoPayload, null, 2));
          }
        })
      );
    };

    const ensureFooterFiles = async () => {
      const locales = created.supportedLocales?.length ? created.supportedLocales : ['en'];
      await Promise.all(
        locales.map(async (locale) => {
          const footer = getDefaultFooter(locale as any);
          if (canUseContentDb()) {
            await upsertContentEntry({
              siteId: created.id,
              locale,
              path: 'footer.json',
              data: footer,
              updatedBy: session.user.id,
            });
            return;
          }

          const footerPath = path.join(process.cwd(), 'content', created.id, locale, 'footer.json');
          try {
            await fs.access(footerPath);
          } catch (error) {
            await fs.mkdir(path.dirname(footerPath), { recursive: true });
            await fs.writeFile(footerPath, JSON.stringify(footer, null, 2));
          }
        })
      );
    };

    const ensureBookingFiles = async () => {
      const bookingRoot = path.join(process.cwd(), 'content', created.id, 'booking');
      const servicesPath = path.join(bookingRoot, 'services.json');
      const settingsPath = path.join(bookingRoot, 'settings.json');
      const defaultServices: BookingService[] = [
        {
          id: 'default-service',
          name: 'Default Service',
          serviceType: 'appointment',
          pricingModel: 'flat',
          durationMinutes: 60,
          price: 0,
          leadTimeHours: 12,
          capacityPerSlot: 4,
          recurringEligible: false,
          active: true,
        },
      ];
      const defaultSettings: BookingSettings = {
        timezone: 'America/New_York',
        bufferMinutes: 15,
        minNoticeHours: 4,
        maxDaysAhead: 60,
        defaultServiceType: 'appointment',
        serviceAreaZips: [],
        blackoutWindows: [],
        rushLeadHours: 6,
        maxOrdersPerSlot: 4,
        recurringEnabled: true,
        businessHours: [
          { day: 'Mon', open: '08:00', close: '20:00' },
          { day: 'Tue', open: '08:00', close: '20:00' },
          { day: 'Wed', open: '08:00', close: '20:00' },
          { day: 'Thu', open: '08:00', close: '20:00' },
          { day: 'Fri', open: '08:00', close: '20:00' },
          { day: 'Sat', open: '09:00', close: '18:00' },
          { day: 'Sun', open: '09:00', close: '16:00', closed: false },
        ],
        blockedDates: [],
        notificationEmails: [],
        notificationPhones: [],
      };
      if (canUseContentDb()) {
        await saveBookingServicesDb(created.id, defaultServices);
        await saveBookingSettingsDb(created.id, defaultSettings);
        return;
      }
      try {
        await fs.mkdir(bookingRoot, { recursive: true });
        await fs.access(servicesPath);
      } catch (error) {
        await fs.writeFile(servicesPath, JSON.stringify(defaultServices, null, 2));
      }
      try {
        await fs.access(settingsPath);
      } catch (error) {
        await fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2));
      }
    };

    await ensureSeoFiles();
    await ensureFooterFiles();
    await ensureBookingFiles();

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to create site' },
      { status: 500 }
    );
  }
}
