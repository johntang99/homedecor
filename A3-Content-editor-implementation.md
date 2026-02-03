# Admin Dashboard - Content Editor Implementation

## 1. Overview

This document details how to implement the content editor for managing JSON-based page content. The editor provides both a user-friendly form interface and a raw JSON editor for advanced users.

## 2. Content Editor Architecture

### 2.1 Two-Mode Editor System

```
┌─────────────────────────────────────────┐
│         Content Editor Page             │
└─────────────────────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼─────┐         ┌──────▼──────┐
│   Form    │         │    JSON     │
│   Mode    │ ←──────→│    Mode     │
│ (Visual)  │  Toggle │   (Raw)     │
└───────────┘         └─────────────┘
      │                       │
      └───────────┬───────────┘
                  │
         ┌────────▼────────┐
         │  Live Preview   │
         │  (Side Panel)   │
         └─────────────────┘
```

### 2.2 Content Structure

```typescript
// lib/types.ts
export interface PageContent {
  [sectionName: string]: any;
}

export interface ContentSchema {
  type: 'object';
  properties: {
    [key: string]: SchemaProperty;
  };
  required?: string[];
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  items?: SchemaProperty;
  properties?: {
    [key: string]: SchemaProperty;
  };
}
```

## 3. Content Editor Page

### 3.1 Main Editor Page

