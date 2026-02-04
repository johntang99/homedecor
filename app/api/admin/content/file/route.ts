import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { resolveContentPath } from '@/lib/admin/content';
import { CONTENT_TEMPLATES } from '@/lib/admin/templates';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const locale = searchParams.get('locale');
  const filePath = searchParams.get('path');

  if (!siteId || !locale || !filePath) {
    return NextResponse.json(
      { message: 'siteId, locale, and path are required' },
      { status: 400 }
    );
  }

  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = await fs.readFile(resolved, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;
  const filePath = payload.path as string | undefined;
  const content = payload.content as string | undefined;

  if (!siteId || !locale || !filePath || typeof content !== 'string') {
    return NextResponse.json(
      { message: 'siteId, locale, path, and content are required' },
      { status: 400 }
    );
  }

  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  try {
    JSON.parse(content);
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  try {
    const existing = await fs.readFile(resolved, 'utf-8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const historyPath = path.join(
      process.cwd(),
      'content',
      '_history',
      siteId,
      locale,
      `${filePath}.${timestamp}.json`
    );
    await fs.mkdir(path.dirname(historyPath), { recursive: true });
    await fs.writeFile(historyPath, existing);
  } catch (error) {
    // ignore missing existing file
  }

  await fs.writeFile(resolved, content);
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const payload = await request.json();
  const siteId = payload.siteId as string | undefined;
  const locale = payload.locale as string | undefined;
  const action = payload.action as string | undefined;

  if (!siteId || !locale || !action) {
    return NextResponse.json(
      { message: 'siteId, locale, and action are required' },
      { status: 400 }
    );
  }

  if (action === 'create') {
    const slug = payload.slug as string | undefined;
    const templateId = (payload.templateId as string | undefined) || 'basic';
    const targetDir = (payload.targetDir as string | undefined) || 'pages';
    if (!slug) {
      return NextResponse.json({ message: 'slug is required' }, { status: 400 });
    }
    if (!['pages', 'blog'].includes(targetDir)) {
      return NextResponse.json({ message: 'Invalid target directory' }, { status: 400 });
    }
    const normalized = slug.trim().toLowerCase();
    const filePath = `${targetDir}/${normalized}.json`;
    const resolved = resolveContentPath(siteId, locale, filePath);
    if (!resolved) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }
    try {
      await fs.access(resolved);
      return NextResponse.json({ message: 'File already exists' }, { status: 409 });
    } catch (error) {
      // ok
    }
    const template =
      CONTENT_TEMPLATES.find((item) => item.id === templateId) ||
      CONTENT_TEMPLATES[0];
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, JSON.stringify(template.content, null, 2));
    return NextResponse.json({ path: filePath });
  }

  if (action === 'duplicate') {
    const sourcePath = payload.path as string | undefined;
    const slug = payload.slug as string | undefined;
    const targetDir = payload.targetDir as string | undefined;
    if (!sourcePath || !slug) {
      return NextResponse.json(
        { message: 'path and slug are required' },
        { status: 400 }
      );
    }
    const normalized = slug.trim().toLowerCase();
    const sourceDir = sourcePath.startsWith('blog/') ? 'blog' : 'pages';
    const resolvedTargetDir =
      sourceDir === 'blog' ? 'blog' : targetDir && ['pages', 'blog'].includes(targetDir) ? targetDir : 'pages';
    if (sourceDir === 'blog' && resolvedTargetDir !== 'blog') {
      return NextResponse.json(
        { message: 'Blog posts must be duplicated into blog/' },
        { status: 400 }
      );
    }
    const targetPath = `${resolvedTargetDir}/${normalized}.json`;
    const sourceResolved = resolveContentPath(siteId, locale, sourcePath);
    const targetResolved = resolveContentPath(siteId, locale, targetPath);
    if (!sourceResolved || !targetResolved) {
      return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
    }
    const content = await fs.readFile(sourceResolved, 'utf-8');
    let nextContent = content;
    if (sourceDir === 'blog') {
      try {
        const parsed = JSON.parse(content);
        parsed.slug = normalized;
        nextContent = JSON.stringify(parsed, null, 2);
      } catch (error) {
        // fallback to raw content if JSON is invalid
      }
    }
    await fs.mkdir(path.dirname(targetResolved), { recursive: true });
    await fs.writeFile(targetResolved, nextContent);
    return NextResponse.json({ path: targetPath });
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const locale = searchParams.get('locale');
  const filePath = searchParams.get('path');

  if (!siteId || !locale || !filePath) {
    return NextResponse.json(
      { message: 'siteId, locale, and path are required' },
      { status: 400 }
    );
  }

  if (['theme.json', 'site.json', 'navigation.json'].includes(filePath)) {
    return NextResponse.json(
      { message: 'Protected file cannot be deleted' },
      { status: 400 }
    );
  }

  const resolved = resolveContentPath(siteId, locale, filePath);
  if (!resolved) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  await fs.unlink(resolved);
  return NextResponse.json({ success: true });
}
