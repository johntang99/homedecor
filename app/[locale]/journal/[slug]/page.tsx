import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import { getRequestSiteId, loadItemBySlug, loadAllItems } from '@/lib/content';

interface PageProps { params: { locale: Locale; slug: string } }

interface PostData {
  slug: string; title?: string; titleCn?: string;
  type?: string; category?: string; date?: string; author?: string;
  coverImage?: string;
  excerpt?: string; excerptCn?: string;
  body?: string; bodyCn?: string;
  videoUrl?: string; videoDuration?: string;
  relatedPosts?: string[];
  relatedProducts?: string[];
}
interface RelatedPost { slug: string; title?: string; titleCn?: string; coverImage?: string; date?: string }
interface RelatedProduct { slug: string; title?: string; titleCn?: string; images?: Array<{ src?: string }>; price?: number }

function tx(en?: string, cn?: string, locale?: Locale) { return (locale === 'zh' && cn) ? cn : (en || ''); }
function hasSlug(value: unknown): value is { slug: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { slug?: unknown }).slug === 'string'
  );
}

function toEmbedVideoUrl(raw?: string) {
  if (!raw) return '';
  const input = raw.trim();
  if (!input) return '';
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    const host = url.hostname.replace(/^www\./, '');

    const youtubeHosts = new Set(['youtube.com', 'm.youtube.com', 'youtu.be']);
    if (youtubeHosts.has(host)) {
      let id = '';
      if (host === 'youtu.be') {
        id = url.pathname.replace('/', '').split('/')[0];
      } else if (url.pathname.startsWith('/watch')) {
        id = url.searchParams.get('v') || '';
      } else if (url.pathname.startsWith('/shorts/')) {
        id = url.pathname.split('/')[2] || '';
      } else if (url.pathname.startsWith('/embed/')) {
        id = url.pathname.split('/')[2] || '';
      }
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    const vimeoHosts = new Set(['vimeo.com', 'player.vimeo.com']);
    if (vimeoHosts.has(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }

    return input;
  } catch {
    return input;
  }
}

export async function generateStaticParams() { return []; }

export default async function JournalPostPage({ params }: PageProps) {
  const { locale, slug } = params;
  const siteId = await getRequestSiteId();

  const [post, allPosts, allProducts] = await Promise.all([
    loadItemBySlug<PostData>(siteId, locale, 'journal', slug),
    loadAllItems<RelatedPost>(siteId, locale, 'journal'),
    loadAllItems<RelatedProduct>(siteId, locale, 'shop-products'),
  ]);

  if (!post) notFound();

  const relatedPostSlugs = Array.isArray(post.relatedPosts) ? post.relatedPosts : [];
  const relatedProductSlugs = Array.isArray(post.relatedProducts) ? post.relatedProducts : [];
  const relatedPosts = relatedPostSlugs
    .map((s) => allPosts.find((p) => hasSlug(p) && p.slug === s))
    .filter(Boolean) as RelatedPost[];
  const relatedProducts = relatedProductSlugs
    .map((s) => allProducts.find((p) => hasSlug(p) && p.slug === s))
    .filter(Boolean) as RelatedProduct[];

  const isCn = locale === 'zh';
  const body = tx(post.body, post.bodyCn, locale);
  const embedVideoUrl = toEmbedVideoUrl(post.videoUrl);

  // Simple markdown → HTML (headers, bold, paragraphs)
  function renderMarkdown(md: string) {
    return md
      .split('\n\n')
      .map(para => {
        if (para.startsWith('## ')) return `<h2 class="font-serif text-xl font-semibold detail-mt-hero detail-mb-md" style="color:var(--primary)">${para.replace('## ', '')}</h2>`;
        if (para.startsWith('# ')) return `<h1 class="font-serif text-2xl font-semibold detail-mt-hero detail-mb-md" style="color:var(--primary)">${para.replace('# ', '')}</h1>`;
        if (para.startsWith('- ')) {
          const items = para.split('\n').map(l => `<li class="detail-mb-xxs">${l.replace('- ', '')}</li>`).join('');
          return `<ul class="list-disc pl-6 detail-my-md detail-space-y-xxs">${items}</ul>`;
        }
        return `<p class="detail-mb-md leading-loose" style="color:var(--text-secondary)">${para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
      }).join('');
  }

  return (
    <>
      {/* Back */}
      <div className="detail-backbar border-b border-[var(--border)] bg-white">
        <div className="container-custom detail-backbar-row">
          <Link href={`/${locale}/journal`} className="detail-back-link">
            <ArrowLeft className="w-4 h-4" /> {isCn ? '返回日志' : 'Back to Journal'}
          </Link>
        </div>
      </div>

      {/* Header */}
      <section className="bg-white" style={{ paddingTop: 'var(--detail-article-header-pt, 2.5rem)', paddingBottom: 'var(--detail-article-header-pb, 1.5rem)' }}>
        <div className="container-custom max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>{post.category}</span>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold detail-mt-sm detail-mb-md" style={{ color: 'var(--primary)' }}>{tx(post.title, post.titleCn, locale)}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{post.author} · {post.date}</p>
        </div>
      </section>

      {/* Cover image or video */}
      <div className="bg-white" style={{ paddingBottom: 'var(--detail-article-media-pb, 2.5rem)' }}>
        <div className="container-custom max-w-3xl mx-auto">
          {post.type === 'video' && embedVideoUrl ? (
            <div className="relative aspect-video image-frame photo-shadow-lg detail-mb-xxl">
              <iframe src={embedVideoUrl} className="w-full h-full" allowFullScreen title={post.title} />
            </div>
          ) : post.coverImage ? (
            <div className="relative aspect-[16/9] image-frame photo-shadow-lg detail-mb-hero">
              <Image src={post.coverImage} alt={tx(post.title, post.titleCn, locale)} fill className="object-cover" priority sizes="100vw" />
            </div>
          ) : null}

          {/* Body */}
          {body && (
            <div
              className="max-w-reading mx-auto text-base"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }}
            />
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
          <div className="container-custom">
            <h2 className="detail-section-title">
              {isCn ? '选购本文商品' : 'Shop This Story'}
            </h2>
            <div className="flex detail-gap-hscroll-cards overflow-x-auto hide-scrollbar detail-pb-xs">
              {relatedProducts.map(p => (
                <Link key={p.slug} href={`/${locale}/shop/${p.slug}`} className="group flex-shrink-0 detail-card-md">
                  <div className="relative aspect-square image-frame photo-shadow-sm detail-card-media bg-[var(--primary-50)]">
                    {p.images?.[0]?.src && <Image src={p.images[0].src} alt={tx(p.title, p.titleCn, locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="208px" />}
                  </div>
                  <p className="detail-card-title">{tx(p.title, p.titleCn, locale)}</p>
                  {p.price && <p className="detail-card-price">${p.price.toLocaleString()}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="detail-section-title">
              {isCn ? '相关文章' : 'Related Articles'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 detail-gap-related-lg">
              {relatedPosts.map(p => (
                <Link key={p.slug} href={`/${locale}/journal/${p.slug}`} className="group">
                  <div className="relative aspect-[4/3] image-frame photo-shadow-sm detail-card-media bg-[var(--primary-50)]">
                    {p.coverImage && <Image src={p.coverImage} alt={tx(p.title, p.titleCn, locale)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" />}
                  </div>
                  <p className="detail-card-title group-hover:opacity-70 transition-opacity">{tx(p.title, p.titleCn, locale)}</p>
                  <p className="text-xs detail-mt-xxs" style={{ color: 'var(--text-secondary)' }}>{p.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 border-t border-[var(--border)]" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-xl detail-mb-lg" style={{ color: 'var(--primary)' }}>{isCn ? '预约免费咨询' : 'Inspired? Book a complimentary consultation.'}</p>
          <Link href={`/${locale}/contact`} className="btn-gold">{isCn ? '预约咨询' : 'Book Consultation'}</Link>
        </div>
      </section>
    </>
  );
}
