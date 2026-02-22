import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent, loadAllItems, loadItemBySlug } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';
import { ArrowRight, ChevronDown, Star } from 'lucide-react';
import HeroBackgroundSlideshow from '@/components/home/HeroBackgroundSlideshow';

export const revalidate = 3600; // 1 hour ISR

interface PageProps { params: { locale: Locale } }

// ── Content types ──────────────────────────────────────────────────────────────
interface HeroSlide { image?: string; alt?: string; altCn?: string }
interface NavCta { label: string; labelCn?: string; href: string }

interface HomeContent {
  hero?: {
    variant?: string;
    overlayMode?: 'focus-text' | 'soft-full';
    slides?: HeroSlide[];
    tagline?: string; taglineCn?: string;
    logoOverlay?: boolean; scrollIndicator?: boolean;
  };
  introduction?: {
    variant?: string;
    headline?: string; headlineCn?: string;
    body?: string; bodyCn?: string;
    image?: string;
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
  };
  portfolioPreview?: {
    headline?: string; headlineCn?: string;
    subline?: string; sublineCn?: string;
    projectSlugs?: string[];
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
    image1?: string; image2?: string; image3?: string; image4?: string; image5?: string; image6?: string;
  };
  servicesOverview?: {
    headline?: string; headlineCn?: string;
    subline?: string; sublineCn?: string;
    services?: Array<{ icon?: string; title?: string; titleCn?: string; description?: string; descriptionCn?: string; href?: string; image?: string }>;
  };
  featuredCollection?: {
    variant?: string;
    headline?: string; headlineCn?: string;
    subline?: string; sublineCn?: string;
    collectionSlug?: string;
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
    image?: string;
  };
  shopPreview?: {
    headline?: string; headlineCn?: string;
    subline?: string; sublineCn?: string;
    productSlugs?: string[];
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
    image1?: string; image2?: string; image3?: string; image4?: string; image5?: string; image6?: string;
    itemName1?: string; itemName2?: string; itemName3?: string; itemName4?: string; itemName5?: string; itemName6?: string;
    itemPrice1?: string | number; itemPrice2?: string | number; itemPrice3?: string | number; itemPrice4?: string | number; itemPrice5?: string | number; itemPrice6?: string | number;
  };
  journalPreview?: {
    headline?: string; headlineCn?: string;
    subline?: string; sublineCn?: string;
    postCount?: number;
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
    image1?: string; image2?: string; image3?: string;
  };
  aboutTeaser?: {
    image?: string;
    headline?: string; headlineCn?: string;
    body?: string; bodyCn?: string;
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
  };
  consultationCta?: {
    variant?: string;
    headline?: string; headlineCn?: string;
    subline?: string; sublineCn?: string;
    ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string;
    backgroundImage?: string;
  };
}

interface PortfolioItem { slug: string; title?: string; titleCn?: string; coverImage?: string; category?: string }
interface ShopItem { slug: string; title?: string; titleCn?: string; images?: Array<{ src?: string }>; price?: number }
interface JournalItem { slug: string; title?: string; titleCn?: string; coverImage?: string; type?: string; date?: string; category?: string }
interface CollectionItem { slug: string; title?: string; titleCn?: string; description?: string; descriptionCn?: string; coverImage?: string }
interface TestimonialItem {
  id?: string;
  quote?: string;
  quoteCn?: string;
  author?: string;
  authorCn?: string;
  title?: string;
  titleCn?: string;
  rating?: number;
  featured?: boolean;
}
interface TestimonialsFile {
  items?: TestimonialItem[];
}

export async function generateMetadata({ params }: PageProps) {
  const siteId = await getRequestSiteId();
  return buildPageMetadata({ siteId, locale: params.locale, slug: 'home',
    title: 'Julia Studio — 25 Years of Timeless Interior Design',
    description: 'Julia Studio creates timeless interior spaces for homes, offices, and exhibitions. 25 years of design excellence, 1,000+ projects completed.' });
}

function tx(en: string | undefined, cn: string | undefined, locale: Locale): string {
  return (locale === 'zh' && cn) ? cn : (en || '');
}

