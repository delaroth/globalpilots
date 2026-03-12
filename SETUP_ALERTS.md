# Price Alerts Setup Guide

This guide explains how to set up the price alerts feature with Supabase and email notifications.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Project Settings** > **API**
4. Copy your **Project URL** and **anon/public key**

## 2. Create Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the SQL from `supabase-schema.sql`:

```sql
-- Copy and paste the contents of supabase-schema.sql
```

This will create the `price_alerts` table with the correct schema and permissions.

## 3. Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your domain (or use the provided resend.dev domain for testing)
3. Go to **API Keys** and create a new key
4. Copy the API key (starts with `re_`)

## 4. Set Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Resend (for email notifications)
RESEND_API_KEY=re_your_api_key

# Cron Job Secret (generate a random string)
CRON_SECRET=your-random-secret-string
```

Also add these to your **Vercel environment variables**:
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all the above variables

## 5. Configure Vercel Cron

The `vercel.json` file is already configured to run the price check every 6 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

After deploying to Vercel, the cron job will automatically run every 6 hours.

## 6. Test the Setup

### Test Creating an Alert

1. Go to `/alerts` page
2. Enter your email, origin, destination, and target price
3. Click "Create Alert"
4. Check your browser console and Supabase table to verify the alert was created

### Test the Cron Job Manually

Make a request to the cron endpoint with the authorization header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/check-alerts
```

You should see a JSON response showing how many alerts were checked.

### Test Email Delivery

1. Create an alert with a target price higher than the current price
2. Wait for the cron job to run (or trigger it manually)
3. Check your inbox for the price drop notification

## How It Works

1. **User creates alert**: Alert stored in Supabase `price_alerts` table
2. **Cron job runs every 6 hours**: `/api/cron/check-alerts` is called by Vercel
3. **Price checking**: For each active alert, fetch current price from TravelPayouts API
4. **Price comparison**: If current price <= target price, send email via Resend
5. **Notification throttling**: Only send one email per 24 hours per alert

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`
- Restart your dev server after adding env vars

### "Failed to create alert in database"
- Check Supabase table was created correctly
- Check RLS policies allow inserts
- View logs in Supabase dashboard under **Database** > **Logs**

### "Emails not sending"
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery logs
- For production, you need to verify your sending domain in Resend

### "Cron job not running"
- Verify `vercel.json` exists in project root
- Check Vercel deployment logs
- Ensure `CRON_SECRET` environment variable is set in Vercel
