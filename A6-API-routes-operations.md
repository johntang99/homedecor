# Admin Dashboard - API Routes for CRUD Operations

## 1. Overview

This document details all API routes required for Create, Read, Update, and Delete operations across the admin dashboard. All routes follow RESTful conventions and include proper authentication and authorization.

## 2. API Route Structure

```
app/api/admin/
├── auth/
│   ├── login/route.ts              # POST - Login
│   ├── logout/route.ts             # POST - Logout
│   └── session/route.ts            # GET - Current session
├── sites/
│   ├── route.ts                    # GET - List all, POST - Create
│   └── [siteId]/
│       ├── route.ts                # GET, PUT, DELETE - Site operations
│       ├── content/
│       │   ├── route.ts            # GET - List pages
│       │   └── [locale]/
│       │       └── [pageName]/
│       │           └── route.ts    # GET, PUT, DELETE - Page content
│       ├── images/
│       │   ├── route.ts            # GET - List, POST - Upload
│       │   └── [imageId]/
│       │       └── route.ts        # GET, PATCH, DELETE - Image ops
│       ├── theme/
│       │   └── route.ts            # GET, PUT - Theme config
│       └── settings/
│           └── route.ts            # GET, PUT - Site settings
└── users/
    ├── route.ts                    # GET - List, POST - Create
    └── [userId]/
        ├── route.ts                # GET, PUT, DELETE - User ops
        └── password/
            └── route.ts            # PUT - Change password
```

## 3. Sites API Routes

### 3.1 List All Sites

```typescript
// app/api/admin/sites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission } from '@/lib/admin/permissions';
import { getAllSites } from '@/lib/admin/site-manager';

/**
 * GET /api/admin/sites
 * List all sites (filtered by user permissions)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    requirePermission(session.user, 'sites.read');

    // Get sites
    const sites = await getAllSites(session.user);

    return NextResponse.json(sites);
  } catch (error: any) {
    console.error('Error listing sites:', error);
    
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sites
 * Create a new site
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    requirePermission(session.user, 'sites.create');

    // Get request body
    const data = await request.json();

    // Validate required fields
    if (!data.id || !data.name) {
      return NextResponse.json(
        { message: 'Site ID and name are required' },
        { status: 400 }
      );
    }

    // Create site
    const site = await createSite(data);

    // Log audit
    await logAudit({
      userId: session.user.id,
      action: 'CREATE_SITE',
      resource: site.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error: any) {
    console.error('Error creating site:', error);

    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    if (error.message === 'Site already exists') {
      return NextResponse.json(
        { message: 'Site ID already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.2 Single Site Operations

```typescript
// app/api/admin/sites/[siteId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { getSite, updateSite, deleteSite } from '@/lib/admin/site-manager';

