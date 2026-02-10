import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { BookingRecord, BookingService, BookingSettings } from '@/lib/types';

interface BookingRow {
  id: string;
  site_id: string;
  service_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  name: string;
  phone: string;
  email: string;
  note: string | null;
  status: BookingRecord['status'];
  created_at: string;
  updated_at: string;
}

function mapBookingRow(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    siteId: row.site_id,
    serviceId: row.service_id,
    date: row.date,
    time: row.time,
    durationMinutes: row.duration_minutes,
    name: row.name,
    phone: row.phone,
    email: row.email,
    note: row.note || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canUseBookingDb() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function loadBookingServicesDb(siteId: string): Promise<BookingService[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('booking_services')
    .select('services')
    .eq('site_id', siteId)
    .maybeSingle();
  if (error) {
    console.error('Supabase loadBookingServicesDb error:', error);
    return [];
  }
  return (data?.services as BookingService[]) || [];
}

export async function saveBookingServicesDb(siteId: string, services: BookingService[]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('booking_services')
    .upsert(
      {
        site_id: siteId,
        services,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id' }
    );
  if (error) {
    console.error('Supabase saveBookingServicesDb error:', error);
  }
}

export async function loadBookingSettingsDb(
  siteId: string
): Promise<BookingSettings | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('booking_settings')
    .select('settings')
    .eq('site_id', siteId)
    .maybeSingle();
  if (error) {
    console.error('Supabase loadBookingSettingsDb error:', error);
    return null;
  }
  return (data?.settings as BookingSettings) || null;
}

export async function saveBookingSettingsDb(siteId: string, settings: BookingSettings) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('booking_settings')
    .upsert(
      {
        site_id: siteId,
        settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'site_id' }
    );
  if (error) {
    console.error('Supabase saveBookingSettingsDb error:', error);
  }
}

export async function listBookingsDb(
  siteId: string,
  startDate: string,
  endDate: string
): Promise<BookingRecord[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('site_id', siteId)
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) {
    console.error('Supabase listBookingsDb error:', error);
    return [];
  }
  return (data || []).map((row) => mapBookingRow(row as BookingRow));
}

export async function upsertBookingDb(siteId: string, booking: BookingRecord) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('bookings')
    .upsert(
      {
        id: booking.id,
        site_id: siteId,
        service_id: booking.serviceId,
        date: booking.date,
        time: booking.time,
        duration_minutes: booking.durationMinutes,
        name: booking.name,
        phone: booking.phone,
        email: booking.email,
        note: booking.note || null,
        status: booking.status,
        created_at: booking.createdAt,
        updated_at: booking.updatedAt,
      },
      { onConflict: 'id' }
    );
  if (error) {
    console.error('Supabase upsertBookingDb error:', error);
  }
}
