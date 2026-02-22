import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadAllItems } from '@/lib/content';
import { getBaseUrlFromHost } from '@/lib/seo';
import { headers } from 'next/headers';
import { locations, getLocationBySlug } from '@/data/seo-locations';
import { ArrowRight } from 'lucide-react';

interface PageProps { params: { locale: Locale; city: string } }
interface PortfolioItem { slug: string; title?: string; titleCn?: string; coverImage?: string; category?: string; location?: string; featured?: boolean }

function tx(en: string, cn: string, locale: Locale) { return locale === 'zh' ? cn : en; }

export async function generateStaticParams() {
  return locations.flatMap(l => [
    { locale: 'en', city: l.slug },
    { locale: 'zh', city: l.slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const loc = getLocationBySlug(params.city);
  if (!loc) return {};
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const isCn = params.locale === 'zh';
  const title = isCn ? `${loc.cityCn}室内设计 | Julia Studio` : `Interior Design in ${loc.city} | Julia Studio`;
  const description = isCn ? loc.descriptionCn : loc.description;
  const canonical = new URL(`/${params.locale}/interior-design/${params.city}`, baseUrl).toString();
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: new URL(`/en/interior-design/${params.city}`, baseUrl).toString(),
        zh: new URL(`/zh/interior-design/${params.city}`, baseUrl).toString(),
        'x-default': new URL(`/en/interior-design/${params.city}`, baseUrl).toString(),
      },
    },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

export default async function LocationPage({ params }: PageProps) {
  const loc = getLocationBySlug(params.city);
  if (!loc) notFound();

  const { locale } = params;
  const isCn = locale === 'zh';
  const siteId = await getRequestSiteId();
  const allProjects = await loadAllItems<PortfolioItem>(siteId, locale, 'portfolio');

  const featuredProjects = allProjects.filter(p => p.featured).slice(0, 3);
  const displayProjects = featuredProjects.length ? featuredProjects : allProjects.slice(0, 3);

  const highlights = isCn ? loc.serviceHighlightsCn : loc.serviceHighlights;
  const nearby = loc.nearbyLocations;

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28" style={{ background: 'var(--primary)' }}>
        <div className="container-custom max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--secondary)' }}>
            {isCn ? '服务地区' : 'Service Area'}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-5">
            {isCn ? `${loc.cityCn}室内设计` : `Interior Design in ${loc.city}`}
          </h1>
          <p className="text-lg text-white/70">
            {isCn ? loc.descriptionCn : loc.description}
          </p>
          <Link href={`/${locale}/contact`} className="btn-gold mt-8 inline-flex">
            {isCn ? '预约免费咨询' : 'Book a Free Consultation'}
          </Link>
        </div>
      </section>

      {/* Service highlights */}
      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-8" style={{ color: 'var(--primary)' }}>
            {isCn ? `我们在${loc.cityCn}的服务` : `Our Services in ${loc.city}`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <div key={i} className="border border-[var(--border)] bg-white p-6">
                <div className="w-8 h-px mb-4" style={{ background: 'var(--secondary)' }} />
                <p className="font-serif text-base font-medium" style={{ color: 'var(--primary)' }}>{h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured projects */}
      {displayProjects.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-8" style={{ color: 'var(--primary)' }}>
              {isCn ? '精选作品' : 'Featured Work'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {displayProjects.map(p => (
                <Link key={p.slug} href={`/${locale}/portfolio/${p.slug}`} className="group">
                  <div className="relative aspect-[4/3] image-frame mb-3 bg-[var(--primary-50)]">
                    {p.coverImage && <Image src={p.coverImage} alt={tx(p.title || '', p.titleCn || '', locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width:768px) 100vw, 33vw" />}
                  </div>
                  <p className="font-serif text-sm font-medium" style={{ color: 'var(--primary)' }}>{tx(p.title || '', p.titleCn || '', locale)}</p>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link href={`/${locale}/portfolio`} className="inline-flex items-center gap-2 text-sm font-semibold group" style={{ color: 'var(--secondary)' }}>
                {isCn ? '查看全部项目' : 'View All Projects'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Service area */}
      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-serif text-2xl font-semibold mb-4" style={{ color: 'var(--primary)' }}>
              {isCn ? '服务区域' : 'Areas We Serve'}
            </h2>
            <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
              {isCn ? loc.regionCn : loc.region}
            </p>
          </div>
          {nearby.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--primary)' }}>
                {isCn ? '临近地区' : 'Nearby Areas'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {nearby.map(slug => {
                  const n = locations.find(l => l.slug === slug);
                  if (!n) return null;
                  return (
                    <Link key={slug} href={`/${locale}/interior-design/${slug}`}
                      className="px-3 py-1 text-sm border border-[var(--border)] hover:border-[var(--secondary)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                      {isCn ? n.cityCn : n.city}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding" style={{ background: 'var(--primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-2xl md:text-3xl text-white mb-6">
            {isCn ? `准备好改变您的${loc.cityCn}空间了吗？` : `Ready to transform your ${loc.city} space?`}
          </p>
          <Link href={`/${locale}/contact`} className="btn-gold">{isCn ? '预约免费咨询' : 'Book Your Free Consultation'}</Link>
        </div>
      </section>
    </>
  );
}
