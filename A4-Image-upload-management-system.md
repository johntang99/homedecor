# Admin Dashboard - Image Upload & Management System

## 1. Overview

This document details how to implement a comprehensive image management system with upload, optimization, organization, and delivery features for the admin dashboard.

## 2. Image Management Architecture

### 2.1 System Flow

```
┌─────────────────────────────────────────┐
│         User Uploads Image              │
│     (Drag & Drop / File Picker)         │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Client-Side Validation             │
│  - File type (jpg, png, webp, svg)      │
│  - File size (max 10MB)                 │
│  - Image dimensions                     │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Upload to API Route               │
│      POST /api/admin/images             │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Server-Side Processing             │
│  1. Validate file                       │
│  2. Generate unique filename            │
│  3. Optimize image (Sharp)              │
│  4. Generate thumbnails                 │
│  5. Convert to WebP                     │
│  6. Save to filesystem                  │
│  7. Update image registry               │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Return Image URLs                  │
│  - Original URL                         │
│  - Optimized URL                        │
│  - Thumbnail URL                        │
└─────────────────────────────────────────┘
```

### 2.2 File Storage Structure

```
public/uploads/
├── dr-huang-clinic/              # Site-specific folder
│   ├── hero/                     # Organized by usage
│   │   ├── hero-bg.jpg
│   │   ├── hero-bg.webp
│   │   └── hero-bg-thumb.webp
│   ├── gallery/
│   │   ├── clinic-front.jpg
│   │   ├── clinic-front.webp
│   │   └── clinic-front-thumb.webp
│   ├── team/
│   │   ├── dr-huang.jpg
│   │   └── dr-huang.webp
│   └── blog/
│       ├── article-1-hero.jpg
│       └── article-1-hero.webp
├── dr-chen-acupuncture/
│   ├── hero/
│   ├── gallery/
│   └── services/
└── _temp/                        # Temporary uploads
    └── pending-upload-123.jpg
```

### 2.3 Image Registry (Metadata Database)

```typescript
// lib/types.ts
export interface ImageMetadata {
  id: string;                    // Unique ID (UUID)
  siteId: string;                // Which site owns this image
  filename: string;              // Original filename
  path: string;                  // Relative path from /uploads
  url: string;                   // Public URL
  thumbnailUrl?: string;         // Thumbnail URL
  webpUrl?: string;              // WebP version URL
  category: string;              // hero, gallery, team, blog, etc.
  alt: string;                   // Alt text for accessibility
  title?: string;                // Optional title
  width: number;                 // Image width in pixels
  height: number;                // Image height in pixels
  size: number;                  // File size in bytes
  mimeType: string;              // image/jpeg, image/png, etc.
  uploadedBy: string;            // User ID who uploaded
  uploadedAt: string;            // ISO timestamp
  usedIn: string[];              // Pages/sections using this image
}
```

**Storage Format: `content/{siteId}/images.json`**
```json
{
  "images": [
    {
      "id": "img_abc123",
      "siteId": "dr-huang-clinic",
      "filename": "hero-background.jpg",
      "path": "/uploads/dr-huang-clinic/hero/hero-bg.jpg",
      "url": "/uploads/dr-huang-clinic/hero/hero-bg.webp",
      "thumbnailUrl": "/uploads/dr-huang-clinic/hero/hero-bg-thumb.webp",
      "webpUrl": "/uploads/dr-huang-clinic/hero/hero-bg.webp",
      "category": "hero",
      "alt": "Dr. Huang Clinic entrance",
      "width": 1920,
      "height": 1080,
      "size": 245678,
      "mimeType": "image/jpeg",
      "uploadedBy": "admin@example.com",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "usedIn": ["home.hero.image"]
    }
  ]
}
```

## 3. Image Gallery Page

### 3.1 Gallery Page Implementation

```typescript
// app/admin/sites/[siteId]/images/page.tsx
import { getSession } from '@/lib/admin/auth';
import { getSite } from '@/lib/admin/site-manager';
import { getImages } from '@/lib/admin/image-manager';
import { redirect } from 'next/navigation';
import { ImageGalleryClient } from '@/components/admin/ImageGalleryClient';
import { Button } from '@/components/ui/button';
import { Upload, FolderPlus } from 'lucide-react';

export default async function SiteImagesPage({
  params,
}: {
  params: { siteId: string };
}) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const site = await getSite(params.siteId);
  if (!site) redirect('/admin/sites');

  const images = await getImages(params.siteId);

  // Group images by category
  const imagesByCategory = images.reduce((acc, img) => {
    if (!acc[img.category]) acc[img.category] = [];
    acc[img.category].push(img);
    return acc;
  }, {} as Record<string, typeof images>);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Images</h1>
          <p className="text-gray-600 mt-2">
            Manage images for {site.name}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            <FolderPlus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Images"
          value={images.length}
          icon="🖼️"
        />
        <StatCard
          title="Total Size"
          value={formatBytes(images.reduce((sum, img) => sum + img.size, 0))}
          icon="💾"
        />
        <StatCard
          title="Hero"
          value={imagesByCategory.hero?.length || 0}
          icon="🎯"
        />
        <StatCard
          title="Gallery"
          value={imagesByCategory.gallery?.length || 0}
          icon="📸"
        />
        <StatCard
          title="Blog"
          value={imagesByCategory.blog?.length || 0}
          icon="📝"
        />
      </div>

      {/* Image Gallery */}
      <ImageGalleryClient
        siteId={params.siteId}
        images={images}
        categories={Object.keys(imagesByCategory)}
      />
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

### 3.2 Image Gallery Client Component

```typescript
// components/admin/ImageGalleryClient.tsx
'use client';

import { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageCard } from './ImageCard';
import { ImageDetailModal } from './ImageDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid3x3, List, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ImageGalleryClientProps {
  siteId: string;
  images: any[];
  categories: string[];
}

export function ImageGalleryClient({
  siteId,
  images: initialImages,
  categories,
}: ImageGalleryClientProps) {
  const [images, setImages] = useState(initialImages);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  // Filter images
  const filteredImages = images
    .filter(img => {
      const matchesSearch = 
        img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.alt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        selectedCategory === 'all' || img.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return b.size - a.size;
        default:
          return 0;
      }
    });

  const handleUploadSuccess = (newImages: any[]) => {
    setImages([...newImages, ...images]);
    setShowUploader(false);
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/admin/sites/${siteId}/images/${imageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(images.filter(img => img.id !== imageId));
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleUpdate = async (imageId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updated = await response.json();
        setImages(images.map(img => img.id === imageId ? updated : img));
        setSelectedImage(updated);
      }
    } catch (error) {
      console.error('Failed to update image:', error);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="size">Sort by Size</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload Button */}
          <Button onClick={() => setShowUploader(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <ImageUploader
          siteId={siteId}
          onSuccess={handleUploadSuccess}
          onClose={() => setShowUploader(false)}
        />
      )}

      {/* Images Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-4">
          {filteredImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer ${
                index !== 0 ? 'border-t' : ''
              }`}
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.alt}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h4 className="font-semibold">{image.filename}</h4>
                <p className="text-sm text-gray-500">{image.alt}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>{image.width} × {image.height}</p>
                <p>{formatBytes(image.size)}</p>
              </div>
              <div className="text-sm text-gray-600">
                {image.category}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredImages.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No images found</p>
          <Button onClick={() => setShowUploader(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload First Image
          </Button>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

## 4. Image Upload Component

### 4.1 Image Uploader

```typescript
// components/admin/ImageUploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  siteId: string;
  onSuccess: (images: any[]) => void;
  onClose: () => void;
}

export function ImageUploader({ siteId, onSuccess, onClose }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});
  const [category, setCategory] = useState('general');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    
    // Initialize status for new files
    const newStatus: Record<string, 'pending'> = {};
    acceptedFiles.forEach(file => {
      newStatus[file.name] = 'pending';
    });
    setUploadStatus(prev => ({ ...prev, ...newStatus }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
    const newStatus = { ...uploadStatus };
    delete newStatus[fileName];
    setUploadStatus(newStatus);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];

    for (const file of files) {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('siteId', siteId);

        // Simulate progress (in real app, use XMLHttpRequest for real progress)
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          if (progress >= 90) clearInterval(progressInterval);
        }, 200);

        const response = await fetch(`/api/admin/sites/${siteId}/images`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        if (!response.ok) throw new Error('Upload failed');

        const imageData = await response.json();
        uploadedImages.push(imageData);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
      }
    }

    setUploading(false);
    
    // Close after 1 second if all successful
    if (uploadedImages.length === files.length) {
      setTimeout(() => {
        onSuccess(uploadedImages);
      }, 1000);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero Images</SelectItem>
                <SelectItem value="gallery">Gallery</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the images here...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, WebP, SVG (max 10MB each)
                </p>
              </>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Preview */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>

                    {/* Progress */}
                    {uploadStatus[file.name] === 'uploading' && (
                      <Progress 
                        value={uploadProgress[file.name] || 0} 
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Status Icon */}
                  <div>
                    {uploadStatus[file.name] === 'pending' && !uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {uploadStatus[file.name] === 'uploading' && (
                      <div className="text-blue-600">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                    {uploadStatus[file.name] === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {uploadStatus[file.name] === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} image(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.2 Image Card Component

```typescript
// components/admin/ImageCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';

interface ImageCardProps {
  image: any;
  onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-white rounded-lg border hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-video relative bg-gray-100">
        <Image
          src={image.thumbnailUrl || image.url}
          alt={image.alt}
          fill
          className="object-cover"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyUrl}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </>
            )}
          </Button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary">
            {image.category}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-semibold truncate mb-1">{image.filename}</h4>
        <p className="text-sm text-gray-500 truncate">{image.alt}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{image.width} × {image.height}</span>
          <span>{formatBytes(image.size)}</span>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}