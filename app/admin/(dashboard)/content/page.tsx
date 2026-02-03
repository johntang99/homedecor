import { getSites } from '@/lib/sites';
import { ContentEditor } from '@/components/admin/ContentEditor';

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams?: { siteId?: string; locale?: string; file?: string };
}) {
  const sites = await getSites();
  const defaultSite = sites[0];
  const selectedSiteId = searchParams?.siteId || defaultSite?.id || '';
  const selectedSite = sites.find((site) => site.id === selectedSiteId) || defaultSite;
  const selectedLocale =
    searchParams?.locale || selectedSite?.defaultLocale || 'en';
  const initialFilePath = searchParams?.file;

  return (
    <ContentEditor
      sites={sites}
      selectedSiteId={selectedSiteId}
      selectedLocale={selectedLocale}
      initialFilePath={initialFilePath}
    />
  );
}
