import type { Metadata } from 'next';
import { CalendarCheck } from 'lucide-react';
import { BookingWidget } from '@/components/booking/BookingWidget';
import { BookingLookup } from '@/components/booking/BookingLookup';
import { getRequestSiteId } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Locale } from '@/lib/types';

interface BookingPageProps {
  params: {
    locale: Locale;
  };
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const siteId = await getRequestSiteId();
  return buildPageMetadata({
    siteId,
    locale: params.locale,
    slug: 'book',
    title: params.locale === 'en' ? 'Book Consultation' : '预约咨询',
    description:
      params.locale === 'en'
        ? 'Schedule your appointment in a few steps.'
        : '几步完成在线预约。',
  });
}

export default function BookingPage({ params }: BookingPageProps) {
  const { locale } = params;

  return (
    <main className="bg-gray-50">
      <section className="pt-28 md:pt-32 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h1 className="text-display font-bold text-gray-900">
              {locale === 'en' ? 'Book Consultation' : '预约咨询'}
            </h1>
            <p className="text-subheading text-gray-600 mt-3">
              {locale === 'en'
                ? 'Choose treatment type, select a time slot, and confirm your appointment.'
                : '选择疗法、预约时段并确认就诊。'}
            </p>
          </div>
          <BookingWidget locale={locale} />
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <BookingLookup locale={locale} />
        </div>
      </section>
    </main>
  );
}
