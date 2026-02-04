import Link from 'next/link';
import { BookOpen, Building2, FileText, Image, Layers, LayoutGrid, Settings, Users } from 'lucide-react';

const navigation = [
  { name: 'Sites', href: '/admin/sites', icon: Building2 },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Blog Posts', href: '/admin/blog-posts', icon: BookOpen },
  { name: 'Media', href: '/admin/media', icon: Image },
  { name: 'Components', href: '/admin/components', icon: LayoutGrid },
  { name: 'Variants', href: '/admin/variants', icon: Layers },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <span className="text-lg font-semibold">Admin Dashboard</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
          >
            <item.icon className="w-4 h-4 text-gray-500" />
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
