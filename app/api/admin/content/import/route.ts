import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { fetchContentEntry, upsertContentEntry } from '@/lib/contentDb';
import { canWriteContent, requireSiteAccess } from '@/lib/admin/permissions';
import { locales } from '@/lib/i18n';

const CONTENT_DIR = path.join(process.cwd(), 'content');

async function readJson(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;
  const mode = payload.mode === 'overwrite' ? 'overwrite' : 'missing';

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

  const tasks: Array<Promise<void>> = [];
  let skipped = 0;

  const queueUpsert = (path: string, data: unknown) => {
    tasks.push(
      (async () => {
        if (mode === 'missing') {
          const existing = await fetchContentEntry(siteId, locale, path);
          if (existing?.data) {
            skipped += 1;
            return;
          }
        }
        await upsertContentEntry({
          siteId,
          locale,
          path,
          data,
          updatedBy: session.user.email,
        });
      })()
    );
  };
  const localeRoot = path.join(CONTENT_DIR, siteId, locale);

  // Root locale JSON files (navigation.json, header.json, site.json, seo.json, footer.json)
  try {
    const rootFiles = await fs.readdir(localeRoot);
    rootFiles
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const filePath = path.join(localeRoot, file);
        tasks.push(
          readJson(filePath).then((data) => {
            queueUpsert(file, data);
          })
        );
      });
  } catch (error) {
    // ignore missing locale root
  }

  // Pages
  const pagesDir = path.join(localeRoot, 'pages');
  try {
    const pageFiles = await fs.readdir(pagesDir);
    pageFiles
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const filePath = path.join(pagesDir, file);
        tasks.push(
          readJson(filePath).then((data) => {
            queueUpsert(`pages/${file}`, data);
          })
        );
      });
  } catch (error) {
    // ignore missing pages dir
  }

  // Blog posts
  const blogDir = path.join(localeRoot, 'blog');
  try {
    const blogFiles = await fs.readdir(blogDir);
    blogFiles
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const filePath = path.join(blogDir, file);
        tasks.push(
          readJson(filePath).then((data) => {
            queueUpsert(`blog/${file}`, data);
          })
        );
      });
  } catch (error) {
    // ignore missing blog dir
  }

  // Theme (site scope)
  const themePath = path.join(CONTENT_DIR, siteId, 'theme.json');
  try {
    const themeData = await readJson(themePath);
    for (const entryLocale of locales) {
      tasks.push(
        (async () => {
          if (mode === 'missing') {
            const existing = await fetchContentEntry(siteId, entryLocale, 'theme.json');
            if (existing?.data) {
              skipped += 1;
              return;
            }
          }
          await upsertContentEntry({
            siteId,
            locale: entryLocale,
            path: 'theme.json',
            data: themeData,
            updatedBy: session.user.email,
          });
        })()
      );
    }
  } catch (error) {
    // ignore missing theme
  }

  await Promise.all(tasks);

  return NextResponse.json({ success: true, imported: tasks.length - skipped, skipped });
}
