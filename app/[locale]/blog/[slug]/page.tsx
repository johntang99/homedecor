import type { Metadata } from 'next';
import type { Locale } from '@/lib/types';
import { getRequestSiteId } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';

interface BlogDetailPageProps {
  params: {
    locale: Locale;
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const siteId = await getRequestSiteId();
  const isEn = params.locale === 'en';
  return buildPageMetadata({
    siteId,
    locale: params.locale,
    slug: 'blog',
    title: isEn ? 'Blog - Under Development' : 'Blog - En desarrollo',
    description: isEn
      ? 'Blog articles are currently under development.'
      : 'Los articulos del blog estan en desarrollo.',
  });
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
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
              ? 'This article is not available yet. We are preparing new content.'
              : 'Este articulo aun no esta disponible. Estamos preparando nuevo contenido.'}
          </p>
        </div>
      </section>
    </main>
  );
}
