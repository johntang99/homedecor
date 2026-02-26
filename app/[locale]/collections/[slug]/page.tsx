import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadItemBySlug, loadAllItems } from '@/lib/content';

export const dynamic = 'force-dynamic';

interface PageProps { params: { locale: Locale; slug: string } }
interface CollectionData { slug: string; title?: string; titleCn?: string; description?: string; descriptionCn?: string; coverImage?: string; moodImages?: string[]; portfolioProjects?: string[]; shopProducts?: string[] }
interface PortfolioItem { slug: string; title?: string; titleCn?: string; coverImage?: string }
interface ShopProduct { slug: string; title?: string; titleCn?: string; images?: Array<{ src?: string }>; price?: number }

function tx(en?: string, cn?: string, locale?: Locale) { return (locale === 'zh' && cn) ? cn : (en || ''); }
function hasSlug(value: unknown): value is { slug: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { slug?: unknown }).slug === 'string'
  );
}
export async function generateStaticParams() { return []; }

export default async function CollectionDetailPage({ params }: PageProps) {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();
  const [col, allProjects, allProducts] = await Promise.all([
    loadItemBySlug<CollectionData>(siteId, locale, 'collections', slug),
    loadAllItems<PortfolioItem>(siteId, locale, 'portfolio'),
    loadAllItems<ShopProduct>(siteId, locale, 'shop-products'),
  ]);
  if (!col) notFound();
  const portfolioProjectSlugs = Array.isArray(col.portfolioProjects) ? col.portfolioProjects : [];
  const shopProductSlugs = Array.isArray(col.shopProducts) ? col.shopProducts : [];
  const projects = portfolioProjectSlugs
    .map((s) => allProjects.find((p) => hasSlug(p) && p.slug === s))
    .filter(Boolean) as PortfolioItem[];
  const products = shopProductSlugs
    .map((s) => allProducts.find((p) => hasSlug(p) && p.slug === s))
    .filter(Boolean) as ShopProduct[];
  const isCn = locale === 'zh';

  return (
    <>
      <div className="detail-backbar border-b border-[var(--border)] bg-white">
        <div className="container-custom detail-backbar-row">
          <Link href={`/${locale}/collections`} className="detail-back-link">
            <ArrowLeft className="w-4 h-4" /> {isCn ? '所有系列' : 'All Collections'}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] overflow-hidden" style={{ background: 'var(--primary-50)', minHeight: 'var(--detail-collection-hero-min-h, 350px)' }}>
        {col.coverImage && (
          <>
            <Image src={col.coverImage} alt={tx(col.title, col.titleCn, locale)} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0" style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--card-hover-overlay, 0.2))' }} />
          </>
        )}
        <div className="relative z-10 flex items-end h-full container-custom" style={{ paddingBottom: 'var(--detail-hero-content-pb, 2.5rem)' }}>
          <div>
            <h1 className="font-serif text-3xl md:text-5xl font-semibold" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>{tx(col.title, col.titleCn, locale)}</h1>
            <p className="detail-mt-xs max-w-xl" style={{ color: 'var(--on-dark-medium, rgb(var(--on-dark-rgb, 250 248 245) / 0.6))' }}>{tx(col.description, col.descriptionCn, locale)}</p>
          </div>
        </div>
      </section>

      {/* Mood images */}
      {col.moodImages?.filter(Boolean).length ? (
        <section className="section-padding bg-white">
          <div className="container-custom grid grid-cols-3 detail-gap-mood-grid">
            {col.moodImages.filter(Boolean).map((img, i) => (
              <div key={i} className="relative aspect-square image-frame photo-shadow-sm bg-[var(--primary-50)]">
                <Image src={img} alt="" fill className="object-cover" sizes="33vw" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <h2 className="detail-section-title">{isCn ? '相关项目' : 'Featured Projects'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 detail-gap-related-md">
              {projects.map(p => (
                <Link key={p.slug} href={`/${locale}/portfolio/${p.slug}`} className="group">
                  <div className="relative aspect-[4/3] image-frame photo-shadow-sm detail-card-media bg-[var(--primary-50)]">
                    {p.coverImage && <Image src={p.coverImage} alt={tx(p.title, p.titleCn, locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />}
                  </div>
                  <p className="detail-card-title">{tx(p.title, p.titleCn, locale)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="detail-section-title">{isCn ? '系列商品' : 'Shop This Collection'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 detail-gap-related-md">
              {products.map(p => (
                <Link key={p.slug} href={`/${locale}/shop/${p.slug}`} className="group">
                  <div className="relative aspect-square image-frame photo-shadow-sm detail-card-media bg-[var(--primary-50)]">
                    {p.images?.[0]?.src && <Image src={p.images[0].src} alt={tx(p.title, p.titleCn, locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />}
                  </div>
                  <p className="detail-card-title">{tx(p.title, p.titleCn, locale)}</p>
                  {p.price && <p className="detail-card-price">${p.price.toLocaleString()}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 border-t border-[var(--border)]" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom text-center">
          <Link href={`/${locale}/contact`} className="btn-gold">{isCn ? '预约咨询' : 'Book Consultation'}</Link>
        </div>
      </section>
    </>
  );
}
