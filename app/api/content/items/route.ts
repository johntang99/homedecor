import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { canUseContentDb, listContentEntriesByPrefix } from '@/lib/contentDb';
import { getRequestSiteId } from '@/lib/content';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const ALLOWED_DIRECTORIES = ['portfolio', 'shop-products', 'journal', 'collections'] as const;
type AllowedDirectory = (typeof ALLOWED_DIRECTORIES)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteIdParam = searchParams.get('siteId');
  const locale = searchParams.get('locale');
  const directory = searchParams.get('directory') as AllowedDirectory | null;

  if (!locale || !directory) {
    return NextResponse.json(
      { message: 'locale and directory are required' },
      { status: 400 }
    );
  }

  if (!ALLOWED_DIRECTORIES.includes(directory)) {
    return NextResponse.json({ message: 'Invalid directory' }, { status: 400 });
  }

  try {
    const siteId = siteIdParam || (await getRequestSiteId());

    if (canUseContentDb()) {
      const entries = await listContentEntriesByPrefix(siteId, locale, `${directory}/`);
      const items = entries.map((entry) => entry.data);
      return NextResponse.json({ items });
    }

    const dirPath = path.join(CONTENT_DIR, siteId, locale, directory);
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dirPath, file);
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
      })
    );
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
