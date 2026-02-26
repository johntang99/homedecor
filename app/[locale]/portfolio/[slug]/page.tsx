import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadItemBySlug, loadAllItems } from '@/lib/content';
import PortfolioGalleryView from '@/components/portfolio/PortfolioGalleryView';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

interface PageProps { params: { locale: Locale; slug: string } }

interface GalleryImage { image?: string; alt?: string; altCn?: string; layout?: 'full' | 'half' }
interface ShopProduct { slug: string; title?: string; titleCn?: string; images?: Array<{ src?: string }>; price?: number }
interface PortfolioItem { slug: string; title?: string; titleCn?: string; coverImage?: string; category?: string }

interface ProjectData {
  slug: string;
  title?: string; titleCn?: string;
  category?: string; style?: string;
  location?: string; year?: string;
  coverImage?: string;
  image?: string;
  overview?: { body?: string; bodyCn?: string };
  details?: {
    scope?: string; scopeCn?: string;
    duration?: string; durationCn?: string;
    rooms?: string[]; roomsCn?: string[];
    keyMaterials?: string[]; keyMaterialsCn?: string[];
  };
  gallery?: GalleryImage[];
  shopThisLook?: string[];
  testimonial?: { quote?: string; quoteCn?: string; author?: string; project?: string };
  relatedProjects?: string[];
}

function tx(en?: string, cn?: string, locale?: Locale): string {
  return (locale === 'zh' && cn) ? cn : (en || '');
}

function hasSlug(value: unknown): value is { slug: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { slug?: unknown }).slug === 'string'
  );
}

