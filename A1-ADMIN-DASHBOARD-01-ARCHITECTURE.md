# Admin Dashboard Architecture Overview

## 1. Introduction

This document outlines the architecture for building a comprehensive admin dashboard for the multi-site medical clinic CMS platform. The dashboard will allow administrators to manage multiple clinic sites, edit content, upload images, and customize themes through a web interface.

## 2. Current Architecture

### 2.1 Existing System
```
medical-clinic/chinese-medicine/
├── app/[locale]/              # Public-facing site
│   ├── layout.tsx             # Root layout with Header/Footer
│   ├── page.tsx               # Homepage
│   └── [other-pages]/
├── components/                # Reusable UI components
│   ├── sections/              # Page section components
│   └── ui/                    # Base UI components
├── lib/
│   ├── content.ts             # Content loading utilities
│   ├── i18n.ts                # Internationalization
│   └── types.ts               # TypeScript interfaces
├── content/
│   └── dr-huang-clinic/       # Site-specific content
│       ├── site.json          # Site configuration
│       ├── theme.json         # Theme variables
│       ├── en/pages/          # English content
│       └── zh/pages/          # Chinese content
└── public/uploads/            # Static assets
```

### 2.2 Current Content Management Method
- **Content**: Manually edit JSON files in `content/` directory
- **Images**: Manually place files in `public/uploads/` directory
- **Theme**: Manually edit `theme.json`
- **Deployment**: Git commit and push changes

### 2.3 Limitations
❌ No user interface for non-technical users  
❌ Requires direct file system access  
❌ No validation or preview before saving  
❌ Risk of breaking JSON syntax  
❌ No image optimization or management  
❌ No role-based access control  
❌ No audit trail or version history  

## 3. Proposed Admin Dashboard Architecture

### 3.1 High-Level Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Admin Dashboard                       │
│  /admin (Protected Route - Authentication Required)     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │  Sites  │      │ Content │      │ Images  │
   │ Manager │      │ Editor  │      │ Manager │
   └─────────┘      └─────────┘      └─────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                   ┌──────▼──────┐
                   │  API Routes  │
                   │  (Server)    │
                   └──────┬──────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ File    │      │ Content │      │  Image  │
   │ System  │      │ Database│      │ Storage │
   └─────────┘      └─────────┘      └─────────┘
```

### 3.2 Directory Structure
```
medical-clinic/chinese-medicine/
├── app/
│   ├── [locale]/              # Public site (existing)
│   ├── admin/                 # ← NEW: Admin dashboard
│   │   ├── layout.tsx         # Admin-specific layout
│   │   ├── page.tsx           # Dashboard home
│   │   ├── login/             # Authentication
│   │   │   └── page.tsx
│   │   ├── sites/             # Multi-site management
│   │   │   ├── page.tsx       # List all sites
│   │   │   ├── new/           # Create new site
│   │   │   │   └── page.tsx
│   │   │   └── [siteId]/      # Manage specific site
│   │   │       ├── page.tsx   # Site dashboard
│   │   │       ├── content/   # Content editor
│   │   │       │   ├── page.tsx            # Page list
│   │   │       │   └── [pageName]/         # Edit specific page
│   │   │       │       └── page.tsx
│   │   │       ├── images/    # Image manager
│   │   │       │   └── page.tsx
│   │   │       ├── theme/     # Theme editor
│   │   │       │   └── page.tsx
│   │   │       └── settings/  # Site settings
│   │   │           └── page.tsx
│   │   └── api/               # Admin API routes
│   │       ├── sites/
│   │       │   ├── route.ts                # GET, POST (list, create)
│   │       │   └── [siteId]/
│   │       │       ├── route.ts            # GET, PUT, DELETE
│   │       │       ├── content/
│   │       │       │   └── [pageName]/
│   │       │       │       └── route.ts    # CRUD for page content
│   │       │       ├── images/
│   │       │       │   └── route.ts        # Upload, list, delete
│   │       │       └── theme/
│   │       │           └── route.ts        # Update theme
│   │       └── auth/
│   │           ├── login/route.ts
│   │           ├── logout/route.ts
│   │           └── session/route.ts
│   └── api/                   # Public API (existing)
├── components/
│   ├── admin/                 # ← NEW: Admin UI components
│   │   ├── SiteSelector.tsx   # Multi-site dropdown
│   │   ├── ContentEditor.tsx  # JSON/Form editor
│   │   ├── ImageGallery.tsx   # Image browser
│   │   ├── ImageUploader.tsx  # Drag & drop uploader
│   │   ├── ThemeEditor.tsx    # Color/style editor
│   │   ├── PreviewPanel.tsx   # Live preview
│   │   └── Sidebar.tsx        # Admin navigation
│   ├── sections/              # Public sections (existing)
│   └── ui/                    # Shared UI (existing)
├── lib/
│   ├── admin/                 # ← NEW: Admin utilities
│   │   ├── auth.ts            # Authentication helpers
│   │   ├── session.ts         # Session management
│   │   ├── permissions.ts     # RBAC utilities
│   │   ├── file-manager.ts    # File CRUD operations
│   │   ├── content-manager.ts # Content CRUD operations
│   │   ├── image-optimizer.ts # Image processing
│   │   └── validation.ts      # Schema validation
│   ├── content.ts             # Public content loader (existing)
│   ├── i18n.ts                # i18n (existing)
│   └── types.ts               # Types (existing)
├── middleware.ts              # ← NEW: Auth & routing middleware
└── prisma/                    # ← NEW: Database (optional)
    └── schema.prisma          # User, Site, Audit models
