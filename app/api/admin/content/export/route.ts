import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { listContentEntries } from '@/lib/contentDb';
import { canWriteContent, requireSiteAccess } from '@/lib/admin/permissions';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;

  if (!siteId || !locale) {
    return NextResponse.json(
      { message: 'siteId and locale are required' },
      { status: 400 }
    );
  }

  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canWriteContent(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const entries = await listContentEntries(siteId, locale);
  if (entries.length === 0) {
    return NextResponse.json({ message: 'No DB entries to export' }, { status: 400 });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportRoot = path.join(
    process.cwd(),
    'content',
    '_export',
    siteId,
    locale,
    timestamp
  );

  await Promise.all(
    entries.map(async (entry) => {
      const targetPath = path.join(exportRoot, entry.path);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, JSON.stringify(entry.data, null, 2));
    })
  );

  return NextResponse.json({ success: true, exportPath: exportRoot });
}
