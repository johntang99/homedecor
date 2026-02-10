import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canUseSitesDb, upsertSiteDb } from '@/lib/sitesDb';
import type { SiteConfig } from '@/lib/types';
import { getAdminUserCountDb } from '@/lib/admin/usersDb';
import { isSuperAdmin } from '@/lib/admin/permissions';

const SITES_FILE = path.join(process.cwd(), 'content', '_sites.json');

interface SitesPayload {
  sites?: SiteConfig[];
}

export async function POST(request: NextRequest) {
  if (!canUseSitesDb()) {
    return NextResponse.json(
      { message: 'Supabase service role key is required for import.' },
      { status: 400 }
    );
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    const existingCount = await getAdminUserCountDb();
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
  } else if (!isSuperAdmin(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const raw = await fs.readFile(SITES_FILE, 'utf-8');
    const payload = JSON.parse(raw) as SitesPayload;
    const sites = payload.sites || [];

    let imported = 0;
    let skipped = 0;

    for (const site of sites) {
      if (!site?.id || !site?.name) {
        skipped += 1;
        continue;
      }
      const saved = await upsertSiteDb(site);
      if (saved) {
        imported += 1;
      } else {
        skipped += 1;
      }
    }

    return NextResponse.json({ success: true, imported, skipped });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to import sites' },
      { status: 500 }
    );
  }
}
