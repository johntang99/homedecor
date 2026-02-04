import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromRequest } from '@/lib/admin/auth';

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
  return NextResponse.json({ success: true });
}
