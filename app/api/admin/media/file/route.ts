import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { deleteMediaDb } from '@/lib/admin/mediaDb';
import { canManageMedia, requireSiteAccess } from '@/lib/admin/permissions';

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const filePath = searchParams.get('path');

  if (!siteId || !filePath) {
    return NextResponse.json(
      { message: 'siteId and path are required' },
      { status: 400 }
    );
  }
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canManageMedia(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const normalized = path.posix.normalize(filePath);
  if (normalized.startsWith('..') || normalized.includes('../')) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  const absolute = path.join(process.cwd(), 'public', 'uploads', siteId, normalized);
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads', siteId);
  if (!absolute.startsWith(uploadsRoot)) {
    return NextResponse.json({ message: 'Invalid path' }, { status: 400 });
  }

  await fs.unlink(absolute);
  await deleteMediaDb(siteId, normalized);
  return NextResponse.json({ success: true });
}