```

## 4. Technology Stack

### 4.1 Frontend (Admin UI)
- **Framework**: Next.js 14+ with App Router (existing)
- **Language**: TypeScript
- **UI Library**: 
  - Option A: Shadcn/ui (recommended - already using some components)
  - Option B: Tailwind UI components
  - Option C: Headless UI + custom styling
- **Form Management**: 
  - React Hook Form + Zod validation
- **Rich Text Editor** (for blog posts):
  - TipTap or Lexical
- **File Upload**:
  - react-dropzone
- **State Management**:
  - React Query (TanStack Query) for server state
  - Zustand for client state (optional)

### 4.2 Backend (Admin API)
- **API Routes**: Next.js API routes (Route Handlers)
- **Authentication**:
  - Option A: NextAuth.js (Auth.js) - recommended
  - Option B: Clerk
  - Option C: Custom JWT implementation
- **File System Operations**: Node.js `fs/promises`
- **Image Processing**: 
  - Sharp (for optimization, resizing, format conversion)
- **Validation**: Zod schemas

### 4.3 Data Storage

#### Option 1: File-Based (Simpler - Recommended for MVP)
```
Pros:
✅ No database setup required
✅ Content already in JSON format
✅ Easy to version control (Git)
✅ Simple backup/restore
✅ Lower hosting costs

Cons:
❌ No complex queries
❌ Limited to filesystem permissions
❌ No built-in audit trail
❌ Concurrent write conflicts possible
```

**Storage:**
- Content: JSON files in `content/` directory (existing)
- Users: JSON file `content/_admin/users.json`
- Sessions: In-memory or Redis (optional)
- Images: File system in `public/uploads/`

#### Option 2: Hybrid (Database + Files)
```
Pros:
✅ Rich user management
✅ Audit trail and versioning
✅ Better concurrent access
✅ Advanced querying
✅ Role-based permissions

Cons:
❌ More complex setup
❌ Database hosting required
❌ Need migration strategy
```

**Storage:**
- Users, Sessions, Audit Logs: PostgreSQL/MySQL via Prisma
- Content: Still JSON files (for portability)
- Images: File system with metadata in database

#### Option 3: Full Database (Future Scale)
```
Pros:
✅ All benefits of Option 2
✅ Real-time collaboration
✅ Complex workflows
✅ Content versioning

Cons:
❌ Most complex
❌ Need to migrate existing JSON content
❌ Lose Git-based version control
```

**Recommendation**: Start with **Option 1** (File-Based) for MVP, design architecture to allow migration to Option 2 later.

## 5. Component Architecture

### 5.1 Admin Layout Pattern
```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <TopBar />
        
        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### 5.2 Page Component Pattern
```typescript
// app/admin/sites/[siteId]/content/[pageName]/page.tsx
export default async function EditPageContent({ params }) {
  // Server-side data loading
  const content = await loadPageContent(params.pageName, params.siteId);
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Editor */}
      <ContentEditor 
        content={content}
        schema={pageSchemas[params.pageName]}
      />
      
      {/* Right: Live Preview */}
      <PreviewPanel 
        page={params.pageName}
        content={content}
      />
    </div>
  );
}
```

### 5.3 API Route Pattern
```typescript
// app/api/admin/sites/[siteId]/content/[pageName]/route.ts
export async function GET(request, { params }) {
  // 1. Authenticate
  const session = await getSession(request);
  if (!session) return unauthorized();
  
  // 2. Check permissions
  if (!canRead(session.user, params.siteId)) return forbidden();
  
  // 3. Load data
  const content = await loadContent(params.siteId, params.pageName);
  
  // 4. Return response
  return NextResponse.json(content);
}

export async function PUT(request, { params }) {
  // 1. Authenticate
  const session = await getSession(request);
  if (!session) return unauthorized();
  
  // 2. Check permissions
  if (!canWrite(session.user, params.siteId)) return forbidden();
  
  // 3. Validate input
  const body = await request.json();
  const validated = contentSchema.parse(body);
  
  // 4. Save data
  await saveContent(params.siteId, params.pageName, validated);
  
  // 5. Log audit
  await logAudit(session.user, 'UPDATE', params);
  
  // 6. Return response
  return NextResponse.json({ success: true });
}
```

## 6. Data Flow

### 6.1 Read Flow (Displaying Content in Editor)
```
User navigates to edit page
        │
        ▼
Admin Page Component (Server)
        │
        ├─> Verify authentication
        ├─> Check permissions
        └─> Load content from JSON
        │
        ▼
Render Editor Component (Client)
        │
        └─> User makes edits
```

