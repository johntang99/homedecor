'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { SiteInfo } from '@/lib/types';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

interface HeaderProps {
  locale: Locale;
  siteId: string;
  siteInfo?: SiteInfo;
  variant?: 'default' | 'centered' | 'transparent' | 'stacked';
  menu?: {
    variant?: 'default' | 'centered' | 'transparent' | 'stacked';
    items: Array<{ text: string; url: string }>;
    cta?: {
      text: string;
      link: string;
    };
  };
}

export default function Header({
  locale,
  siteId,
  siteInfo,
  variant = 'default',
  menu,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Navigation menu items
  const navigation =
    menu?.items && menu.items.length > 0
      ? menu.items
      : [
          { text: locale === 'en' ? 'Home' : '首页', url: `/${locale}` },
          { text: locale === 'en' ? 'Services' : '服务项目', url: `/${locale}/services` },
          { text: locale === 'en' ? 'Conditions' : '治疗病症', url: `/${locale}/conditions` },
          { text: locale === 'en' ? 'About' : '关于我们', url: `/${locale}/about` },
          { text: locale === 'en' ? 'Case Studies' : '案例研究', url: `/${locale}/case-studies` },
          { text: locale === 'en' ? 'Gallery' : '图库', url: `/${locale}/gallery` },
          { text: locale === 'en' ? 'New Visit' : '首次就诊', url: `/${locale}/new-patients` },
          { text: locale === 'en' ? 'Blog' : '博客', url: `/${locale}/blog` },
          { text: locale === 'en' ? 'Contact' : '联系我们', url: `/${locale}/contact` },
        ];

  const cta = menu?.cta || {
    text: locale === 'en' ? 'Book Online' : '在线预约',
    link: `/${locale}/contact`,
  };
  
  useEffect(() => {
    if (variant !== 'transparent') return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  const topBar = (
    <div
      className={`hidden md:block overflow-hidden transition-all duration-1000 ease-out ${
        variant === 'transparent' && scrolled
          ? 'max-h-0 opacity-0 -translate-y-2'
          : 'max-h-16 opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-primary text-white py-2">
      <div className="container-custom">
        <div className="flex justify-between items-center text-sm">
          <div className="flex flex-wrap items-center gap-6">
            {siteInfo?.address && (
              <a
                href={siteInfo.addressMapUrl || '#'}
                className="flex items-center gap-2 text-white hover:text-white transition-colors"
              >
                <MapPin className="w-4 h-4" />
                {siteInfo.address}, {siteInfo.city}, {siteInfo.state} {siteInfo.zip}
              </a>
            )}
            {siteInfo?.phone && (
              <a href={`tel:${siteInfo.phone}`} className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                {siteInfo.phone}
              </a>
            )}
            {siteInfo?.email && (
              <a href={`mailto:${siteInfo.email}`} className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                {siteInfo.email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Social Media */}
            <div className="flex items-center gap-3">
              {siteInfo?.social?.facebook && (
                <a href={siteInfo.social.facebook} target="_blank" rel="noreferrer" className="text-white hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {siteInfo?.social?.instagram && (
                <a href={siteInfo.social.instagram} target="_blank" rel="noreferrer" className="text-white hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {siteInfo?.social?.youtube && (
                <a href={siteInfo.social.youtube} target="_blank" rel="noreferrer" className="text-white hover:text-white transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {siteInfo?.social?.wechat && (
                <a href={siteInfo.social.wechat} target="_blank" rel="noreferrer" className="text-white hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
            <span className="badge bg-white/20 text-white">
              {locale === 'en' ? 'Accepting New Patients' : '接受新患者'}
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  const headerNode = (
    <header
      className={`transition-colors ${
        variant === 'transparent'
          ? scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
          : 'bg-white shadow-sm'
      }`}
    >
        {variant === 'centered' || variant === 'stacked' ? (
          /* Stacked Variant: Logo on top, menu below */
          <nav className="container-custom py-4">
            {/* Logo - Centered */}
            <div className="flex justify-center mb-4">
              <Link href={`/${locale}`}>
                <Image
                  src="/uploads/dr-huang-clinic/home/drhuang-2.svg"
                  alt="Dr Huang Clinic"
                  width={60}
                  height={60}
                  className="w-auto h-16 hover:opacity-90 transition-opacity"
                />
            </Link>
            </div>
            
            {/* Menu - Centered below logo */}
            <div className="hidden lg:flex items-center justify-center gap-6 flex-wrap">
              {navigation.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className="text-gray-700 hover:text-primary font-medium transition-colors text-sm"
                >
                  {item.text}
                </Link>
              ))}
              
              <LanguageSwitcher currentLocale={locale} />
              
              <Link href={cta.link} className="btn-primary text-sm px-5 py-2.5 ml-4">
                {cta.text}
              </Link>
            </div>
            
            {/* Mobile Menu Button - Centered variant */}
            <div className="flex lg:hidden justify-center gap-4 mt-4">
              <LanguageSwitcher currentLocale={locale} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-primary"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
        </nav>
        ) : (
          /* Default Variant: Logo left, menu right (all in one line) */
          <nav className="container-custom">
            <div className="flex items-center h-20">
              {/* Logo */}
              <Link href={`/${locale}`} className="flex-shrink-0">
                <Image
                  src="/uploads/dr-huang-clinic/home/drhuang-2.svg"
                  alt="Dr Huang Clinic"
                  width={48}
                  height={48}
                  className="w-auto h-12 hover:opacity-90 transition-opacity"
                />
              </Link>
              
              {/* Desktop Navigation - All in one line */}
              <div className="hidden xl:flex items-center gap-4 2xl:gap-6 flex-1 justify-center">
                {navigation.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    className="text-gray-700 hover:text-primary font-medium transition-colors text-sm whitespace-nowrap"
                  >
                    {item.text}
                  </Link>
                ))}
              </div>
              <div className="hidden xl:flex items-center gap-4">
                <LanguageSwitcher currentLocale={locale} />
                <Link href={cta.link} className="btn-primary text-sm px-5 py-2.5 whitespace-nowrap">
                  {cta.text}
                </Link>
              </div>
            
              {/* Mobile Menu Button */}
              <div className="flex xl:hidden items-center gap-4">
                <LanguageSwitcher currentLocale={locale} />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-700 hover:text-primary"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </nav>
        )}
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t bg-white">
            <div className="container-custom py-4">
              <div className="flex flex-col gap-4">
                {navigation.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    className="text-gray-700 hover:text-primary font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.text}
                  </Link>
                ))}
                <Link
                  href={cta.link}
                  className="btn-primary text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cta.text}
                </Link>
              </div>
            </div>
          </div>
        )}
    </header>
  );

  if (variant === 'transparent') {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50">
          {topBar}
          {headerNode}
        </div>
        <div className="h-6 md:h-8" />
      </>
    );
  }

  return (
    <>
      {topBar}
      <div className="sticky top-0 z-50">{headerNode}</div>
    </>
  );
}
