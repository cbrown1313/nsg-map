

# Admin Area for Map Data Management

## What's Needed

The map data (clinic locations, state statuses, URLs) is currently hardcoded in TypeScript files. To make it editable by an admin, you need three things: a **database** to store the data, **authentication** to protect the admin area, and an **admin UI** to manage the data.

## Architecture

```text
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│  Public Map  │◄─────│  Supabase DB │◄─────│  Admin UI  │
│  (read-only) │      │  + RLS       │      │  (authed)  │
└─────────────┘      └──────────────┘      └────────────┘
```

## Components

### 1. Backend (Lovable Cloud / Supabase)
- **`clinic_locations` table** — stores each clinic's name, city, state, slug, external URL, and SVG coordinates
- **`state_configs` table** — stores each state's tier (licensed / psypact / none / excluded), whether it has clinics, and whether it's license-only
- **`user_roles` table** — stores admin role assignments (per security best practices, roles are never stored on the profile table)
- **Row-Level Security (RLS)** — public read access for the map; write access restricted to admin role via a `has_role()` security-definer function

### 2. Authentication
- Email/password login for admin users (Supabase Auth)
- Admin role checked server-side via `user_roles` table
- No public signup — admin accounts created manually or via invite

### 3. Admin UI (new pages)
- **Login page** at `/admin` — email/password form
- **Dashboard** at `/admin/dashboard` with two tabs:
  - **Locations** — table listing all clinics with inline edit/add/delete (name, city, state, URL, SVG coordinates)
  - **State Configuration** — table of all 50 states + DC with dropdown to set tier, checkbox for clinic/license-only flags
- Protected by auth check — redirects to login if not authenticated or not admin
- Requires adding `react-router-dom` back for `/admin` routes (public map stays at `/`)

### 4. Public Map Changes
- `USMap` and `MapLegend` fetch data from Supabase instead of importing hardcoded constants
- Data cached with React Query (already installed) for performance
- Fallback to current hardcoded data if fetch fails (graceful degradation)

## Database Schema

- **`clinic_locations`**: id, name, city, state, slug, external_url, svg_x, svg_y, created_at, updated_at
- **`state_configs`**: state_code (PK), tier (enum: licensed/psypact/none/excluded), has_clinic, is_license_only, created_at, updated_at
- **`user_roles`**: id, user_id (FK → auth.users), role (enum: admin/user)

## Estimated Scope

This is a meaningful expansion — roughly 8-12 files to create/modify:
- 3 database migrations (tables + RLS + seed data)
- 1 security-definer function for role checks
- 4-5 new React components (login, admin layout, locations editor, states editor)
- 2-3 modified files (USMap, MapLegend, App.tsx)
- Re-add react-router-dom for admin routing

## Security Measures
- RLS on all tables — public can only SELECT; only admins can INSERT/UPDATE/DELETE
- Admin role verified server-side via `has_role()` function (never client-side localStorage)
- JWT validation on all write operations
- Input validation with Zod on admin forms

