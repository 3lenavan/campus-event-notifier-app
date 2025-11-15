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
      .select('id, name, category, code_hash, code_hash_member, code_hash_moderator')
      .order('name');

    if (error) {
      console.error('Error fetching clubs from Supabase:', error);
      return [];
    }

    // Transform Supabase data to Club interface
    return (data || []).map((row: any) => ({
      id: String(row.id),
      name: row.name,
      category: row.category || 'Other',
      codeHash: row.code_hash || undefined,
      codeHash_member: row.code_hash_member || row.code_hash || undefined,
      codeHash_moderator: row.code_hash_moderator || undefined,
    }));
  } catch (error) {
    console.error('Error listing clubs:', error);
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


