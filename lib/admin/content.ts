import fs from 'fs/promises';
import path from 'path';

export interface ContentFileItem {
  id: string;
  label: string;
  path: string;
  scope: 'locale' | 'site';
  publishDate?: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content');

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export async function listContentFiles(
  siteId: string,
  locale: string
): Promise<ContentFileItem[]> {
  const items: ContentFileItem[] = [];

  const pagesDir = path.join(CONTENT_DIR, siteId, locale, 'pages');
  try {
    const files = await fs.readdir(pagesDir);
    files
      .filter((file) => file.endsWith('.json'))
      .forEach((file) => {
        const slug = file.replace('.json', '');
        items.push({
          id: `page-${slug}`,
          label: `Page: ${titleCase(slug)}`,
          path: `pages/${file}`,
          scope: 'locale',
        });
      });
  } catch (error) {
    // ignore missing pages directory
  }

  const blogDir = path.join(CONTENT_DIR, siteId, locale, 'blog');
  try {
    const files = await fs.readdir(blogDir);
    await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const slug = file.replace('.json', '');
          let title = '';
          let publishDate = '';
          try {
            const raw = await fs.readFile(path.join(blogDir, file), 'utf-8');
            const parsed = JSON.parse(raw);
            title = typeof parsed.title === 'string' ? parsed.title : '';
            publishDate =
              typeof parsed.publishDate === 'string' ? parsed.publishDate : '';
          } catch (error) {
            // ignore parse errors
          }
          items.push({
            id: `blog-${slug}`,
            label: `Blog Post: ${title || titleCase(slug)}`,
            path: `blog/${file}`,
            scope: 'locale',
            publishDate: publishDate || undefined,
          });
        })
    );
  } catch (error) {
    // ignore missing blog directory
  }

  items.push({
    id: 'navigation',
    label: 'Navigation',
    path: 'navigation.json',
    scope: 'locale',
  });
  items.push({
    id: 'site',
    label: 'Site Info',
    path: 'site.json',
    scope: 'locale',
  });
  items.push({
    id: 'theme',
    label: 'Theme',
    path: 'theme.json',
    scope: 'site',
  });

  return items;
}

export function resolveContentPath(siteId: string, locale: string, filePath: string) {
  if (filePath === 'theme.json') {
    return path.join(CONTENT_DIR, siteId, 'theme.json');
  }

  if (filePath === 'navigation.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'navigation.json');
  }

  if (filePath === 'site.json') {
    return path.join(CONTENT_DIR, siteId, locale, 'site.json');
  }

  if (filePath.startsWith('pages/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  if (filePath.startsWith('blog/')) {
    return path.join(CONTENT_DIR, siteId, locale, filePath);
  }

  return null;
}
