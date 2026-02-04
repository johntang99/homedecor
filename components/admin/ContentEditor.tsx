'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale, SiteConfig } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui';
import { CONTENT_TEMPLATES } from '@/lib/admin/templates';
import { ImagePickerModal } from '@/components/admin/ImagePickerModal';

interface ContentFileItem {
  id: string;
  label: string;
  path: string;
  scope: 'locale' | 'site';
  publishDate?: string;
}

interface ContentEditorProps {
  sites: SiteConfig[];
  selectedSiteId: string;
  selectedLocale: string;
  initialFilePath?: string;
  fileFilter?: 'all' | 'blog';
  titleOverride?: string;
  basePath?: string;
}

export function ContentEditor({
  sites,
  selectedSiteId,
  selectedLocale,
  initialFilePath,
  fileFilter = 'all',
  titleOverride,
  basePath = '/admin/content',
}: ContentEditorProps) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [locale, setLocale] = useState<Locale>(selectedLocale as Locale);
  const [files, setFiles] = useState<ContentFileItem[]>([]);
  const [activeFile, setActiveFile] = useState<ContentFileItem | null>(null);
  const [content, setContent] = useState('');
  const [formData, setFormData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageFieldPath, setImageFieldPath] = useState<string[] | null>(null);
  const [markdownPreview, setMarkdownPreview] = useState<Record<string, boolean>>({});
  const filesTitle = fileFilter === 'blog' ? 'Blog Posts' : 'Files';

  const site = useMemo(
    () => sites.find((item) => item.id === siteId),
    [sites, siteId]
  );

  useEffect(() => {
    if (!site) return;
    if (!site.supportedLocales.includes(locale)) {
      setLocale(site.defaultLocale);
    }
  }, [site, locale]);

  useEffect(() => {
    if (!siteId || !locale) return;
    const params = new URLSearchParams({ siteId, locale });
    router.replace(`${basePath}?${params.toString()}`);
  }, [router, siteId, locale, basePath]);

  const loadFiles = async (preferredPath?: string) => {
    if (!siteId || !locale) return;
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/admin/content/files?siteId=${siteId}&locale=${locale}`
      );
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Failed to load files');
      }
      const payload = await response.json();
      let nextFiles: ContentFileItem[] = payload.files || [];
      if (fileFilter === 'blog') {
        nextFiles = nextFiles.filter((file) => file.path.startsWith('blog/'));
        nextFiles = [...nextFiles].sort((a, b) =>
          (b.publishDate || '').localeCompare(a.publishDate || '')
        );
      } else {
        nextFiles = nextFiles.filter((file) => !file.path.startsWith('blog/'));
      }
      setFiles(nextFiles);
      if (preferredPath) {
        const matched = nextFiles.find((file) => file.path === preferredPath);
        setActiveFile(matched || nextFiles[0] || null);
      } else {
        setActiveFile(nextFiles[0] || null);
      }
    } catch (error: any) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(initialFilePath);
  }, [siteId, locale, initialFilePath, fileFilter]);

  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setStatus(null);
    fetch(
      `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
        activeFile.path
      )}`
    )
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message || 'Failed to load content');
        }
        return response.json();
      })
      .then((payload) => {
        const nextContent = payload.content || '';
        setContent(nextContent);
        try {
          setFormData(JSON.parse(nextContent));
        } catch (error) {
          setFormData(null);
        }
      })
      .catch((error) => setStatus(error.message))
      .finally(() => setLoading(false));
  }, [activeFile, siteId, locale]);

  const handleSave = async () => {
    setStatus(null);
    if (!activeFile) return;
    try {
      JSON.parse(content);
    } catch (error) {
      setStatus('Invalid JSON. Please fix before saving.');
      return;
    }

    const response = await fetch('/api/admin/content/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        path: activeFile.path,
        content,
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Save failed');
      return;
    }

    setStatus('Saved');
  };

  const handleCreate = async () => {
    const isBlog = fileFilter === 'blog';
    const slug = window.prompt(
      isBlog ? 'New blog slug (example: my-post)' : 'New page slug (example: faq)'
    );
    if (!slug) return;
    const templateId =
      window.prompt(
        `Template: ${CONTENT_TEMPLATES.map((t) => t.id).join(', ')}`,
        CONTENT_TEMPLATES[0]?.id || 'basic'
      ) || CONTENT_TEMPLATES[0]?.id;
    const response = await fetch('/api/admin/content/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        action: 'create',
        slug,
        templateId,
        targetDir: isBlog ? 'blog' : 'pages',
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Create failed');
      return;
    }

    const payload = await response.json();
    await loadFiles(payload.path);
  };

  const handleDuplicate = async () => {
    if (!activeFile) return;
    const isBlog = activeFile.path.startsWith('blog/');
    const slug = window.prompt(
      isBlog
        ? 'Duplicate blog slug (example: my-post-copy)'
        : 'Duplicate page slug (example: faq-copy)'
    );
    if (!slug) return;
    const response = await fetch('/api/admin/content/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        locale,
        action: 'duplicate',
        path: activeFile.path,
        slug,
        targetDir: isBlog ? 'blog' : 'pages',
      }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Duplicate failed');
      return;
    }

    const payload = await response.json();
    await loadFiles(payload.path);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setFormData(parsed);
      setStatus('Formatted');
    } catch (error) {
      setStatus('Invalid JSON. Unable to format.');
    }
  };

  const handleDelete = async () => {
    if (!activeFile) return;
    const confirmed = window.confirm(`Delete ${activeFile.path}? This cannot be undone.`);
    if (!confirmed) return;
    const response = await fetch(
      `/api/admin/content/file?siteId=${siteId}&locale=${locale}&path=${encodeURIComponent(
        activeFile.path
      )}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.message || 'Delete failed');
      return;
    }
    await loadFiles();
  };

  const getPreviewPath = () => {
    if (!activeFile) return `/${locale}`;
    if (activeFile.path.startsWith('pages/')) {
      const slug = activeFile.path.replace('pages/', '').replace('.json', '');
      if (slug === 'home') return `/${locale}`;
      return `/${locale}/${slug}`;
    }
    return `/${locale}`;
  };

  const updateFormValue = (path: string[], value: any) => {
    if (!formData) return;
    const next = { ...formData };
    let cursor: any = next;
    path.forEach((key, index) => {
      if (index === path.length - 1) {
        cursor[key] = value;
      } else {
        cursor[key] = cursor[key] ?? {};
        cursor = cursor[key];
      }
    });
    setFormData(next);
    setContent(JSON.stringify(next, null, 2));
  };

  const openImagePicker = (path: string[]) => {
    setImageFieldPath(path);
    setShowImagePicker(true);
  };

  const handleImageSelect = (url: string) => {
    if (!imageFieldPath) return;
    updateFormValue(imageFieldPath, url);
  };

  const toggleMarkdownPreview = (key: string) => {
    setMarkdownPreview((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const normalizeMarkdown = (text: string) =>
    text
      .replace(/\r\n/g, '\n')
      .replace(/([^\n])\n-\s+/g, '$1\n\n- ')
      .replace(/([^\n])\n\*\s+/g, '$1\n\n- ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {titleOverride || 'Content Editor'}
          </h1>
          <p className="text-sm text-gray-600">
            Select a site and locale to edit JSON content files.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <label className="block text-xs font-medium text-gray-500">Site</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={siteId}
              onChange={(event) => {
                setSiteId(event.target.value);
              }}
            >
              {sites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Locale</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {(site?.supportedLocales || ['en']).map((item) => (
                <option key={item} value={item}>
                  {item === 'en' ? 'English' : 'Chinese'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
            {filesTitle}
          </div>
          {loading && files.length === 0 ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    activeFile?.id === file.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{file.label}</div>
                  <div className="text-xs opacity-70">{file.path}</div>
                  {fileFilter === 'blog' && file.publishDate && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      {new Date(file.publishDate).toLocaleDateString(
                        locale === 'zh' ? 'zh-CN' : 'en-US',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </div>
                  )}
                </button>
              ))}
              {files.length === 0 && (
                <div className="text-sm text-gray-500">
                  {fileFilter === 'blog'
                    ? 'No blog posts found for this locale.'
                    : 'No content files found for this locale.'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {activeFile?.label || 'Select a file'}
              </div>
              <div className="text-xs text-gray-500">{activeFile?.path}</div>
            </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(getPreviewPath(), '_blank')}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
          >
            {fileFilter === 'blog' ? 'New Post' : 'New Page'}
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={!activeFile}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleFormat}
            disabled={!activeFile}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Format
          </button>
          {activeFile &&
            (activeFile.path.startsWith('pages/') ||
              activeFile.path.startsWith('blog/')) && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          <Button onClick={handleSave} disabled={!activeFile}>
            Save
          </Button>
        </div>
          </div>

          {status && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {status}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 rounded-md text-xs ${
                activeTab === 'form'
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-gray-200 text-gray-700'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-md text-xs ${
                activeTab === 'json'
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-gray-200 text-gray-700'
              }`}
            >
              JSON
            </button>
          </div>

          {activeTab === 'form' ? (
            <div className="space-y-6 text-sm">
              {!formData && (
                <div className="text-sm text-gray-500">
                  Invalid JSON. Switch to JSON tab to fix.
                </div>
              )}

              {formData?.hero && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Hero
                  </div>
                  {'title' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Title</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.title || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'title'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'subtitle' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Subtitle</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.subtitle || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'subtitle'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'clinicName' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Clinic Name</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.clinicName || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'clinicName'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'tagline' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Tagline</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.tagline || ''}
                        onChange={(event) =>
                          updateFormValue(['hero', 'tagline'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'description' in formData.hero && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">
                        Description
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.hero.description || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['hero', 'description'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {'backgroundImage' in formData.hero && (
                    <div>
                      <label className="block text-xs text-gray-500">
                        Background Image
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.hero.backgroundImage || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['hero', 'backgroundImage'],
                              event.target.value
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['hero', 'backgroundImage'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  )}
                  {'image' in formData.hero && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500">Image</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          value={formData.hero.image || ''}
                          onChange={(event) =>
                            updateFormValue(['hero', 'image'], event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() => openImagePicker(['hero', 'image'])}
                          className="px-3 rounded-md border border-gray-200 text-xs"
                        >
                          Choose
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData?.introduction && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Introduction
                  </div>
                  {'text' in formData.introduction && (
                    <div>
                      <label className="block text-xs text-gray-500">Text</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.introduction.text || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['introduction', 'text'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {formData?.cta && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    CTA
                  </div>
                  {'title' in formData.cta && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">Title</label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.cta.title || ''}
                        onChange={(event) =>
                          updateFormValue(['cta', 'title'], event.target.value)
                        }
                      />
                    </div>
                  )}
                  {'description' in formData.cta && (
                    <div className="mb-3">
                      <label className="block text-xs text-gray-500">
                        Description
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        value={formData.cta.description || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'description'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {formData.cta?.primaryCta && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Primary CTA</div>
                      <input
                        className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Text"
                        value={formData.cta.primaryCta.text || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'primaryCta', 'text'],
                            event.target.value
                          )
                        }
                      />
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Link"
                        value={formData.cta.primaryCta.link || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'primaryCta', 'link'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                  {formData.cta?.secondaryCta && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Secondary CTA</div>
                      <input
                        className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Text"
                        value={formData.cta.secondaryCta.text || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'secondaryCta', 'text'],
                            event.target.value
                          )
                        }
                      />
                      <input
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Link"
                        value={formData.cta.secondaryCta.link || ''}
                        onChange={(event) =>
                          updateFormValue(
                            ['cta', 'secondaryCta', 'link'],
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(formData?.services) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Services
                  </div>
                  <div className="space-y-4">
                    {formData.services.map((service: any, index: number) => (
                      <div key={service.id || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {service.title || `Service ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Title"
                          value={service.title || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['services', String(index), 'title'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Short description"
                          value={service.shortDescription || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['services', String(index), 'shortDescription'],
                              event.target.value
                            )
                          }
                        />
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Image"
                            value={service.image || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['services', String(index), 'image'],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openImagePicker(['services', String(index), 'image'])
                            }
                            className="px-3 rounded-md border border-gray-200 text-xs"
                          >
                            Choose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(formData?.conditions) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Conditions
                  </div>
                  <div className="space-y-4">
                    {formData.conditions.map((condition: any, index: number) => (
                      <div key={condition.id || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {condition.title || `Condition ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Title"
                          value={condition.title || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'title'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Description"
                          value={condition.description || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['conditions', String(index), 'description'],
                              event.target.value
                            )
                          }
                        />
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Image"
                            value={condition.image || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['conditions', String(index), 'image'],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openImagePicker(['conditions', String(index), 'image'])
                            }
                            className="px-3 rounded-md border border-gray-200 text-xs"
                          >
                            Choose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(formData?.caseStudies) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Case Studies
                  </div>
                  <div className="space-y-4">
                    {formData.caseStudies.map((item: any, index: number) => (
                      <div key={item.id || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {item.condition || `Case ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Condition"
                          value={item.condition || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['caseStudies', String(index), 'condition'],
                              event.target.value
                            )
                          }
                        />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Summary (Markdown)</span>
                        <button
                          type="button"
                          onClick={() =>
                            toggleMarkdownPreview(`caseStudies-${index}-summary`)
                          }
                          className="text-xs text-gray-600 hover:text-gray-900"
                        >
                          {markdownPreview[`caseStudies-${index}-summary`]
                            ? 'Edit'
                            : 'Preview'}
                        </button>
                      </div>
                      {markdownPreview[`caseStudies-${index}-summary`] ? (
                        <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                          <ReactMarkdown
                            components={{
                              ul: (props) => <ul className="list-disc pl-5" {...props} />,
                              ol: (props) => (
                                <ol className="list-decimal pl-5" {...props} />
                              ),
                              li: (props) => <li className="mb-1" {...props} />,
                            }}
                          >
                            {normalizeMarkdown(item.summary || '')}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Summary (Markdown supported)"
                          value={item.summary || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['caseStudies', String(index), 'summary'],
                              event.target.value
                            )
                          }
                        />
                      )}
                        <div className="grid gap-2 md:grid-cols-3">
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Image"
                              value={item.image || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['caseStudies', String(index), 'image'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker(['caseStudies', String(index), 'image'])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Before image"
                              value={item.beforeImage || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['caseStudies', String(index), 'beforeImage'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker([
                                  'caseStudies',
                                  String(index),
                                  'beforeImage',
                                ])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              placeholder="After image"
                              value={item.afterImage || ''}
                              onChange={(event) =>
                                updateFormValue(
                                  ['caseStudies', String(index), 'afterImage'],
                                  event.target.value
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker([
                                  'caseStudies',
                                  String(index),
                                  'afterImage',
                                ])
                              }
                              className="px-3 rounded-md border border-gray-200 text-xs"
                            >
                              Choose
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.featuredPost && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Featured Post
                  </div>
                  <input
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Title"
                    value={formData.featuredPost.title || ''}
                    onChange={(event) =>
                      updateFormValue(['featuredPost', 'title'], event.target.value)
                    }
                  />
                  <textarea
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Excerpt"
                    value={formData.featuredPost.excerpt || ''}
                    onChange={(event) =>
                      updateFormValue(['featuredPost', 'excerpt'], event.target.value)
                    }
                  />
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Image"
                      value={formData.featuredPost.image || ''}
                      onChange={(event) =>
                        updateFormValue(['featuredPost', 'image'], event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker(['featuredPost', 'image'])}
                      className="px-3 rounded-md border border-gray-200 text-xs"
                    >
                      Choose
                    </button>
                  </div>
                </div>
              )}

              {Array.isArray(formData?.posts) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Blog Posts
                  </div>
                  <div className="space-y-4">
                    {formData.posts.map((post: any, index: number) => (
                      <div key={post.slug || index} className="border rounded-md p-3">
                        <div className="text-xs text-gray-500 mb-2">
                          {post.title || `Post ${index + 1}`}
                        </div>
                        <input
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Title"
                          value={post.title || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['posts', String(index), 'title'],
                              event.target.value
                            )
                          }
                        />
                        <textarea
                          className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Excerpt"
                          value={post.excerpt || ''}
                          onChange={(event) =>
                            updateFormValue(
                              ['posts', String(index), 'excerpt'],
                              event.target.value
                            )
                          }
                        />
                        <div className="flex gap-2">
                          <input
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Image"
                            value={post.image || ''}
                            onChange={(event) =>
                              updateFormValue(
                                ['posts', String(index), 'image'],
                                event.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openImagePicker(['posts', String(index), 'image'])
                            }
                            className="px-3 rounded-md border border-gray-200 text-xs"
                          >
                            Choose
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData?.slug && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Blog Article
                  </div>
                  <input
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Title"
                    value={formData.title || ''}
                    onChange={(event) => updateFormValue(['title'], event.target.value)}
                  />
                  <textarea
                    className="mb-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Excerpt"
                    value={formData.excerpt || ''}
                    onChange={(event) => updateFormValue(['excerpt'], event.target.value)}
                  />
                  <div className="flex gap-2 mb-2">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Image"
                      value={formData.image || ''}
                      onChange={(event) => updateFormValue(['image'], event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => openImagePicker(['image'])}
                      className="px-3 rounded-md border border-gray-200 text-xs"
                    >
                      Choose
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Author"
                      value={formData.author || ''}
                      onChange={(event) => updateFormValue(['author'], event.target.value)}
                    />
                    <input
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Publish Date (YYYY-MM-DD)"
                      value={formData.publishDate || ''}
                      onChange={(event) =>
                        updateFormValue(['publishDate'], event.target.value)
                      }
                    />
                  </div>
                  <input
                    className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Category"
                    value={formData.category || ''}
                    onChange={(event) => updateFormValue(['category'], event.target.value)}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      id="featured"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={Boolean(formData.featured)}
                      onChange={(event) =>
                        updateFormValue(['featured'], event.target.checked)
                      }
                    />
                    <label htmlFor="featured" className="text-sm text-gray-700">
                      Featured article
                    </label>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Body (Markdown)</span>
                      <button
                        type="button"
                        onClick={() => toggleMarkdownPreview('blog-article-body')}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        {markdownPreview['blog-article-body'] ? 'Edit' : 'Preview'}
                      </button>
                    </div>
                    {markdownPreview['blog-article-body'] ? (
                      <div className="prose prose-sm max-w-none rounded-md border border-gray-200 px-3 py-2">
                        <ReactMarkdown
                          components={{
                            ul: (props) => <ul className="list-disc pl-5" {...props} />,
                            ol: (props) => (
                              <ol className="list-decimal pl-5" {...props} />
                            ),
                            li: (props) => <li className="mb-1" {...props} />,
                          }}
                        >
                          {normalizeMarkdown(formData.contentMarkdown || '')}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        className="w-full min-h-[220px] rounded-md border border-gray-200 px-3 py-2 text-sm"
                        placeholder="Write the article body in Markdown"
                        value={formData.contentMarkdown || ''}
                        onChange={(event) =>
                          updateFormValue(['contentMarkdown'], event.target.value)
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {formData && !formData.hero && !formData.introduction && !formData.cta && (
                <div className="text-sm text-gray-500">
                  No schema panels available for this file yet. Use the JSON tab.
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="w-full min-h-[520px] rounded-lg border border-gray-200 p-3 font-mono text-xs text-gray-800"
              value={content}
              onChange={(event) => {
                const next = event.target.value;
                setContent(next);
                try {
                  setFormData(JSON.parse(next));
                } catch (error) {
                  setFormData(null);
                }
              }}
              placeholder="Select a file to begin editing."
            />
          )}
        </div>
      </div>
      <ImagePickerModal
        open={showImagePicker}
        siteId={siteId}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
      />
    </div>
  );
}
