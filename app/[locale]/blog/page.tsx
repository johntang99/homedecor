import type { Metadata } from 'next';
import type { Locale } from '@/lib/types';
import { getRequestSiteId } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';

interface BlogPageProps {
  params: {
    locale: Locale;
  };
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const siteId = await getRequestSiteId();
  const isEn = params.locale === 'en';
  return buildPageMetadata({
    siteId,
    locale: params.locale,
    slug: 'blog',
    title: isEn ? 'Blog - Under Development' : 'Blog - En desarrollo',
    description: isEn
      ? 'The WeWash blog is currently under development.'
      : 'El blog de WeWash esta en desarrollo.',
  });
}

export default function BlogPage({ params }: BlogPageProps) {
  const isEn = params.locale === 'en';

  return (
    <main className="min-h-screen bg-white">
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-display font-bold text-gray-900 mb-4">
            {isEn ? 'Blog Under Development' : 'Blog en desarrollo'}
          </h1>
          <p className="text-subheading text-gray-600">
            {isEn
              ? 'We are preparing laundry blog content. Please check back soon.'
              : 'Estamos preparando contenido del blog de lavanderia. Vuelve pronto.'}
          </p>
        </div>
      </section>
    </main>
  );
}
