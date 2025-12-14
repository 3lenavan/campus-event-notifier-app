# Email Notification Setup Guide

This guide outlines the steps to set up email notifications for RSVP'd events.

## 1. Database Schema Update

You need to update the `event_rsvp` table and create a new `email_notifications` table to store pending email notification requests.

### SQL Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add notification timing column to event_rsvp table
ALTER TABLE event_rsvp
ADD COLUMN IF NOT EXISTS notification_timing TEXT;

-- Add constraint for valid notification timing values
ALTER TABLE event_rsvp
ADD CONSTRAINT check_notification_timing 
CHECK (notification_timing IS NULL OR notification_timing IN ('15min', '30min', '1hour', '2hours', '1day', '1week', 'custom', 'none'));

-- Add email notifications enabled column
ALTER TABLE event_rsvp
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false;

-- Add custom notification time column (for custom timing option)
ALTER TABLE event_rsvp
ADD COLUMN IF NOT EXISTS custom_notification_time TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_rsvp_notification_timing 
ON event_rsvp(notification_timing) 
WHERE notification_timing IS NOT NULL;

-- Create email_notifications table to store pending email notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date_iso TIMESTAMP WITH TIME ZONE NOT NULL,
  event_location TEXT,
  club_name TEXT,
  notification_timing TEXT NOT NULL,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error_message TEXT,
  UNIQUE (event_id, user_id, notification_timing)
);

-- Add index for efficient querying of pending notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_status_timing 
ON email_notifications (status, notification_timing);

CREATE INDEX IF NOT EXISTS idx_email_notifications_reminder_time 
ON email_notifications (reminder_time) 
WHERE status = 'pending';

-- Add RLS policy for email_notifications table
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email notifications" 
ON email_notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email notifications" 
ON email_notifications FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own email notifications" 
ON email_notifications FOR DELETE 
USING (user_id = auth.uid());
```

## 2. Supabase Edge Function (Example)

You'll need a Supabase Edge Function to handle sending emails. This function will be triggered by a scheduled job (e.g., `pg_cron`).

Here's an example `send-email-reminders` Edge Function:

```typescript
// supabase/functions/send-email-reminders/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.1';
import { Resend } from 'https://esm.sh/resend@1.1.0'; // Or your preferred email service

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY'); // Set this in Supabase Secrets
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(RESEND_API_KEY);

serve(async (req) => {
  try {
    const now = new Date();
    
    // Fetch pending email notifications where reminder_time has passed
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('email_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('reminder_time', now.toISOString());

    if (fetchError) {
      console.error('Error fetching pending notifications:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No notifications to send' }), { status: 200 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const notification of notifications) {
      try {
        // Send email using Resend (or your chosen service)
        const { data, error: sendError } = await resend.emails.send({
          from: 'Campus Event Notifier <onboarding@resend.dev>',
          to: [notification.user_email],
          subject: `Reminder: ${notification.event_title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Event Reminder</h2>
              <p>Hi there,</p>
              <p>This is a reminder for the upcoming event:</p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563eb;">${notification.event_title}</h3>
                <p><strong>Club:</strong> ${notification.club_name}</p>
                <p><strong>Date:</strong> ${new Date(notification.event_date_iso).toLocaleString()}</p>
                <p><strong>Location:</strong> ${notification.event_location}</p>
              </div>
              <p>We look forward to seeing you!</p>
              <p>Best,<br>The Campus Event Notifier Team</p>
            </div>
          `,
        });

        if (sendError) {
          console.error('Error sending email:', sendError);
          // Update notification status to 'failed'
          await supabaseAdmin
            .from('email_notifications')
            .update({
              status: 'failed',
              error_message: sendError.message,
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);
          failCount++;
        } else {
          console.log('Email sent successfully:', data);
          // Update notification status to 'sent'
          await supabaseAdmin
            .from('email_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);
          successCount++;
        }
      } catch (emailServiceError) {
        console.error('Unexpected error from email service:', emailServiceError);
        await supabaseAdmin
          .from('email_notifications')
          .update({
            status: 'failed',
            error_message: (emailServiceError as Error).message,
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Email reminders processed',
        success: successCount,
        failed: failCount,
      }),
      { status: 200 }
    );
  } catch (globalError) {
    console.error('Global error in Edge Function:', globalError);
    return new Response(
      JSON.stringify({ error: (globalError as Error).message }),
      { status: 500 }
    );
  }
});
```

## 3. Scheduled Job Setup

To trigger the Edge Function periodically, you can use `pg_cron` in Supabase or a GitHub Actions workflow.

### Option A: `pg_cron` (Recommended for Supabase)

1. **Enable `pg_cron`**: In your Supabase project, navigate to `Database` -> `Extensions` and enable `pg_cron`.

2. **Create a cron job**: Run the following SQL in your Supabase SQL Editor. This will call your Edge Function every 5 minutes.

```sql
SELECT cron.schedule(
  'email-reminders-job', -- name of the job
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT net.http_post(
    'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-email-reminders',
    '{}',
    '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'
  )
  $$
);
```

Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference (e.g., `abcdefghijklmnop`).
Replace `YOUR_SERVICE_ROLE_KEY` with your Supabase service role key (found in Project Settings -> API).

**Important**: Use the service role key (not the anon key) for the Edge Function's `Authorization` header, and ensure your RLS policies are secure.

### Option B: GitHub Actions (Alternative)

You can set up a GitHub Actions workflow to trigger the Edge Function via an HTTP request:

```yaml
# .github/workflows/send-email-reminders.yml
name: Send Email Reminders

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  send_reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Edge Function
        run: |
          curl -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            "https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-email-reminders"
```

Replace `YOUR_SUPABASE_PROJECT_REF` and ensure `SUPABASE_SERVICE_ROLE_KEY` is set as a GitHub Secret.

## 4. Email Service Provider

Choose an email service provider (ESP) like Resend, SendGrid, Mailgun, or AWS SES. The example Edge Function uses Resend. You'll need to:

1. Sign up for an account with your chosen ESP
2. Obtain an API key
3. Set the API key as a Supabase Secret (e.g., `RESEND_API_KEY`)
4. Configure your sender domain (e.g., `onboarding@yourdomain.com`) with the ESP

### Setting Supabase Secrets

1. Go to your Supabase project dashboard
2. Navigate to `Project Settings` -> `Edge Functions` -> `Secrets`
3. Add your email service API key (e.g., `RESEND_API_KEY`)

## 5. Environment Variables

Ensure the following environment variables are set:

**In Supabase (for Edge Functions):**
- `RESEND_API_KEY` (or your chosen ESP's API key)
- `SUPABASE_URL` (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically available)

**In your app (`.env` file):**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 6. Testing

To test email notifications:

1. RSVP to an event with a future date
2. Select a notification timing (e.g., "1 hour before")
3. Enable email notifications
4. Check the `email_notifications` table to see the scheduled email
5. Wait for the scheduled time or manually trigger the email function
6. Verify the email was sent and the status was updated to 'sent'

## 7. Custom Time Implementation

For the "custom time" option, you'll need to implement a date/time picker in the `NotificationPreferenceModal` component. The component currently has a placeholder. You can use `@react-native-community/datetimepicker` which is already in your dependencies.

## Notes

- Email notifications are stored in the database and processed by a background job
- Users must have a valid email address in their account
- Email notifications work independently of the app (emails are sent even if the app is closed)
- The system supports multiple notification timings per RSVP
- Failed emails can be retried by updating their status back to 'pending'

