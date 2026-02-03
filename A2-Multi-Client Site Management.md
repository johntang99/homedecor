# Admin Dashboard - Multi-Client Site Management

## 1. Overview

This document details how to implement multi-client site management in the admin dashboard. The system allows super admins to manage multiple clinic sites, each with its own content, theme, and settings.

## 2. Multi-Site Architecture

### 2.1 Site Data Structure

Each site is stored in its own directory under `content/`:

```
content/
├── dr-huang-clinic/           # Site ID (slug)
│   ├── site.json              # Site metadata
│   ├── theme.json             # Theme configuration
│   ├── en/                    # English content
│   │   └── pages/
│   │       ├── home.json
│   │       ├── about.json
│   │       └── services.json
│   └── zh/                    # Chinese content
│       └── pages/
├── dr-chen-acupuncture/       # Another site
│   ├── site.json
│   ├── theme.json
│   ├── en/
│   └── zh/
└── wellness-center-nyc/       # Third site
    ├── site.json
    ├── theme.json
    └── en/
```

### 2.2 Site Metadata Schema

```typescript
// lib/types.ts
export interface SiteMetadata {
  id: string;                    // Unique identifier (slug)
  name: string;                  // Display name
  description?: string;          // Site description
  domain?: string;               // Custom domain (optional)
  defaultLocale: string;         // Default language
  locales: string[];             // Supported languages
  logo?: string;                 // Logo URL
  favicon?: string;              // Favicon URL
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
  status: 'active' | 'draft' | 'archived';
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  settings: {
    googleAnalytics?: string;
    facebookPixel?: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
}
```

**Example `content/dr-huang-clinic/site.json`:**
```json
{
  "id": "dr-huang-clinic",
  "name": "Dr. Huang Clinic",
  "description": "Traditional Chinese Medicine & Acupuncture",
  "domain": "drhuangclinic.com",
  "defaultLocale": "en",
  "locales": ["en", "zh"],
  "logo": "/uploads/dr-huang-clinic/logo.png",
  "favicon": "/uploads/dr-huang-clinic/favicon.ico",
  "owner": {
    "name": "Dr. Wei Huang",
    "email": "info@drhuangclinic.com",
    "phone": "+1 (555) 123-4567"
  },
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "settings": {
    "googleAnalytics": "G-XXXXXXXXXX",
    "contactEmail": "appointments@drhuangclinic.com",
    "contactPhone": "+1 (555) 123-4567",
    "address": "123 Main St, New York, NY 10001",
    "socialMedia": {
      "facebook": "https://facebook.com/drhuangclinic",
      "instagram": "https://instagram.com/drhuangclinic"
    }
  }
}
```

## 3. Site Listing Page

### 3.1 File Structure
```
app/admin/sites/
├── page.tsx              # Sites list
├── new/
│   └── page.tsx          # Create new site
└── [siteId]/
    ├── page.tsx          # Site dashboard
    ├── content/
    ├── images/
    ├── theme/
    └── settings/
```

### 3.2 Sites List Implementation

```typescript
// app/admin/sites/page.tsx
import { getAllSites } from '@/lib/admin/site-manager';
import { getSession } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';
import { SiteCard } from '@/components/admin/SiteCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function SitesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/admin/login');
  }

  const sites = await getAllSites(session.user);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-gray-600 mt-2">
            Manage your clinic websites
          </p>
        </div>
        
        {session.user.role === 'super_admin' && (
          <Link href="/admin/sites/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Site
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Sites" 
          value={sites.length}
          icon="🏥"
        />
        <StatCard 
          title="Active" 
          value={sites.filter(s => s.status === 'active').length}
          icon="✅"
        />
        <StatCard 
          title="Draft" 
          value={sites.filter(s => s.status === 'draft').length}
          icon="📝"
        />
        <StatCard 
          title="Archived" 
          value={sites.filter(s => s.status === 'archived').length}
          icon="📦"
        />
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-3 gap-6">
        {sites.map(site => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>

      {sites.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No sites yet</p>
          <Link href="/admin/sites/new">
            <Button>Create Your First Site</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
```

### 3.3 Site Card Component

