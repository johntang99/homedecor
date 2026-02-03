import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { loadPageContent } from '@/lib/content';
import { Locale } from '@/lib/types';
import { Badge, Card, Icon, Tabs, Button } from '@/components/ui';

interface CaseStudy {
  id: string;
  category: string;
  condition: string;
  image?: string;
  beforeImage?: string;
  afterImage?: string;
  summary: string;
}

interface CaseStudiesPageData {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
  };
  introduction: {
    text: string;
    note: string;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  caseStudies: CaseStudy[];
  statistics: {
    title: string;
    stats: Array<{
      number: string;
      label: string;
      icon: string;
    }>;
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

interface CaseStudiesPageProps {
  params: {
    locale: Locale;
  };
}

export async function generateMetadata({ params }: CaseStudiesPageProps): Promise<Metadata> {
  const { locale } = params;

  return {
    title: locale === 'en' ? 'Case Studies - Dr. Huang Clinic' : '成功案例 - 黄医生诊所',
    description: locale === 'en'
      ? 'Real patient success stories with Traditional Chinese Medicine at Dr. Huang Clinic.'
      : '黄医生诊所的真实中医成功案例。',
  };
}

export default async function CaseStudiesPage({ params }: CaseStudiesPageProps) {
  const { locale } = params;
  const content = await loadPageContent<CaseStudiesPageData>('case-studies', locale);

  if (!content) {
    return (
      <main className="min-h-screen">
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="text-display font-bold text-gray-900 mb-4">
              {locale === 'en' ? 'Patient Success Stories' : '患者成功案例'}
            </h1>
            <p className="text-subheading text-gray-600">
              {locale === 'en'
                ? 'Case studies content is not available yet.'
                : '成功案例内容尚未发布。'}
            </p>
          </div>
        </section>
      </main>
    );
  }

  const { hero, introduction, categories, caseStudies, statistics, cta } = content;

  const caseStudiesByCategory = (categoryId: string) => {
    if (categoryId === 'all') {
      return caseStudies;
    }
    return caseStudies.filter((study) => study.category === categoryId);
  };

  const normalizeMarkdown = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
      .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[var(--backdrop-primary)] via-[var(--backdrop-secondary)] to-[var(--backdrop-primary)] py-16 md:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary-50 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-display font-bold text-gray-900 mb-6 leading-tight">
                {hero.title}
              </h1>
              <p className="text-subheading text-gray-600 leading-relaxed">
                {hero.subtitle}
              </p>
            </div>

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
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <Icon name="Sparkles" className="text-primary/40" size="xl" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary rounded-3xl opacity-10 -z-10"></div>
              <div className="absolute -top-6 -left-6 w-48 h-48 bg-secondary rounded-3xl opacity-10 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {introduction.text}
            </p>
            <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6">
              <p className="text-gray-700 font-medium flex items-start gap-3">
                <Icon name="Info" className="text-primary mt-0.5 flex-shrink-0" />
                {introduction.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-backdrop-secondary to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs
              defaultValue="all"
              variant="pills"
              items={categories.map((category) => ({
                value: category.id,
                label: category.name,
                icon: <Icon name={category.icon as any} size="sm" />,
                content: (
                  <div className="pt-8">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {caseStudiesByCategory(category.id).map((study, index) => {
                        const caseTitle = study.condition || study.summary;
                        const categoryName = categories.find(cat => cat.id === study.category)?.name;
                        const afterImage = study.afterImage || study.image;
                        const beforeImage = study.beforeImage;
                        const hasBeforeAndAfter = Boolean(beforeImage && afterImage);
                        const overviewText = study.summary;

                        return (
                          <Card key={study.id} variant="default" hover padding="none" className="h-full overflow-hidden border border-gray-200 shadow-sm">
                            <div className="bg-gradient-to-br from-backdrop-secondary to-white border-b border-gray-200 p-4">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <Badge variant="primary" size="sm">
                                  {locale === 'en' ? `Case Study #${index + 1}` : `案例 #${index + 1}`}
                                </Badge>
                                <Badge variant="secondary" size="sm">
                                  {categoryName}
                                </Badge>
                              </div>
                              <h3 className="text-subheading font-bold text-gray-900 mb-1">
                                {caseTitle}
                              </h3>
                            </div>

                            <div className={hasBeforeAndAfter ? 'grid grid-cols-2 gap-2 p-4 bg-gray-50' : 'p-4 bg-gray-50'}>
                              {hasBeforeAndAfter ? (
                                <>
                                  <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                                    <Image src={beforeImage as string} alt={`${caseTitle} before`} fill className="object-cover" />
                                    <Badge variant="primary" size="sm" className="absolute left-3 top-3">
                                      {locale === 'en' ? 'Before' : '治疗前'}
                                    </Badge>
                                  </div>
                                  <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                                    <Image src={afterImage as string} alt={`${caseTitle} after`} fill className="object-cover" />
                                    <Badge variant="primary" size="sm" className="absolute left-3 top-3">
                                      {locale === 'en' ? 'After' : '治疗后'}
                                    </Badge>
                                  </div>
                                </>
                              ) : (
                                <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
                                  {afterImage ? (
                                    <Image src={afterImage} alt={`${caseTitle} after`} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Icon name="Camera" className="text-primary/40" size="lg" />
                                    </div>
                                  )}
                                  <Badge variant="primary" size="sm" className="absolute left-3 top-3">
                                    {locale === 'en' ? 'After' : '治疗后'}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="p-6 space-y-6">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                  {locale === 'en' ? 'Description' : '描述'}
                                </h4>
                                <div className="prose prose-sm max-w-none text-gray-700">
                                  <ReactMarkdown
                                    components={{
                                      ul: (props) => (
                                        <ul className="list-disc pl-5" {...props} />
                                      ),
                                      ol: (props) => (
                                        <ol className="list-decimal pl-5" {...props} />
                                      ),
                                      li: (props) => <li className="mb-1" {...props} />,
                                    }}
                                  >
                                    {normalizeMarkdown(overviewText)}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-heading font-bold text-gray-900">
                {statistics.title}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statistics.stats.map((stat, idx) => (
                <Card key={idx} className="text-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name={stat.icon as any} className="text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
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