// ── Service icon map (simple) ──────────────────────────────────────────────────
function ServiceIcon({ icon }: { icon?: string }) {
  const size = 'w-6 h-6';
  if (icon === 'hammer') return <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25L18.75 8.25M3.75 20.25l9-9M14.25 3.75L20.25 9.75l-1.5 1.5L12.75 5.25l1.5-1.5z"/></svg>;
  if (icon === 'sofa') return <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5V15m0 0H3.75M20.25 15v2.25M3.75 15V7.5m0 7.5v2.25M6 7.5A2.25 2.25 0 018.25 5.25h7.5A2.25 2.25 0 0118 7.5v2.25H6V7.5z"/></svg>;
  // palette default
  return <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/></svg>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();

  const [content, portfolioItems, shopItems, journalItems, collectionsItems, testimonialsData] = await Promise.all([
    loadPageContent<HomeContent>('home', locale, siteId),
    loadAllItems<PortfolioItem>(siteId, locale, 'portfolio'),
    loadAllItems<ShopItem>(siteId, locale, 'shop-products'),
    loadAllItems<JournalItem>(siteId, locale, 'journal'),
    loadAllItems<CollectionItem>(siteId, locale, 'collections'),
    loadItemBySlug<TestimonialsFile>(siteId, locale, '', 'testimonials'),
  ]);

  if (!content) notFound();

  const h = content.hero || {};
  const slides = h.slides?.filter(s => s.image) || [];
  const tagline = tx(h.tagline, h.taglineCn, locale);
  const isRotatingHero = h.variant === 'gallery-background' || h.variant === 'slideshow';
  const heroOverlayMode = h.overlayMode === 'soft-full' ? 'soft-full' : 'focus-text';

  // Sort and limit collection items
  const previewProjects = (content.portfolioPreview?.projectSlugs || [])
    .map(slug => portfolioItems.find(p => p.slug === slug))
    .filter(Boolean) as PortfolioItem[];
  const fallbackProjects = portfolioItems.slice(0, 6);
  const displayProjects = previewProjects.length ? previewProjects : fallbackProjects;

  const previewProducts = (content.shopPreview?.productSlugs || [])
    .map(slug => shopItems.find(p => p.slug === slug))
    .filter(Boolean) as ShopItem[];
  const displayProducts = previewProducts.length ? previewProducts : shopItems.slice(0, 5);

  const displayJournal = journalItems.slice(0, content.journalPreview?.postCount || 3);

  const intro = content.introduction || {};
  const services = content.servicesOverview || {};
  const featuredCollection = content.featuredCollection || {};
  const shop = content.shopPreview || {};
  const journal = content.journalPreview || {};
  const about = content.aboutTeaser || {};
  const cta = content.consultationCta || {};
  const featuredCollectionItem = featuredCollection.collectionSlug
    ? collectionsItems.find((item) => item.slug === featuredCollection.collectionSlug)
    : collectionsItems[0];
  const featuredCollectionImage = featuredCollection.image || featuredCollectionItem?.coverImage;
  const testimonialItems = testimonialsData?.items || [];
  const featuredTestimonials = testimonialItems.filter((item) => item.featured).slice(0, 3);
  const homeTestimonials = (featuredTestimonials.length > 0 ? featuredTestimonials : testimonialItems).slice(0, 3);

  const getSlotImage = (section: Record<string, unknown> | undefined, index: number): string | undefined => {
    if (!section) return undefined;
    const key = `image${index + 1}`;
    const value = section[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
  };
  const getSlotText = (
    section: Record<string, unknown> | undefined,
    prefix: string,
    index: number
  ): string | undefined => {
    if (!section) return undefined;
    const value = section[`${prefix}${index + 1}`];
    return typeof value === 'string' && value.trim() ? value : undefined;
  };
  const getSlotPrice = (
    section: Record<string, unknown> | undefined,
    index: number
  ): number | undefined => {
    if (!section) return undefined;
    const raw = section[`itemPrice${index + 1}`];
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const normalized = raw.replace(/[^\d.]/g, '');
      if (!normalized) return undefined;
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end overflow-hidden" style={{ background: 'var(--hero-base-bg, var(--primary-dark, #1A1A1A))' }}>
        <HeroBackgroundSlideshow
          slides={slides}
          locale={locale}
          rotate={isRotatingHero}
          imageOpacity={heroOverlayMode === 'focus-text' ? 1 : 0.9}
        />
        {heroOverlayMode === 'soft-full' ? (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--hero-soft-from, 0.45)) 0%, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--hero-soft-mid, 0.16)) 55%, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--hero-soft-to, 0.06)) 100%)',
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--hero-focus-from, 0.14)) 0%, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--hero-focus-mid, 0.04)) 45%, transparent 75%)',
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 container-custom pb-20 pt-32">
          <div
            className={
              heroOverlayMode === 'focus-text'
                ? 'max-w-2xl rounded-sm px-6 py-6 md:px-8 md:py-7'
                : 'max-w-2xl'
            }
            style={
              heroOverlayMode === 'focus-text'
                ? {
                    background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--hero-panel-bg, 0.10))',
                    boxShadow: 'var(--hero-panel-shadow, 0 10px 30px rgba(0,0,0,0.22))',
                  }
                : undefined
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--secondary, #C4A265)' }}>
              Julia Studio
            </p>
            <h1
              className="font-serif text-4xl md:text-6xl font-semibold leading-tight mb-6"
              style={{ color: 'var(--text-on-dark, #FAF8F5)', textShadow: 'var(--hero-title-shadow, 0 2px 10px rgba(0,0,0,0.35))' }}
            >
              {tagline || '25 Years of Timeless Design'}
            </h1>
            <Link
              href={`/${locale}/portfolio`}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors group"
              style={{ color: 'var(--text-on-dark, #FAF8F5)', textShadow: 'var(--hero-link-shadow, 0 1px 8px rgba(0,0,0,0.28))' }}
            >
              {locale === 'zh' ? '探索作品集' : 'Explore Our Work'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        {h.scrollIndicator !== false && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <ChevronDown className="w-5 h-5" style={{ color: 'var(--on-dark-medium, rgba(250,248,245,0.6))' }} />
          </div>
        )}
      </section>

      {/* ── INTRODUCTION ────────────────────────────────────────────────────── */}
      <section className="section-padding" style={{ background: 'var(--backdrop-primary, #FAF8F5)' }}>
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6" style={{ color: 'var(--primary)' }}>
                {tx(intro.headline, intro.headlineCn, locale) || 'Spaces That Transcend Trends'}
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)', maxWidth: '44ch' }}>
                {tx(intro.body, intro.bodyCn, locale)}
              </p>
              {intro.ctaHref && (
                <Link
                  href={`/${locale}${intro.ctaHref}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold group"
                  style={{ color: 'var(--secondary)' }}
                >
                  {tx(intro.ctaLabel, intro.ctaLabelCn, locale) || 'Our Story'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            <div className="relative aspect-[4/3] image-frame">
              {intro.image ? (
                <Image src={intro.image} alt="Julia Studio" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full" style={{ background: 'var(--primary-50, #F5F5F5)' }} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO PREVIEW ─────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: 'var(--primary)' }}>
                {tx(content.portfolioPreview?.headline, content.portfolioPreview?.headlineCn, locale) || 'Selected Work'}
              </h2>
              <p className="mt-3 text-sm md:text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                {tx(
                  content.portfolioPreview?.subline,
                  content.portfolioPreview?.sublineCn,
                  locale
                ) || (locale === 'zh'
                  ? '精选项目故事，呈现我们在住宅、商业与展览空间中的设计语言。'
                  : 'A curated selection of completed projects across residential, commercial, and exhibition spaces.')}
              </p>
            </div>
            <Link href={`/${locale}${content.portfolioPreview?.ctaHref || '/portfolio'}`}
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold group" style={{ color: 'var(--secondary)' }}>
              {tx(content.portfolioPreview?.ctaLabel, content.portfolioPreview?.ctaLabelCn, locale) || 'View All'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProjects.map((project, i) => (
              <Link
                key={project.slug}
                href={`/${locale}/portfolio/${project.slug}`}
                className={`group relative block ${i === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
              >
                <div className={`relative image-frame ${i === 0 ? 'aspect-[4/3]' : 'aspect-[4/3]'}`}>
                  {getSlotImage(content.portfolioPreview as Record<string, unknown> | undefined, i) || project.coverImage ? (
                    <Image
                      src={getSlotImage(content.portfolioPreview as Record<string, unknown> | undefined, i) || project.coverImage || ''}
                      alt={tx(project.title, project.titleCn, locale) || ''}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: `hsl(${(i * 37) % 360}, 10%, 88%)` }} />
                  )}
                  <div
                    className="absolute inset-0 transition-colors duration-300"
                    style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / 0)' }}
                  />
                  <div className="absolute inset-0 transition-colors duration-300 group-hover:opacity-100 opacity-0" style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--card-hover-overlay, 0.2))' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: 'linear-gradient(transparent, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--card-bottom-gradient, 0.7)))' }}>
                    <p className="text-white font-serif text-lg font-medium">{tx(project.title, project.titleCn, locale)}</p>
                    <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--on-dark-medium, rgba(250,248,245,0.6))' }}>{project.category}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 md:hidden text-center">
            <Link href={`/${locale}${content.portfolioPreview?.ctaHref || '/portfolio'}`} className="btn-gold text-sm">
              {tx(content.portfolioPreview?.ctaLabel, content.portfolioPreview?.ctaLabelCn, locale) || 'View All Projects'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES OVERVIEW ─────────────────────────────────────────────────── */}
      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4 text-center" style={{ color: 'var(--primary)' }}>
            {tx(services.headline, services.headlineCn, locale) || 'What We Do'}
          </h2>
          <p className="text-center text-sm md:text-base mb-12 max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {tx(services.subline, services.sublineCn, locale) || (locale === 'zh'
              ? '从概念构思到落地呈现，我们提供完整的一体化设计与执行服务。'
              : 'From concept to completion, we provide a seamless design-to-delivery service model.')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(services.services || []).map((svc, i) => (
              <Link
                key={i}
                href={`/${locale}${svc.href || '/services'}`}
                className="group p-8 border border-[var(--border)] hover:border-[var(--secondary)] transition-colors bg-white"
              >
                {svc.image && (
                  <div className="relative aspect-[4/3] image-frame mb-5">
                    <Image
                      src={svc.image}
                      alt={tx(svc.title, svc.titleCn, locale) || 'Service image'}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="mb-5 text-[var(--secondary)]">
                  <ServiceIcon icon={svc.icon} />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
                  {tx(svc.title, svc.titleCn, locale)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {tx(svc.description, svc.descriptionCn, locale)}
                </p>
                <div className="mt-5 flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all" style={{ color: 'var(--secondary)' }}>
                  {locale === 'zh' ? '了解更多' : 'Learn More'} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COLLECTION ──────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-8 flex items-end justify-between gap-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--secondary)' }}>
                {tx(featuredCollection.headline, featuredCollection.headlineCn, locale) || 'Featured Collection'}
              </p>
              <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-4" style={{ color: 'var(--primary)' }}>
                {tx(featuredCollectionItem?.title, featuredCollectionItem?.titleCn, locale) || 'Collection'}
              </h2>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {tx(featuredCollection.subline, featuredCollection.sublineCn, locale) ||
                  tx(featuredCollectionItem?.description, featuredCollectionItem?.descriptionCn, locale)}
              </p>
            </div>
            <Link
              href={`/${locale}${featuredCollection.ctaHref || `/collections/${featuredCollectionItem?.slug || ''}`}`}
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold group"
              style={{ color: 'var(--secondary)' }}
            >
              {tx(featuredCollection.ctaLabel, featuredCollection.ctaLabelCn, locale) || 'Explore Collection'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="relative image-frame aspect-[21/9]">
            {featuredCollectionImage ? (
              <Image
                src={featuredCollectionImage}
                alt={tx(featuredCollectionItem?.title, featuredCollectionItem?.titleCn, locale) || 'Featured collection'}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-[var(--primary-50)]" />
            )}
          </div>
          <div className="mt-6 md:hidden">
            <Link
              href={`/${locale}${featuredCollection.ctaHref || `/collections/${featuredCollectionItem?.slug || ''}`}`}
              className="inline-flex items-center gap-2 text-sm font-semibold group"
              style={{ color: 'var(--secondary)' }}
            >
              {tx(featuredCollection.ctaLabel, featuredCollection.ctaLabelCn, locale) || 'Explore Collection'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SHOP PREVIEW ─────────────────────────────────────────────────────── */}
      {displayProducts.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: 'var(--primary)' }}>
                  {tx(shop.headline, shop.headlineCn, locale) || 'Shop Julia Studio'}
                </h2>
                <p className="mt-3 text-sm md:text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                  {tx(shop.subline, shop.sublineCn, locale) || (locale === 'zh'
                    ? '精选家具与家居单品，呈现 Julia Studio 一贯的审美与质感。'
                    : 'Curated furniture and decor pieces selected to reflect Julia Studio’s signature aesthetic.')}
                </p>
              </div>
              <Link href={`/${locale}${shop.ctaHref || '/shop'}`} className="hidden md:flex items-center gap-1.5 text-sm font-semibold group" style={{ color: 'var(--secondary)' }}>
                {tx(shop.ctaLabel, shop.ctaLabelCn, locale) || 'Shop All'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar">
              {displayProducts.map((product, index) => (
                <Link
                  key={product.slug}
                  href={`/${locale}/shop/${product.slug}`}
                  className="group flex-shrink-0 w-60"
                >
                  <div className="relative aspect-square image-frame mb-3 bg-[var(--primary-50)]">
                    {getSlotImage(content.shopPreview as Record<string, unknown> | undefined, index) || product.images?.[0]?.src ? (
                      <Image src={getSlotImage(content.shopPreview as Record<string, unknown> | undefined, index) || product.images?.[0]?.src || ''} alt={tx(product.title, product.titleCn, locale) || ''} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="240px" />
                    ) : (
                      <div className="w-full h-full bg-[var(--primary-50)]" />
                    )}
                  </div>
                  <p className="font-serif text-sm font-medium" style={{ color: 'var(--primary)' }}>
                    {getSlotText(content.shopPreview as Record<string, unknown> | undefined, 'itemName', index) || tx(product.title, product.titleCn, locale)}
                  </p>
                  {(getSlotPrice(content.shopPreview as Record<string, unknown> | undefined, index) || product.price) && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      ${(getSlotPrice(content.shopPreview as Record<string, unknown> | undefined, index) || product.price || 0).toLocaleString()}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── JOURNAL PREVIEW ──────────────────────────────────────────────────── */}
      {displayJournal.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: 'var(--primary)' }}>
                  {tx(journal.headline, journal.headlineCn, locale) || 'From the Journal'}
                </h2>
                <p className="mt-3 text-sm md:text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                  {tx(journal.subline, journal.sublineCn, locale) || (locale === 'zh'
                    ? '设计灵感、项目幕后与实用技巧，持续更新。'
                    : 'Design ideas, project stories, and practical insights from the studio.')}
                </p>
              </div>
              <Link href={`/${locale}${journal.ctaHref || '/journal'}`} className="hidden md:flex items-center gap-1.5 text-sm font-semibold group" style={{ color: 'var(--secondary)' }}>
                {tx(journal.ctaLabel, journal.ctaLabelCn, locale) || 'Read More'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {displayJournal.map((post, index) => (
                <Link key={post.slug} href={`/${locale}/journal/${post.slug}`} className="group">
                  <div className="relative aspect-[4/3] image-frame mb-4 bg-[var(--primary-50)]">
                    {getSlotImage(content.journalPreview as Record<string, unknown> | undefined, index) || post.coverImage ? (
                      <Image src={getSlotImage(content.journalPreview as Record<string, unknown> | undefined, index) || post.coverImage || ''} alt={tx(post.title, post.titleCn, locale) || ''} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
                    ) : (
                      <div className="w-full h-full bg-[var(--primary-50)]" />
                    )}
                    {post.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center">
                          <svg className="w-5 h-5 ml-1" fill="var(--primary)" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>{post.category}</span>
                  <h3 className="font-serif text-lg font-medium mt-2 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>
                    {tx(post.title, post.titleCn, locale)}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{post.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT TEASER ─────────────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[3/4] image-frame max-w-sm mx-auto lg:mx-0">
              {about.image ? (
                <Image src={about.image} alt="Julia" fill className="object-cover" sizes="(max-width:1024px) 100vw, 400px" />
              ) : (
                <div className="w-full h-full" style={{ background: 'var(--primary-50)' }} />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--secondary)' }}>
                {tx(about.headline, about.headlineCn, locale) || 'Meet Julia'}
              </p>
              <p className="font-serif text-2xl md:text-3xl leading-relaxed mb-8" style={{ color: 'var(--primary)' }}>
                {tx(about.body, about.bodyCn, locale) || '25 years. 1,000+ projects. One vision: timeless design.'}
              </p>
              {about.ctaHref && (
                <Link href={`/${locale}${about.ctaHref}`} className="inline-flex items-center gap-2 text-sm font-semibold group" style={{ color: 'var(--secondary)' }}>
                  {tx(about.ctaLabel, about.ctaLabelCn, locale) || 'Our Story'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      {homeTestimonials.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p
                className="text-xs font-semibold uppercase tracking-[0.25em] mb-4"
                style={{ color: 'var(--secondary)' }}
              >
                {locale === 'zh' ? '客户评价' : 'Client Stories'}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold" style={{ color: 'var(--primary)' }}>
                {locale === 'zh' ? '他们如何评价 Julia Studio' : 'What Clients Say About Julia Studio'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {homeTestimonials.map((item, index) => (
                <article
                  key={item.id || index}
                  className="bg-white border border-[var(--border)] p-6 md:p-7 flex flex-col"
                >
                  <div className="flex gap-1 mb-5" style={{ color: 'var(--secondary)' }}>
                    {Array(item.rating || 5)
                      .fill(0)
                      .map((_, starIndex) => (
                        <Star
                          key={`${item.id || index}-star-${starIndex}`}
                          className="w-4 h-4 fill-current"
                        />
                      ))}
                  </div>
                  <blockquote className="font-serif text-xl leading-relaxed mb-6" style={{ color: 'var(--primary)' }}>
                    "{tx(item.quote, item.quoteCn, locale)}"
                  </blockquote>
                  <div className="mt-auto">
                    <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                      {tx(item.author, item.authorCn, locale)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {tx(item.title, item.titleCn, locale)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONSULTATION CTA ─────────────────────────────────────────────────── */}
      <section className="relative section-padding overflow-hidden" style={{ background: 'var(--primary, #2C2C2C)' }}>
        {cta.backgroundImage && (
          <>
            <div className="absolute inset-0">
              <Image src={cta.backgroundImage} alt="" fill className="object-cover opacity-30" sizes="100vw" />
            </div>
            <div className="absolute inset-0 bg-[var(--primary)]/70" />
          </>
        )}
        <div className="relative z-10 container-custom text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-5 max-w-2xl mx-auto">
            {tx(cta.headline, cta.headlineCn, locale) || 'Begin Your Design Journey'}
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--on-dark-medium, rgba(250,248,245,0.6))' }}>
            {tx(cta.subline, cta.sublineCn, locale)}
          </p>
          <Link href={`/${locale}${cta.ctaHref || '/contact'}`} className="btn-gold text-base px-10 py-4">
            {tx(cta.ctaLabel, cta.ctaLabelCn, locale) || 'Book Consultation'}
          </Link>
        </div>
      </section>
    </>
  );
}
