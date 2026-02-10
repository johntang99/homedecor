import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { SiteConfig } from '@/lib/types';

interface SiteRow {
  id: string;
  name: string;
  domain: string | null;
  enabled: boolean;
  default_locale: string;
  supported_locales: string[];
  created_at: string;
  updated_at: string;
}

function mapSiteRow(row: SiteRow): SiteConfig {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain || undefined,
    enabled: row.enabled,
    defaultLocale: row.default_locale as SiteConfig['defaultLocale'],
    supportedLocales: (row.supported_locales || []) as SiteConfig['supportedLocales'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canUseSitesDb() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function listSitesDb(): Promise<SiteConfig[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from('sites').select('*');
  if (error) {
    console.error('Supabase listSitesDb error:', error);
    return [];
  }
  return (data || []).map((row) => mapSiteRow(row as SiteRow));
}

export async function getSiteByIdDb(siteId: string): Promise<SiteConfig | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .maybeSingle();
  if (error) {
    console.error('Supabase getSiteByIdDb error:', error);
    return null;
  }
  return data ? mapSiteRow(data as SiteRow) : null;
}

export async function createSiteDb(
  input: Omit<SiteConfig, 'createdAt' | 'updatedAt'>
): Promise<SiteConfig | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sites')
    .insert({
      id: input.id,
      name: input.name,
      domain: input.domain || null,
      enabled: input.enabled,
      default_locale: input.defaultLocale,
      supported_locales: input.supportedLocales,
    })
    .select('*')
    .maybeSingle();
  if (error) {
    console.error('Supabase createSiteDb error:', error);
    return null;
  }
  return data ? mapSiteRow(data as SiteRow) : null;
}

export async function updateSiteDb(
  siteId: string,
  updates: Partial<SiteConfig>
): Promise<SiteConfig | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const payload: Partial<SiteRow> = {
    name: updates.name,
    domain: updates.domain ?? null,
    enabled: updates.enabled,
    default_locale: updates.defaultLocale,
    supported_locales: updates.supportedLocales,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sites')
    .update(payload)
    .eq('id', siteId)
    .select('*')
    .maybeSingle();
  if (error) {
    console.error('Supabase updateSiteDb error:', error);
    return null;
  }
  return data ? mapSiteRow(data as SiteRow) : null;
}

export async function upsertSiteDb(params: SiteConfig): Promise<SiteConfig | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const existing = await getSiteByIdDb(params.id);
  const payload: Partial<SiteRow> = {
    id: params.id,
    name: params.name,
    domain: params.domain || null,
    enabled: params.enabled,
    default_locale: params.defaultLocale,
    supported_locales: params.supportedLocales,
    created_at: existing?.createdAt || params.createdAt,
    updated_at: params.updatedAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sites')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .maybeSingle();
  if (error) {
    console.error('Supabase upsertSiteDb error:', error);
    return null;
  }
  return data ? mapSiteRow(data as SiteRow) : null;
}
