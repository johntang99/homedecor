import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { resolveContentPath } from '@/lib/admin/content';
import { canUseContentDb, fetchContentEntry } from '@/lib/contentDb';
import { getRequestSiteId } from '@/lib/content';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteIdParam = searchParams.get('siteId');
  const locale = searchParams.get('locale');
  const filePath = searchParams.get('path');

  if (!locale || !filePath) {
    return NextResponse.json(
      { message: 'locale and path are required' },
      { status: 400 }
    );
  }

  const siteId = siteIdParam || (await getRequestSiteId());
  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  try {
    if (canUseContentDb()) {
      const entry = await fetchContentEntry(siteId, locale, filePath);
      if (entry?.data) {
        return NextResponse.json({ content: JSON.stringify(entry.data, null, 2) });
      }
    }

    const content = await fs.readFile(resolved, 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
}
