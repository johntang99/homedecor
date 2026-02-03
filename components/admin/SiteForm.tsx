'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SiteConfig } from '@/lib/types';
import { Button, Input } from '@/components/ui';
 
 const siteSchema = z.object({
   name: z.string().min(2, 'Name is required'),
   domain: z.string().optional(),
   enabled: z.boolean(),
   defaultLocale: z.enum(['en', 'zh']),
   supportedLocales: z.array(z.enum(['en', 'zh'])).min(1, 'Select at least one locale'),
 });
 
 type SiteFormData = z.infer<typeof siteSchema>;
 
 interface SiteFormProps {
   site: SiteConfig;
 }
 
 export function SiteForm({ site }: SiteFormProps) {
   const router = useRouter();
   const [status, setStatus] = useState<string | null>(null);
 
   const form = useForm<SiteFormData>({
     resolver: zodResolver(siteSchema),
     defaultValues: {
       name: site.name,
       domain: site.domain || '',
       enabled: site.enabled,
       defaultLocale: site.defaultLocale,
       supportedLocales: site.supportedLocales,
     },
   });
 
   const onSubmit = async (data: SiteFormData) => {
     setStatus(null);
     const response = await fetch(`/api/admin/sites/${site.id}`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         ...data,
         domain: data.domain ? data.domain : undefined,
       }),
     });
 
     if (!response.ok) {
       const payload = await response.json();
       setStatus(payload.message || 'Update failed');
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
           <option value="zh">Chinese</option>
         </select>
       </div>
 
       <div>
         <label className="block text-sm font-medium text-gray-700">Supported Locales</label>
         <div className="mt-2 flex gap-6">
           {(['en', 'zh'] as const).map((locale) => (
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
               {locale === 'en' ? 'English' : 'Chinese'}
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
