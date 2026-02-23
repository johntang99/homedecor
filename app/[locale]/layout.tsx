import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { getDefaultSite, getSiteById } from '@/lib/sites';
import { getRequestSiteId, loadContent, loadFooter, loadSeo, loadTheme, loadSiteInfo } from '@/lib/content';
import type { SeoConfig, SiteInfo } from '@/lib/types';
import Header, { type JuliaHeaderConfig } from '@/components/layout/Header';
import Footer, { type JuliaFooterData } from '@/components/layout/Footer';
import { getBaseUrlFromHost } from '@/lib/seo';

function hexToRgbChannels(hex: string | undefined, fallback: string) {
  if (!hex) return fallback;
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const requestSiteId = await getRequestSiteId();
  const site = (await getSiteById(requestSiteId)) || (await getDefaultSite());
  const locale = params.locale as Locale;
  const seo = site ? await loadSeo(site.id, locale) as SeoConfig | null : null;

  return {
    metadataBase: baseUrl,
    title: {
      default: seo?.title || 'Julia Studio — 25 Years of Timeless Interior Design',
      template: `%s | Julia Studio`,
    },
    description: seo?.description || 'Julia Studio creates timeless interior spaces for homes, offices, and exhibitions.',
    alternates: {
      canonical: new URL(`/${locale}`, baseUrl).toString(),
      languages: Object.fromEntries(
        locales.map(l => [l, new URL(`/${l}`, baseUrl).toString()])
          .concat([['x-default', new URL(`/${defaultLocale}`, baseUrl).toString()]])
      ),
    },
    openGraph: {
      type: 'website',
      siteName: 'Julia Studio',
      images: seo?.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locales.includes(locale as Locale)) notFound();

  const host = headers().get('host');
  const requestSiteId = await getRequestSiteId();
  const site = (await getSiteById(requestSiteId)) || (await getDefaultSite());
  if (!site) return <div style={{ padding: '2rem', fontFamily: 'serif' }}>No site configured.</div>;

  const [theme, headerConfig, footer, siteInfo] = await Promise.all([
    loadTheme(site.id),
    loadContent<JuliaHeaderConfig>(site.id, locale as Locale, 'header.json'),
    loadFooter<JuliaFooterData>(site.id, locale as Locale),
    loadSiteInfo(site.id, locale as Locale) as Promise<SiteInfo | null>,
  ]);

  // Build CSS vars from theme.json
  const t = (theme as any)?.colors;
  const r = (theme as any)?.borderRadius;
  const ty = (theme as any)?.typography;
  const op = (theme as any)?.opacity?.onDark;
  const ly = (theme as any)?.layout;
  const cm = (theme as any)?.components;
  const fx = (theme as any)?.effects;
  const onDarkRgb = hexToRgbChannels(t?.text?.onDark, '250 248 245');
  const backdropPrimaryRgb = hexToRgbChannels(t?.backdrop?.primary, '250 248 245');
  const overlayRgb = fx?.hero?.overlayRgb || hexToRgbChannels(fx?.hero?.baseBg || t?.primary?.dark, '26 26 26');

  const cssVars = `:root {
    --primary: ${t.primary?.DEFAULT || '#2C2C2C'};
    --primary-dark: ${t.primary?.dark || '#1A1A1A'};
    --primary-light: ${t.primary?.light || '#4A4A4A'};
    --primary-50: ${t.primary?.['50'] || '#F5F5F5'};
    --primary-100: ${t.primary?.['100'] || '#EBEBEB'};
    --secondary: ${t.secondary?.DEFAULT || '#C4A265'};
    --secondary-dark: ${t.secondary?.dark || '#A88B50'};
    --secondary-light: ${t.secondary?.light || '#D4B87A'};
    --secondary-50: ${t.secondary?.['50'] || '#FDF8F0'};
    --accent: ${t.accent?.DEFAULT || '#8B9D83'};
    --accent-light: ${t.accent?.light || '#A3B39B'};
    --backdrop-primary: ${t.backdrop?.primary || '#FAF8F5'};
    --backdrop-secondary: ${t.backdrop?.secondary || '#1A1A1A'};
    --border: ${t.border || '#E5E2DD'};
    --text-primary: ${t.text?.primary || '#2C2C2C'};
    --text-secondary: ${t.text?.secondary || '#6B6B6B'};
    --text-on-dark: ${t.text?.onDark || '#FAF8F5'};
    --text-on-gold: ${t.text?.onGold || '#1A1A1A'};
    --on-dark-rgb: ${onDarkRgb};
    --backdrop-primary-rgb: ${backdropPrimaryRgb};
    --on-dark-high: rgb(var(--on-dark-rgb) / ${op?.high || '0.9'});
    --on-dark-medium: rgb(var(--on-dark-rgb) / ${op?.medium || '0.6'});
    --on-dark-low: rgb(var(--on-dark-rgb) / ${op?.low || '0.4'});
    --on-dark-subtle: rgb(var(--on-dark-rgb) / ${op?.subtle || '0.3'});
    --hero-base-bg: ${fx?.hero?.baseBg || '#1A1A1A'};
    --hero-overlay-rgb: ${overlayRgb};
    --hero-soft-from: ${fx?.hero?.softFull?.from || '0.45'};
    --hero-soft-mid: ${fx?.hero?.softFull?.mid || '0.16'};
    --hero-soft-to: ${fx?.hero?.softFull?.to || '0.06'};
    --hero-focus-from: ${fx?.hero?.focusText?.from || '0.14'};
    --hero-focus-mid: ${fx?.hero?.focusText?.mid || '0.04'};
    --hero-panel-bg: ${fx?.hero?.textPanel?.bg || '0.10'};
    --hero-panel-shadow: ${fx?.hero?.textPanel?.shadow || '0 10px 30px rgba(0,0,0,0.22)'};
    --hero-title-shadow: ${fx?.hero?.titleShadow || '0 2px 10px rgba(0,0,0,0.35)'};
    --hero-link-shadow: ${fx?.hero?.linkShadow || '0 1px 8px rgba(0,0,0,0.28)'};
    --overlay-light: ${fx?.overlay?.light || '0.5'};
    --overlay-medium: ${fx?.overlay?.medium || '0.6'};
    --overlay-strong: ${fx?.overlay?.strong || '0.7'};
    --media-dim-light: ${fx?.media?.dimLight || '0.25'};
    --media-dim-medium: ${fx?.media?.dimMedium || '0.3'};
    --media-dim-heavy: ${fx?.media?.dimHeavy || '0.5'};
    --sticky-filter-top-mobile: ${ly?.stickyFilter?.topMobile || '4rem'};
    --sticky-filter-top-desktop: ${ly?.stickyFilter?.topDesktop || '5rem'};
    --sticky-filter-py: ${ly?.stickyFilter?.paddingY || '0.75rem'};
    --hero-compact-pt: ${ly?.heroSpacing?.compact?.top || '8rem'};
    --hero-compact-pb: ${ly?.heroSpacing?.compact?.bottom || '3rem'};
    --hero-compact-pt-md: ${ly?.heroSpacing?.compact?.topDesktop || '10rem'};
    --hero-compact-pb-md: ${ly?.heroSpacing?.compact?.bottomDesktop || '4rem'};
    --hero-feature-pt: ${ly?.heroSpacing?.feature?.top || '8rem'};
    --hero-feature-pb: ${ly?.heroSpacing?.feature?.bottom || '4rem'};
    --hero-feature-pt-md: ${ly?.heroSpacing?.feature?.topDesktop || '10rem'};
    --hero-feature-pb-md: ${ly?.heroSpacing?.feature?.bottomDesktop || '6rem'};
    --hero-services-pt: ${ly?.heroSpacing?.services?.top || '8rem'};
    --hero-services-pb: ${ly?.heroSpacing?.services?.bottom || '5rem'};
    --hero-services-pt-md: ${ly?.heroSpacing?.services?.topDesktop || '11rem'};
    --hero-services-pb-md: ${ly?.heroSpacing?.services?.bottomDesktop || '7rem'};
    --about-hero-content-pb: ${ly?.heroSpacing?.aboutContentBottom || '3rem'};
    --about-hero-min-h: ${ly?.heroSpacing?.aboutHeroMinHeight || '400px'};
    --detail-backbar-pt: ${ly?.detailPages?.backBarTop || '5rem'};
    --detail-backbar-row-y: ${ly?.detailPages?.backBarRowY || '0.75rem'};
    --detail-sticky-top: ${ly?.detailPages?.stickyInfoTop || '6rem'};
    --detail-portfolio-hero-min-h: ${ly?.detailPages?.portfolioHeroMinHeight || '500px'};
    --detail-collection-hero-min-h: ${ly?.detailPages?.collectionHeroMinHeight || '350px'};
    --detail-hero-content-pb: ${ly?.detailPages?.heroContentBottom || '2.5rem'};
    --detail-gallery-pb: ${ly?.detailPages?.galleryBottomPadding || '4rem'};
    --detail-article-header-pt: ${ly?.detailPages?.articleHeaderTop || '2.5rem'};
    --detail-article-header-pb: ${ly?.detailPages?.articleHeaderBottom || '1.5rem'};
    --detail-article-media-pb: ${ly?.detailPages?.articleMediaBottom || '2.5rem'};
    --detail-rhythm-hairline: ${ly?.detailPages?.rhythm?.hairline || '0.125rem'};
    --detail-rhythm-xxs: ${ly?.detailPages?.rhythm?.xxs || '0.25rem'};
    --detail-rhythm-xs: ${ly?.detailPages?.rhythm?.xs || '0.5rem'};
    --detail-rhythm-sm: ${ly?.detailPages?.rhythm?.sm || '0.75rem'};
    --detail-rhythm-md: ${ly?.detailPages?.rhythm?.md || '1rem'};
    --detail-rhythm-lg: ${ly?.detailPages?.rhythm?.lg || '1.25rem'};
    --detail-rhythm-xl: ${ly?.detailPages?.rhythm?.xl || '1.5rem'};
    --detail-rhythm-xxl: ${ly?.detailPages?.rhythm?.xxl || '2rem'};
    --detail-rhythm-hero: ${ly?.detailPages?.rhythm?.hero || '2.5rem'};
    --detail-gap-back-link: ${ly?.detailPages?.gaps?.backLink || '0.375rem'};
    --detail-gap-hero-meta: ${ly?.detailPages?.gaps?.heroMeta || '1.25rem'};
    --detail-gap-main-columns: ${ly?.detailPages?.gaps?.mainColumns || '3.5rem'};
    --detail-gap-spec-row: ${ly?.detailPages?.gaps?.specRow || '1rem'};
    --detail-gap-chip-group: ${ly?.detailPages?.gaps?.chipGroup || '0.25rem'};
    --detail-gap-thumb-grid: ${ly?.detailPages?.gaps?.thumbGrid || '0.5rem'};
    --detail-gap-gallery-pair: ${ly?.detailPages?.gaps?.galleryPair || '1rem'};
    --detail-gap-hscroll-cards: ${ly?.detailPages?.gaps?.hScrollCards || '1.5rem'};
    --detail-gap-related-md: ${ly?.detailPages?.gaps?.relatedGridMedium || '1.25rem'};
    --detail-gap-related-lg: ${ly?.detailPages?.gaps?.relatedGridLarge || '1.75rem'};
    --detail-gap-mood-grid: ${ly?.detailPages?.gaps?.moodGrid || '1rem'};
    --filter-chip-px: ${cm?.filterChip?.paddingX || '1rem'};
    --filter-chip-py: ${cm?.filterChip?.paddingY || '0.375rem'};
    --filter-chip-radius: ${cm?.filterChip?.radius || '9999px'};
    --btn-loadmore-px: ${cm?.buttons?.loadMore?.paddingX || '2rem'};
    --btn-loadmore-py: ${cm?.buttons?.loadMore?.paddingY || '0.75rem'};
    --btn-cta-lg-px: ${cm?.buttons?.ctaLarge?.paddingX || '2.5rem'};
    --btn-cta-lg-py: ${cm?.buttons?.ctaLarge?.paddingY || '1rem'};
    --play-badge-size-lg: ${cm?.media?.playBadgeLarge || '4rem'};
    --play-badge-size-md: ${cm?.media?.playBadgeMedium || '3rem'};
    --play-icon-size-lg: ${cm?.media?.playIconLarge || '1.5rem'};
    --play-icon-size-md: ${cm?.media?.playIconMedium || '1rem'};
    --photo-radius: ${cm?.media?.photoRadius || r?.medium || '6px'};
    --image-radius: ${cm?.media?.photoRadius || r?.medium || '6px'};
    --card-radius: ${cm?.cards?.radius || r?.large || '6px'};
    --photo-shadow: ${fx?.surface?.photoShadow || '0 10px 24px rgba(31, 26, 22, 0.14)'};
    --photo-shadow-sm: ${fx?.surface?.photoShadowSmall || '0 1px 2px rgba(31, 26, 22, 0.03)'};
    --photo-shadow-lg: ${fx?.surface?.photoShadowLarge || fx?.surface?.photoShadow || '0 12px 28px rgba(31, 26, 22, 0.16)'};
    --card-shadow: ${fx?.cards?.shadow || '0 6px 16px rgba(31, 26, 22, 0.09)'};
    --card-shadow-hover: ${fx?.cards?.shadowHover || '0 12px 26px rgba(31, 26, 22, 0.14)'};
    --btn-gold-fill: ${t.secondary?.DEFAULT || '#BFA261'};
    --btn-gold-fill-hover: ${t.secondary?.dark || '#A88C4D'};
    --btn-gold-text: ${t.text?.onGold || '#FFFDF8'};
    --detail-card-w-lg: ${cm?.detailCards?.shopLookWidth || '14rem'};
    --detail-card-w-md: ${cm?.detailCards?.storyProductWidth || '13rem'};
    --card-hover-overlay: ${fx?.cards?.hoverOverlay || '0.2'};
    --card-bottom-gradient: ${fx?.cards?.bottomGradient || '0.7'};
    --radius-small: ${r?.small || '2px'};
    --radius-medium: ${r?.medium || '4px'};
    --radius-large: ${r?.large || '8px'};
    --image-radius: ${cm?.media?.photoRadius || r?.medium || '5px'};
    --text-display: ${ty?.display || '3.75rem'};
    --text-heading: ${ty?.heading || '2.5rem'};
    --text-subheading: ${ty?.subheading || '1.5rem'};
    --text-body: ${ty?.body || '1rem'};
    --text-small: ${ty?.small || '0.875rem'};
    --font-display-token: ${ty?.fonts?.display || 'var(--font-heading)'};
    --font-heading-token: ${ty?.fonts?.heading || 'var(--font-heading)'};
    --font-subheading-token: ${ty?.fonts?.subheading || 'var(--font-heading)'};
    --font-body-token: ${ty?.fonts?.body || 'var(--font-body)'};
    --font-small-token: ${ty?.fonts?.small || 'var(--font-body)'};
  }`;

  return (
    <>
      {cssVars && <style dangerouslySetInnerHTML={{ __html: cssVars }} />}
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--backdrop-primary, #FAF8F5)' }}>
        <Header
          locale={locale as Locale}
          siteId={site.id}
          siteInfo={siteInfo as Record<string, unknown> | null}
          headerConfig={headerConfig}
        />
        <main className="flex-grow">{children}</main>
        <Footer
          locale={locale as Locale}
          siteId={site.id}
          footer={footer ?? undefined}
        />
      </div>
    </>
  );
}
