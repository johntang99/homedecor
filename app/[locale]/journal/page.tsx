'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface JournalPost {
  slug: string; title?: string; titleCn?: string;
  type?: string; category?: string;
  date?: string; author?: string;
  coverImage?: string;
  excerpt?: string; excerptCn?: string;
  videoDuration?: string; featured?: boolean;
}

interface FilterOption { value: string; label: string; labelCn?: string }
interface JournalPageData {
  hero?: { headline?: string; headlineCn?: string; subline?: string; sublineCn?: string };
  featured?: { enabled?: boolean; postSlug?: string };
  filters?: { categories?: FilterOption[] };
  grid?: { itemsPerPage?: number; loadMoreLabel?: string; loadMoreLabelCn?: string };
  newsletter?: { headline?: string; headlineCn?: string; placeholder?: string; placeholderCn?: string; buttonLabel?: string; buttonLabelCn?: string };
}

export default function JournalPage() {
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [pageData, setPageData] = useState<JournalPageData>({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [locale, setLocale] = useState('en');
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loc = window.location.pathname.startsWith('/zh') ? 'zh' : 'en';
    setLocale(loc);
    const siteId = 'julia-studio';

    Promise.all([
      fetch(`/api/admin/content/file?siteId=${siteId}&locale=${loc}&path=pages/journal.json`).then(r => r.json()),
      fetch(`/api/admin/content/files?siteId=${siteId}&locale=${loc}`).then(r => r.json()),
    ]).then(async ([pageRes, filesRes]) => {
      try { setPageData(JSON.parse(pageRes.content || '{}')); } catch {}
      const journalFiles = (filesRes.files || []).filter((f: { path: string }) => f.path.startsWith('journal/'));
      const items = await Promise.all(
        journalFiles.map(async (f: { path: string }) => {
          const r = await fetch(`/api/admin/content/file?siteId=${siteId}&locale=${loc}&path=${encodeURIComponent(f.path)}`);
          const d = await r.json();
          try { return JSON.parse(d.content || 'null'); } catch { return null; }
        })
      );
      setPosts(items.filter(Boolean).sort((a, b) => (b.date || '').localeCompare(a.date || '')));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isCn = locale === 'zh';
  const tx = (en?: string, cn?: string) => (isCn && cn) ? cn : (en || '');

  const categories = pageData.filters?.categories || [
    { value: 'all', label: 'All', labelCn: '全部' },
    { value: 'design-tips', label: 'Design Tips', labelCn: '设计技巧' },
    { value: 'project-stories', label: 'Project Stories', labelCn: '项目故事' },
    { value: 'behind-the-scenes', label: 'Behind the Scenes', labelCn: '幕后花絮' },
    { value: 'video', label: 'Video', labelCn: '视频' },
  ];

  const featuredSlug = pageData.featured?.postSlug;
  const featuredPost = posts.find(p => p.slug === featuredSlug) || (posts.find(p => p.featured));
  const filtered = posts.filter(p => activeCategory === 'all' || p.category === activeCategory || (activeCategory === 'video' && p.type === 'video'));
  const gridPosts = featuredPost ? filtered.filter(p => p.slug !== featuredPost.slug) : filtered;
  const displayed = gridPosts.slice(0, visibleCount);

  return (
    <>
      {/* Hero */}
      <section className="hero-pad-compact" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
            {tx(pageData.hero?.headline, pageData.hero?.headlineCn) || (isCn ? '日志' : 'Journal')}
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            {tx(pageData.hero?.subline, pageData.hero?.sublineCn) || (isCn ? '设计见解、项目故事和灵感' : 'Design insights, project stories, and inspiration.')}
          </p>
        </div>
      </section>

      {/* Featured */}
      {featuredPost && (
        <section className="bg-white border-b border-[var(--border)]">
          <div className="container-custom py-12">
            <Link href={`/${locale}/journal/${featuredPost.slug}`} className="group grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="relative aspect-[4/3] image-frame bg-[var(--primary-50)]">
                {featuredPost.coverImage ? <Image src={featuredPost.coverImage} alt={tx(featuredPost.title, featuredPost.titleCn)} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width:768px) 100vw, 50vw" /> : <div className="w-full h-full" />}
                {featuredPost.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="play-badge-lg rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--on-dark-rgb, 250 248 245) / 0.8)' }}>
                      <Play className="play-icon-lg ml-1" style={{ color: 'var(--primary)' }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>{isCn ? '精选' : 'Featured'} · {featuredPost.category}</span>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold mt-3 mb-4 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>{tx(featuredPost.title, featuredPost.titleCn)}</h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>{tx(featuredPost.excerpt, featuredPost.excerptCn)}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{featuredPost.author} · {featuredPost.date}</p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Category filters */}
      <div
        className="sticky-page-filter z-30 border-b border-[var(--border)] backdrop-blur-sm"
        style={{ background: 'rgb(var(--backdrop-primary-rgb, 250 248 245) / 0.9)' }}
      >
        <div className="container-custom filter-bar-row flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <button key={cat.value} onClick={() => { setActiveCategory(cat.value); setVisibleCount(9); }}
              className={`flex-shrink-0 filter-chip text-sm font-medium border transition-colors ${activeCategory === cat.value ? 'border-[var(--secondary)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'}`}
              style={activeCategory === cat.value ? { background: 'var(--secondary-50)' } : {}}>
              {isCn ? (cat.labelCn || cat.label) : cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] bg-white animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                {displayed.map(post => (
                  <Link key={post.slug} href={`/${locale}/journal/${post.slug}`} className="group bg-white">
                    <div className="relative aspect-[4/3] image-frame bg-[var(--primary-50)]">
                      {post.coverImage ? <Image src={post.coverImage} alt={tx(post.title, post.titleCn)} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 100vw, 33vw" /> : <div className="w-full h-full" />}
                      {post.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="play-badge-md rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--on-dark-rgb, 250 248 245) / 0.8)' }}>
                            <Play className="play-icon-md ml-0.5" style={{ color: 'var(--primary)' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>{post.category}</span>
                      <h3 className="font-serif text-base font-medium mt-2 mb-2 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>{tx(post.title, post.titleCn)}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{post.author} · {post.date}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {displayed.length < gridPosts.length && (
                <div className="text-center mt-12">
                  <button onClick={() => setVisibleCount(v => v + 9)}
                    className="btn-load-more border border-[var(--primary)] text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                    {tx(pageData.grid?.loadMoreLabel, pageData.grid?.loadMoreLabelCn) || (isCn ? '加载更多' : 'Load More')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-white border-t border-[var(--border)]">
        <div className="container-custom max-w-lg mx-auto text-center">
          <h2 className="font-serif text-2xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
            {tx(pageData.newsletter?.headline, pageData.newsletter?.headlineCn) || (isCn ? '每周设计灵感' : 'Design inspiration, delivered weekly.')}
          </h2>
          <div className="flex gap-2 mt-6">
            <input type="email" placeholder={tx(pageData.newsletter?.placeholder, pageData.newsletter?.placeholderCn) || (isCn ? '您的邮箱' : 'Your email address')}
              className="flex-1 border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--secondary)] transition-colors" />
            <button className="btn-gold text-sm px-5">{tx(pageData.newsletter?.buttonLabel, pageData.newsletter?.buttonLabelCn) || (isCn ? '订阅' : 'Subscribe')}</button>
          </div>
        </div>
      </section>
    </>
  );
}
