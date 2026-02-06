import { NextRequest, NextResponse } from 'next/server';
import { createSite, getSiteById, getSites } from '@/lib/sites';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { getDefaultFooter } from '@/lib/footer';
import type { SiteConfig } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const sites = await getSites();
  return NextResponse.json(sites);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
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

      const contentRoot = path.join(process.cwd(), 'content');
      const sourceDir = path.join(contentRoot, source.id);
      const targetDir = path.join(contentRoot, created.id);

      await fs.cp(sourceDir, targetDir, { recursive: true, errorOnExist: false });

      const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
      const sourceUploads = path.join(uploadsRoot, source.id);
      const targetUploads = path.join(uploadsRoot, created.id);
      await fs.cp(sourceUploads, targetUploads, { recursive: true, errorOnExist: false });
    }

    const ensureSeoFiles = async () => {
      const locales = created.supportedLocales?.length ? created.supportedLocales : ['en'];
      await Promise.all(
        locales.map(async (locale) => {
          const seoPath = path.join(process.cwd(), 'content', created.id, locale, 'seo.json');
          try {
            await fs.access(seoPath);
          } catch (error) {
            await fs.mkdir(path.dirname(seoPath), { recursive: true });
            await fs.writeFile(
              seoPath,
              JSON.stringify(
                {
                  title: created.name,
                  description: '',
                  home: {
                    title: '',
                    description: '',
                  },
                },
                null,
                2
              )
            );
          }
        })
      );
    };

    const ensureFooterFiles = async () => {
      const locales = created.supportedLocales?.length ? created.supportedLocales : ['en'];
      await Promise.all(
        locales.map(async (locale) => {
          const footerPath = path.join(process.cwd(), 'content', created.id, locale, 'footer.json');
          try {
            await fs.access(footerPath);
          } catch (error) {
            await fs.mkdir(path.dirname(footerPath), { recursive: true });
            const footer = getDefaultFooter(locale as any);
            await fs.writeFile(footerPath, JSON.stringify(footer, null, 2));
          }
        })
      );
    };

    await ensureSeoFiles();
    await ensureFooterFiles();

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to create site' },
      { status: 500 }
    );
  }
}
