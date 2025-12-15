// Supabase Edge Function: send-email-reminders
// Uses Resend (Node.js SDK style) to send scheduled reminder emails.
//
// How this fits your app:
// - Your Expo app writes rows into the `email_notifications` table when a user RSVPs.
// - This function runs on Supabase, finds pending notifications that are due,
//   sends emails via Resend, and marks them as sent/failed.
//
// IMPORTANT:
// - Set these secrets in Supabase: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// - Deploy this function with `supabase functions deploy send-email-reminders`

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { Resend } from "npm:resend@4.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function environment."
  );
}

if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY in Edge Function environment.");
}

// Supabase admin client (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Resend client (Node.js style, per Resend docs)
const resend = new Resend(RESEND_API_KEY);

serve(async (req) => {
  try {
    const now = new Date();

    // 1. Fetch pending notifications that are due
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from("email_notifications")
      .select("*")
      .eq("status", "pending")
      .lte("reminder_time", now.toISOString());

    if (fetchError) {
      console.error("Error fetching pending notifications:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500 },
      );
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No notifications to send" }),
        { status: 200 },
      );
    }

    let successCount = 0;
    let failCount = 0;

    for (const notification of notifications) {
      try {
        // 2. Send email via Resend (Node.js SDK style)
        const { data, error: sendError } = await resend.emails.send({
          // You can customize this "from" address once your domain is verified in Resend
          from: notification.club_name
            ? `${notification.club_name} <no-reply@yourdomain.com>`
            : "Campus Event Notifier <no-reply@yourdomain.com>",
          to: [notification.user_email],
          subject: `Reminder: ${notification.event_title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #111827;">Event Reminder</h2>
              <p>Hi there,</p>
              <p>This is a reminder for the upcoming event you RSVP'd to:</p>
              <div style="background-color: #F3F4F6; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2563EB;">${notification.event_title}</h3>
                ${
                  notification.club_name
                    ? `<p><strong>Club:</strong> ${notification.club_name}</p>`
                    : ""
                }
                <p><strong>Date:</strong> ${
                  new Date(notification.event_date_iso).toLocaleString()
                }</p>
                ${
                  notification.event_location
                    ? `<p><strong>Location:</strong> ${notification.event_location}</p>`
                    : ""
                }
              </div>
              <p>We look forward to seeing you!</p>
              <p style="color: #6B7280; font-size: 12px; margin-top: 32px;">
                You are receiving this email because you opted in to event reminders.
              </p>
            </div>
          `,
        });

        if (sendError) {
          console.error("Error sending email:", sendError);

          // 3a. Mark as failed
          await supabaseAdmin
            .from("email_notifications")
            .update({
              status: "failed",
              error_message: sendError.message ?? "Unknown error",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);

          failCount++;
        } else {
          console.log("Email sent successfully:", data);

          // 3b. Mark as sent
          await supabaseAdmin
            .from("email_notifications")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);

          successCount++;
        }
      } catch (emailError) {
        console.error("Unexpected error while sending email:", emailError);

        await supabaseAdmin
          .from("email_notifications")
          .update({
            status: "failed",
            error_message:
              (emailError as Error).message ?? "Unexpected error sending email",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);

        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Email reminders processed",
        success: successCount,
        failed: failCount,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Global error in send-email-reminders function:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 },
    );
  }
});


