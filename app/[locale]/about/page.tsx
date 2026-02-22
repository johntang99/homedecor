import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadPageContent } from '@/lib/content';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 86400;

interface PageProps { params: { locale: Locale } }

function tx(en?: string, cn?: string, locale?: Locale) { return (locale === 'zh' && cn) ? cn : (en || ''); }

interface AboutData {
  hero?: { headline?: string; headlineCn?: string; backgroundImage?: string };
  story?: { headline?: string; headlineCn?: string; blocks?: Array<{ body?: string; bodyCn?: string; image?: string }> };
  philosophy?: { headline?: string; headlineCn?: string; body?: string; bodyCn?: string };
  stats?: { variant?: string; items?: Array<{ value?: string; label?: string; labelCn?: string }> };
  team?: { headline?: string; headlineCn?: string; members?: Array<{ name?: string; title?: string; titleCn?: string; bio?: string; bioCn?: string; image?: string }> };
  timeline?: { headline?: string; headlineCn?: string; milestones?: Array<{ year?: string; event?: string; eventCn?: string }> };
  awards?: { headline?: string; headlineCn?: string; items?: Array<{ name?: string; year?: string; logo?: string }> };
  cta?: { headline?: string; headlineCn?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const siteId = await getRequestSiteId();
  return buildPageMetadata({ siteId, locale: params.locale, slug: 'about',
    title: 'About — Julia Studio',
    description: '25 years of design excellence. Julia Studio is a premier interior design house creating timeless spaces.' });
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = params;
  const siteId = await getRequestSiteId();
  const data = await loadPageContent<AboutData>('about', locale, siteId);
  if (!data) notFound();
  const isCn = locale === 'zh';

  return (
    <>
      {/* Hero */}
      <section className="relative h-[50vh] overflow-hidden" style={{ background: 'var(--primary)', minHeight: 'var(--about-hero-min-h, 400px)' }}>
        {data.hero?.backgroundImage && (
          <>
            <div className="absolute inset-0">
              <Image
                src={data.hero.backgroundImage}
                alt=""
                fill
                className="object-cover"
                style={{ opacity: 'var(--media-dim-heavy, 0.5)' }}
                sizes="100vw"
                priority
              />
            </div>
            <div className="absolute inset-0" style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--overlay-light, 0.5))' }} />
          </>
        )}
        <div className="relative z-10 flex items-end h-full container-custom" style={{ paddingBottom: 'var(--about-hero-content-pb, 3rem)' }}>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>
            {tx(data.hero?.headline, data.hero?.headlineCn, locale) || (isCn?'关于 Julia Studio':'About Julia Studio')}
          </h1>
        </div>
      </section>

      {/* Story */}
      {data.story?.blocks?.map((block, i) => (
        <section key={i} className={`section-padding ${i % 2 === 0 ? 'bg-white' : ''}`} style={i % 2 !== 0 ? { background: 'var(--backdrop-primary)' } : {}}>
          <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              {i === 0 && <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-6" style={{ color: 'var(--primary)' }}>{tx(data.story?.headline, data.story?.headlineCn, locale)}</h2>}
              <p className="text-base leading-loose" style={{ color: 'var(--text-secondary)', maxWidth: '52ch' }}>{tx(block.body, block.bodyCn, locale)}</p>
            </div>
            <div className={`relative aspect-[4/3] image-frame ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
              {block.image ? <Image src={block.image} alt="" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" /> : <div className="w-full h-full bg-[var(--primary-50)]" />}
            </div>
          </div>
        </section>
      ))}

      {/* Philosophy */}
      {data.philosophy && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom max-w-2xl mx-auto text-center">
            <div className="mb-6 h-px w-16 mx-auto" style={{ background: 'var(--secondary)' }} />
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-6" style={{ color: 'var(--primary)' }}>{tx(data.philosophy.headline, data.philosophy.headlineCn, locale)}</h2>
            <p className="text-base leading-loose" style={{ color: 'var(--text-secondary)' }}>{tx(data.philosophy.body, data.philosophy.bodyCn, locale)}</p>
            <div className="mt-6 h-px w-16 mx-auto" style={{ background: 'var(--secondary)' }} />
          </div>
        </section>
      )}

      {/* Stats */}
      {data.stats?.items && (
        <section className="py-16 bg-white border-y border-[var(--border)]">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
              {data.stats.items.map((item, i) => (
                <div key={i}>
                  <p className="font-serif text-4xl md:text-5xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>{item.value}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{tx(item.label, item.labelCn, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {data.team?.members && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="font-serif text-3xl font-semibold mb-12" style={{ color: 'var(--primary)' }}>{tx(data.team.headline, data.team.headlineCn, locale)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {data.team.members.map((member, i) => (
                <div key={i}>
                  <div className="relative aspect-[3/4] image-frame mb-5">
                    {member.image ? <Image src={member.image} alt={member.name || ''} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" /> : <div className="w-full h-full bg-[var(--primary-50)]" />}
                  </div>
                  <p className="font-serif text-lg font-semibold" style={{ color: 'var(--primary)' }}>{member.name}</p>
                  <p className="text-sm mb-3" style={{ color: 'var(--secondary)' }}>{tx(member.title, member.titleCn, locale)}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tx(member.bio, member.bioCn, locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Timeline */}
      {data.timeline?.milestones && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <h2 className="font-serif text-3xl font-semibold mb-12" style={{ color: 'var(--primary)' }}>{tx(data.timeline.headline, data.timeline.headlineCn, locale)}</h2>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />
              <div className="space-y-8 pl-8">
                {data.timeline.milestones.map((m, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-10 w-3 h-3 rounded-full border-2" style={{ top: '2px', background: 'var(--backdrop-primary)', borderColor: 'var(--secondary)' }} />
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--secondary)' }}>{m.year}</p>
                    <p className="font-serif text-base" style={{ color: 'var(--primary)' }}>{tx(m.event, m.eventCn, locale)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Awards */}
      {data.awards?.items && data.awards.items.length > 0 && (
        <section className="py-16 bg-white border-t border-[var(--border)]">
          <div className="container-custom">
            <h2 className="font-serif text-2xl font-semibold mb-8" style={{ color: 'var(--primary)' }}>{tx(data.awards.headline, data.awards.headlineCn, locale)}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.awards.items.map((award, i) => (
                <div key={i} className="border border-[var(--border)] p-5 text-center">
                  <p className="font-serif text-sm font-medium" style={{ color: 'var(--primary)' }}>{award.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{award.year}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-padding" style={{ background: 'var(--primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-3xl mb-6" style={{ color: 'var(--text-on-dark, #FAF8F5)' }}>{tx(data.cta?.headline, data.cta?.headlineCn, locale)}</p>
          <Link href={`/${locale}${data.cta?.ctaHref || '/contact'}`} className="btn-gold">{tx(data.cta?.ctaLabel, data.cta?.ctaLabelCn, locale) || (isCn?'预约咨询':'Book Consultation')}</Link>
        </div>
      </section>
    </>
  );
}
