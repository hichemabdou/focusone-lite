# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build production bundle
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

### Tech Stack
- **Next.js 16** with App Router (React 19, TypeScript 5)
- **NextAuth.js** for authentication (Google OAuth + credentials)
- **Supabase PostgreSQL** for multi-user data persistence
- **Client-side rendering** for main workspace features
- **Hybrid storage**: API for authenticated users, localStorage for guests
- **CSS Modules** via globals.css with BEM-style naming

### Authentication & Backend
- **NextAuth.js** with JWT sessions (OPTIONAL - only needed for cloud sync)
  - Google OAuth provider (one-click sign-in) - configured when env vars present
  - Credentials provider (email/password) - configured when Supabase is set up
- **Supabase PostgreSQL** for multi-user data persistence (OPTIONAL)
  - Row Level Security (RLS) - users only see their own data
  - RESTful API endpoints for CRUD operations
- **Middleware** (middleware.ts) - **Allows unauthenticated access** - authentication is optional
- **Hybrid Storage Strategy** (automatic):
  - **Authenticated users**: Data synced to Supabase via API
  - **Guest users**: LocalStorage (works out-of-the-box, no setup needed)

### Environment Variables (Optional for Guest Mode)

**For guest mode (localStorage only)**: No environment variables required! A minimal `.env.local` is included with placeholder values.

