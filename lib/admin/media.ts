import fs from 'fs/promises';
import path from 'path';

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
  const items: MediaItem[] = [];
  try {
    await walkDirectory(baseDir, baseDir, items);
  } catch (error) {
    return [];
  }
  return items
    .map((item) => ({
      ...item,
      url: `/uploads/${siteId}/${item.path}`,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}
