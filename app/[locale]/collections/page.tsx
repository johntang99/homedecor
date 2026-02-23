'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Collection { slug: string; title?: string; titleCn?: string; description?: string; descriptionCn?: string; coverImage?: string; featured?: boolean }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [locale, setLocale] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loc = window.location.pathname.startsWith('/zh') ? 'zh' : 'en';
    setLocale(loc);
    fetch(`/api/content/items?locale=${loc}&directory=collections`)
      .then(r => r.json())
      .then(async (d) => {
        const items = Array.isArray(d.items) ? d.items : [];
        const parsedCollections = items.filter(Boolean) as Collection[];
        setCollections(
          parsedCollections.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        );
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const isCn = locale === 'zh';
  const tx = (en?: string, cn?: string) => (isCn && cn) ? cn : (en || '');

  return (
    <>
      <section className="pt-32 pb-16 md:pt-40" style={{ background: 'var(--backdrop-primary)' }}>
        <div className="container-custom">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-3" style={{ color: 'var(--primary)' }}>
            {isCn ? '设计系列' : 'Design Collections'}
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            {isCn ? '以我们最喜爱的设计主题为灵感的精选系列。' : 'Curated collections inspired by our favorite design themes.'}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(3)].map((_, i) => <div key={i} className="aspect-[3/2] bg-[var(--primary-50)] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {collections.map(col => (
                <Link key={col.slug} href={`/${locale}/collections/${col.slug}`} className="group block card-frame p-4 bg-white border border-[var(--border)]">
                  <div className="relative aspect-[3/2] image-frame photo-shadow-sm mb-5 bg-[var(--primary-50)]">
                    {col.coverImage ? (
                      <Image src={col.coverImage} alt={tx(col.title, col.titleCn)} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width:768px) 100vw, 50vw" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold mb-2" style={{ color: 'var(--primary)' }}>{tx(col.title, col.titleCn)}</h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: '44ch' }}>{tx(col.description, col.descriptionCn)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
