import { supabase } from "../../data/supabaseClient";
import { getEventById } from "./eventsService";
import { NotificationTiming } from "./interactionsService";

/**
 * Schedules an email notification for an RSVP'd event.
 * Stores the request in the email_notifications table.
 */
export const scheduleEmailNotification = async (
  eventId: string,
  userId: string,
  userEmail: string,
  timing: NotificationTiming,
  customTime?: string
): Promise<void> => {
  try {
    const event = await getEventById(eventId);
    if (!event) {
      console.error("Event not found for email notification scheduling");
      return;
    }

    // Calculate the reminder time
    const eventDate = new Date(event.dateISO);
    let reminderTime: Date;

    if (timing === "custom" && customTime) {
      reminderTime = new Date(customTime);
    } else {
      reminderTime = new Date(eventDate);

      switch (timing) {
        case "15min":
          reminderTime.setMinutes(reminderTime.getMinutes() - 15);
          break;
        case "30min":
          reminderTime.setMinutes(reminderTime.getMinutes() - 30);
          break;
        case "1hour":
          reminderTime.setHours(reminderTime.getHours() - 1);
          break;
        case "2hours":
          reminderTime.setHours(reminderTime.getHours() - 2);
          break;
        case "1day":
          reminderTime.setDate(reminderTime.getDate() - 1);
          break;
        case "1week":
          reminderTime.setDate(reminderTime.getDate() - 7);
          break;
        case "none":
          return; // don't schedule
        default:
          console.error("Invalid notification timing:", timing);
          return;
      }
    }

    // Don't schedule in the past
    if (reminderTime <= new Date()) {
      console.warn("Reminder time is in the past, not scheduling");
      return;
    }

    const payload = {
      event_id: Number(eventId), // bigint in DB
      firebase_uid: userId, // DB column name
      user_email: userEmail,
      event_title: event.title,
      event_date_iso: event.dateISO,
      reminder_time: reminderTime.toISOString(),
      status: "pending",
    };

    const { error } = await supabase.from("email_notifications").insert(payload);

    if (error) {
      console.error("Error scheduling email notification:", error);
      throw error;
    }

    console.log(
      `Email notification scheduled for event ${eventId} for user ${userId} at ${timing}`
    );
  } catch (error) {
    console.error("Failed to schedule email notification:", error);
    throw error;
  }
};

/**
 * Cancels pending email notifications for a specific RSVP.
 */
export const cancelEmailNotifications = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("email_notifications")
      .delete()
      .eq("event_id", Number(eventId)) // bigint-safe
      .eq("firebase_uid", userId) // correct column name
      .eq("status", "pending");

    if (error) {
      console.error("Error canceling email notifications:", error);
      throw error;
    }

    console.log(`Email notifications cancelled for event ${eventId} for user ${userId}`);
  } catch (error) {
    console.error("Failed to cancel email notifications:", error);
    throw error;
  }
};

/**
 * Get existing notification preferences for an RSVP
 */
export const getRSVPNotificationPreferences = async (
  eventId: string,
  userId: string
): Promise<{ timing: NotificationTiming | null; emailEnabled: boolean }> => {
  try {
    const { data, error } = await supabase
      .from("event_rsvp")
      .select("notification_timing, email_notifications_enabled")
      .eq("firebase_uid", userId)
      .eq("event_id", Number(eventId)) // bigint-safe
      .maybeSingle();

    if (error) {
      console.error("Error getting RSVP notification preferences:", error);
      return { timing: null, emailEnabled: false };
    }

    return {
      timing: (data?.notification_timing as NotificationTiming) || null,
      emailEnabled: data?.email_notifications_enabled || false,
    };
  } catch (error) {
    console.error("Failed to get RSVP notification preferences:", error);
    return { timing: null, emailEnabled: false };
  }
};