/**
 * GET /api/admin/sites/[siteId]
 * Get a single site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'sites.read');
    requireSiteAccess(session.user, params.siteId);

    const site = await getSite(params.siteId);

    if (!site) {
      return NextResponse.json({ message: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/sites/[siteId]
 * Update a site
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'sites.update');
    requireSiteAccess(session.user, params.siteId);

    const updates = await request.json();
    const site = await updateSite(params.siteId, updates);

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE_SITE',
      resource: params.siteId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(site);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (error.message === 'Site not found') {
      return NextResponse.json({ message: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/sites/[siteId]
 * Delete (archive) a site
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'sites.delete');
    requireSiteAccess(session.user, params.siteId);

    await deleteSite(params.siteId);

    await logAudit({
      userId: session.user.id,
      action: 'DELETE_SITE',
      resource: params.siteId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

## 4. Content API Routes

### 4.1 List Pages

```typescript
// app/api/admin/sites/[siteId]/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { getPages } from '@/lib/admin/content-manager';

/**
 * GET /api/admin/sites/[siteId]/content
 * List all pages for all locales
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'content.read');
    requireSiteAccess(session.user, params.siteId);

    // Get locale from query parameter (optional)
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');

    if (locale) {
      const pages = await getPages(params.siteId, locale);
      return NextResponse.json({ [locale]: pages });
    }

    // Get all locales
    const site = await getSite(params.siteId);
    if (!site) {
      return NextResponse.json({ message: 'Site not found' }, { status: 404 });
    }

    const pagesByLocale: Record<string, any[]> = {};
    for (const loc of site.locales) {
      pagesByLocale[loc] = await getPages(params.siteId, loc);
    }

    return NextResponse.json(pagesByLocale);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

### 4.2 Page Content Operations

```typescript
// app/api/admin/sites/[siteId]/content/[locale]/[pageName]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { 
  getPageContent, 
  savePageContent, 
  deletePage 
} from '@/lib/admin/content-manager';

/**
 * GET /api/admin/sites/[siteId]/content/[locale]/[pageName]
 * Get page content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string; locale: string; pageName: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'content.read');
    requireSiteAccess(session.user, params.siteId);

    const content = await getPageContent(
      params.siteId,
      params.locale,
      params.pageName
    );

    if (!content) {
      return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/sites/[siteId]/content/[locale]/[pageName]
 * Update page content
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string; locale: string; pageName: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'content.update');
    requireSiteAccess(session.user, params.siteId);

    const content = await request.json();

    // Validate content against schema (optional)
    // const schema = await getPageSchema(params.pageName);
    // validateContent(content, schema);

    await savePageContent(
      params.siteId,
      params.locale,
      params.pageName,
      content
    );

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE_CONTENT',
      resource: `${params.siteId}/${params.locale}/${params.pageName}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/sites/[siteId]/content/[locale]/[pageName]
 * Delete a page
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string; locale: string; pageName: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'content.delete');
    requireSiteAccess(session.user, params.siteId);

    await deletePage(params.siteId, params.locale, params.pageName);

    await logAudit({
      userId: session.user.id,
      action: 'DELETE_CONTENT',
      resource: `${params.siteId}/${params.locale}/${params.pageName}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

## 5. Images API Routes

### 5.1 List and Upload Images

```typescript
// app/api/admin/sites/[siteId]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { getImages, uploadImage } from '@/lib/admin/image-manager';

/**
 * GET /api/admin/sites/[siteId]/images
 * List all images
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'images.read');
    requireSiteAccess(session.user, params.siteId);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const images = await getImages(params.siteId, category || undefined);

    return NextResponse.json(images);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/sites/[siteId]/images
 * Upload a new image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'images.upload');
    requireSiteAccess(session.user, params.siteId);

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';
    const alt = formData.get('alt') as string || '';

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPG, PNG, WebP, and SVG are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Upload and process image
    const imageMetadata = await uploadImage({
      siteId: params.siteId,
      file,
      category,
      alt,
      uploadedBy: session.user.id,
    });

    await logAudit({
      userId: session.user.id,
      action: 'UPLOAD_IMAGE',
      resource: `${params.siteId}/images/${imageMetadata.id}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(imageMetadata, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading image:', error);

    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

### 5.2 Single Image Operations

```typescript
// app/api/admin/sites/[siteId]/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { 
  getImage, 
  updateImageMetadata, 
  deleteImage 
} from '@/lib/admin/image-manager';

/**
 * GET /api/admin/sites/[siteId]/images/[imageId]
 * Get image metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string; imageId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'images.read');
    requireSiteAccess(session.user, params.siteId);

    const image = await getImage(params.siteId, params.imageId);

    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json(image);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/sites/[siteId]/images/[imageId]
 * Update image metadata (alt, title, category)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { siteId: string; imageId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'images.upload');
    requireSiteAccess(session.user, params.siteId);

    const updates = await request.json();

    const updatedImage = await updateImageMetadata(
      params.siteId,
      params.imageId,
      updates
    );

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE_IMAGE',
      resource: `${params.siteId}/images/${params.imageId}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updatedImage);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (error.message === 'Image not found') {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/sites/[siteId]/images/[imageId]
 * Delete an image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { siteId: string; imageId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'images.delete');
    requireSiteAccess(session.user, params.siteId);

    await deleteImage(params.siteId, params.imageId);

    await logAudit({
      userId: session.user.id,
      action: 'DELETE_IMAGE',
      resource: `${params.siteId}/images/${params.imageId}`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

## 6. Theme API Routes

```typescript
// app/api/admin/sites/[siteId]/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission, requireSiteAccess } from '@/lib/admin/permissions';
import { getTheme, updateTheme } from '@/lib/admin/theme-manager';

/**
 * GET /api/admin/sites/[siteId]/theme
 * Get theme configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'sites.read');
    requireSiteAccess(session.user, params.siteId);

    const theme = await getTheme(params.siteId);

    if (!theme) {
      return NextResponse.json({ message: 'Theme not found' }, { status: 404 });
    }

    return NextResponse.json(theme);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/sites/[siteId]/theme
 * Update theme configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'theme.update');
    requireSiteAccess(session.user, params.siteId);

    const themeData = await request.json();

    const updatedTheme = await updateTheme(params.siteId, themeData);

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE_THEME',
      resource: `${params.siteId}/theme`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updatedTheme);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions' || error.message === 'No access to this site') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

## 7. Users API Routes

```typescript
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { requirePermission } from '@/lib/admin/permissions';
import { getAllUsers, createUser } from '@/lib/admin/user-manager';

/**
 * GET /api/admin/users
 * List all users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'users.read');

    const users = await getAllUsers();

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    requirePermission(session.user, 'users.create');

    const { email, password, name, role, sites } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name, role, sites);

    await logAudit({
      userId: session.user.id,
      action: 'CREATE_USER',
      resource: user.id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (error.message === 'User already exists') {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}