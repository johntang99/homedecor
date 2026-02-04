// ============================================
// SITE MANAGEMENT UTILITIES
// ============================================

import { SiteConfig } from './types';
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const SITES_CONFIG_PATH = path.join(CONTENT_DIR, '_sites.json');

/**
 * Get all registered sites
 */
export async function getSites(): Promise<SiteConfig[]> {
  try {
    const data = await fs.promises.readFile(SITES_CONFIG_PATH, 'utf-8');
    const sites = JSON.parse(data);
    return sites.sites || [];
  } catch (error) {
    console.error('Error reading sites config:', error);
    return [];
  }
}

async function saveSites(sites: SiteConfig[]): Promise<void> {
  await fs.promises.mkdir(CONTENT_DIR, { recursive: true });
  const payload = { sites };
  await fs.promises.writeFile(SITES_CONFIG_PATH, JSON.stringify(payload, null, 2));
}

/**
 * Get a single site by ID
 */
export async function getSiteById(siteId: string): Promise<SiteConfig | null> {
  const sites = await getSites();
  return sites.find(site => site.id === siteId) || null;
}

/**
 * Get the default/first site
 */
export async function getDefaultSite(): Promise<SiteConfig | null> {
  const sites = await getSites();
  return sites.find(site => site.enabled) || sites[0] || null;
}

/**
 * Get site by domain (for multi-domain setup)
 */
export async function getSiteByDomain(domain: string): Promise<SiteConfig | null> {
  const sites = await getSites();
  const normalized = normalizeHost(domain);
  return (
    sites.find((site) => normalizeHost(site.domain || '') === normalized) || null
  );
}

/**
 * Check if a site exists
 */
export async function siteExists(siteId: string): Promise<boolean> {
  const site = await getSiteById(siteId);
  return site !== null;
}

/**
 * Update a site by ID
 */
export async function updateSite(
  siteId: string,
  updates: Partial<SiteConfig>
): Promise<SiteConfig | null> {
  const sites = await getSites();
  const index = sites.findIndex((site) => site.id === siteId);
  if (index === -1) return null;

  const updated: SiteConfig = {
    ...sites[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  sites[index] = updated;
  await saveSites(sites);
  return updated;
}

/**
 * Get site content directory path
 */
export function getSiteContentPath(siteId: string): string {
  return path.join(CONTENT_DIR, siteId);
}

/**
 * Get site upload directory path
 */
export function getSiteUploadPath(siteId: string): string {
  return path.join(process.cwd(), 'public', 'uploads', siteId);
}

export function normalizeHost(host: string): string {
  return host.replace(/:\d+$/, '').replace(/^www\./, '').toLowerCase();
}

export async function getSiteByHost(host?: string | null): Promise<SiteConfig | null> {
  if (!host) return null;
  return getSiteByDomain(host);
}
