'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BookingService } from '@/lib/types';
import { Button } from '@/components/ui';

interface BookingWidgetProps {
  locale: 'en' | 'es';
}

interface BookingForm {
  name: string;
  phone: string;
  email: string;
  note: string;
  pickupAddress: string;
  deliveryAddress: string;
  unitOrApt: string;
  zipCode: string;
  bags: string;
  estimatedWeightLb: string;
  requestType: 'one_time' | 'recurring';
}

export function BookingWidget({ locale }: BookingWidgetProps) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [form, setForm] = useState<BookingForm>({
    name: '',
    phone: '',
    email: '',
    note: '',
    pickupAddress: '',
    deliveryAddress: '',
    unitOrApt: '',
    zipCode: '',
    bags: '',
    estimatedWeightLb: '',
    requestType: 'one_time',
  });
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      const response = await fetch('/api/booking/services');
      if (!response.ok) return;
      const payload = await response.json();
      setServices(payload.services || []);
    };
    loadServices();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedService || !selectedDate) return;
      setLoading(true);
      setStatus(null);
      try {
        const response = await fetch(
          `/api/booking/slots?serviceId=${selectedService.id}&date=${selectedDate}`
        );
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message || 'Failed to load time slots');
        }
        const payload = await response.json();
        setSlots(payload.slots || []);
      } catch (error: any) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [selectedService, selectedDate]);

  const canProceedToDetails = selectedService && selectedDate && selectedTime;
  const requiresAddress =
    selectedService?.serviceType === 'pickup_delivery' ||
    selectedService?.serviceType === 'commercial';
  const isFormComplete =
    Boolean(form.name && form.phone && form.email) &&
    (!requiresAddress || Boolean(form.pickupAddress && form.zipCode));

  const summary = useMemo(() => {
    if (!selectedService) return null;
    return {
      service: selectedService.name,
      duration: `${selectedService.durationMinutes} min`,
      date: selectedDate,
      time: selectedTime,
    };
  }, [selectedService, selectedDate, selectedTime]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !isFormComplete) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          name: form.name,
          phone: form.phone,
          email: form.email,
          note: form.note,
          pickupAddress: form.pickupAddress || undefined,
          deliveryAddress: form.deliveryAddress || undefined,
          unitOrApt: form.unitOrApt || undefined,
          zipCode: form.zipCode || undefined,
          bags: form.bags ? Number(form.bags) : undefined,
          estimatedWeightLb: form.estimatedWeightLb
            ? Number(form.estimatedWeightLb)
            : undefined,
          requestType: form.requestType,
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Booking failed');
      }
      setStep(4);
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[2.2fr,1fr]">
      <div className="space-y-8">
        <div className="bg-white/95 border border-gray-200/80 rounded-3xl p-8 space-y-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">
                  1
                </span>
                {locale === 'en' ? 'Step 1' : 'Paso 1'}
              </div>
              <h2 className="text-heading font-semibold text-gray-900 mt-2">
                {locale === 'en' ? 'Choose a Service' : 'Selecciona un servicio'}
              </h2>
            </div>
            <div className="text-xs text-gray-500">
              {locale === 'en' ? 'Select service type' : 'Selecciona tipo de servicio'}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
                className={`rounded-2xl border px-4 py-4 text-left transition group ${
                  selectedService?.id === service.id
                    ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,white)] shadow-[0_6px_20px_rgba(15,23,42,0.08)]'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 group-hover:text-gray-800">
                  {service.name}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {service.serviceType ? `${service.serviceType.replace('_', ' ')} · ` : ''}
                  {service.durationMinutes} min
                  {service.price ? ` · $${service.price}` : ''}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/95 border border-gray-200/80 rounded-3xl p-8 space-y-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">
                  2
                </span>
                {locale === 'en' ? 'Step 2' : 'Paso 2'}
              </div>
              <h2 className="text-heading font-semibold text-gray-900 mt-2">
                {locale === 'en' ? 'Select Date & Time' : 'Selecciona fecha y hora'}
              </h2>
            </div>
            <div className="text-xs text-gray-500">
              {locale === 'en' ? 'Pick an open slot' : 'Elige un horario disponible'}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">
                {locale === 'en' ? 'Date' : 'Fecha'}
              </label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedTime('');
                  setStep(2);
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">
                {locale === 'en' ? 'Time' : 'Hora'}
              </label>
              <div className="mt-1 grid grid-cols-2 gap-3">
                {slots.length === 0 && selectedDate && (
                  <div className="col-span-2 rounded-xl border border-dashed border-gray-200 px-3 py-4 text-xs text-gray-500 text-center">
                    {locale === 'en' ? 'No slots available.' : 'No hay horarios disponibles.'}
                  </div>
                )}
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedTime(slot);
                      setStep(3);
                    }}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      selectedTime === slot
                        ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)] shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {status && (
            <div className="text-sm text-red-500">{status}</div>
          )}
        </div>

        <div className="bg-white/95 border border-gray-200/80 rounded-3xl p-8 space-y-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] flex items-center justify-center text-xs font-bold">
                  3
                </span>
                {locale === 'en' ? 'Step 3' : 'Paso 3'}
              </div>
              <h2 className="text-heading font-semibold text-gray-900 mt-2">
                {locale === 'en' ? 'Your Details' : 'Tus datos'}
              </h2>
            </div>
            <div className="text-xs text-gray-500">
              {locale === 'en' ? 'Required fields' : 'Campos obligatorios'}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">
                {locale === 'en' ? 'Full name' : 'Nombre completo'}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">
                {locale === 'en' ? 'Phone number' : 'Telefono'}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500">
                {locale === 'en' ? 'Email address' : 'Correo electronico'}
              </label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500">
                {locale === 'en' ? 'Note (optional)' : 'Nota (opcional)'}
              </label>
              <textarea
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                rows={3}
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder={
                  locale === 'en'
                    ? 'Let us know anything important before your visit.'
                    : 'Indicanos detalles especiales para tu pedido.'
                }
              />
            </div>
            {requiresAddress && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500">
                    {locale === 'en' ? 'Pickup address' : 'Direccion de recogida'}
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                    value={form.pickupAddress}
                    onChange={(event) => setForm({ ...form, pickupAddress: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    {locale === 'en' ? 'Unit/Apt (optional)' : 'Unidad/Apto (opcional)'}
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                    value={form.unitOrApt}
                    onChange={(event) => setForm({ ...form, unitOrApt: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    {locale === 'en' ? 'Zip code' : 'Codigo postal'}
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                    value={form.zipCode}
                    onChange={(event) => setForm({ ...form, zipCode: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    {locale === 'en' ? 'Bags (optional)' : 'Bolsas (opcional)'}
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                    value={form.bags}
                    onChange={(event) => setForm({ ...form, bags: event.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">
                    {locale === 'en' ? 'Estimated weight (lb)' : 'Peso estimado (lb)'}
                  </label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                    value={form.estimatedWeightLb}
                    onChange={(event) =>
                      setForm({ ...form, estimatedWeightLb: event.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500">
                    {locale === 'en' ? 'Request type' : 'Tipo de solicitud'}
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={form.requestType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        requestType: event.target.value as 'one_time' | 'recurring',
                      })
                    }
                  >
                    <option value="one_time">
                      {locale === 'en' ? 'One-time order' : 'Pedido unico'}
                    </option>
                    <option value="recurring">
                      {locale === 'en' ? 'Recurring schedule' : 'Servicio recurrente'}
                    </option>
                  </select>
                </div>
              </>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceedToDetails || !isFormComplete || loading}
          >
            {locale === 'en' ? 'Confirm Booking' : 'Confirmar reserva'}
          </Button>
        </div>

        {step === 4 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
            <div className="text-lg font-semibold text-emerald-900">
              {locale === 'en' ? 'Booking confirmed!' : 'Reserva confirmada'}
            </div>
            <p className="text-sm text-emerald-700 mt-2">
              {locale === 'en'
                ? 'We have emailed your confirmation. You can manage your booking below.'
                : 'Te enviamos una confirmacion por correo. Puedes gestionar tu reserva abajo.'}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white/95 border border-gray-200/80 rounded-3xl p-6 h-fit shadow-[0_12px_30px_rgba(15,23,42,0.08)] lg:sticky lg:top-28">
        <div className="text-sm font-semibold text-gray-900 mb-4">
          {locale === 'en' ? 'Booking Summary' : 'Resumen de reserva'}
        </div>
        {summary ? (
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{locale === 'en' ? 'Service' : 'Servicio'}</span>
              <span className="font-medium text-gray-900">{summary.service}</span>
            </div>
            <div className="flex justify-between">
              <span>{locale === 'en' ? 'Duration' : '时长'}</span>
              <span className="font-medium text-gray-900">{summary.duration}</span>
            </div>
            <div className="flex justify-between">
              <span>{locale === 'en' ? 'Date' : 'Fecha'}</span>
              <span className="font-medium text-gray-900">{summary.date || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>{locale === 'en' ? 'Time' : 'Hora'}</span>
              <span className="font-medium text-gray-900">{summary.time || '-'}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            {locale === 'en'
              ? 'Select a service to get started.'
              : 'Selecciona un servicio para comenzar.'}
          </div>
        )}
      </div>
    </div>
  );
}
