import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Badge, Tabs, Accordion, Icon } from '@/components/ui';
import { ServicesVariant, getSectionClasses } from '@/lib/section-variants';
import { Service } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface ServicesSectionProps {
  variant?: ServicesVariant;
  badge?: string;
  title: string;
  subtitle?: string;
  featured?: Service;
  services: Service[];
  moreLink?: {
    text: string;
    url: string;
  };
  className?: string;
}

const servicesVariantConfig = {
  'grid-cards': {
    variant: 'grid-cards',
    layout: 'container' as const,
    padding: 'lg' as const,
    className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-6',
  },
  'featured-large': {
    variant: 'featured-large',
    layout: 'container' as const,
    padding: 'lg' as const,
  },
  'list-horizontal': {
    variant: 'list-horizontal',
    layout: 'container' as const,
    padding: 'lg' as const,
  },
  'accordion': {
    variant: 'accordion',
    layout: 'container' as const,
    padding: 'lg' as const,
  },
  'tabs': {
    variant: 'tabs',
    layout: 'container' as const,
    padding: 'lg' as const,
  },
  'detail-alternating': {
    variant: 'detail-alternating',
    layout: 'full-width' as const,
    padding: 'lg' as const,
  },
};

export default function ServicesSection({
  variant = 'grid-cards',
  badge,
  title,
  subtitle,
  featured: featuredProp,
  services,
  moreLink,
  className,
}: ServicesSectionProps) {
  const config = servicesVariantConfig[variant];
  const sectionClasses = getSectionClasses(config);
  const featured = featuredProp || services.find((s) => s.featured) || services[0];
  const nonFeaturedServices = featuredProp
    ? services
    : services.filter((s) => s.id !== featured?.id);
  
  return (
    <section className={cn('bg-white', sectionClasses, className)}>
      {/* Section Header */}
      <div className="text-center mb-12">
        {badge && (
          <Badge variant="primary" className="mb-4">
            {badge}
          </Badge>
        )}
        <h2 className="text-heading font-bold mb-4">{title}</h2>
        {subtitle && <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
      </div>
      
      {/* Variant-specific rendering */}
      {variant === 'grid-cards' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
      
      {variant === 'featured-large' && (
        <div className="space-y-8">
          {/* Featured Service */}
          {featured && (
            <div className="bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-primary transition-all">
              <div className="grid md:grid-cols-2">
                {/* Image Side */}
                <div className="relative aspect-[4/3] md:aspect-auto bg-gray-100">
                  {featured.image ? (
                    <img src={featured.image} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <span className="text-gray-500 text-sm">Featured Service</span>
                    </div>
                  )}
                </div>
                
                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <Badge variant="primary" className="mb-4 w-fit">Featured</Badge>
                  <div className="flex gap-4 items-start mb-4">
                    {featured.icon && (
                      <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name={featured.icon as any} size="md" className="text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-subheading md:text-heading font-bold text-gray-900 mb-2">{featured.title}</h3>
                      <p className="text-subheading text-primary font-medium">{featured.shortDescription}</p>
                    </div>
                  </div>
                  {(featured.fullDescription || featured.shortDescription) && (
                    <p className="text-gray-700 leading-relaxed mb-6 line-clamp-3">
                      {featured.fullDescription || featured.shortDescription}
                    </p>
                  )}
                  {featured.link && (
                    <Link href={featured.link} className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2">
                      Learn More
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Other Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonFeaturedServices.slice(0, 6).map((service) => (
              <ServiceCard key={service.id} service={service} compact />
            ))}
          </div>
        </div>
      )}
      
      {variant === 'list-horizontal' && (
        <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar">
          {services.map((service) => (
            <div key={service.id} className="flex-shrink-0 w-80">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      )}
      
      {variant === 'accordion' && (
        <Accordion
          items={services.map((service) => ({
            id: service.id,
            title: service.title,
            content: (
              <div className="space-y-4">
                <p className="text-gray-700">{service.fullDescription || service.shortDescription}</p>
                {service.benefits && (
                  <div>
                    <h4 className="font-semibold mb-2">Benefits:</h4>
                    <ul className="space-y-1">
                      {service.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          }))}
        />
      )}
      
      {variant === 'tabs' && (
        <Tabs
          tabs={services.map((service) => ({
            id: service.id,
            label: service.title,
            content: (
              <div className="p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-6">{service.fullDescription || service.shortDescription}</p>
                {service.benefits && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {service.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          }))}
          variant="pills"
        />
      )}

      {variant === 'detail-alternating' && (
        <div className="max-w-6xl mx-auto space-y-12 lg:space-y-16">
          {services
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((service, index) => (
              <div
                key={service.id}
                id={service.id}
                className={`grid lg:grid-cols-2 gap-8 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Icon name={service.icon as any} size="xl" className="text-primary/30" />
                      </div>
                    )}
                  </div>
                </div>

                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon name={service.icon as any} className="text-primary" />
                    </div>
                    <Badge variant="primary">{`Service ${service.order || index + 1}`}</Badge>
                  </div>

                  <h2 className="text-heading font-bold text-gray-900 mb-4">{service.title}</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {service.fullDescription || service.shortDescription}
                  </p>

                  {service.benefits && service.benefits.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-subheading font-semibold text-gray-900 mb-4">
                        Key Benefits
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {service.benefits.slice(0, 6).map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Icon
                              name="Check"
                              className="text-primary mt-0.5 flex-shrink-0"
                              size="sm"
                            />
                            <span className="text-sm text-gray-600">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.whatToExpect && (
                    <div className="bg-white rounded-xl p-6 border border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Icon name="Info" size="sm" className="text-primary" />
                        What to Expect
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {service.whatToExpect}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
      
      {/* More Link */}
      {moreLink && (
        <div className="text-center mt-12">
          <Link
            href={moreLink.url}
            className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-2 group"
          >
            {moreLink.text}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}

// ============================================
// SERVICE CARD COMPONENT
// ============================================

interface ServiceCardProps {
  service: Service;
  compact?: boolean;
}

function ServiceCard({ service, compact }: ServiceCardProps) {
  const CardWrapper = service.link ? Link : 'div';
  
  return (
    <CardWrapper href={service.link || '#'} className={service.link ? 'block' : ''}>
      <Card
        variant="default"
        hover
        className={cn(
          'h-full',
          compact && 'border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-lg'
        )}
      >
        {service.image && !compact && (
          <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden">
            <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader>
          {service.icon && (
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4 shadow-sm">
              <Icon name={service.icon as any} size="md" className="text-primary" />
            </div>
          )}
          <CardTitle>{service.title}</CardTitle>
          {service.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{service.subtitle}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm line-clamp-3">
            {service.fullDescription || service.shortDescription}
          </p>
          {service.link && (
            <div className="mt-4 text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-1 text-sm">
              Learn More
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
