import { getSites } from '@/lib/sites';
import { ContentEditor } from '@/components/admin/ContentEditor';

export default async function AdminBlogPostsPage({
  searchParams,
}: {
  searchParams?: { siteId?: string; locale?: string };
}) {
  const sites = await getSites();
  const defaultSite = sites[0];
  const selectedSiteId = searchParams?.siteId || defaultSite?.id || '';
  const selectedSite = sites.find((site) => site.id === selectedSiteId) || defaultSite;
  const selectedLocale =
    searchParams?.locale || selectedSite?.defaultLocale || 'en';

  return (
    <ContentEditor
      sites={sites}
      selectedSiteId={selectedSiteId}
      selectedLocale={selectedLocale}
      fileFilter="blog"
      titleOverride="Blog Posts"
      basePath="/admin/blog-posts"
    />
  );
}
