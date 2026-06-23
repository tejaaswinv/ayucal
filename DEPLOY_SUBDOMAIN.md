# Deploy AyuPulse Scheduler at ayucal.tejaaswinv.site

This version is prepared for a subdomain deployment:

```text
ayucal.tejaaswinv.site
```

It does **not** use `basePath`, so the app runs at the root of the subdomain:

```text
/
 /book
 /dashboard
```

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Deploy AyuPulse scheduler"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ayupulse-scheduler.git
git push -u origin main
```

Do not commit `.env.local`.

## 2. Import into Vercel

Go to Vercel:

```text
Add New Project → Import GitHub Repo → Deploy
```

Framework should be detected as:

```text
Next.js
```

## 3. Add environment variables in Vercel

In Vercel project settings:

```text
Settings → Environment Variables
```

Add:

```env
NEXT_PUBLIC_APP_URL=https://ayucal.tejaaswinv.site

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_secret_key

RESEND_API_KEY=your_resend_api_key
MAIL_FROM=AyuPulse Scheduler <onboarding@resend.dev>

DEMO_MODE=false
```

Redeploy after adding environment variables.

## 4. Add custom domain in Vercel

In your Vercel project:

```text
Settings → Domains → Add
```

Add:

```text
ayucal.tejaaswinv.site
```

Vercel will show the DNS record required.

Usually it will be a CNAME like:

```text
Type: CNAME
Name: ayucal
Value: cname.vercel-dns.com
```

## 5. Add DNS record wherever tejaaswinv.site is managed

Go to your domain DNS provider and add the CNAME record Vercel gives.

Example:

```text
CNAME
ayucal
cname.vercel-dns.com
```

Wait for DNS verification.

## 6. Update Supabase Auth URLs

In Supabase:

```text
Authentication → URL Configuration
```

Set:

```text
Site URL:
https://ayucal.tejaaswinv.site
```

Add redirect URL:

```text
https://ayucal.tejaaswinv.site/**
```

## 7. Run the latest SQL

In Supabase SQL Editor, run:

```text
supabase/schema.sql
```

The required tables are:

```text
availability_windows
bookings
```

## 8. Final test

Open:

```text
https://ayucal.tejaaswinv.site/dashboard
```

Login, add availability:

```text
Date: 2026-06-23
Start: 16:00
End: 22:00
```

Then open:

```text
https://ayucal.tejaaswinv.site/book
```

Choose the same host/date and confirm that 15-minute slots appear.
