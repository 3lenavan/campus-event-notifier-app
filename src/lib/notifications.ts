import { getLS, LS_KEYS, setLS } from './localStorage';
import { listApprovedEvents } from '../services/eventsService';
import { Event } from '../types';

// Notification tracking keys
const NOTIFIED_KEYS = (uid: string) => `notifiedKeys:${uid}`;

/**
 * Request notification permission if not already granted
 */
export const ensurePermission = async (): Promise<"granted" | "denied"> => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    // Check current permission
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission === 'granted' ? 'granted' : 'denied';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Format time for display in notifications
 */
const formatTimeForNotification = (dateISO: string): string => {
  const eventDate = new Date(dateISO);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  } else {
    return `${diffMinutes}m`;
  }
};

/**
 * Get club name by ID
 */
const getClubName = async (clubId: string): Promise<string> => {
  try {
    const clubs = await getLS<any[]>(LS_KEYS.CLUBS, []);
    const club = clubs.find(c => c.id === clubId);
    return club?.name || 'Unknown Club';
  } catch (error) {
    console.error('Error getting club name:', error);
    return 'Unknown Club';
  }
};

/**
 * Check if we should notify for an event
 */
const shouldNotifyForEvent = async (
  event: Event,
  uid: string,
  timeWindow: '24h' | '1h'
): Promise<boolean> => {
  try {
    const notifiedKeys = await getLS<string[]>(NOTIFIED_KEYS(uid), []);
    const key = `${event.id}:${timeWindow}`;
    return !notifiedKeys.includes(key);
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};

/**
 * Mark event as notified for a time window
 */
const markEventAsNotified = async (
  event: Event,
  uid: string,
  timeWindow: '24h' | '1h'
): Promise<void> => {
  try {
    const notifiedKeys = await getLS<string[]>(NOTIFIED_KEYS(uid), []);
    const key = `${event.id}:${timeWindow}`;
    
    if (!notifiedKeys.includes(key)) {
      notifiedKeys.push(key);
      await setLS(NOTIFIED_KEYS(uid), notifiedKeys);
    }
  } catch (error) {
    console.error('Error marking event as notified:', error);
  }
};

/**
 * Show notification for an event
 */
const showEventNotification = async (event: Event, timeWindow: '24h' | '1h'): Promise<void> => {
  try {
    const clubName = await getClubName(event.clubId);
    const prettyTime = formatTimeForNotification(event.dateISO);
    
    const title = `Upcoming Event: ${event.title}`;
    const body = `${clubName} • ${prettyTime}`;
    
    new Notification(title, {
      body,
      icon: '/favicon.png', // You can customize this
      tag: `${event.id}:${timeWindow}`, // Prevents duplicate notifications
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

/**
 * Check and send notifications for upcoming events
 */
const checkAndNotifyEvents = async (uid: string): Promise<void> => {
  try {
    const events = await listApprovedEvents();
    const now = new Date();
    
    for (const event of events) {
      const eventDate = new Date(event.dateISO);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      // Check 24-hour window
      if (diffHours <= 24 && diffHours > 0) {
        const shouldNotify24h = await shouldNotifyForEvent(event, uid, '24h');
        if (shouldNotify24h) {
          await showEventNotification(event, '24h');
          await markEventAsNotified(event, uid, '24h');
        }
      }
      
      // Check 1-hour window
      if (diffHours <= 1 && diffHours > 0) {
        const shouldNotify1h = await shouldNotifyForEvent(event, uid, '1h');
        if (shouldNotify1h) {
          await showEventNotification(event, '1h');
          await markEventAsNotified(event, uid, '1h');
        }
      }
    }
  } catch (error) {
    console.error('Error checking and notifying events:', error);
  }
};

/**
 * Schedule the notification scan loop
 */
export const scheduleScanLoop = (uid: string): void => {
  try {
    // Run immediately on first call
    checkAndNotifyEvents(uid);
    
    // Then run every 15 minutes
    setInterval(() => {
      checkAndNotifyEvents(uid);
    }, 15 * 60 * 1000); // 15 minutes in milliseconds
    
    console.log('Notification scan loop scheduled for user:', uid);
  } catch (error) {
    console.error('Error scheduling notification scan loop:', error);
  }
};

/**
 * Initialize notifications for a user
 */
export const initializeNotifications = async (uid: string): Promise<void> => {
  try {
    const permission = await ensurePermission();
    
    if (permission === 'granted') {
      scheduleScanLoop(uid);
      console.log('Notifications initialized for user:', uid);
    } else {
      console.log('Notification permission denied for user:', uid);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

/**
 * Clear notification history for a user
 */
export const clearNotificationHistory = async (uid: string): Promise<void> => {
  try {
    await setLS(NOTIFIED_KEYS(uid), []);
    console.log('Notification history cleared for user:', uid);
  } catch (error) {
    console.error('Error clearing notification history:', error);
  }
};
