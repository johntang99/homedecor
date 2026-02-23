import { notFound } from 'next/navigation';
import Link from 'next/link';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent, loadItemBySlug } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { Star } from 'lucide-react';

interface PageProps { params: { locale: Locale } }
interface Testimonial { id?: string; quote?: string; quoteCn?: string; author?: string; authorCn?: string; title?: string; titleCn?: string; category?: string; rating?: number; featured?: boolean }
interface TestimonialsFile { items?: Testimonial[] }
interface PageData { hero?: { headline?: string; headlineCn?: string; subline?: string; sublineCn?: string }; cta?: { headline?: string; headlineCn?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string } }

function tx(en?: string, cn?: string, locale?: Locale) { return (locale === 'zh' && cn) ? cn : (en || ''); }

export async function generateMetadata({ params }: PageProps) {
  const siteId = await getRequestSiteId();
  return buildPageMetadata({ siteId, locale: params.locale, slug: 'testimonials', title: 'Client Stories — Julia Studio', description: 'What our clients say about working with Julia Studio.' });
}

export default async function TestimonialsPage({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const [pageData, testimonialsData] = await Promise.all([
    loadPageContent<PageData>('testimonials', locale, siteId),
    loadItemBySlug<TestimonialsFile>(siteId, locale, '', 'testimonials'),
  ]);

  const items = testimonialsData?.items || [];
  const featured = items.filter(t => t.featured);
  const rest = items.filter(t => !t.featured);
  const isCn = locale === 'zh';

  return (
    <>
      <section className="pt-32 pb-16 md:pt-40" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom max-w-xl">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
            {tx(pageData?.hero?.headline, pageData?.hero?.headlineCn, locale) || (isCn ? '客户故事' : 'Client Stories')}
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{tx(pageData?.hero?.subline, pageData?.hero?.sublineCn, locale)}</p>
        </div>
      </section>

      {/* Featured testimonials */}
      {featured.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-8">
            {featured.map((t, i) => (
              <div key={t.id || i} className="card-frame bg-white p-8 border border-[var(--border)]">
                <div className="flex gap-1 mb-5">
                  {Array(t.rating || 5).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-[var(--secondary)] text-[var(--secondary)]" />)}
                </div>
                <blockquote className="font-serif text-lg leading-relaxed mb-6" style={{ color: 'var(--primary)' }}>"{tx(t.quote, t.quoteCn, locale)}"</blockquote>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>{tx(t.author, t.authorCn, locale)}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{tx(t.title, t.titleCn, locale)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All others */}
      {rest.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom columns-1 md:columns-2 lg:columns-3 gap-6">
            {rest.map((t, i) => (
              <div key={t.id || i} className="card-frame break-inside-avoid mb-6 p-6 bg-white border border-[var(--border)]">
                <div className="flex gap-1 mb-4">
                  {Array(t.rating || 5).fill(0).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-[var(--secondary)] text-[var(--secondary)]" />)}
                </div>
                <blockquote className="text-sm leading-loose mb-4" style={{ color: 'var(--text-secondary)' }}>"{tx(t.quote, t.quoteCn, locale)}"</blockquote>
                <p className="font-semibold text-xs" style={{ color: 'var(--primary)' }}>{tx(t.author, t.authorCn, locale)}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{tx(t.title, t.titleCn, locale)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 border-t border-[var(--border)] bg-white">
        <div className="container-custom text-center">
          <Link href={`/${locale}${pageData?.cta?.ctaHref || '/contact'}`} className="btn-gold">{tx(pageData?.cta?.ctaLabel, pageData?.cta?.ctaLabelCn, locale) || (isCn ? '预约咨询' : 'Book Consultation')}</Link>
        </div>
      </section>
    </>
  );
}