### 6.2 Write Flow (Saving Content)
```
User clicks "Save" in editor
        │
        ▼
Client-side validation (Zod)
        │
        ▼
POST to API route
        │
        ▼
API Route (Server)
        │
        ├─> Verify authentication
        ├─> Check permissions
        ├─> Validate data (Zod)
        ├─> Backup existing file
        ├─> Write JSON to filesystem
        ├─> Log audit trail
        └─> Return success
        │
        ▼
Update UI (React Query cache)
        │
        └─> Show success message
```

### 6.3 Image Upload Flow
```
User drags image to upload area
        │
        ▼
Client validates (size, type)
        │
        ▼
FormData POST to /api/admin/images
        │
        ▼
API Route (Server)
        │
        ├─> Verify authentication
        ├─> Check file type/size
        ├─> Generate unique filename
        ├─> Optimize image (Sharp)
        │   ├─> Resize if too large
        │   ├─> Convert to WebP
        │   └─> Generate thumbnails
        ├─> Save to /public/uploads/
        ├─> Update image registry
        └─> Return image URL
        │
        ▼
Display in image gallery
```

## 7. Security Architecture

### 7.1 Authentication Layers
```
┌─────────────────────────────────────┐
│  1. Middleware                      │
│     - Check if /admin route         │
│     - Verify session exists         │
│     - Redirect to login if not      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  2. API Route Guards                │
│     - Verify JWT/session token      │
│     - Check user permissions        │
│     - Rate limiting                 │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  3. Resource-Level Permissions      │
│     - Check user.role               │
│     - Verify site ownership         │
│     - Enforce RBAC rules            │
└─────────────────────────────────────┘
```

### 7.2 Role-Based Access Control (RBAC)
```typescript
// User Roles
type Role = 'super_admin' | 'site_admin' | 'editor' | 'viewer';

// Permissions Matrix
const permissions = {
  super_admin: {
    sites: ['create', 'read', 'update', 'delete'],
    content: ['create', 'read', 'update', 'delete'],
    images: ['upload', 'read', 'delete'],
    theme: ['update'],
    users: ['create', 'read', 'update', 'delete'],
  },
  site_admin: {
    sites: ['read', 'update'], // Only their sites
    content: ['create', 'read', 'update', 'delete'],
    images: ['upload', 'read', 'delete'],
    theme: ['update'],
    users: ['read'], // Read only
  },
  editor: {
    sites: ['read'],
    content: ['read', 'update'], // Can edit, not delete
    images: ['upload', 'read'],
    theme: [], // No access
    users: [], // No access
  },
  viewer: {
    sites: ['read'],
    content: ['read'],
    images: ['read'],
    theme: [],
    users: [],
  },
};
```

### 7.3 File System Security
```typescript
// Prevent path traversal attacks
function sanitizePath(userInput: string): string {
  // Remove ../ attempts
  const clean = userInput.replace(/\.\./g, '');
  
  // Ensure within allowed directory
  const basePath = path.join(process.cwd(), 'content');
  const fullPath = path.join(basePath, clean);
  
  if (!fullPath.startsWith(basePath)) {
    throw new Error('Invalid path');
  }
  
  return fullPath;
}

// Whitelist allowed file operations
const ALLOWED_DIRS = [
  'content/',
  'public/uploads/',
];

const ALLOWED_EXTENSIONS = {
  content: ['.json'],
  images: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
};
```

## 8. Performance Considerations

### 8.1 Optimization Strategies
- **Image Optimization**: Automatically resize, compress, and convert to WebP
- **Lazy Loading**: Load large content editors only when needed
- **Debounced Saves**: Auto-save with debouncing to prevent excessive writes
- **Preview Caching**: Cache preview renders to avoid re-renders
- **React Query**: Automatic caching and background refetching

### 8.2 Scalability
- **File-based storage**: Works well up to ~100 sites
- **CDN for images**: Serve uploads from CDN (Cloudinary, Vercel Blob)
- **Edge caching**: Cache public content at edge
- **Database migration path**: Design to allow future DB migration

## 9. Development Phases

### Phase 1: MVP (Week 1-2)
- [ ] Basic authentication (login/logout)
- [ ] Single site content editor (JSON form)
- [ ] Image uploader (basic)
- [ ] Simple preview panel

### Phase 2: Multi-Site (Week 3-4)
- [ ] Site selector/switcher
- [ ] Site creation wizard
- [ ] Site-level permissions
- [ ] Theme editor

### Phase 3: Enhanced Features (Week 5-6)
- [ ] Rich text editor for blog posts
- [ ] Image optimization pipeline
- [ ] Audit trail/activity log
- [ ] User management

### Phase 4: Polish (Week 7-8)
- [ ] Advanced preview (responsive, locale switching)
- [ ] Bulk operations
- [ ] Import/export functionality
- [ ] Documentation

## 10. Next Steps

To proceed with implementation, we need to:

1. **Choose authentication method** (NextAuth.js recommended)
2. **Design database schema** (if using Option 2/3)
3. **Create admin layout and navigation**
4. **Build API routes for content CRUD**
5. **Implement content editor UI**
6. **Add image upload functionality**
7. **Create theme editor**

---

**Ready to proceed to Document #2: Multi-Client Site Management?**
