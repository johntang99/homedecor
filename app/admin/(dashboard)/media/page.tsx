import { MediaManager } from '@/components/admin/MediaManager';
import { getSites } from '@/lib/sites';

export default async function AdminMediaPage() {
  const sites = await getSites();
  const selectedSiteId = sites[0]?.id || '';
  return (
    <MediaManager sites={sites} selectedSiteId={selectedSiteId} />
  );
}
