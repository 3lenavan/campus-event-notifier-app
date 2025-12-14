import { supabase } from '../../data/supabaseClient';
import { Event } from '../types';
import { getEventById } from './eventsService';
import { listClubs } from './clubsService';
import { NotificationTiming } from './interactionsService';

/**
 * Schedules an email notification for an RSVP'd event.
 * This function stores the notification request in the database,
 * which is then processed by a backend job (e.g., Supabase Edge Function + pg_cron).
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
      console.error('Event not found for email notification scheduling');
      return;
    }

    const clubs = await listClubs();
    const club = clubs.find(c => c.id === event.clubId);
    const clubName = club?.name || 'Unknown Club';

    // Calculate the actual reminder time based on timing preference
    const eventDate = new Date(event.dateISO);
    let reminderTime: Date;

    if (timing === 'custom' && customTime) {
      reminderTime = new Date(customTime);
    } else {
      reminderTime = new Date(eventDate);
      switch (timing) {
        case '15min':
          reminderTime.setMinutes(reminderTime.getMinutes() - 15);
          break;
        case '30min':
          reminderTime.setMinutes(reminderTime.getMinutes() - 30);
          break;
        case '1hour':
          reminderTime.setHours(reminderTime.getHours() - 1);
          break;
        case '2hours':
          reminderTime.setHours(reminderTime.getHours() - 2);
          break;
        case '1day':
          reminderTime.setDate(reminderTime.getDate() - 1);
          break;
        case '1week':
          reminderTime.setDate(reminderTime.getDate() - 7);
          break;
        case 'none':
          // Don't schedule if none
          return;
        default:
          console.error('Invalid notification timing:', timing);
          return;
      }
    }

    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      console.warn('Reminder time is in the past, not scheduling');
      return;
    }

    const { error } = await supabase.from('email_notifications').insert({
      event_id: eventId,
      user_id: userId,
      user_email: userEmail,
      event_title: event.title,
      event_date_iso: event.dateISO,
      event_location: event.location,
      club_name: clubName,
      notification_timing: timing,
      reminder_time: reminderTime.toISOString(),
      scheduled_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error scheduling email notification:', error);
      throw error;
    }

    console.log(`Email notification scheduled for event ${eventId} for user ${userId} at ${timing}`);
  } catch (error) {
    console.error('Failed to schedule email notification:', error);
    throw error;
  }
};

/**
 * Cancels all pending email notifications for a specific RSVP.
 */
export const cancelEmailNotifications = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('email_notifications')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error canceling email notifications:', error);
      throw error;
    }

    console.log(`Email notifications cancelled for event ${eventId} for user ${userId}`);
  } catch (error) {
    console.error('Failed to cancel email notifications:', error);
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
      .from('event_rsvp')
      .select('notification_timing, email_notifications_enabled')
      .eq('firebase_uid', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('Error getting RSVP notification preferences:', error);
      return { timing: null, emailEnabled: false };
    }

    return {
      timing: (data?.notification_timing as NotificationTiming) || null,
      emailEnabled: data?.email_notifications_enabled || false,
    };
  } catch (error) {
    console.error('Failed to get RSVP notification preferences:', error);
    return { timing: null, emailEnabled: false };
  }
};

