import type { SiteConfig, User } from '@/lib/types';

export function isSuperAdmin(user: User) {
  return user.role === 'super_admin';
}

export function canAccessSite(user: User, siteId: string) {
  if (isSuperAdmin(user)) return true;
  return user.sites.includes(siteId);
}

export function filterSitesForUser(sites: SiteConfig[], user: User) {
  if (isSuperAdmin(user)) return sites;
  return sites.filter((site) => user.sites.includes(site.id));
}

export function requireRole(user: User, roles: User['role'][]) {
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
}

export function requireSiteAccess(user: User, siteId: string) {
  if (!canAccessSite(user, siteId)) {
    throw new Error('Forbidden');
  }
}

export function canWriteContent(user: User) {
  return ['super_admin', 'site_admin', 'editor'].includes(user.role);
}

export function canManageBookings(user: User) {
  return ['super_admin', 'site_admin'].includes(user.role);
}

export function canManageMedia(user: User) {
  return ['super_admin', 'site_admin', 'editor'].includes(user.role);
}
