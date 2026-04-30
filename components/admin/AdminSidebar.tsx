import { getSession } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';
import { AdminSidebarNav } from './AdminSidebarNav';
import type { IconKey } from './AdminSidebarNav';

const navigation: Array<{
  name: string;
  href: string;
  iconKey: IconKey;
  group: 'site' | 'system';
  preserveContext?: boolean;
}> = [
  { name: 'Site Settings', href: '/admin/site-settings', iconKey: 'slidersHorizontal', group: 'site' },
  { name: 'Content', href: '/admin/content', iconKey: 'fileText', group: 'site' },
  { name: 'Portfolio', href: '/admin/portfolio', iconKey: 'layoutGrid', group: 'site' },
  { name: 'Shop Products', href: '/admin/shop-products', iconKey: 'image', group: 'site' },
  { name: 'Journal', href: '/admin/journal', iconKey: 'bookOpen', group: 'site' },
  { name: 'Collections', href: '/admin/collections', iconKey: 'layers', group: 'site' },
  { name: 'Testimonials', href: '/admin/testimonials', iconKey: 'users', group: 'site' },
  { name: 'Media', href: '/admin/media', iconKey: 'image', group: 'site' },

  { name: 'Sites', href: '/admin/sites', iconKey: 'building2', group: 'system', preserveContext: false },
  { name: 'Variants', href: '/admin/variants', iconKey: 'layers', group: 'system', preserveContext: false },
  { name: 'Users', href: '/admin/users', iconKey: 'users', group: 'system', preserveContext: false },
  { name: 'Settings', href: '/admin/settings', iconKey: 'settings', group: 'system', preserveContext: false },
];

export async function AdminSidebar() {
  const session = await getSession();
  const isAdmin = session?.user ? isSuperAdmin(session.user) : false;
  const items = isAdmin ? navigation : navigation.filter((item) => item.name !== 'Users');
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <span className="text-lg font-semibold">Admin Dashboard</span>
      </div>
      <AdminSidebarNav items={items} />
    </aside>
  );
}