```typescript
// components/admin/SiteCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SiteMetadata } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  ExternalLink, 
  Settings, 
  Copy,
  Archive,
  Trash2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SiteCardProps {
  site: SiteMetadata;
}

export function SiteCard({ site }: SiteCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow">
      {/* Thumbnail/Logo */}
      <div className="h-40 bg-gradient-to-br from-blue-50 to-purple-50 rounded-t-lg relative">
        {site.logo ? (
          <Image 
            src={site.logo} 
            alt={site.name}
            fill
            className="object-contain p-8"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">🏥</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge className={statusColors[site.status]}>
            {site.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{site.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {site.description}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <span>{site.domain || site.id + '.vercel.app'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🗣️</span>
            <span>{site.locales.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span>{site.owner.name}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/admin/sites/${site.id}`} className="flex-1">
            <Button className="w-full" variant="default">
              Manage
            </Button>
          </Link>
          <a 
            href={`https://${site.domain || site.id + '.vercel.app'}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="icon">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
```

## 4. Create New Site

### 4.1 Site Creation Wizard

```typescript
// app/admin/sites/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSetupForm } from '@/components/admin/SiteSetupForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewSitePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [siteData, setSiteData] = useState({});

  const handleSubmit = async (data) => {
    try {
      const response = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const site = await response.json();
        router.push(`/admin/sites/${site.id}`);
      }
    } catch (error) {
      console.error('Failed to create site:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/sites">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Site</h1>
        <p className="text-gray-600 mt-2">
          Set up a new clinic website in minutes
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Localization' },
            { num: 3, label: 'Contact Details' },
            { num: 4, label: 'Theme' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${step >= s.num 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {s.num}
              </div>
              <span className={`ml-3 ${step >= s.num ? 'font-semibold' : ''}`}>
                {s.label}
              </span>
              {i < 3 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-8">
        <SiteSetupForm 
          step={step}
          data={siteData}
          onNext={(data) => {
            setSiteData({ ...siteData, ...data });
            if (step < 4) setStep(step + 1);
          }}
          onBack={() => setStep(step - 1)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
```

### 4.2 Site Setup Form Component

```typescript
// components/admin/SiteSetupForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const step1Schema = z.object({
  name: z.string().min(1, 'Site name is required'),
  id: z.string()
    .min(3, 'Site ID must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  domain: z.string().optional(),
});

const step2Schema = z.object({
  defaultLocale: z.string(),
  locales: z.array(z.string()).min(1),
});

const step3Schema = z.object({
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  address: z.string(),
});

const step4Schema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
});

interface SiteSetupFormProps {
  step: number;
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSubmit: (data: any) => void;
}

export function SiteSetupForm({ 
  step, 
  data, 
  onNext, 
  onBack, 
  onSubmit 
}: SiteSetupFormProps) {
  const schemas = [step1Schema, step2Schema, step3Schema, step4Schema];
  
  const form = useForm({
    resolver: zodResolver(schemas[step - 1]),
    defaultValues: data,
  });

  const handleNext = form.handleSubmit((formData) => {
    if (step === 4) {
      onSubmit({ ...data, ...formData });
    } else {
      onNext(formData);
    }
  });

  return (
    <form onSubmit={handleNext} className="space-y-6">
      {/* Step 1: Basic Info */}
      {step === 1 && (
        <>
          <div>
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              placeholder="Dr. Huang Clinic"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="id">Site ID (URL slug) *</Label>
            <Input
              id="id"
              placeholder="dr-huang-clinic"
              {...form.register('id')}
            />
            <p className="text-sm text-gray-500 mt-1">
              Will be used in URL: yourdomain.com/<strong>{form.watch('id') || 'site-id'}</strong>
            </p>
            {form.formState.errors.id && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.id.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Traditional Chinese Medicine & Acupuncture"
              {...form.register('description')}
            />
          </div>

          <div>
            <Label htmlFor="domain">Custom Domain (Optional)</Label>
            <Input
              id="domain"
              placeholder="drhuangclinic.com"
              {...form.register('domain')}
            />
          </div>
        </>
      )}

      {/* Step 2: Localization */}
      {step === 2 && (
        <>
          <div>
            <Label>Default Language *</Label>
            <Select 
              onValueChange={(value) => form.setValue('defaultLocale', value)}
              defaultValue={data.defaultLocale || 'en'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文 (Chinese)</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Supported Languages *</Label>
            <div className="space-y-2 mt-2">
              {['en', 'zh', 'es'].map(locale => (
                <label key={locale} className="flex items-center">
                  <input
                    type="checkbox"
                    value={locale}
                    {...form.register('locales')}
                    className="mr-2"
                  />
                  {locale === 'en' && 'English'}
                  {locale === 'zh' && '中文 (Chinese)'}
                  {locale === 'es' && 'Español (Spanish)'}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 3: Contact Details */}
      {step === 3 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input
                id="ownerName"
                placeholder="Dr. Wei Huang"
                {...form.register('ownerName')}
              />
            </div>
            <div>
              <Label htmlFor="ownerEmail">Owner Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="dr.huang@example.com"
                {...form.register('ownerEmail')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ownerPhone">Owner Phone</Label>
            <Input
              id="ownerPhone"
              placeholder="+1 (555) 123-4567"
              {...form.register('ownerPhone')}
            />
          </div>

          <hr className="my-6" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="appointments@clinic.com"
                {...form.register('contactEmail')}
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                placeholder="+1 (555) 123-4567"
                {...form.register('contactPhone')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Clinic Address *</Label>
            <Textarea
              id="address"
              placeholder="123 Main St, New York, NY 10001"
              {...form.register('address')}
            />
          </div>
        </>
      )}

      {/* Step 4: Theme */}
      {step === 4 && (
        <>
          <div>
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="primaryColor"
                type="color"
                className="w-20 h-12"
                {...form.register('primaryColor')}
              />
              <Input
                type="text"
                placeholder="#2B6CB0"
                {...form.register('primaryColor')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="secondaryColor"
                type="color"
                className="w-20 h-12"
                {...form.register('secondaryColor')}
              />
              <Input
                type="text"
                placeholder="#D69E2E"
                {...form.register('secondaryColor')}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Preview</h4>
            <div className="space-y-3">
              <div 
                className="p-4 rounded-lg text-white font-semibold"
                style={{ backgroundColor: form.watch('primaryColor') }}
              >
                Primary Color
              </div>
              <div 
                className="p-4 rounded-lg text-white font-semibold"
                style={{ backgroundColor: form.watch('secondaryColor') }}
              >
                Secondary Color
              </div>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={step === 1}
        >
          Back
        </Button>
        <Button type="submit">
          {step === 4 ? 'Create Site' : 'Next'}
        </Button>
      </div>
    </form>
  );
}
```

## 5. Site Manager Library

```typescript
// lib/admin/site-manager.ts
import fs from 'fs/promises';
import path from 'path';
import { SiteMetadata } from '@/lib/types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Get all sites (filtered by user permissions)
 */
export async function getAllSites(user: any): Promise<SiteMetadata[]> {
  const dirs = await fs.readdir(CONTENT_DIR);
  const sites: SiteMetadata[] = [];

  for (const dir of dirs) {
    // Skip non-directory files
    if (dir.startsWith('.') || dir.startsWith('_')) continue;

    const sitePath = path.join(CONTENT_DIR, dir, 'site.json');
    
    try {
      const content = await fs.readFile(sitePath, 'utf-8');
      const site: SiteMetadata = JSON.parse(content);
      
      // Filter by permissions
      if (canAccessSite(user, site)) {
        sites.push(site);
      }
    } catch (error) {
      console.error(`Failed to load site: ${dir}`, error);
    }
  }

  return sites.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single site by ID
 */
export async function getSite(siteId: string): Promise<SiteMetadata | null> {
  try {
    const sitePath = path.join(CONTENT_DIR, siteId, 'site.json');
    const content = await fs.readFile(sitePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Create a new site
 */
export async function createSite(data: Partial<SiteMetadata>): Promise<SiteMetadata> {
  const siteId = data.id!;
  const sitePath = path.join(CONTENT_DIR, siteId);

  // Check if site already exists
  const exists = await fs.access(sitePath).then(() => true).catch(() => false);
  if (exists) {
    throw new Error('Site already exists');
  }

  // Create directory structure
  await fs.mkdir(sitePath, { recursive: true });
  await fs.mkdir(path.join(sitePath, 'en', 'pages'), { recursive: true });
  await fs.mkdir(path.join(sitePath, 'zh', 'pages'), { recursive: true });

  // Create site.json
  const site: SiteMetadata = {
    ...data,
    id: siteId,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as SiteMetadata;

  await fs.writeFile(
    path.join(sitePath, 'site.json'),
    JSON.stringify(site, null, 2)
  );

  // Create default theme.json
  const defaultTheme = {
    colors: {
      primary: data.primaryColor || '#2B6CB0',
      secondary: data.secondaryColor || '#D69E2E',
      // ... other default colors
    },
  };

  await fs.writeFile(
    path.join(sitePath, 'theme.json'),
    JSON.stringify(defaultTheme, null, 2)
  );

  // Create default home.json
  const defaultHome = {
    hero: {
      variant: 'photo-background',
      clinicName: data.name,
      tagline: data.description || '',
      primaryCta: { text: 'Book Appointment', url: '/contact' },
      secondaryCta: { text: 'Learn More', url: '/about' },
    },
  };

  await fs.writeFile(
    path.join(sitePath, 'en', 'pages', 'home.json'),
    JSON.stringify(defaultHome, null, 2)
  );

  return site;
}

/**
 * Update site metadata
 */
export async function updateSite(
  siteId: string, 
  updates: Partial<SiteMetadata>
): Promise<SiteMetadata> {
  const site = await getSite(siteId);
  if (!site) throw new Error('Site not found');

  const updated = {
    ...site,
    ...updates,
    id: siteId, // Prevent ID change
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(CONTENT_DIR, siteId, 'site.json'),
    JSON.stringify(updated, null, 2)
  );

  return updated;
}

/**
 * Delete a site (moves to archive)
 */
export async function deleteSite(siteId: string): Promise<void> {
  const sitePath = path.join(CONTENT_DIR, siteId);
  const archivePath = path.join(CONTENT_DIR, '_archive', siteId);

  // Move to archive instead of deleting
  await fs.mkdir(path.join(CONTENT_DIR, '_archive'), { recursive: true });
  await fs.rename(sitePath, archivePath);
}

/**
 * Check if user can access site
 */
function canAccessSite(user: any, site: SiteMetadata): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'site_admin' && user.sites?.includes(site.id)) return true;
  return false;
}