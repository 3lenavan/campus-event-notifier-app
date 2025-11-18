import { sha256 } from '../lib/hash';
import { Club } from '../types';
import { supabase } from '../../data/supabaseClient';

/**
 * List all clubs from Supabase
 */
export const listClubs = async (): Promise<Club[]> => {
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name, category, code_hash, code_hash_member, code_hash_moderator, string_id')
      .order('name');

    if (error) {
      console.error('[clubsService] Error fetching clubs from Supabase:', error);
      return [];
    }

    console.log('[clubsService] Fetched clubs from Supabase:', data?.length || 0, 'clubs');
    if (data && data.length > 0) {
      console.log('[clubsService] Sample club:', data[0]?.name);
    }

    // Transform Supabase data to Club interface
    // Use string_id if available, otherwise use integer id as string
    return (data || []).map((row: any) => ({
      id: row.string_id || String(row.id), // Prefer string_id if it exists
      name: row.name,
      category: row.category || 'Other',
      codeHash: row.code_hash || undefined,
      codeHash_member: row.code_hash_member || row.code_hash || undefined,
      codeHash_moderator: row.code_hash_moderator || undefined,
    }));
  } catch (error) {
    console.error('[clubsService] Error listing clubs:', error);
    return [];
  }
};

/**
 * Update club verification codes in Supabase
 */
export const updateClubCodes = async (
  clubId: string,
  options: { newMemberCode?: string; newModeratorCode?: string }
): Promise<Club> => {
  try {
    const updateData: any = {};

    if (options.newMemberCode) {
      const hash = await sha256(options.newMemberCode);
      updateData.code_hash_member = hash;
      // Keep legacy in sync for compatibility
      updateData.code_hash = hash;
    }

    if (options.newModeratorCode) {
      const hash = await sha256(options.newModeratorCode);
      updateData.code_hash_moderator = hash;
    }

    const { data, error } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', parseInt(clubId))
      .select()
      .single();

    if (error) {
      console.error('Error updating club codes:', error);
      throw new Error('Failed to update club codes');
    }

    if (!data) {
      throw new Error('Club not found');
    }

    return {
      id: String(data.id),
      name: data.name,
      category: data.category || 'Other',
      codeHash: data.code_hash || undefined,
      codeHash_member: data.code_hash_member || data.code_hash || undefined,
      codeHash_moderator: data.code_hash_moderator || undefined,
    };
  } catch (error) {
    console.error('Error updating club codes:', error);
    throw error;
  }
};


