import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getRequestSiteId, loadPageContent, loadSiteInfo } from '@/lib/content';
import { Locale, SiteInfo } from '@/lib/types';
import { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Icon } from '@/components/ui';
import { CheckCircle2, MapPin, Clock } from 'lucide-react';

interface AboutPageData {
  hero: {
    title: string;
    subtitle: string;
    description?: string;
    backgroundImage?: string;
  };
  profile: {
    name: string;
    title: string;
    image: string;
    bio: string;
    quote: string;
    signature?: string;
  };
  credentials: {
    title: string;
    items: Array<{
      icon: string;
      credential: string;
      institution: string;
      year: string;
      location: string;
    }>;
  };
  specializations: {
    title: string;
    description: string;
    areas: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  philosophy: {
    title: string;
    introduction: string;
    principles: Array<{
      title: string;
      description: string;
    }>;
  };
  journey: {
    title: string;
    story: string;
  };
  affiliations: {
    title: string;
    organizations: Array<{
      name: string;
      role: string;
    }>;
  };
  continuingEducation: {
    title: string;
    description: string;
    items: string[];
  };
  clinic: {
    title: string;
    description: string | string[];
    features?: string[];
    values: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    environment: string;
  };
  cta: {
    title: string;
    description: string;
    primaryCta: {
      text: string;
      link: string;
    };
    secondaryCta: {
      text: string;
      link: string;
    };
  };
}

interface AboutPageProps {
  params: {
    locale: Locale;
  };
}

interface ContactHoursSchedule {
  day: string;
  time: string;
  isOpen: boolean;
  note?: string;
}

interface ContactPageData {
  hours?: {
    title?: string;
    schedule: ContactHoursSchedule[];
    note?: string;
  };
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = params;
  
