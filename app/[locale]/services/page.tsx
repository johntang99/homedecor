import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 86400; // 24 hours

interface PageProps { params: { locale: Locale } }

interface ServiceItem { title?: string; titleCn?: string; description?: string; descriptionCn?: string; image?: string }
interface ProcessStep { number?: number; title?: string; titleCn?: string; description?: string; descriptionCn?: string }
interface SpecialtyItem { icon?: string; label?: string; labelCn?: string }

interface ServicesData {
  hero?: { headline?: string; headlineCn?: string; subline?: string; sublineCn?: string; backgroundImage?: string };
  designServices?: { headline?: string; headlineCn?: string; items?: ServiceItem[] };
  constructionServices?: { headline?: string; headlineCn?: string; body?: string; bodyCn?: string; image?: string; capabilities?: Array<{ label?: string; labelCn?: string }> };
  furnishingServices?: { headline?: string; headlineCn?: string; body?: string; bodyCn?: string; image?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string };
  process?: { headline?: string; headlineCn?: string; steps?: ProcessStep[]; variant?: string };
  specialties?: { headline?: string; headlineCn?: string; items?: SpecialtyItem[] };
  cta?: { headline?: string; headlineCn?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string; backgroundImage?: string };
}

function tx(en?: string, cn?: string, locale?: Locale) { return (locale === 'zh' && cn) ? cn : (en || ''); }

export async function generateMetadata({ params }: PageProps) {
  const siteId = await getRequestSiteId();
  return buildPageMetadata({ siteId, locale: params.locale, slug: 'services',
    title: 'Services — Julia Studio',
    description: 'Full-service interior design, construction, and furniture sourcing. From concept to reveal.' });
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const data = await loadPageContent<ServicesData>('services', locale, siteId);
  if (!data) notFound();
  const isCn = locale === 'zh';

  return (
    <>
      {/* Hero */}
      <section className="relative hero-pad-services overflow-hidden" style={{ background: 'var(--primary)' }}>
        {data.hero?.backgroundImage && (
          <>
            <div className="absolute inset-0">
              <Image
                src={data.hero.backgroundImage}
                alt=""
                fill
                className="object-cover"
                style={{ opacity: 'var(--media-dim-medium, 0.3)' }}
                sizes="100vw"
                priority
              />
            </div>
            <div className="absolute inset-0" style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--overlay-medium, 0.6))' }} />
          </>
        )}
        <div className="relative z-10 container-custom max-w-2xl">
          <h1 className="font-serif text-4xl md:text-6xl font-semibold mb-5" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>{tx(data.hero?.headline, data.hero?.headlineCn, locale) || (isCn?'我们的服务':'Our Services')}</h1>
          <p className="text-lg" style={{ color: 'var(--on-dark-medium, rgb(var(--on-dark-rgb, 250 248 245) / 0.6))' }}>{tx(data.hero?.subline, data.hero?.sublineCn, locale)}</p>
        </div>
      </section>

      {/* Design Services */}
      {data.designServices?.items?.map((item, i) => (
        <section key={i} className={`section-padding ${i % 2 === 0 ? 'bg-white' : ''}`} style={i % 2 !== 0 ? { background: 'var(--backdrop-primary)' } : {}}>
          <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-5" style={{ color: 'var(--primary)' }}>{tx(item.title, item.titleCn, locale)}</h2>
              <p className="text-base leading-loose" style={{ color: 'var(--text-secondary)' }}>{tx(item.description, item.descriptionCn, locale)}</p>
            </div>
            <div className={`relative aspect-[4/3] image-frame ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
              {item.image ? <Image src={item.image} alt={tx(item.title, item.titleCn, locale)} fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" /> : <div className="w-full h-full bg-[var(--primary-50)]" />}
            </div>
          </div>
        </section>
      ))}

      {/* Process */}
      {data.process?.steps && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-14 text-center" style={{ color: 'var(--primary)' }}>
              {tx(data.process.headline, data.process.headlineCn, locale) || (isCn?'我们的流程':'Our Process')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {data.process.steps.map((step, i) => (
                <div key={i} className="text-center relative">
                  {i < data.process!.steps!.length - 1 && (
                    <div className="hidden lg:block absolute top-5 left-full w-full h-px" style={{ background: 'var(--border)' }} />
                  )}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-semibold font-serif" style={{ background: 'var(--secondary-50)', color: 'var(--secondary)' }}>
                    {step.number || i + 1}
                  </div>
                  <p className="font-serif text-sm font-semibold mb-2" style={{ color: 'var(--primary)' }}>{tx(step.title, step.titleCn, locale)}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tx(step.description, step.descriptionCn, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Specialties */}
      {data.specialties?.items && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <h2 className="font-serif text-3xl font-semibold mb-10 text-center" style={{ color: 'var(--primary)' }}>
              {tx(data.specialties.headline, data.specialties.headlineCn, locale) || (isCn?'专业领域':'Specialties')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {data.specialties.items.map((item, i) => (
                <div key={i} className="border border-[var(--border)] p-5 text-center hover:border-[var(--secondary)] transition-colors bg-white">
                  <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{tx(item.label, item.labelCn, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative section-padding overflow-hidden" style={{ background: 'var(--primary)' }}>
        {data.cta?.backgroundImage && (
          <>
            <div className="absolute inset-0">
              <Image
                src={data.cta.backgroundImage}
                alt=""
                fill
                className="object-cover"
                style={{ opacity: 'var(--media-dim-light, 0.25)' }}
                sizes="100vw"
              />
            </div>
            <div className="absolute inset-0" style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--overlay-strong, 0.7))' }} />
          </>
        )}
        <div className="relative z-10 container-custom text-center">
          <p className="font-serif text-3xl md:text-4xl mb-8 max-w-xl mx-auto" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>{tx(data.cta?.headline, data.cta?.headlineCn, locale)}</p>
          <Link href={`/${locale}${data.cta?.ctaHref || '/contact'}`} className="btn-gold btn-gold-lg text-base">
            {tx(data.cta?.ctaLabel, data.cta?.ctaLabelCn, locale) || (isCn?'预约免费咨询':'Book Your Free Consultation')}
          </Link>
        </div>
      </section>
    </>
  );
}
