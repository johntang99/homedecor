import type { FooterSection, Locale } from './types';

export function getDefaultFooter(locale: Locale): FooterSection {
  const isEnglish = locale === 'en';

  return {
    brand: {
      logoText: 'TCM',
      name: 'Dr Huang Clinic',
      description: isEnglish
        ? 'Traditional Chinese Medicine and Acupuncture serving the community with holistic healing.'
        : '以传统中医和针灸为社区提供整体治疗。',
    },
    quickLinks: [
      { text: isEnglish ? 'About Us' : '关于我们', url: `/${locale}/about` },
      { text: isEnglish ? 'Services' : '服务项目', url: `/${locale}/services` },
      { text: isEnglish ? 'Conditions' : '治疗病症', url: `/${locale}/conditions` },
      { text: isEnglish ? 'Case Studies' : '案例研究', url: `/${locale}/case-studies` },
      { text: isEnglish ? 'New Visit' : '首次就诊', url: `/${locale}/new-patients` },
      { text: isEnglish ? 'New Patients' : '新患者', url: `/${locale}/new-patients` },
      { text: isEnglish ? 'Blog' : '博客', url: `/${locale}/blog` },
      { text: isEnglish ? 'Contact' : '联系我们', url: `/${locale}/contact` },
    ],
    services: [
      { text: isEnglish ? 'Acupuncture' : '针灸', url: `/${locale}/services#acupuncture` },
      { text: isEnglish ? 'Herbal Medicine' : '中药', url: `/${locale}/services#herbs` },
      { text: isEnglish ? 'Cupping' : '拔罐', url: `/${locale}/services#cupping` },
      { text: isEnglish ? 'Tui Na' : '推拿', url: `/${locale}/services#tuina` },
    ],
    contact: {
      addressLines: ['71 East Main Street', 'Middletown, NY 10940'],
      phone: '(845) 381-1106',
      phoneLink: 'tel:+18453811106',
      email: 'info@clinic.com',
      emailLink: 'mailto:info@clinic.com',
    },
    hours: ['Mon-Fri: 9:00 AM - 6:00 PM', 'Sat: 10:00 AM - 2:00 PM'],
    legalLinks: [
      { text: isEnglish ? 'Privacy Policy' : '隐私政策', url: `/${locale}/privacy` },
      { text: isEnglish ? 'Terms of Service' : '服务条款', url: `/${locale}/terms` },
    ],
    copyright: isEnglish
      ? '© {year} Dr Huang Clinic. All rights reserved.'
      : '© {year} Dr Huang Clinic. 版权所有。',
  };
}
