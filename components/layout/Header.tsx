'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { switchLocale } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

export interface JuliaHeaderConfig {
  logo?: { text?: string; image?: string; showText?: boolean; showImage?: boolean };
  navigation?: Array<{ label: string; labelCn?: string; href: string }>;
  ctaButton?: { label: string; labelCn?: string; href: string; style?: string };
  showLanguageSwitcher?: boolean;
  transparentOnHero?: boolean;
  // legacy compat
  menu?: { items?: Array<{ text: string; url: string }>; variant?: string };
  cta?: { text?: string; link?: string };
}

interface HeaderProps {
  locale: Locale;
  siteId: string;
  siteInfo?: Record<string, unknown> | null;
  variant?: string;
  headerConfig?: JuliaHeaderConfig | Record<string, unknown> | null;
}

export default function Header({ locale, headerConfig }: HeaderProps) {
  const cfg = (headerConfig ?? {}) as JuliaHeaderConfig;
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoText = cfg.logo?.text || 'Julia Studio';
  const transparent = cfg.transparentOnHero !== false;
  const showLangSwitcher = cfg.showLanguageSwitcher !== false;
  const ctaLabel = locale === 'zh'
    ? (cfg.ctaButton?.labelCn || '预约咨询')
    : (cfg.ctaButton?.label || 'Book Consultation');
  const ctaHref = cfg.ctaButton?.href || '/contact';

  // Build nav from content or fallback
  const navItems = cfg.navigation?.length
    ? cfg.navigation.map(item => ({
        label: locale === 'zh' ? (item.labelCn || item.label) : item.label,
        href: `/${locale}${item.href}`,
      }))
    : [
        { label: locale === 'zh' ? '作品集' : 'Portfolio', href: `/${locale}/portfolio` },
        { label: locale === 'zh' ? '服务' : 'Services', href: `/${locale}/services` },
        { label: locale === 'zh' ? '商店' : 'Shop', href: `/${locale}/shop` },
        { label: locale === 'zh' ? '日志' : 'Journal', href: `/${locale}/journal` },
        { label: locale === 'zh' ? '关于' : 'About', href: `/${locale}/about` },
        { label: locale === 'zh' ? '联系' : 'Contact', href: `/${locale}/contact` },
      ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isOnHeroPage = pathname === `/${locale}` || pathname === `/${locale}/`;

  const handleLocaleSwitch = (newLocale: Locale) => {
    if (newLocale === locale) return;
    router.push(switchLocale(pathname, newLocale));
  };

  const isDark = transparent && isOnHeroPage && !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDark
          ? 'bg-transparent'
          : 'bg-[var(--backdrop-primary)] border-b border-[var(--border)]'
      } ${scrolled ? 'shadow-sm' : ''}`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className={`font-serif text-xl font-semibold tracking-wide transition-colors ${
              isDark ? 'text-white' : 'text-[var(--primary)]'
            }`}
            style={isDark ? { color: 'var(--text-on-dark, #FAF8F5)' } : undefined}
          >
            {logoText}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:opacity-70 ${
                  isDark ? 'text-white/90' : 'text-[var(--primary)]'
                } ${pathname === item.href ? 'opacity-60' : ''}`}
                style={isDark ? { color: 'var(--on-dark-high, rgba(250,248,245,0.9))' } : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: lang switcher + CTA */}
          <div className="hidden lg:flex items-center gap-5">
            {showLangSwitcher && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleLocaleSwitch('en')}
                  className={`text-xs font-semibold px-2 py-1 transition-opacity ${
                    locale === 'en'
                      ? (isDark ? 'text-white' : 'text-[var(--primary)]')
                      : (isDark ? 'text-white/50' : 'text-[var(--text-secondary)]')
                  }`}
                  style={
                    isDark
                      ? {
                          color: locale === 'en'
                            ? 'var(--text-on-dark, #FAF8F5)'
                            : 'var(--on-dark-medium, rgba(250,248,245,0.6))',
                        }
                      : undefined
                  }
                >
                  EN
                </button>
                <span
                  className={`text-xs ${isDark ? 'text-white/30' : 'text-[var(--border)]'}`}
                  style={isDark ? { color: 'var(--on-dark-subtle, rgba(250,248,245,0.3))' } : undefined}
                >
                  |
                </span>
                <button
                  onClick={() => handleLocaleSwitch('zh')}
                  className={`text-xs font-semibold px-2 py-1 transition-opacity ${
                    locale === 'zh'
                      ? (isDark ? 'text-white' : 'text-[var(--primary)]')
                      : (isDark ? 'text-white/50' : 'text-[var(--text-secondary)]')
                  }`}
                  style={
                    isDark
                      ? {
                          color: locale === 'zh'
                            ? 'var(--text-on-dark, #FAF8F5)'
                            : 'var(--on-dark-medium, rgba(250,248,245,0.6))',
                        }
                      : undefined
                  }
                >
                  中文
                </button>
              </div>
            )}
            <Link
              href={`/${locale}${ctaHref}`}
              className="btn-gold text-sm"
              style={{ borderRadius: '2px', padding: '0.6rem 1.25rem' }}
            >
              {ctaLabel}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden p-2 ${isDark ? 'text-white' : 'text-[var(--primary)]'}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 flex flex-col" style={{ background: 'var(--backdrop-secondary, #1A1A1A)' }}>
          <div className="flex flex-col px-8 py-10 gap-6">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-serif text-2xl text-white/90 hover:text-[var(--secondary)] transition-colors"
                style={{ color: 'var(--on-dark-high, rgba(250,248,245,0.9))' }}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 pt-6 border-t flex items-center gap-6" style={{ borderColor: 'rgb(var(--on-dark-rgb, 250 248 245) / 0.1)' }}>
              {showLangSwitcher && (
                <div className="flex gap-4">
                  <button
                    onClick={() => { handleLocaleSwitch('en'); setMobileOpen(false); }}
                    className="text-sm font-semibold"
                    style={{ color: locale === 'en' ? 'var(--secondary)' : 'var(--on-dark-medium, rgba(250,248,245,0.6))' }}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => { handleLocaleSwitch('zh'); setMobileOpen(false); }}
                    className="text-sm font-semibold"
                    style={{ color: locale === 'zh' ? 'var(--secondary)' : 'var(--on-dark-medium, rgba(250,248,245,0.6))' }}
                  >
                    中文
                  </button>
                </div>
              )}
              <Link
                href={`/${locale}${ctaHref}`}
                onClick={() => setMobileOpen(false)}
                className="btn-gold text-sm flex-1 text-center"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