```typescript
// app/admin/sites/[siteId]/content/page.tsx
import { getSession } from '@/lib/admin/auth';
import { getSite } from '@/lib/admin/site-manager';
import { getPages } from '@/lib/admin/content-manager';
import { redirect } from 'next/navigation';
import { PageList } from '@/components/admin/PageList';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function SiteContentPage({ 
  params 
}: { 
  params: { siteId: string } 
}) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const site = await getSite(params.siteId);
  if (!site) redirect('/admin/sites');

  // Get all pages for all locales
  const pagesByLocale = await Promise.all(
    site.locales.map(async (locale) => ({
      locale,
      pages: await getPages(params.siteId, locale),
    }))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-gray-600 mt-2">
            Manage pages for {site.name}
          </p>
        </div>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Tabs for Locales */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {site.locales.map((locale) => (
              <a
                key={locale}
                href={`#${locale}`}
                className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium"
              >
                {locale === 'en' && '🇺🇸 English'}
                {locale === 'zh' && '🇨🇳 中文'}
                {locale === 'es' && '🇪🇸 Español'}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Pages Grid */}
      {pagesByLocale.map(({ locale, pages }) => (
        <div key={locale} id={locale} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {locale === 'en' && 'English Pages'}
            {locale === 'zh' && '中文页面'}
            {locale === 'es' && 'Páginas en Español'}
          </h2>
          
          <div className="grid grid-cols-4 gap-4">
            {pages.map((page) => (
              <Link
                key={page.name}
                href={`/admin/sites/${params.siteId}/content/${locale}/${page.name}`}
              >
                <div className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <FileText className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-1">{page.title}</h3>
                  <p className="text-sm text-gray-500">
                    Last edited: {new Date(page.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3.2 Individual Page Editor

```typescript
// app/admin/sites/[siteId]/content/[locale]/[pageName]/page.tsx
import { getSession } from '@/lib/admin/auth';
import { getPageContent } from '@/lib/admin/content-manager';
import { getPageSchema } from '@/lib/admin/schemas';
import { redirect } from 'next/navigation';
import { ContentEditorClient } from '@/components/admin/ContentEditorClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function EditPageContent({ 
  params 
}: { 
  params: { 
    siteId: string;
    locale: string;
    pageName: string;
  } 
}) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  // Load page content
  const content = await getPageContent(
    params.siteId, 
    params.locale, 
    params.pageName
  );

  // Load schema for validation
  const schema = await getPageSchema(params.pageName);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/sites/${params.siteId}/content`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {params.pageName.charAt(0).toUpperCase() + params.pageName.slice(1)} Page
            </h1>
            <p className="text-sm text-gray-500">
              {params.locale.toUpperCase()} • {params.siteId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href={`/${params.locale}/${params.pageName === 'home' ? '' : params.pageName}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </a>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ContentEditorClient
          siteId={params.siteId}
          locale={params.locale}
          pageName={params.pageName}
          initialContent={content}
          schema={schema}
        />
      </div>
    </div>
  );
}
```

## 4. Content Editor Component

### 4.1 Main Editor Client Component

```typescript
// components/admin/ContentEditorClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateZodSchema } from '@/lib/admin/validation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormEditor } from './FormEditor';
import { JsonEditor } from './JsonEditor';
import { PreviewPanel } from './PreviewPanel';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ContentEditorClientProps {
  siteId: string;
  locale: string;
  pageName: string;
  initialContent: any;
  schema: any;
}

export function ContentEditorClient({
  siteId,
  locale,
  pageName,
  initialContent,
  schema,
}: ContentEditorClientProps) {
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const { toast } = useToast();

  const zodSchema = generateZodSchema(schema);
  
  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: content,
  });

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [form.formState.isDirty]);

  const saveDraft = async () => {
    const data = form.getValues();
    localStorage.setItem(
      `draft-${siteId}-${locale}-${pageName}`,
      JSON.stringify(data)
    );
    toast({
      title: 'Draft saved',
      description: 'Your changes are saved locally',
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const data = form.getValues();
      
      const response = await fetch(
        `/api/admin/sites/${siteId}/content/${locale}/${pageName}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error('Failed to save');

      // Clear draft
      localStorage.removeItem(`draft-${siteId}-${locale}-${pageName}`);
      
      form.reset(data);
      setContent(data);

      toast({
        title: 'Saved successfully',
        description: 'Your changes have been published',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.reset(initialContent);
    setContent(initialContent);
    localStorage.removeItem(`draft-${siteId}-${locale}-${pageName}`);
  };

  return (
    <div className="flex h-full">
      {/* Editor Panel */}
      <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r overflow-y-auto`}>
        <div className="p-6">
          {/* Mode Toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="form">Form Editor</TabsTrigger>
              <TabsTrigger value="json">JSON Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="mt-6">
              <FormEditor
                schema={schema}
                form={form}
                onChange={(data) => setContent(data)}
              />
            </TabsContent>

            <TabsContent value="json" className="mt-6">
              <JsonEditor
                content={content}
                schema={schema}
                onChange={(data) => {
                  setContent(data);
                  form.reset(data);
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t pt-4 mt-8 flex gap-3">
            <Button 
              onClick={handleSave} 
              disabled={saving || !form.formState.isDirty}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!form.formState.isDirty}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <PreviewPanel
            siteId={siteId}
            locale={locale}
            pageName={pageName}
            content={content}
          />
        </div>
      )}
    </div>
  );
}
```

### 4.2 Form Editor Component

```typescript
// components/admin/FormEditor.tsx
'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface FormEditorProps {
  schema: any;
  form: UseFormReturn<any>;
  onChange: (data: any) => void;
}

export function FormEditor({ schema, form, onChange }: FormEditorProps) {
  const { register, watch, setValue } = form;

  // Watch all values for live updates
  const values = watch();

  // Update parent when form changes
  React.useEffect(() => {
    onChange(values);
  }, [values, onChange]);

  const renderField = (name: string, field: any, path: string = '') => {
    const fullPath = path ? `${path}.${name}` : name;
    const value = watch(fullPath);

    switch (field.type) {
      case 'string':
        if (field.enum) {
          // Dropdown for enums
          return (
            <div key={fullPath} className="mb-4">
              <Label htmlFor={fullPath}>{field.title || name}</Label>
              {field.description && (
                <p className="text-sm text-gray-500 mb-2">{field.description}</p>
              )}
              <Select
                value={value}
                onValueChange={(v) => setValue(fullPath, v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.enum.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        } else if (field.format === 'textarea') {
          // Textarea for long text
          return (
            <div key={fullPath} className="mb-4">
              <Label htmlFor={fullPath}>{field.title || name}</Label>
              {field.description && (
                <p className="text-sm text-gray-500 mb-2">{field.description}</p>
              )}
              <Textarea
                id={fullPath}
                {...register(fullPath)}
                rows={4}
              />
            </div>
          );
        } else {
          // Regular input
          return (
            <div key={fullPath} className="mb-4">
              <Label htmlFor={fullPath}>{field.title || name}</Label>
              {field.description && (
                <p className="text-sm text-gray-500 mb-2">{field.description}</p>
              )}
              <Input
                id={fullPath}
                type={field.format === 'url' ? 'url' : 'text'}
                {...register(fullPath)}
              />
            </div>
          );
        }

      case 'number':
        return (
          <div key={fullPath} className="mb-4">
            <Label htmlFor={fullPath}>{field.title || name}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <Input
              id={fullPath}
              type="number"
              {...register(fullPath, { valueAsNumber: true })}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={fullPath} className="mb-4 flex items-center justify-between">
            <div>
              <Label htmlFor={fullPath}>{field.title || name}</Label>
              {field.description && (
                <p className="text-sm text-gray-500">{field.description}</p>
              )}
            </div>
            <Switch
              id={fullPath}
              checked={value}
              onCheckedChange={(checked) => setValue(fullPath, checked)}
            />
          </div>
        );

      case 'array':
        return (
          <div key={fullPath} className="mb-6">
            <Label>{field.title || name}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 mb-3">{field.description}</p>
            )}
            
            <div className="space-y-3">
              {(value || []).map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Item {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newArray = [...value];
                        newArray.splice(index, 1);
                        setValue(fullPath, newArray);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  
                  {field.items?.type === 'object' ? (
                    Object.entries(field.items.properties || {}).map(([key, prop]: [string, any]) =>
                      renderField(key, prop, `${fullPath}.${index}`)
                    )
                  ) : (
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newArray = [...value];
                        newArray[index] = e.target.value;
                        setValue(fullPath, newArray);
                      }}
                    />
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={() => {
                  const newItem = field.items?.type === 'object' 
                    ? {} 
                    : '';
                  setValue(fullPath, [...(value || []), newItem]);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        );

      case 'object':
        return (
          <Accordion key={fullPath} type="single" collapsible className="mb-4">
            <AccordionItem value={name}>
              <AccordionTrigger>
                {field.title || name}
              </AccordionTrigger>
              <AccordionContent className="pl-4">
                {field.description && (
                  <p className="text-sm text-gray-500 mb-4">{field.description}</p>
                )}
                {Object.entries(field.properties || {}).map(([key, prop]: [string, any]) =>
                  renderField(key, prop, fullPath)
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {Object.entries(schema.properties || {}).map(([name, field]: [string, any]) =>
        renderField(name, field)
      )}
    </div>
  );
}
```

### 4.3 JSON Editor Component

```typescript
// components/admin/JsonEditor.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JsonEditorProps {
  content: any;
  schema: any;
  onChange: (data: any) => void;
}

export function JsonEditor({ content, schema, onChange }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(content, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setJsonText(value);
    setError(null);

    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid JSON: {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-3 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {error ? (
            <span className="flex items-center text-red-600">
              <X className="w-4 h-4 mr-1" />
              Invalid JSON
            </span>
          ) : (
            <span className="flex items-center text-green-600">
              <Check className="w-4 h-4 mr-1" />
              Valid JSON
            </span>
          )}
        </span>
        
        <Button variant="outline" size="sm" onClick={formatJson}>
          Format JSON
        </Button>
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-[600px] font-mono text-sm p-4 border rounded-lg bg-gray-50"
        spellCheck={false}
      />
    </div>
  );
}
```

### 4.4 Preview Panel Component

```typescript
// components/admin/PreviewPanel.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface PreviewPanelProps {
  siteId: string;
  locale: string;
  pageName: string;
  content: any;
}

export function PreviewPanel({
  siteId,
  locale,
  pageName,
  content,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const deviceSizes = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto',
  };

  const previewUrl = `/${locale}/${pageName === 'home' ? '' : pageName}?preview=true`;

  return (
    <div className="h-full flex flex-col">
      {/* Device Toggle */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={device === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="w-4 h-4" />
          </Button>
          <Button
            variant={device === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={device === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        <span className="text-sm text-gray-600">
          Live Preview
        </span>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-auto p-6 bg-gray-100">
        <div className={`${deviceSizes[device]} transition-all duration-300`}>
          <iframe
            src={previewUrl}
            className="w-full h-full bg-white rounded-lg shadow-lg border"
            style={{ minHeight: '800px' }}
          />
        </div>
      </div>
    </div>
  );
}
```

## 5. Content Manager Library

```typescript
// lib/admin/content-manager.ts
import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Get all pages for a site/locale
 */
export async function getPages(siteId: string, locale: string) {
  const pagesDir = path.join(CONTENT_DIR, siteId, locale, 'pages');
  
  try {
    const files = await fs.readdir(pagesDir);
    const pages = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(pagesDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          
          return {
            name: file.replace('.json', ''),
            title: data.hero?.clinicName || file.replace('.json', ''),
            updatedAt: stats.mtime.toISOString(),
          };
        })
    );
    
    return pages;
  } catch (error) {
    return [];
  }
}

/**
 * Get page content
 */
export async function getPageContent(
  siteId: string,
  locale: string,
  pageName: string
): Promise<any> {
  const filePath = path.join(
    CONTENT_DIR,
    siteId,
    locale,
    'pages',
    `${pageName}.json`
  );
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Save page content
 */
export async function savePageContent(
  siteId: string,
  locale: string,
  pageName: string,
  content: any
): Promise<void> {
  const filePath = path.join(
    CONTENT_DIR,
    siteId,
    locale,
    'pages',
    `${pageName}.json`
  );
  
  // Backup existing file
  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    const backupPath = filePath.replace('.json', `.backup.${Date.now()}.json`);
    await fs.writeFile(backupPath, existing);
  } catch (error) {
    // No existing file, skip backup
  }
  
  // Save new content
  await fs.writeFile(
    filePath,
    JSON.stringify(content, null, 2),
    'utf-8'
  );
}

/**
 * Delete page
 */
export async function deletePage(
  siteId: string,
  locale: string,
  pageName: string
): Promise<void> {
  const filePath = path.join(
    CONTENT_DIR,
    siteId,
    locale,
    'pages',
    `${pageName}.json`
  );
  
  await fs.unlink(filePath);
}