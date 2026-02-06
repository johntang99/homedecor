import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { locales, type Locale } from '@/lib/i18n';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { loadFooter, loadPageContent, loadSeo, loadTheme, loadSiteInfo } from '@/lib/content';
import type { FooterSection, HomePage, SeoConfig, SiteInfo } from '@/lib/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getBaseUrlFromHost } from '@/lib/seo';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  const locale = params.locale as Locale;

  if (!site) {
    return {
      metadataBase: baseUrl,
      title: 'Clinic Website',
      description: 'Healthcare services',
    };
  }

  const [siteInfo, seo] = await Promise.all([
    loadSiteInfo(site.id, locale) as Promise<SiteInfo | null>,
    loadSeo(site.id, locale) as Promise<SeoConfig | null>,
  ]);
  const titleBase = siteInfo?.clinicName || site.name;
  const description =
    seo?.description ||
    siteInfo?.description ||
    'Traditional Chinese medicine and acupuncture services.';
  const titleDefault = seo?.title || titleBase;

  return {
    metadataBase: baseUrl,
    title: {
      default: titleDefault,
      template: `%s | ${titleBase}`,
    },
    description,
    openGraph: {
      title: titleDefault,
      description,
      url: new URL(`/${locale}`, baseUrl).toString(),
      siteName: titleBase,
      locale,
      type: 'website',
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
  
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  
  const host = headers().get('host');
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  
  if (!site) {
    return <div>No site configured</div>;
  }
  
  // Load theme
  const theme = await loadTheme(site.id);
  
  // Load site info for header/footer
  const [siteInfo, seo, footer] = await Promise.all([
    loadSiteInfo(site.id, locale as Locale) as Promise<SiteInfo | null>,
    loadSeo(site.id, locale as Locale) as Promise<SeoConfig | null>,
    loadFooter<FooterSection>(site.id, locale as Locale),
  ]);
  const homeContent = await loadPageContent<HomePage>('home', locale as Locale);
  const menuConfig = homeContent?.menu;
  const baseUrl = getBaseUrlFromHost(host);
  
  // Generate inline style for theme variables
  const themeStyle = theme ? `
    :root {
      /* Typography */
      --text-display: ${theme.typography.display};
      --text-heading: ${theme.typography.heading};
      --text-subheading: ${theme.typography.subheading};
      --text-body: ${theme.typography.body};
      --text-small: ${theme.typography.small};
      
      /* Primary Colors */
      --primary: ${theme.colors.primary.DEFAULT};
      --primary-dark: ${theme.colors.primary.dark};
      --primary-light: ${theme.colors.primary.light};
      --primary-50: ${theme.colors.primary['50']};
      --primary-100: ${theme.colors.primary['100']};
      
      /* Secondary Colors */
      --secondary: ${theme.colors.secondary.DEFAULT};
      --secondary-dark: ${theme.colors.secondary.dark};
      --secondary-light: ${theme.colors.secondary.light};
      --secondary-50: ${theme.colors.secondary['50']};
      
      /* Backdrop Colors */
      --backdrop-primary: ${theme.colors.backdrop.primary};
      --backdrop-secondary: ${theme.colors.backdrop.secondary};
    }
  ` : '';
  
  return (
    <>
      {/* Inject theme CSS variables */}
      {theme && (
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      )}

      {siteInfo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MedicalBusiness',
              name: siteInfo.clinicName,
              url: new URL(`/${locale}`, baseUrl).toString(),
              description: siteInfo.description,
              telephone: siteInfo.phone,
              email: siteInfo.email,
              address: {
                '@type': 'PostalAddress',
                streetAddress: siteInfo.address,
                addressLocality: siteInfo.city,
                addressRegion: siteInfo.state,
                postalCode: siteInfo.zip,
                addressCountry: 'US',
              },
            }),
          }}
        />
      )}
      
      <div className="min-h-screen flex flex-col relative">
        <Header
          locale={locale as Locale}
          siteId={site.id}
          siteInfo={siteInfo ?? undefined}
          variant={menuConfig?.variant || siteInfo?.headerVariant || 'default'}
          menu={menuConfig}
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
