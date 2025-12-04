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
      imageUrl: row.image_url || undefined,
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
      imageUrl: row.image_url || undefined,
    }));
  } catch (error) {
    console.error('Error listing approved events:', error);
    return [];
  }
};

/**
 * Get events for a specific club (only approved events)
 */
export const listClubEvents = async (clubId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', parseInt(clubId))
      .eq('status', 'approved')
      .order('date_iso', { ascending: true });

    // 🔍 DEBUG LOG #1 — check exactly what Supabase sends
    console.log("RAW events from Supabase (listClubEvents):", data);

    if (error) {
      console.error('Error listing club events from Supabase:', error);
      return [];
    }

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
      imageUrl: row.image_url || undefined,
    }));
  } catch (error) {
    console.error('Error listing club events:', error);
    return [];
  }
};

/**
 * Get the count of approved events for a specific club
 */
export const getClubEventCount = async (clubId: string | number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', typeof clubId === 'string' ? parseInt(clubId) : clubId)
      .eq('status', 'approved');

    if (error) {
      console.error('Error getting club event count from Supabase:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting club event count:', error);
    return 0;
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
        image_url: eventInput.imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event in Supabase:', error);
      if (error.code === '42501') {
        throw new Error('Permission denied. Please check your Supabase RLS policies.');
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
      imageUrl: data.image_url || undefined,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};
