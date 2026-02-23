'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface PortfolioItem {
  slug: string;
  title?: string;
  titleCn?: string;
  coverImage?: string;
  image?: string;
  category?: string;
  style?: string;
  location?: string;
  year?: string;
}

interface FilterOption { value: string; label: string; labelCn?: string }

interface PageData {
  hero?: { headline?: string; headlineCn?: string; subline?: string; sublineCn?: string; backgroundImage?: string };
  filters?: { categories?: FilterOption[]; styles?: FilterOption[] };
  grid?: { variant?: string; loadMoreLabel?: string; loadMoreLabelCn?: string; itemsPerPage?: number };
  cta?: { headline?: string; headlineCn?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string };
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);
  const [pageData, setPageData] = useState<PageData>({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStyle, setActiveStyle] = useState('all');
  const [locale, setLocale] = useState('en');
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const loc = path.startsWith('/zh') ? 'zh' : 'en';
    setLocale(loc);

    Promise.all([
      fetch(`/api/content/file?locale=${loc}&path=pages/portfolio.json`).then(r => r.json()),
      fetch(`/api/content/items?locale=${loc}&directory=portfolio`).then(r => r.json()),
    ]).then(([pageRes, itemsRes]) => {
      try { setPageData(JSON.parse(pageRes.content || '{}')); } catch {}
      const items = Array.isArray(itemsRes.items) ? itemsRes.items : [];
      setProjects(items.filter(Boolean));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const tx = (en?: string, cn?: string) => (locale === 'zh' && cn) ? cn : (en || '');
  const isCn = locale === 'zh';

  const categories = pageData.filters?.categories || [
    { value: 'all', label: 'All', labelCn: '全部' },
    { value: 'residential', label: 'Residential', labelCn: '住宅' },
    { value: 'commercial', label: 'Commercial', labelCn: '商业' },
    { value: 'exhibition', label: 'Exhibition', labelCn: '展览' },
  ];

  const filtered = projects.filter(p => {
    const catOk = activeCategory === 'all' || p.category === activeCategory;
    const styleOk = activeStyle === 'all' || p.style === activeStyle;
    return catOk && styleOk;
  });

  const displayed = filtered.slice(0, visibleCount);

  return (
    <>
      {/* Hero */}
      <section className="relative hero-pad-feature" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-semibold mb-4" style={{ color: 'var(--primary)' }}>
            {tx(pageData.hero?.headline, pageData.hero?.headlineCn) || (isCn ? '我们的作品' : 'Our Work')}
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {tx(pageData.hero?.subline, pageData.hero?.sublineCn) || (isCn ? '25年。1,000+项目。' : '25 years. 1,000+ projects. Every space tells a story.')}
          </p>
        </div>
      </section>

      {/* Filters */}
      <div
        className="sticky-page-filter z-30 border-b border-[var(--border)] backdrop-blur-sm"
        style={{ background: 'rgb(var(--backdrop-primary-rgb, 250 248 245) / 0.9)' }}
      >
        <div className="container-custom filter-bar-row flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => { setActiveCategory(cat.value); setVisibleCount(12); }}
              className={`flex-shrink-0 filter-chip text-sm font-medium border transition-colors ${
                activeCategory === cat.value
                  ? 'border-[var(--secondary)] text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
              }`}
              style={activeCategory === cat.value ? { background: 'var(--secondary-50)' } : {}}
            >
              {isCn ? (cat.labelCn || cat.label) : cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-[var(--primary-50)] animate-pulse rounded-sm" />
              ))}
            </div>
          ) : (
            <>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
                {displayed.map(project => {
                  const projectImage = project.coverImage || project.image;
                  return (
                  <Link
                    key={project.slug}
                    href={`/${locale}/portfolio/${project.slug}`}
                    className="group block mb-4 break-inside-avoid relative"
                  >
                    <div className="relative image-frame photo-shadow-sm aspect-[4/3]">
                      {projectImage ? (
                        <Image
                          src={projectImage}
                          alt={tx(project.title, project.titleCn) || ''}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: 'var(--primary-50)' }} />
                      )}
                      <div
                        className="absolute inset-0 transition-colors duration-300"
                        style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / 0)' }}
                      />
                      <div
                        className="absolute inset-0 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                        style={{ background: 'rgb(var(--hero-overlay-rgb, 26 26 26) / var(--card-hover-overlay, 0.2))' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0" style={{ background: 'linear-gradient(transparent, rgb(var(--hero-overlay-rgb, 26 26 26) / var(--card-bottom-gradient, 0.7)))' }}>
                        <p className="text-white font-serif font-medium">{tx(project.title, project.titleCn)}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--on-dark-medium, rgb(var(--on-dark-rgb, 250 248 245) / 0.6))' }}>{project.category}</span>
                          {project.location && <span className="text-xs" style={{ color: 'var(--on-dark-low, rgb(var(--on-dark-rgb, 250 248 245) / 0.4))' }}>{project.location}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Always visible title below image */}
                    <div className="py-3 px-1">
                      <p className="font-serif text-sm font-medium" style={{ color: 'var(--primary)' }}>{tx(project.title, project.titleCn)}</p>
                      <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{project.category}</p>
                    </div>
                  </Link>
                  );
                })}
              </div>

              {/* Load More */}
              {displayed.length < filtered.length && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => setVisibleCount(v => v + 12)}
                    className="btn-load-more border border-[var(--primary)] text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                  >
                    {isCn ? (pageData.grid?.loadMoreLabelCn || '加载更多项目') : (pageData.grid?.loadMoreLabel || 'Load More Projects')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom text-center">
          <p className="font-serif text-2xl md:text-3xl mb-6" style={{ color: 'var(--primary)' }}>
            {tx(pageData.cta?.headline, pageData.cta?.headlineCn) || (isCn ? '心动了？让我们一起创造非凡。' : "Inspired? Let's create something extraordinary.")}
          </p>
          <Link href={`/${locale}${pageData.cta?.ctaHref || '/contact'}`} className="btn-gold">
            {tx(pageData.cta?.ctaLabel, pageData.cta?.ctaLabelCn) || (isCn ? '预约咨询' : 'Book Consultation')}
          </Link>
        </div>
      </section>
    </>
  );
}
