import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadAllItems } from '@/lib/content';
import { getBaseUrlFromHost } from '@/lib/seo';
import { headers } from 'next/headers';
import { serviceTypes, getServiceTypeBySlug } from '@/data/seo-service-types';

interface PageProps { params: { locale: Locale; type: string } }
interface PortfolioItem { slug: string; title?: string; titleCn?: string; coverImage?: string; category?: string; featured?: boolean }

function tx(en: string, cn: string, locale: Locale) { return locale === 'zh' ? cn : en; }

export async function generateStaticParams() {
  return serviceTypes.flatMap(s => [
    { locale: 'en', type: s.slug },
    { locale: 'zh', type: s.slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const svc = getServiceTypeBySlug(params.type);
  if (!svc) return {};
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const isCn = params.locale === 'zh';
  const title = isCn ? `${svc.titleCn} | Julia Studio` : `${svc.title} | Julia Studio`;
  const description = isCn ? svc.descriptionCn : svc.description;
  const canonical = new URL(`/${params.locale}/interior-design-for/${params.type}`, baseUrl).toString();
  return {
    title, description,
    alternates: { canonical, languages: { en: new URL(`/en/interior-design-for/${params.type}`, baseUrl).toString(), zh: new URL(`/zh/interior-design-for/${params.type}`, baseUrl).toString(), 'x-default': new URL(`/en/interior-design-for/${params.type}`, baseUrl).toString() } },
  };
}

export default async function ServiceTypePage({ params }: PageProps) {
  const svc = getServiceTypeBySlug(params.type);
  if (!svc) notFound();

  const { locale } = params;
  const isCn = locale === 'zh';
  const siteId = await getRequestSiteId();
  const allProjects = await loadAllItems<PortfolioItem>(siteId, locale, 'portfolio');
  const categoryProjects = allProjects.filter(p => p.category === svc.portfolioCategory).slice(0, 3);
  const displayProjects = categoryProjects.length ? categoryProjects : allProjects.filter(p => p.featured).slice(0, 3);
  const highlights = isCn ? svc.keyServicesCn : svc.keyServices;

  return (
    <>
      <section className="pt-32 pb-20 md:pt-44 md:pb-28" style={{ background: 'var(--primary)' }}>
        <div className="container-custom max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--secondary)' }}>Julia Studio</p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-5">{isCn ? svc.titleCn : svc.title}</h1>
          <p className="text-lg text-white/70">{isCn ? svc.descriptionCn : svc.description}</p>
          <Link href={`/${locale}/contact`} className="btn-gold mt-8 inline-flex">{isCn ? '预约免费咨询' : 'Book a Free Consultation'}</Link>
        </div>
      </section>

      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h2 className="font-serif text-2xl font-semibold mb-8" style={{ color: 'var(--primary)' }}>{isCn ? '服务内容' : 'Key Services'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <div key={i} className="bg-white border border-[var(--border)] p-6">
                <div className="w-8 h-px mb-4" style={{ background: 'var(--secondary)' }} />
                <p className="font-serif text-base font-medium" style={{ color: 'var(--primary)' }}>{h}</p>
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

      <section className="section-padding" style={{ background: 'var(--primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-2xl text-white mb-6">{isCn ? '开始您的项目' : 'Start Your Project'}</p>
          <Link href={`/${locale}/contact`} className="btn-gold">{isCn ? '预约免费咨询' : 'Book Your Free Consultation'}</Link>
        </div>
      </section>
    </>
  );
}
