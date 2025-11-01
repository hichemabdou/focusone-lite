# Focus.One Lite (static MVP)

A zero-backend, single-user prototype for your goals timeline and quarterly reviews.

## Features
- Add goals with title, dates, priority, status
- Visual Gantt timeline (frappe-gantt)
- Quarterly review scoring (completion, on-time, priority-weighted)
- Export/import data as JSON
- Generate a downloadable .ics calendar file for review periods

## How to run locally
Open `index.html` in your browser. No build step required.

## How to put it online (Vercel static hosting)
1. Create a new GitHub repo and upload these files.
2. Go to vercel.com → New Project → Import your repo.
3. Framework preset: **Other** (static).
4. Build command: **none**; Output directory: **/**.
5. Deploy. Your app will be live on a vercel.app URL (add a custom domain later).

## Limitations
- Single user (browser localStorage). No login/auth.
- Email reminders require a backend (can add later).
- iCal is a manual download (subscription feed requires a server).

## Next steps (when ready)
- Rebuild with Next.js + Supabase for multi-user accounts.
- Add server route `/api/ical/[token]` to publish a private calendar feed.
- Add email reminders via a daily cron (Vercel Cron) and Resend.
