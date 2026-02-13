'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SiteConfig } from '@/lib/types';
import { Button, Input } from '@/components/ui';
 
const siteSchemaBase = z.object({
  name: z.string().min(2, 'Name is required'),
  domain: z.string().optional(),
  enabled: z.boolean(),
  defaultLocale: z.enum(['en', 'es']),
  supportedLocales: z.array(z.enum(['en', 'es'])).min(1, 'Select at least one locale'),
});

const createSchema = siteSchemaBase.extend({
  id: z
    .string()
    .min(2, 'ID is required')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  cloneFrom: z.string().optional(),
});

type SiteFormData = z.infer<typeof siteSchemaBase>;
type SiteCreateFormData = z.infer<typeof createSchema>;
 
interface SiteFormProps {
  site: SiteConfig;
  mode?: 'edit' | 'create';
  sites?: SiteConfig[];
}

export function SiteForm({ site, mode = 'edit', sites = [] }: SiteFormProps) {
   const router = useRouter();
   const [status, setStatus] = useState<string | null>(null);
  const isCreate = mode === 'create';
 
  const form = useForm<SiteFormData | SiteCreateFormData>({
    resolver: zodResolver(isCreate ? createSchema : siteSchemaBase),
     defaultValues: {
      id: site.id,
       name: site.name,
       domain: site.domain || '',
       enabled: site.enabled,
       defaultLocale: site.defaultLocale,
       supportedLocales: site.supportedLocales,
      cloneFrom: '',
     },
   });
 
  const onSubmit = async (data: SiteFormData | SiteCreateFormData) => {
     setStatus(null);
    const request = isCreate
      ? fetch('/api/admin/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(data as SiteCreateFormData),
            domain: data.domain ? data.domain : undefined,
          }),
        })
      : fetch(`/api/admin/sites/${site.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            domain: data.domain ? data.domain : undefined,
          }),
        });

    const response = await request;
 
     if (!response.ok) {
       const payload = await response.json();
       setStatus(payload.message || 'Update failed');
       return;
     }
 
    if (isCreate) {
      const payload = await response.json();
      router.push(`/admin/sites/${payload.id}`);
      router.refresh();
      return;
    }

    setStatus('Saved');
    router.refresh();
   };
 
   const supported = form.watch('supportedLocales');
 
   return (
     <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
       {status && (
         <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700">
           {status}
         </div>
       )}
 
      {isCreate && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Site ID</label>
          <Input className="mt-1" {...form.register('id' as const)} placeholder="wewash" />
          <p className="text-xs text-gray-500 mt-1">
            Used for folder name and URLs. Lowercase letters, numbers, and hyphens only.
          </p>
          {(form.formState.errors as any)?.id && (
            <p className="text-sm text-red-600 mt-1">
              {(form.formState.errors as any).id?.message}
            </p>
          )}
        </div>
      )}

      {isCreate && sites.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Clone from</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...form.register('cloneFrom' as const)}
          >
            <option value="">No clone (empty site)</option>
            {sites.map((existing) => (
              <option key={existing.id} value={existing.id}>
                {existing.name} ({existing.id})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Copies the content folder from the selected site.
          </p>
        </div>
      )}

      <div>
         <label className="block text-sm font-medium text-gray-700">Site Name</label>
         <Input className="mt-1" {...form.register('name')} />
         {form.formState.errors.name && (
           <p className="text-sm text-red-600 mt-1">
             {form.formState.errors.name.message}
           </p>
         )}
       </div>
 
       <div>
         <label className="block text-sm font-medium text-gray-700">Domain</label>
         <Input className="mt-1" placeholder="example.com" {...form.register('domain')} />
         <p className="text-xs text-gray-500 mt-1">
           Optional. Used for multi-domain routing.
         </p>
       </div>
 
       <div className="flex items-center gap-3">
         <input
           id="enabled"
           type="checkbox"
           className="h-4 w-4 rounded border-gray-300"
           {...form.register('enabled')}
         />
         <label htmlFor="enabled" className="text-sm text-gray-700">
           Site is active
         </label>
       </div>
 
       <div>
         <label className="block text-sm font-medium text-gray-700">Default Locale</label>
         <select
           className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
           {...form.register('defaultLocale')}
         >
           <option value="en">English</option>
          <option value="es">Spanish</option>
         </select>
       </div>
 
       <div>
         <label className="block text-sm font-medium text-gray-700">Supported Locales</label>
         <div className="mt-2 flex gap-6">
          {(['en', 'es'] as const).map((locale) => (
             <label key={locale} className="flex items-center gap-2 text-sm text-gray-700">
               <input
                 type="checkbox"
                 className="h-4 w-4 rounded border-gray-300"
                 value={locale}
                 checked={supported.includes(locale)}
                 onChange={(event) => {
                   const next = event.target.checked
                     ? [...supported, locale]
                     : supported.filter((value) => value !== locale);
                   form.setValue('supportedLocales', next, { shouldValidate: true });
                 }}
               />
              {locale === 'en' ? 'English' : 'Spanish'}
             </label>
           ))}
         </div>
         {form.formState.errors.supportedLocales && (
           <p className="text-sm text-red-600 mt-1">
             {form.formState.errors.supportedLocales.message}
           </p>
         )}
       </div>
 
       <div className="flex items-center gap-3">
         <Button type="submit">Save Changes</Button>
         <button
           type="button"
           className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
           onClick={() => form.reset()}
         >
           Reset
         </button>
       </div>
     </form>
   );
 }
