import fs from 'fs/promises';
import path from 'path';
import { canUseMediaDb, listMediaDb, upsertMediaDb } from '@/lib/admin/mediaDb';

export interface MediaItem {
  id: string;
  url: string;
  path: string;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

async function walkDirectory(dir: string, baseDir: string, items: MediaItem[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath, baseDir, items);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        const relative = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        items.push({
          id: relative,
          path: relative,
          url: `/uploads/${relative}`,
        });
      }
    }
  }
}

export async function listMedia(siteId: string): Promise<MediaItem[]> {
  const baseDir = path.join(process.cwd(), 'public', 'uploads', siteId);
  const filesystemItems: MediaItem[] = [];
  try {
    await walkDirectory(baseDir, baseDir, filesystemItems);
  } catch (error) {
    // ignore; directory may not exist yet
  }
  const normalizedFilesystemItems = filesystemItems
    .map((item) => ({
      ...item,
      url: `/uploads/${siteId}/${item.path}`,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  if (canUseMediaDb()) {
    const dbItems = await listMediaDb(siteId);
    const merged = new Map<string, MediaItem>();
    for (const item of dbItems) {
      merged.set(item.path, item);
    }
    for (const item of normalizedFilesystemItems) {
      merged.set(item.path, item);
    }
    const mergedItems = Array.from(merged.values()).sort((a, b) =>
      a.path.localeCompare(b.path)
    );

    // Ensure filesystem-discovered items are persisted for future queries.
    await Promise.all(
      normalizedFilesystemItems.map((item) =>
        upsertMediaDb({ siteId, path: item.path, url: item.url })
      )
    );
    return mergedItems;
  }

  return normalizedFilesystemItems;
}
