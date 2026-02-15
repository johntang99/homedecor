import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { listContentEntries, upsertContentEntry } from '@/lib/contentDb';
import { canWriteContent, requireSiteAccess } from '@/lib/admin/permissions';

async function collectJsonPathsRecursive(
  rootDir: string,
  currentDir = rootDir
): Promise<string[]> {
  let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>;
  try {
    entries = (await fs.readdir(currentDir, {
      withFileTypes: true,
    })) as Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>;
  } catch {
    return [];
  }

  const paths: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectJsonPathsRecursive(rootDir, fullPath);
      paths.push(...nested);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      const relativePath = path.relative(rootDir, fullPath).split(path.sep).join('/');
      paths.push(relativePath);
    }
  }
  return paths;
}

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

  const contentRoot = path.join(process.cwd(), 'content', siteId, locale);
  const entries = await listContentEntries(siteId, locale);
  const localeEntryMap = new Map(entries.filter((e) => e.path !== 'theme.json').map((e) => [e.path, e]));
  let themeEntry = entries.find((e) => e.path === 'theme.json');

  // Backfill missing DB paths from local locale files (pages/*.json, *.layout.json, footer/header, etc.)
  const localJsonPaths = await collectJsonPathsRecursive(contentRoot);
  let backfilled = 0;
  let backfillErrors = 0;
  const backfilledPaths: string[] = [];
  const backfillErrorPaths: string[] = [];
  for (const relativePath of localJsonPaths) {
    if (localeEntryMap.has(relativePath)) continue;
    const absolutePath = path.join(contentRoot, relativePath);
    try {
      const raw = await fs.readFile(absolutePath, 'utf-8');
      const data = JSON.parse(raw);
      const upserted = await upsertContentEntry({
        siteId,
        locale,
        path: relativePath,
        data,
        updatedBy: session.user.email,
      });
      if (upserted) {
        localeEntryMap.set(relativePath, upserted);
        backfilled += 1;
        backfilledPaths.push(relativePath);
      } else {
        backfillErrors += 1;
        backfillErrorPaths.push(relativePath);
      }
    } catch {
      backfillErrors += 1;
      backfillErrorPaths.push(relativePath);
    }
  }

  // Backfill theme if missing for this locale
  if (!themeEntry) {
    const themePath = path.join(process.cwd(), 'content', siteId, 'theme.json');
    try {
      const raw = await fs.readFile(themePath, 'utf-8');
      const data = JSON.parse(raw);
      const upsertedTheme = await upsertContentEntry({
        siteId,
        locale,
        path: 'theme.json',
        data,
        updatedBy: session.user.email,
      });
      if (upsertedTheme) {
        themeEntry = upsertedTheme;
        backfilled += 1;
        backfilledPaths.push('theme.json');
      }
    } catch {
      // ignore missing/invalid local theme during backfill
    }
  }

  const localeEntries = Array.from(localeEntryMap.values());
  if (localeEntries.length === 0 && !themeEntry) {
    return NextResponse.json({ message: 'No DB entries to export' }, { status: 400 });
  }

  await Promise.all(
    localeEntries.map(async (entry) => {
      const targetPath = path.join(contentRoot, entry.path);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, JSON.stringify(entry.data, null, 2));
    })
  );

  // Export theme to site-level (not locale)
  if (themeEntry) {
    const themePath = path.join(process.cwd(), 'content', siteId, 'theme.json');
    await fs.writeFile(themePath, JSON.stringify(themeEntry.data, null, 2));
  }

  return NextResponse.json({
    success: true,
    exported: localeEntries.length + (themeEntry ? 1 : 0),
    backfilled,
    backfillErrors,
    backfilledPaths,
    backfillErrorPaths,
    message: `Exported ${localeEntries.length} content files to content/${siteId}/${locale}/` +
      (backfilled > 0 ? ` Backfilled ${backfilled} missing DB entries from local files.` : '') +
      (backfillErrors > 0 ? ` (${backfillErrors} files could not be backfilled.)` : ''),
  });
}
