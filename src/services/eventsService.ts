import { getEventPolicy } from '../lib/eventPolicy';
import { CreateEventInput, Event } from '../types';
import { supabase } from '../../data/supabaseClient';

/**
 * Get all events sorted by creation date (newest first)
 */
export const listEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing events from Supabase:', error);
      return [];
    }

    // Transform Supabase data to Event interface
    return (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      clubId: String(row.club_id),
      dateISO: row.date_iso,
      location: row.location,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).getTime(),
      status: row.status || 'pending',
      moderationNote: row.moderation_note || undefined,
    }));
  } catch (error) {
    console.error('Error listing events:', error);
    return [];
  }
};

/**
 * Get all approved events sorted by creation date (newest first)
 */
export const listApprovedEvents = async (): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing approved events from Supabase:', error);
      return [];
    }

    // Transform Supabase data to Event interface
    return (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      clubId: String(row.club_id),
      dateISO: row.date_iso,
      location: row.location,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).getTime(),
      status: row.status || 'approved',
      moderationNote: row.moderation_note || undefined,
    }));
  } catch (error) {
    console.error('Error listing approved events:', error);
    return [];
  }
};

/**
 * Get events for a specific club
 */
export const listClubEvents = async (clubId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', parseInt(clubId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing club events from Supabase:', error);
      return [];
    }

    // Transform Supabase data to Event interface
    return (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      clubId: String(row.club_id),
      dateISO: row.date_iso,
      location: row.location,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).getTime(),
      status: row.status || 'pending',
      moderationNote: row.moderation_note || undefined,
    }));
  } catch (error) {
    console.error('Error listing club events:', error);
    return [];
  }
};

/**
 * Get events by their IDs
 */
export const getEventsByIds = async (eventIds: string[]): Promise<Event[]> => {
  try {
    if (eventIds.length === 0) return [];

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds.map(id => parseInt(id)))
      .eq('status', 'approved')
      .order('date_iso', { ascending: true });

    if (error) {
      console.error('Error getting events by IDs from Supabase:', error);
      return [];
    }

    // Transform Supabase data to Event interface
    return (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      clubId: String(row.club_id),
      dateISO: row.date_iso,
      location: row.location,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).getTime(),
      status: row.status || 'approved',
      moderationNote: row.moderation_note || undefined,
    }));
  } catch (error) {
    console.error('Error getting events by IDs:', error);
    return [];
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventInput: CreateEventInput, createdBy: string): Promise<Event> => {
  try {
    // Get event policy to determine status
    const eventPolicy = await getEventPolicy();
    const status = eventPolicy.moderationMode === "off" ? "approved" : "pending";
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: eventInput.title,
        description: eventInput.description,
        club_id: parseInt(eventInput.clubId),
        date_iso: eventInput.dateISO,
        location: eventInput.location,
        created_by: createdBy,
        status: status,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event in Supabase:', error);
      // Provide more helpful error message for RLS issues
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your Supabase RLS policies. See SUPABASE_RLS_POLICIES.sql for setup instructions.');
      }
      throw error;
    }

    return {
      id: String(data.id),
      title: data.title,
      description: data.description,
      clubId: String(data.club_id),
      dateISO: data.date_iso,
      location: data.location,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at).getTime(),
      status: data.status || status,
      moderationNote: data.moderation_note || undefined,
    };
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
    const { data, error } = await supabase
      .from('saved_events')
      .select('event_id')
      .eq('user_id', uid);

    if (error) {
      console.error('Error getting saved events from Supabase:', error);
      return [];
    }

    return (data || []).map((row: any) => String(row.event_id));
  } catch (error) {
    console.error('Error getting saved events:', error);
    return [];
  }
};

/**
 * Save an event for a user
 */
export const saveEvent = async (uid: string, eventId: string): Promise<void> => {
  try {
    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_events')
      .select('id')
      .eq('user_id', uid)
      .eq('event_id', parseInt(eventId))
      .maybeSingle();

    if (existing) {
      return; // Already saved
    }

    const { error } = await supabase
      .from('saved_events')
      .insert({
        user_id: uid,
        event_id: parseInt(eventId),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving event to Supabase:', error);
      throw error;
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
    const { error } = await supabase
      .from('saved_events')
      .delete()
      .eq('user_id', uid)
      .eq('event_id', parseInt(eventId));

    if (error) {
      console.error('Error unsaving event from Supabase:', error);
      throw error;
    }
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
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', parseInt(clubId))
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending events from Supabase:', error);
      return [];
    }

    // Transform Supabase data to Event interface
    return (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title,
      description: row.description,
      clubId: String(row.club_id),
      dateISO: row.date_iso,
      location: row.location,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at).getTime(),
      status: row.status || 'pending',
      moderationNote: row.moderation_note || undefined,
    }));
  } catch (error) {
    console.error('Error getting pending events:', error);
    return [];
  }
};

/**
 * Approve an event
 */
export const approveEvent = async (eventId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', parseInt(eventId));

    if (error) {
      console.error('Error approving event in Supabase:', error);
      throw error;
    }
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
    const { error } = await supabase
      .from('events')
      .update({
        status: 'rejected',
        moderation_note: moderationNote,
      })
      .eq('id', parseInt(eventId));

    if (error) {
      console.error('Error rejecting event in Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error rejecting event:', error);
    throw error;
  }
};