**For authenticated mode with cloud sync**:
```bash
# Supabase (required for cloud sync)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# NextAuth (included with placeholders)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret  # Generate with: openssl rand -base64 32

# Google OAuth (optional - for Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

See `SETUP_AUTHENTICATION.md` for detailed authentication setup instructions.

### Context Providers (app/layout.tsx)
Four global contexts wrap the application in this order:
1. **SessionProvider** - NextAuth session management
2. **ThemeProvider** - Dark/light mode switching
3. **CustomizationProvider** - User-defined categories, priorities, statuses (syncs to API if authenticated)
4. **GoalsProvider** - Goals data, filtering, CRUD operations (syncs to API if authenticated)

### Routes
- `/` → redirects to `/classic`
- `/auth/login` - Authentication page (optional - only shown if auth configured)
- `/auth/signup` - User registration page (optional - only shown if auth configured)
- `/classic` - Main workspace (timeline + goals list) **[open to all - works in guest mode]**
- `/dashboard` - Analytics/dashboard view with charts **[open to all - works in guest mode]**
- `/review` - Quarterly review interface **[open to all - works in guest mode]**

**Note**: All routes work without authentication. Authentication is optional for cloud sync features.

## API Routes

All routes require authentication (except `/api/auth/*`). Returns JSON responses.

### Authentication
- `POST /api/auth/signup` - User registration (email/password)
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers (login, OAuth, sessions)

### Goals
- `GET /api/goals` - List all user's goals
- `POST /api/goals` - Create new goal
- `PATCH /api/goals/[id]` - Update goal
- `DELETE /api/goals/[id]` - Delete goal
- `POST /api/goals/[id]/comments` - Add comment to goal
- `DELETE /api/goals/[id]/comments/[commentId]` - Delete comment

### Customizations
- `GET /api/customizations` - Get user's categories, priorities, statuses
- `PUT /api/customizations` - Update categories/priorities/statuses

### Notifications
- `POST /api/notifications/send-test` - Send test notification

### Field Mapping (API ↔ Frontend)
API uses snake_case (database convention), frontend uses camelCase:

| Frontend      | API/Database   |
|---------------|----------------|
| startDate     | start_date     |
| endDate       | end_date       |
| userId        | user_id        |
| createdAt     | created_at     |
| updatedAt     | updated_at     |

Conversion handled by `dbGoalToFrontend()` helper in GoalsContext.tsx.

## Core Data Models

### Goal Structure (GoalsContext.tsx)
```typescript
type Goal = {
  id: string;
  title: string;
  startDate: string;  // ISO yyyy-mm-dd
  endDate: string;
  category: string;   // Dynamic, user-customizable
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "blocked" | "done";
  notes?: string;
  milestone?: Milestone | null;
  comments: GoalComment[];
}
```

### Milestone System
Two milestone types integrated into Timeline component:

1. **Point milestones**: Specific date markers with icons
   - `{ type: "point", date: string, label: string, color: string, icon: string }`
   - Render as vertical markers with pulsing animations
   - Click to edit directly in timeline

2. **Window milestones**: Date range overlays
   - `{ type: "window", startDate: string, endDate: string, label: string, color: string }`
   - Render as colored background overlays in timeline
   - Click to edit directly in timeline

**Important**: Milestones appear WITHIN the timeline visualization, not as external lists. The timeline integrity must be preserved.

## Key Components

### Timeline.tsx
The centerpiece visualization component:
- Renders goals as horizontal bars across time periods
- Supports month/quarter views with dynamic date ranges
- Integrates both point and window milestones
- Inline editing: click goals or milestones to edit
- Three density modes: cozy, balanced, compact
- Uses percentage-based positioning for responsive layout

### GoalsContext.tsx
Central state management with filtering:
- **Authenticated**: Fetches from `/api/goals`, syncs CRUD operations to API
- **Guest**: Loads/persists from localStorage (`focusone_goals_v1`)
- `visibleGoals` computed from filters (categories, priorities, statuses, query)
- Provides CRUD operations and comment management
- Export/import JSON functionality
- Auto-detects session state and switches storage strategy

### CustomizationContext.tsx
User-defined taxonomy:
- **Authenticated**: Fetches from `/api/customizations`, syncs to API
- **Guest**: Loads/persists from localStorage (`focusone_customization_v1`)
- Categories: Default `["STRATEGY", "VISION", "TACTICAL", "PROJECT", "DAILY"]`
- Each has customizable name and color
- Accessed via `useCustomization()` hook

### ClassicClient.tsx
Main workspace layout:
- Header with search, nav, theme toggle, settings
- GoalFilters + GoalsList (left/scrollable)
- Timeline (main visualization)
- Control center dropdown (import/export, customization)
- Opens modals: IntegrationsModal, CustomizationPanel

### Dashboard Components

The `/dashboard` route includes analytics visualizations:

- **BurndownChart.tsx** - Circular progress chart showing goal completion rate
- **TrendChart.tsx** - Time-series visualization of goal trends over time
- **HeatMap.tsx** - Activity heatmap showing goal progress patterns
- **FocusDistribution.tsx** - Pie/donut chart of goals by category
- **VelocityMetric.tsx** - Goal completion velocity metrics and trends
- **CategoryRadar.tsx** - Radar chart showing category distribution

All dashboard components consume data from `useGoals()` and `useCustomization()` hooks.

## Important Patterns

### Authentication Patterns

**Checking Auth Status:**
```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
const isAuthenticated = status === "authenticated";
const userId = session?.user?.id;
```

**Context Providers Auto-Detect:**
```typescript
// GoalsContext and CustomizationContext automatically detect session
const { status } = useSession();
const isAuthenticated = status === "authenticated";

if (isAuthenticated) {
  // Use API endpoints
  await fetch("/api/goals", { ... });
} else {
  // Use localStorage
  localStorage.setItem("focusone_goals_v1", ...);
}
```

**Guest Mode Architecture:**
- Middleware allows unauthenticated access to all pages
- Context providers automatically detect session state
- When unauthenticated: localStorage mode activates
- When authenticated: API sync mode activates
- No manual mode switching needed in components

### Color System
- Categories, priorities, statuses all have customizable colors
- Timeline uses `hexToRgba()` utility for gradients and overlays
- CSS custom properties in globals.css: `--cat-strategy`, `--st-open`, etc.

### Modal Management
- Most editors are modal-based: GoalEditor, MilestoneCreator, MilestoneEditor
- Use `<Modal>` component wrapper from components/Modal.tsx
- Custom events for cross-component communication (e.g., `openCustomizationPanel`)

### Date Handling
Timeline.tsx includes utilities:
- `parseISO()` - Parse "yyyy-mm-dd" strings to Date objects
- `startOfMonth()`, `endOfMonth()`, `addMonths()` - Date calculations
- All dates stored as ISO strings in goals data

### CSS Conventions
- BEM-style naming: `.timeline__milestone-marker`, `.workspace__masthead`
- Modifier classes: `.timeline__milestone--editable`, `.chip--on`
- Responsive with media queries (see `.workspace__masthead` @ ~2076-2103)

## Visual Design Philosophy

Focus.One emphasizes:
- **Elegant, polished UI** with gradients, shadows, animations
- **Timeline-first** approach - timeline is sacred, don't shrink it
- **Direct manipulation** - click elements in timeline to edit
- **Subtle animations** - pulse effects, hover transforms, smooth transitions
- **Professional typography** - uppercase labels, letter-spacing, proper hierarchy

When adding features:
- Integrate INTO existing visualizations (timeline, lists)
- Avoid external panels that reduce main content area
- Use consistent color system from CustomizationContext
- Match existing animation curves: `cubic-bezier(0.4, 0, 0.2, 1)`

## File Organization

```
app/
  layout.tsx          # Root layout with context providers
  page.tsx            # Redirects to /classic
  globals.css         # All styles (3500+ lines, BEM naming)
  classic/            # Main workspace route
  dashboard/          # Dashboard route with analytics
  review/             # Review route
  auth/
    login/page.tsx    # Login page
    signup/page.tsx   # Signup page
  api/
    auth/
      [...nextauth]/route.ts   # NextAuth API handler
      signup/route.ts          # User registration
    goals/
      route.ts                 # List/create goals
      [id]/route.ts            # Update/delete goal
      [id]/comments/route.ts   # Add comment
      [id]/comments/[commentId]/route.ts  # Delete comment
    customizations/
      route.ts                 # Get/update customizations
    notifications/
      send-test/route.ts       # Test notifications

components/
  GoalsContext.tsx           # Goals state + CRUD (API + localStorage)
  CustomizationContext.tsx   # User customization state (API + localStorage)
  ThemeContext.tsx           # Dark/light theme
  SessionProvider.tsx        # NextAuth session wrapper
  Timeline.tsx               # Main timeline visualization
  GoalsList.tsx              # Scrollable goals list
  GoalEditor.tsx             # Goal editing modal
  GoalFilters.tsx            # Filter controls
  MilestoneCreator.tsx       # Add/edit milestones modal
  MilestoneEditor.tsx        # Edit milestone modal
  MilestonesList.tsx         # Milestones list view
  CustomizationPanel.tsx     # Customize categories/colors
  IntegrationsModal.tsx      # Settings/integrations
  Modal.tsx                  # Base modal component
  BurndownChart.tsx          # Completion progress chart
  TrendChart.tsx             # Time-series trends
  HeatMap.tsx                # Activity heatmap
  FocusDistribution.tsx      # Category distribution
  VelocityMetric.tsx         # Velocity metrics
  CategoryRadar.tsx          # Radar chart
  Summary.tsx                # Summary component
  QuickGoalComposer.tsx      # Quick goal creation
  QuickAddModal.tsx          # Quick add modal
  InlineSelect.tsx           # Inline select component

lib/
  auth.ts                    # NextAuth configuration
  supabase.ts               # Supabase client utilities

middleware.ts              # Route protection
supabase-schema.sql       # Database schema
```

## Data Persistence

### Authenticated Users
- Data stored in **Supabase PostgreSQL**
- API calls via fetch to `/api/goals`, `/api/customizations`
- Automatic sync on CRUD operations
- Row Level Security (RLS) ensures users only see their data
- Context providers auto-detect session and use API

### Guest Users (Backward Compatible)
All data stored in localStorage:
- `focusone_goals_v1` - Goals array
- `focusone_customization_v1` - Categories, priorities, statuses
- `focusone_theme` - Dark/light preference

No backend or API calls. Import/export via JSON files.

### Database Schema (Supabase)
See `supabase-schema.sql` for complete schema. Key tables:
- **users** - User accounts (email, password_hash, OAuth profiles)
- **goals** - User goals (user_id scoped with RLS)
- **goal_comments** - Comments on goals (cascade delete)
- **customizations** - User-specific categories, priorities, statuses

### Data Migration
When users sign up, their localStorage data persists. To migrate:
1. Export JSON from guest mode before signing up
2. Log in to account
3. Import JSON via the import feature

## Security Notes

- **bcrypt** password hashing (10 rounds)
- **JWT** session tokens via NextAuth
- **Row Level Security (RLS)** on all Supabase tables
- **Middleware** protects authenticated routes
- Never commit `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it bypasses RLS
- Use HTTPS in production
