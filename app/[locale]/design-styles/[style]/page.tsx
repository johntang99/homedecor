import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadAllItems } from '@/lib/content';
import { getBaseUrlFromHost } from '@/lib/seo';
import { headers } from 'next/headers';
import { designStyles, getDesignStyleBySlug } from '@/data/seo-design-styles';

interface PageProps { params: { locale: Locale; style: string } }
interface PortfolioItem { slug: string; title?: string; titleCn?: string; coverImage?: string; style?: string; category?: string; featured?: boolean }

function tx(en: string, cn: string, locale: Locale) { return locale === 'zh' ? cn : en; }

export async function generateStaticParams() {
  return designStyles.flatMap(s => [{ locale: 'en', style: s.slug }, { locale: 'zh', style: s.slug }]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const style = getDesignStyleBySlug(params.style);
  if (!style) return {};
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const isCn = params.locale === 'zh';
  const title = isCn ? `${style.titleCn} | Julia Studio` : `${style.title} | Julia Studio`;
  const description = isCn ? style.descriptionCn : style.description;
  const canonical = new URL(`/${params.locale}/design-styles/${params.style}`, baseUrl).toString();
  return { title, description, alternates: { canonical, languages: { en: new URL(`/en/design-styles/${params.style}`, baseUrl).toString(), zh: new URL(`/zh/design-styles/${params.style}`, baseUrl).toString(), 'x-default': new URL(`/en/design-styles/${params.style}`, baseUrl).toString() } } };
}

export default async function DesignStylePage({ params }: PageProps) {
  const style = getDesignStyleBySlug(params.style);
  if (!style) notFound();

  const { locale } = params;
  const isCn = locale === 'zh';
  const siteId = await getRequestSiteId();
  const allProjects = await loadAllItems<PortfolioItem>(siteId, locale, 'portfolio');
  const styleProjects = allProjects.filter(p => p.style === style.portfolioStyle).slice(0, 3);
  const displayProjects = styleProjects.length ? styleProjects : allProjects.filter(p => p.featured).slice(0, 3);
  const characteristics = isCn ? style.characteristicsCn : style.characteristics;
  const relatedStyles = designStyles.filter(s => s.slug !== style.slug).slice(0, 4);

  return (
    <>
      <section className="pt-32 pb-20 md:pt-44 md:pb-28" style={{ background: 'var(--primary)' }}>
        <div className="container-custom max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--secondary)' }}>{isCn ? '设计风格' : 'Design Style'}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-5">{isCn ? style.titleCn : style.title}</h1>
          <p className="text-lg text-white/70">{isCn ? style.descriptionCn : style.description}</p>
          <Link href={`/${locale}/contact`} className="btn-gold mt-8 inline-flex">{isCn ? '预约免费咨询' : 'Book a Free Consultation'}</Link>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h2 className="font-serif text-2xl font-semibold mb-8" style={{ color: 'var(--primary)' }}>{isCn ? '风格特征' : 'Style Characteristics'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {characteristics.map((c, i) => (
              <div key={i} className="bg-white border border-[var(--border)] p-4 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {displayProjects.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="font-serif text-2xl font-semibold mb-8" style={{ color: 'var(--primary)' }}>{isCn ? '精选作品' : 'Featured Work'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {displayProjects.map(p => (
                <Link key={p.slug} href={`/${locale}/portfolio/${p.slug}`} className="group">
                  <div className="relative aspect-[4/3] image-frame mb-3 bg-[var(--primary-50)]">
                    {p.coverImage && <Image src={p.coverImage} alt={tx(p.title || '', p.titleCn || '', locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="33vw" />}
                  </div>
                  <p className="font-serif text-sm font-medium" style={{ color: 'var(--primary)' }}>{tx(p.title || '', p.titleCn || '', locale)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h2 className="font-serif text-xl font-semibold mb-6" style={{ color: 'var(--primary)' }}>{isCn ? '更多设计风格' : 'Explore Other Styles'}</h2>
          <div className="flex flex-wrap gap-3">
            {relatedStyles.map(s => (
              <Link key={s.slug} href={`/${locale}/design-styles/${s.slug}`} className="px-4 py-2 border border-[var(--border)] text-sm hover:border-[var(--secondary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                {isCn ? s.titleCn : s.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-2xl text-white mb-6">{isCn ? '探索您的设计风格' : 'Ready to explore this style in your home?'}</p>
          <Link href={`/${locale}/contact`} className="btn-gold">{isCn ? '预约免费咨询' : 'Book Your Free Consultation'}</Link>
        </div>
      </section>
    </>
  );
}
