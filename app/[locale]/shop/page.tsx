'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface ShopProduct {
  slug: string;
  title?: string; titleCn?: string;
  category?: string; room?: string;
  price?: number; status?: string; featured?: boolean;
  images?: Array<{ src?: string; alt?: string }>;
}

interface FilterOption { value: string; label: string; labelCn?: string }

interface ShopPageData {
  hero?: { headline?: string; headlineCn?: string; subline?: string; sublineCn?: string };
  filters?: { categories?: FilterOption[]; rooms?: FilterOption[] };
  grid?: { variant?: string; itemsPerPage?: number; loadMoreLabel?: string; loadMoreLabelCn?: string };
  tradeProgram?: { enabled?: boolean; headline?: string; headlineCn?: string; body?: string; bodyCn?: string; ctaLabel?: string; ctaLabelCn?: string; ctaHref?: string };
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [pageData, setPageData] = useState<ShopPageData>({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRoom, setActiveRoom] = useState('all');
  const [locale, setLocale] = useState('en');
  const [visibleCount, setVisibleCount] = useState(16);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = window.location.pathname;
    const loc = path.startsWith('/zh') ? 'zh' : 'en';
    setLocale(loc);
    const siteId = 'julia-studio';

    Promise.all([
      fetch(`/api/admin/content/file?siteId=${siteId}&locale=${loc}&path=pages/shop.json`).then(r => r.json()),
      fetch(`/api/admin/content/files?siteId=${siteId}&locale=${loc}`).then(r => r.json()),
    ]).then(async ([pageRes, filesRes]) => {
      try { setPageData(JSON.parse(pageRes.content || '{}')); } catch {}
      const shopFiles = (filesRes.files || []).filter((f: { path: string }) => f.path.startsWith('shop-products/'));
      const items = await Promise.all(
        shopFiles.map(async (f: { path: string }) => {
          const r = await fetch(`/api/admin/content/file?siteId=${siteId}&locale=${loc}&path=${encodeURIComponent(f.path)}`);
          const d = await r.json();
          try { return JSON.parse(d.content || 'null'); } catch { return null; }
        })
      );
      setProducts(items.filter(Boolean));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isCn = locale === 'zh';
  const tx = (en?: string, cn?: string) => (isCn && cn) ? cn : (en || '');

  const categories = pageData.filters?.categories || [
    { value: 'all', label: 'All', labelCn: '全部' },
    { value: 'furniture', label: 'Furniture', labelCn: '家具' },
    { value: 'lighting', label: 'Lighting', labelCn: '灯具' },
    { value: 'textiles', label: 'Textiles', labelCn: '纺织品' },
    { value: 'art', label: 'Art & Décor', labelCn: '艺术与装饰' },
    { value: 'accessories', label: 'Accessories', labelCn: '配饰' },
  ];

  const filtered = products.filter(p => {
    const catOk = activeCategory === 'all' || p.category === activeCategory;
    const roomOk = activeRoom === 'all' || p.room === activeRoom;
    return catOk && roomOk;
  });

  // Sort: featured first
  const sorted = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const displayed = sorted.slice(0, visibleCount);

  return (
    <>
      {/* Hero */}
      <section className="hero-pad-compact" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
            {tx(pageData.hero?.headline, pageData.hero?.headlineCn) || (isCn ? '选购 Julia Studio' : 'Shop Julia Studio')}
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            {tx(pageData.hero?.subline, pageData.hero?.sublineCn)}
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
            <button key={cat.value} onClick={() => { setActiveCategory(cat.value); setVisibleCount(16); }}
              className={`flex-shrink-0 filter-chip text-sm font-medium border transition-colors ${
                activeCategory === cat.value
                  ? 'border-[var(--secondary)] text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
              }`}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white animate-pulse" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {displayed.map(product => (
                  <Link key={product.slug} href={`/${locale}/shop/${product.slug}`} className="group bg-white">
                    <div className="relative aspect-square image-frame">
                      {product.images?.[0]?.src ? (
                        <Image src={product.images[0].src} alt={tx(product.title, product.titleCn) || ''} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width:768px) 50vw, (max-width:1024px) 33vw, 25vw" />
                      ) : (
                        <div className="w-full h-full bg-[var(--primary-50)]" />
                      )}
                      {product.status === 'sold-out' && (
                        <div className="absolute top-3 left-3 px-2 py-1 text-xs bg-[var(--primary)] text-white">{isCn ? '已售罄' : 'Sold Out'}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-serif text-sm font-medium" style={{ color: 'var(--primary)' }}>{tx(product.title, product.titleCn)}</p>
                      {product.price && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>${product.price.toLocaleString()}</p>}
                    </div>
                  </Link>
                ))}
              </div>
              {displayed.length < sorted.length && (
                <div className="text-center mt-12">
                  <button onClick={() => setVisibleCount(v => v + 16)}
                    className="btn-load-more border border-[var(--primary)] text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors">
                    {tx(pageData.grid?.loadMoreLabel, pageData.grid?.loadMoreLabelCn) || (isCn ? '加载更多' : 'Load More')}
                  </button>
                </div>
              )}
              {displayed.length === 0 && !loading && (
                <div className="text-center py-20">
                  <p className="font-serif text-xl" style={{ color: 'var(--primary)' }}>{isCn ? '暂无产品' : 'No products found'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Trade Program */}
      {pageData.tradeProgram?.enabled !== false && (
        <section className="py-14 border-t border-[var(--border)] bg-white">
          <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-serif text-xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                {tx(pageData.tradeProgram?.headline, pageData.tradeProgram?.headlineCn) || (isCn ? '设计师采购计划' : 'Trade Program')}
              </p>
              <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                {tx(pageData.tradeProgram?.body, pageData.tradeProgram?.bodyCn)}
              </p>
            </div>
            <Link href={`/${locale}${pageData.tradeProgram?.ctaHref || '/contact'}`}
              className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold group" style={{ color: 'var(--secondary)' }}>
              {tx(pageData.tradeProgram?.ctaLabel, pageData.tradeProgram?.ctaLabelCn) || (isCn ? '申请行业价格' : 'Apply for Trade Pricing')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
