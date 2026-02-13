'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import type { BookingRecord, BookingService } from '@/lib/types';
import { Button } from '@/components/ui';

interface BookingLookupProps {
  locale: 'en' | 'es';
}

export function BookingLookup({ locale }: BookingLookupProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rescheduleDraft, setRescheduleDraft] = useState<
    Record<string, { date: string; time: string; slots: string[] }>
  >({});

  useEffect(() => {
    const loadServices = async () => {
      const response = await fetch('/api/booking/services');
      if (!response.ok) return;
      const payload = await response.json();
      setServices(payload.services || []);
    };
    loadServices();
  }, []);

  const getServiceName = (serviceId: string) =>
    services.find((service) => service.id === serviceId)?.name || serviceId;

  const lookup = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/booking/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Lookup failed');
      }
      const payload = await response.json();
      setBookings(payload.bookings || []);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!email) {
      setStatus(locale === 'en' ? 'Enter your email first.' : 'Ingresa tu correo primero.');
      return;
    }
    const confirmed = window.confirm(
      locale === 'en'
        ? 'Are you sure you want to cancel this booking?'
        : 'Seguro que deseas cancelar esta reserva?'
    );
    if (!confirmed) return;
    setStatus(null);
    const response = await fetch('/api/booking/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, email }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Cancel failed');
      return;
    }
    await lookup();
  };

  const loadSlots = async (bookingId: string, serviceId: string, date: string) => {
    const response = await fetch(
      `/api/booking/slots?serviceId=${serviceId}&date=${date}`
    );
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return payload.slots || [];
  };

  const rescheduleBooking = async (bookingId: string) => {
    const draft = rescheduleDraft[bookingId];
    if (!draft?.date || !draft?.time) {
      setStatus(
        locale === 'en' ? 'Select a new date and time.' : 'Selecciona una nueva fecha y hora.'
      );
      return;
    }
    const response = await fetch('/api/booking/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        email,
        date: draft.date,
        time: draft.time,
      }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Reschedule failed');
      return;
    }
    await lookup();
  };

  return (
    <div className="bg-white/95 border border-gray-200/80 rounded-3xl p-8 space-y-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {locale === 'en' ? 'Manage' : 'Gestion'}
        </div>
        <h2 className="text-heading font-semibold text-gray-900 mt-2">
          {locale === 'en' ? 'Manage Your Booking' : 'Gestiona tu reserva'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {locale === 'en'
            ? 'Enter the email and phone used for booking.'
            : 'Ingresa el correo y telefono usados al reservar.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
          placeholder={locale === 'en' ? 'Email' : 'Correo'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
          placeholder={locale === 'en' ? 'Phone' : 'Telefono'}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <Button type="button" onClick={lookup} disabled={loading || !email || !phone}>
        {locale === 'en' ? 'Find My Bookings' : 'Buscar mis reservas'}
      </Button>

      {status && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {status}
        </div>
      )}

      <div className="space-y-4">
        {bookings.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 text-center">
            {locale === 'en' ? 'No bookings found.' : 'No se encontraron reservas.'}
          </div>
        )}
        {bookings.map((booking) => {
          const draft = rescheduleDraft[booking.id];
          return (
            <div key={booking.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {getServiceName(booking.serviceId)} · {booking.date} {booking.time}
                  </div>
                  <div className="text-xs text-gray-500">
                    {booking.status} · ID: {booking.id}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cancelBooking(booking.id)}
                  disabled={booking.status === 'cancelled'}
                >
                  {booking.status === 'cancelled'
                    ? locale === 'en'
                      ? 'Cancelled'
                      : 'Cancelada'
                    : locale === 'en'
                      ? 'Cancel'
                      : 'Cancelar'}
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <input
                  type="date"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={draft?.date || ''}
                  onChange={async (event) => {
                    const date = event.target.value;
                    const slots = date
                      ? await loadSlots(booking.id, booking.serviceId, date)
                      : [];
                    setRescheduleDraft((current) => ({
                      ...current,
                      [booking.id]: { date, time: '', slots },
                    }));
                  }}
                />
                <select
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={draft?.time || ''}
                  onChange={(event) =>
                    setRescheduleDraft((current) => ({
                      ...current,
                      [booking.id]: {
                        date: draft?.date || '',
                        time: event.target.value,
                        slots: draft?.slots || [],
                      },
                    }))
                  }
                >
                  <option value="">{locale === 'en' ? 'Select time' : 'Seleccionar hora'}</option>
                  {(draft?.slots || []).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={() => rescheduleBooking(booking.id)}>
                  {locale === 'en' ? 'Reschedule' : 'Reprogramar'}
                </Button>
              </div>
              {(booking.pickupAddress || booking.deliveryAddress || booking.zipCode) && (
                <div className="mt-3 text-xs text-gray-500">
                  {booking.pickupAddress && (
                    <div>
                      {locale === 'en' ? 'Pickup' : 'Recogida'}: {booking.pickupAddress}
                    </div>
                  )}
                  {booking.deliveryAddress && (
                    <div>
                      {locale === 'en' ? 'Delivery' : 'Entrega'}: {booking.deliveryAddress}
                    </div>
                  )}
                  {booking.zipCode && (
                    <div>
                      ZIP: {booking.zipCode}
                      {typeof booking.bags === 'number' ? ` · Bags: ${booking.bags}` : ''}
                      {typeof booking.estimatedWeightLb === 'number'
                        ? ` · ${booking.estimatedWeightLb} lb`
                        : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
