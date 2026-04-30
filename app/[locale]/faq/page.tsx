import Link from 'next/link';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadContent } from '@/lib/content';
import FaqAccordion from './FaqAccordion';

export const dynamic = 'force-dynamic';

interface FAQItem { question?: string; questionCn?: string; answer?: string; answerCn?: string }
interface FAQCategory { name?: string; nameCn?: string; items?: FAQItem[] }
interface FAQData {
  hero?: { headline?: string; headlineCn?: string; subline?: string; sublineCn?: string };
  categories?: FAQCategory[];
  cta?: { headline?: string; headlineCn?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string };
}

interface PageProps { params: { locale: Locale } }

export default async function FAQPage({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const data = (await loadContent<FAQData>(siteId, locale, 'pages/faq.json')) || {};

  const isCn = locale === 'zh';
  const tx = (en?: string, cn?: string) => (isCn && cn) ? cn : (en || '');

  return (
    <>
      <section className="pt-32 pb-16 md:pt-40" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom max-w-2xl">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
            {tx(data.hero?.headline, data.hero?.headlineCn) || (isCn ? '常见问题' : 'FAQ')}
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>{tx(data.hero?.subline, data.hero?.sublineCn)}</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-2xl">
          <FaqAccordion categories={data.categories || []} locale={locale} />
        </div>
      </section>

      <section className="py-16 border-t border-[var(--border)]" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-xl mb-5" style={{ color: 'var(--primary)' }}>{tx(data.cta?.headline, data.cta?.headlineCn) || (isCn ? '还有疑问？' : 'Still have questions?')}</p>
          <Link href={`/${locale}${data.cta?.ctaHref || '/contact'}`} className="btn-gold">{tx(data.cta?.ctaLabel, data.cta?.ctaLabelCn) || (isCn ? '联系我们' : 'Contact Us')}</Link>
        </div>
      </section>
    </>
  );
}
