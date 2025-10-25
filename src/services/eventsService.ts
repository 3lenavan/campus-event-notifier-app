import { getLS, LS_KEYS, setLS } from '../lib/localStorage';
import { getEventPolicy } from '../lib/eventPolicy';
import { CreateEventInput, Event } from '../types';

/**
 * Generate a simple UUID for event IDs
 */
const generateEventId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get all events sorted by creation date (newest first)
 */
export const listEvents = async (): Promise<Event[]> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    return events.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error listing events:', error);
    throw error;
  }
};

/**
 * Get all approved events sorted by creation date (newest first)
 */
export const listApprovedEvents = async (): Promise<Event[]> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    return events
      .filter(event => event.status === "approved")
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error listing approved events:', error);
    throw error;
  }
};

/**
 * Get events for a specific club
 */
export const listClubEvents = async (clubId: string): Promise<Event[]> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    return events
      .filter(event => event.clubId === clubId)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error listing club events:', error);
    throw error;
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventInput: CreateEventInput, createdBy: string): Promise<Event> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    
    // Get event policy to determine status
    const eventPolicy = await getEventPolicy();
    const status = eventPolicy.moderationMode === "off" ? "approved" : "pending";
    
    const newEvent: Event = {
      id: generateEventId(),
      title: eventInput.title,
      description: eventInput.description,
      clubId: eventInput.clubId,
      dateISO: eventInput.dateISO,
      location: eventInput.location,
      createdBy,
      createdAt: Date.now(),
      status,
    };

    // Add to events array
    events.push(newEvent);
    
    // Save back to Local Storage
    await setLS(LS_KEYS.EVENTS, events);
    
    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

/**
 * Get saved events for a user
 */
export const getSavedEvents = async (uid: string): Promise<string[]> => {
  try {
    return await getLS<string[]>(LS_KEYS.SAVED_EVENTS(uid), []);
  } catch (error) {
    console.error('Error getting saved events:', error);
    throw error;
  }
};

/**
 * Save an event for a user
 */
export const saveEvent = async (uid: string, eventId: string): Promise<void> => {
  try {
    const savedEvents = await getSavedEvents(uid);
    if (!savedEvents.includes(eventId)) {
      savedEvents.push(eventId);
      await setLS(LS_KEYS.SAVED_EVENTS(uid), savedEvents);
    }
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
};

/**
 * Remove a saved event for a user
 */
export const unsaveEvent = async (uid: string, eventId: string): Promise<void> => {
  try {
    const savedEvents = await getSavedEvents(uid);
    const filteredEvents = savedEvents.filter(id => id !== eventId);
    await setLS(LS_KEYS.SAVED_EVENTS(uid), filteredEvents);
  } catch (error) {
    console.error('Error unsaving event:', error);
    throw error;
  }
};

/**
 * Get pending events for a specific club
 */
export const getPendingEvents = async (clubId: string): Promise<Event[]> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    return events
      .filter(event => event.clubId === clubId && event.status === "pending")
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting pending events:', error);
    throw error;
  }
};

/**
 * Approve an event
 */
export const approveEvent = async (eventId: string): Promise<void> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    events[eventIndex] = {
      ...events[eventIndex],
      status: "approved"
    };
    
    await setLS(LS_KEYS.EVENTS, events);
  } catch (error) {
    console.error('Error approving event:', error);
    throw error;
  }
};

/**
 * Reject an event with a moderation note
 */
export const rejectEvent = async (eventId: string, moderationNote: string): Promise<void> => {
  try {
    const events = await getLS<Event[]>(LS_KEYS.EVENTS, []);
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      throw new Error('Event not found');
    }
    
    events[eventIndex] = {
      ...events[eventIndex],
      status: "rejected",
      moderationNote
    };
    
    await setLS(LS_KEYS.EVENTS, events);
  } catch (error) {
    console.error('Error rejecting event:', error);
    throw error;
  }
};
