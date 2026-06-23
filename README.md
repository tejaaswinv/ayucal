# AyuPulse Date-Specific Scheduler

This version uses exact Supabase availability windows.

Example:

```text
Tejaaswin available on 2026-06-23 from 16:00 to 22:00
```

The `/book` page will split that into 15-minute slots:

```text
4:00 PM
4:15 PM
4:30 PM
...
9:45 PM
```

If no availability exists in Supabase for the selected date, the booking page shows:

```text
No available slots on this date.
```

## What changed

- `/book` now has a date picker
- Slots are generated from `availability_windows`
- No random/demo slots are shown
- Dashboard adds exact date + start/end time
- Public booking page reads only date-specific Supabase availability
- Cleaner landing page
- Cleaner booking page
- Brand logo added
- Extra public buttons like availability setup removed

## Supabase setup

Run:

```text
supabase/schema.sql
```

It creates:

```text
availability_windows
bookings
```

Both tables have RLS enabled.

No public policies are needed because the server API validates Supabase Auth and uses the service role key.

## Important env

Your `.env.local` should include:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_secret_key
RESEND_API_KEY=your_resend_key
MAIL_FROM=AyuPulse Scheduler <onboarding@resend.dev>
DEMO_MODE=false
```

## Add availability

Go to:

```text
/dashboard
```

Login as Tejaaswin or Raksha.

Add:

```text
Date: 2026-06-23
Start: 16:00
End: 22:00
```

Then open:

```text
/book
```

Select the same host and date. The slots will appear.

## Raksha email

Open:

```text
lib/config.ts
```

Replace:

```ts
email: "raksha@example.com"
```

with Raksha's real Supabase Auth email.


## Typography update

The main headings have been adjusted to be more breathable:

- Reduced negative letter spacing
- Slightly smaller hero heading
- Improved line height
- Less cramped visual spacing


## Subdomain-ready deployment

This package is configured for:

```text
ayucal.tejaaswinv.site
```

No `basePath` is used. Deploy this as a separate Vercel project and connect the custom domain:

```text
ayucal.tejaaswinv.site
```

Read:

```text
DEPLOY_SUBDOMAIN.md
```

for the exact deployment steps.
# ayucal
# ayucal