  return {
    title: locale === 'en' ? 'About Dr. Huang - Traditional Chinese Medicine Expert' : '关于黄医生 - 传统中医专家',
    description: locale === 'en' 
      ? 'Meet Dr. Michael Huang, L.Ac., MSTCM - Licensed acupuncturist with over 15 years of experience in Traditional Chinese Medicine.'
      : '认识黄迈克医生，L.Ac., MSTCM - 持牌针灸师，拥有超过15年的传统中医经验。',
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = params;
  
  // Load page content
  const siteId = await getRequestSiteId();
  const content = await loadPageContent<AboutPageData>('about', locale, siteId);
  const contactContent = await loadPageContent<ContactPageData>('contact', locale, siteId);
  const siteInfo = await loadSiteInfo(siteId, locale) as SiteInfo | null;
  
  if (!content) {
    notFound();
  }

  const { hero, profile, credentials, specializations, philosophy, journey, affiliations, continuingEducation, clinic, cta } = content;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)] py-16 md:py-20 px-4 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-display font-bold text-gray-900 mb-6 leading-tight">
                {hero.title}
              </h1>
              <p className="text-subheading text-primary font-medium mb-4">
                {hero.subtitle}
              </p>
              {hero.description && (
                <p className="text-subheading text-gray-600 leading-relaxed">
                  {hero.description}
                </p>
              )}
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative lg:h-[500px] h-[350px] hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] rounded-3xl overflow-hidden shadow-2xl">
                {hero.backgroundImage ? (
                  <Image
                    src={hero.backgroundImage}
                    alt={hero.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 relative p-8">
                    <div className="absolute top-10 left-10 w-24 h-24 bg-primary-50/20 rounded-full"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary-50/20 rounded-full"></div>

                    <div className="relative z-10 text-center">
                      <div className="text-8xl mb-6">🏥</div>
                      <p className="text-gray-700 font-semibold text-subheading mb-2">
                        {siteInfo?.clinicName || 'Dr. Huang Clinic'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {siteInfo?.tagline || 'Traditional Chinese Medicine'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary rounded-3xl opacity-10 -z-10"></div>
              <div className="absolute -top-6 -left-6 w-48 h-48 bg-secondary rounded-3xl opacity-10 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              {/* Photo */}
              <div className="lg:col-span-2">
                <div className="sticky top-8">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl mb-6">
                    {/* Placeholder - replace with actual image */}
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Icon name="User" size="xl" className="text-primary/30" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-heading font-bold text-gray-900 mb-2">
                      {profile.name}
                    </h2>
                    <p className="text-gray-600 mb-6">{profile.title}</p>
                    <div className="flex gap-4 justify-center">
                      <Button asChild size="sm">
                        <Link href={cta.primaryCta.link}>Book Appointment</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={cta.secondaryCta.link}>Call Now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Content */}
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {profile.bio}
                  </p>
                  
                  {/* Quote */}
                  <div className="bg-gradient-to-br from-primary/5 to-backdrop-primary border-l-4 border-primary rounded-r-2xl p-8">
                    <blockquote className="text-xl italic text-gray-800 mb-4">
                      "{profile.quote}"
                    </blockquote>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{profile.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Qualifications</Badge>
              <h2 className="text-heading font-bold text-gray-900">
                {credentials.title}
              </h2>
            </div>

            <div className="grid gap-4">
              {credentials.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon as any} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {item.credential}
                      </h3>
                      <p className="text-gray-700 mb-2">{item.institution}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size="sm" />
                          {item.year}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="MapPin" size="sm" />
                          {item.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Expertise</Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {specializations.title}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {specializations.description}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {specializations.areas.map((area, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon name={area.icon as any} className="text-primary" />
                    </div>
                    <CardTitle>{area.title}</CardTitle>
                    <CardDescription>{area.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-backdrop-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">Philosophy</Badge>
              <h2 className="text-heading font-bold text-gray-900 mb-4">
                {philosophy.title}
              </h2>
              <p className="text-lg text-gray-700">
                {philosophy.introduction}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {philosophy.principles.map((principle, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 pt-0.5">
                      {principle.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Journey Story */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="primary" className="mb-4">My Story</Badge>
              <h2 className="text-heading font-bold text-gray-900">
                {journey.title}
              </h2>
            </div>

            <div className="prose prose-lg max-w-none">
              {journey.story.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Affiliations & Continuing Ed */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Affiliations */}
              <div>
                <h2 className="text-subheading font-bold text-gray-900 mb-6">
                  {affiliations.title}
                </h2>
                <div className="space-y-4">
                  {affiliations.organizations.map((org, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border border-gray-100"
                    >
                      <p className="font-semibold text-gray-900 mb-1">
                        {org.name}
                      </p>
                      <p className="text-sm text-gray-600">{org.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continuing Education */}
              <div>
                <h2 className="text-subheading font-bold text-gray-900 mb-4">
                  {continuingEducation.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {continuingEducation.description}
                </p>
                <ul className="space-y-3">
                  {continuingEducation.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon name="Check" className="text-primary mt-1 flex-shrink-0" size="sm" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Clinic */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-heading font-bold text-gray-900 mb-8 text-center">{clinic.title}</h2>

          {/* Description */}
          <div className="max-w-3xl mx-auto mb-12">
            {(Array.isArray(clinic.description)
              ? clinic.description
              : clinic.description.split('\n\n')
            ).map((paragraph, idx) => (
              <p key={idx} className="text-subheading text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Features List */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
              <h3 className="text-subheading font-bold text-gray-900 mb-6">
                {locale === 'en' ? 'Clinic Features' : '诊所特色'}
              </h3>
              <ul className="space-y-3">
                {(clinic.features && clinic.features.length > 0
                  ? clinic.features
                  : clinic.values.map(value => value.title)
                ).map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Location & Hours */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] border-2 border-gray-200 rounded-xl p-8">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0" />
                  <h3 className="text-subheading font-bold text-gray-900">
                    {locale === 'en' ? 'Location' : '地址'}
                  </h3>
                </div>
                <p className="text-gray-700 mb-2">{siteInfo?.address}</p>
                <p className="text-gray-700 mb-4">
                  {siteInfo?.city}, {siteInfo?.state} {siteInfo?.zip}
                </p>
                {siteInfo?.addressMapUrl && (
                  <a
                    href={siteInfo.addressMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-primary hover:text-primary-dark font-semibold text-small"
                  >
                    {locale === 'en' ? 'Get Directions' : '获取路线'} →
                  </a>
                )}
              </div>

              {/* Hours Card */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
                <div className="flex items-start gap-3 mb-4">
                  <Clock className="w-6 h-6 text-primary shrink-0" />
                  <h3 className="text-subheading font-bold text-gray-900">
                    {locale === 'en' ? 'Office Hours' : '营业时间'}
                  </h3>
                </div>
                <div className="space-y-2">
                  {(contactContent?.hours?.schedule || []).map((hour, idx) => (
                    <div key={idx} className="flex justify-between text-gray-700">
                      <span className="font-medium">{hour.day}</span>
                      <span>{hour.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-heading text-white mb-4">
            {cta.title}
          </h2>
          <p className="text-subheading mb-10 leading-relaxed max-w-3xl mx-auto text-white/95">
            {cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={cta.primaryCta.link}
              className="bg-white text-[var(--primary)] px-8 py-4 rounded-lg hover:bg-gray-50 font-semibold text-subheading transition-all shadow-lg"
            >
              {cta.primaryCta.text}
            </Link>
            <Link
              href={cta.secondaryCta.link}
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 font-semibold text-subheading transition-all"
            >
              {cta.secondaryCta.text}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
