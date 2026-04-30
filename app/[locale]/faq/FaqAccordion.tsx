'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem { question?: string; questionCn?: string; answer?: string; answerCn?: string }
interface FAQCategory { name?: string; nameCn?: string; items?: FAQItem[] }

export default function FaqAccordion({ categories, locale }: { categories: FAQCategory[]; locale: string }) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const isCn = locale === 'zh';
  const tx = (en?: string, cn?: string) => (isCn && cn) ? cn : (en || '');
  const toggle = (key: string) => setOpenKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <>
      {categories.map((cat, ci) => (
        <div key={ci} className="mb-10">
          <h2 className="font-serif text-lg font-semibold mb-5 pb-3 border-b border-[var(--border)]" style={{ color: 'var(--primary)' }}>
            {tx(cat.name, cat.nameCn)}
          </h2>
          <div className="space-y-3">
            {(cat.items || []).map((item, qi) => {
              const key = `${ci}-${qi}`;
              const open = openKeys.has(key);
              return (
                <div key={qi} className="border border-[var(--border)]">
                  <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <span className="font-serif text-base font-medium pr-4" style={{ color: 'var(--primary)' }}>{tx(item.question, item.questionCn)}</span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--secondary)' }} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-sm leading-loose border-t border-[var(--border)]" style={{ color: 'var(--text-secondary)', paddingTop: '16px' }}>
                      {tx(item.answer, item.answerCn)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