export async function generateStaticParams() {
  // Only called at build — dynamic in dev
  return [];
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();

  const [project, allProducts, allProjects] = await Promise.all([
    loadItemBySlug<ProjectData>(siteId, locale, 'portfolio', slug),
    loadAllItems<ShopProduct>(siteId, locale, 'shop-products'),
    loadAllItems<PortfolioItem>(siteId, locale, 'portfolio'),
  ]);

  if (!project) notFound();
  const heroImage = project.coverImage || project.image;

  const shopLookSlugs = Array.isArray(project.shopThisLook) ? project.shopThisLook : [];
  const relatedProjectSlugs = Array.isArray(project.relatedProjects) ? project.relatedProjects : [];

  const shopProducts = shopLookSlugs
    .map(s => allProducts.find(p => hasSlug(p) && p.slug === s))
    .filter(Boolean) as ShopProduct[];

  const relatedProjects = relatedProjectSlugs
    .map(s => allProjects.find(p => hasSlug(p) && p.slug === s))
    .filter(Boolean) as PortfolioItem[];

  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden" style={{ background: 'var(--primary-50)', minHeight: 'var(--detail-portfolio-hero-min-h, 500px)' }}>
        {heroImage && (
          <Image src={heroImage} alt={tx(project.title, project.titleCn, locale)} fill className="object-cover" priority sizes="100vw" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(26,26,26,0.65) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 right-0 container-custom" style={{ paddingBottom: 'var(--detail-hero-content-pb, 2.5rem)' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] detail-mb-xs" style={{ color: 'var(--secondary)' }}>{project.category}</p>
          <h1 className="font-serif text-3xl md:text-5xl font-semibold detail-mb-xs" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>{tx(project.title, project.titleCn, locale)}</h1>
          <div className="detail-hero-meta">
            {project.location && <span>{project.location}</span>}
            {project.year && <span>{project.year}</span>}
          </div>
        </div>
      </section>

      {/* Back link */}
      <div className="detail-backbar border-b border-[var(--border)] bg-white">
        <div className="container-custom detail-backbar-row">
          <Link href={`/${locale}/portfolio`} className="detail-back-link">
            <ArrowLeft className="w-4 h-4" /> {locale === 'zh' ? '返回作品集' : 'Back to Portfolio'}
          </Link>
        </div>
      </div>

      {/* Overview + Details */}
      <section className="section-padding bg-white">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-3 detail-gap-main-columns">
          <div className="lg:col-span-2">
            <p className="text-base leading-loose" style={{ color: 'var(--text-secondary)', maxWidth: '60ch' }}>
              {tx(project.overview?.body, project.overview?.bodyCn, locale)}
            </p>
          </div>
          {project.details && (
            <div className="border border-[var(--border)] p-7 h-fit">
              {project.details.scope && (
                <div className="detail-mb-md"><p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">{locale==='zh'?'项目范围':'Scope'}</p><p className="font-serif font-medium detail-mt-xxs" style={{ color: 'var(--primary)' }}>{tx(project.details.scope, project.details.scopeCn, locale)}</p></div>
              )}
              {project.details.duration && (
                <div className="detail-mb-md"><p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">{locale==='zh'?'工期':'Duration'}</p><p className="font-serif font-medium detail-mt-xxs" style={{ color: 'var(--primary)' }}>{tx(project.details.duration, project.details.durationCn, locale)}</p></div>
              )}
              {project.details.rooms?.length && (
                <div className="detail-mb-md">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">{locale==='zh'?'空间':'Rooms'}</p>
                  <div className="detail-mt-xxs flex flex-wrap detail-gap-chip-group">
                    {(locale==='zh' ? (project.details.roomsCn || project.details.rooms) : project.details.rooms).map(r => (
                      <span key={r} className="text-xs px-2 py-0.5 border border-[var(--border)]" style={{ color: 'var(--primary)' }}>{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {project.details.keyMaterials?.length && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">{locale==='zh'?'主要材料':'Key Materials'}</p>
                  <ul className="detail-mt-xxs detail-space-y-hairline">
                    {(locale==='zh' ? (project.details.keyMaterialsCn || project.details.keyMaterials) : project.details.keyMaterials).map(m => (
                      <li key={m} className="text-sm" style={{ color: 'var(--primary)' }}>— {m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      {project.gallery && project.gallery.length > 0 && (
        <PortfolioGalleryView locale={locale} gallery={project.gallery} />
      )}

      {/* Shop This Look */}
      {shopProducts.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <h2 className="detail-section-title">
              {locale === 'zh' ? '选购同款' : 'Shop This Look'}
            </h2>
            <div className="flex detail-gap-hscroll-cards overflow-x-auto hide-scrollbar detail-pb-xs">
              {shopProducts.map(product => (
                <Link key={product.slug} href={`/${locale}/shop/${product.slug}`} className="group flex-shrink-0 detail-card-lg">
                  <div className="relative aspect-square image-frame photo-shadow-sm detail-card-media bg-[var(--primary-50)]">
                    {product.images?.[0]?.src && <Image src={product.images[0].src} alt={tx(product.title, product.titleCn, locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="224px" />}
                  </div>
                  <p className="detail-card-title">{tx(product.title, product.titleCn, locale)}</p>
                  {product.price && <p className="detail-card-price">${product.price.toLocaleString()}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial */}
      {project.testimonial?.quote && (
        <section className="section-padding bg-white">
          <div className="container-custom max-w-2xl mx-auto text-center">
            <div className="detail-mb-xl text-5xl font-serif" style={{ color: 'var(--secondary)' }}>"</div>
            <blockquote className="font-serif text-xl md:text-2xl leading-relaxed detail-mb-xl" style={{ color: 'var(--primary)' }}>
              {tx(project.testimonial.quote, project.testimonial.quoteCn, locale)}
            </blockquote>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>— {project.testimonial.author}</p>
          </div>
        </section>
      )}

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <h2 className="detail-section-title">
              {locale === 'zh' ? '相关项目' : 'Related Projects'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 detail-gap-hscroll-cards">
              {relatedProjects.map(p => (
                <Link key={p.slug} href={`/${locale}/portfolio/${p.slug}`} className="group">
                  <div className="relative aspect-[4/3] image-frame photo-shadow-sm detail-card-media">
                    {p.coverImage ? <Image src={p.coverImage} alt={tx(p.title, p.titleCn, locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="33vw" /> : <div className="w-full h-full bg-[var(--primary-50)]" />}
                  </div>
                  <p className="detail-card-title">{tx(p.title, p.titleCn, locale)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-padding" style={{ background: 'var(--primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-2xl md:text-3xl detail-mb-xl" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>{locale==='zh'?'准备好改变您的空间了吗？':'Ready to transform your space?'}</p>
          <Link href={`/${locale}/contact`} className="btn-gold">{locale==='zh'?'预约咨询':'Book Consultation'}</Link>
        </div>
      </section>
    </>
  );
}
