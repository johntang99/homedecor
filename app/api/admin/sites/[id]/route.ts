import { NextRequest, NextResponse } from 'next/server';
import { getSiteById, updateSite } from '@/lib/sites';
import { getSessionFromRequest } from '@/lib/admin/auth';
import type { SiteConfig } from '@/lib/types';
import { isSuperAdmin, requireRole, requireSiteAccess } from '@/lib/admin/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    requireSiteAccess(session.user, params.id);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const site = await getSiteById(params.id);
  if (!site) {
    return NextResponse.json({ message: 'Site not found' }, { status: 404 });
  }

  return NextResponse.json(site);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    requireRole(session.user, ['super_admin', 'site_admin']);
    requireSiteAccess(session.user, params.id);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const payload = (await request.json()) as Partial<SiteConfig>;
  const allowed: Partial<SiteConfig> = {
    name: payload.name,
    domain: payload.domain,
    enabled: payload.enabled,
    defaultLocale: payload.defaultLocale,
    supportedLocales: payload.supportedLocales,
  };

  const updated = await updateSite(params.id, allowed);
  if (!updated) {
    return NextResponse.json({ message: 'Site not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
