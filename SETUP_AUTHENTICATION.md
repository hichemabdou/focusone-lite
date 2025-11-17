# Authentication Setup Guide for Focus.One

This guide will help you set up multi-user authentication with Google OAuth and username/password login.

## 1. Supabase Setup

### Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### Run Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `/supabase-schema.sql` from your project
4. Copy and paste the entire content into the SQL Editor
5. Click "Run" to create all tables, indexes, and security policies

## 2. Environment Variables

### Create `.env.local` file
Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

### Fill in the following values:

#### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (from project settings)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)

#### NextAuth Configuration
- `NEXTAUTH_URL`: `http://localhost:3000` (for local development)
- `NEXTAUTH_SECRET`: Generate with: `openssl rand -base64 32`

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Note down your:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## 3. Install Dependencies

Dependencies have already been installed. Verify with:

```bash
npm list next-auth @supabase/supabase-js bcryptjs @supabase/ssr
```

## 4. What Has Been Implemented

### ✅ Authentication System
- [x] NextAuth.js configured with Google OAuth and credentials providers
- [x] Login page at `/auth/login`
- [x] Signup page at `/auth/signup`
- [x] SessionProvider wrapping the app
- [x] Middleware protecting routes (`/classic`, `/dashboard`, `/review`)

### ✅ Database Schema
- [x] Users table for authentication
- [x] Goals table (user-scoped)
- [x] Goal comments table
- [x] Customizations table (categories, priorities, statuses)
- [x] Row Level Security (RLS) policies
- [x] Indexes for performance

### ✅ API Routes
- [x] `POST /api/auth/signup` - User registration
- [x] `GET /api/goals` - List user's goals
- [x] `POST /api/goals` - Create new goal
- [x] `PATCH /api/goals/[id]` - Update goal
- [x] `DELETE /api/goals/[id]` - Delete goal
- [x] `POST /api/goals/[id]/comments` - Add comment
- [x] `DELETE /api/goals/[id]/comments/[commentId]` - Delete comment
- [x] `GET /api/customizations` - Get user customizations
- [x] `PUT /api/customizations` - Update customizations

### ⏳ Pending Updates
- [ ] Update `GoalsContext.tsx` to use API instead of localStorage
- [ ] Update `CustomizationContext.tsx` to use API instead of localStorage
- [ ] Create data migration tool for existing localStorage data
- [ ] Test complete authentication flow

## 5. Next Steps

After setting up the environment variables:

1. **Test the setup:**
   ```bash
   npm run dev
   ```

2. **Visit** `http://localhost:3000`
   - You should be redirected to `/auth/login`

3. **Try signing up:**
   - Use email/password
   - Or click "Continue with Google"

4. **After login:**
   - You'll be redirected to `/classic`
   - Currently, the app still uses localStorage (will be updated next)

## 6. Data Migration

Once authentication is working, you'll need to migrate existing localStorage data to the database. A migration tool will be created to help with this.

## 7. Schema Field Mapping

The database uses snake_case while the frontend uses camelCase:

| Frontend (camelCase) | Database (snake_case) |
|---------------------|----------------------|
| `startDate`         | `start_date`         |
| `endDate`           | `end_date`           |
| `userId`            | `user_id`            |
| `createdAt`         | `created_at`         |
| `updatedAt`         | `updated_at`         |

## 8. Security Notes

- Never commit `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it bypasses RLS
- Use HTTPS in production
- Set `NEXTAUTH_URL` to your production URL when deploying

## 9. Troubleshooting

### "Unauthorized" errors
- Check that environment variables are set correctly
- Verify you're logged in (session exists)
- Check browser console for errors

### Database errors
- Verify the schema was created successfully in Supabase
- Check RLS policies are enabled
- Ensure your Supabase keys are correct

### OAuth not working
- Verify Google OAuth credentials
- Check redirect URI matches exactly
- Ensure Google+ API is enabled

## 10. Production Deployment

When deploying to production (e.g., Vercel):

1. Add all environment variables to your hosting platform
2. Update `NEXTAUTH_URL` to your production domain
3. Add production URL to Google OAuth authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
4. Update `NEXTAUTH_SECRET` (generate a new one for production)

---

**Need help?** Check the Next.js and NextAuth.js documentation, or review the code comments in the `lib/` and `app/api/` directories.
