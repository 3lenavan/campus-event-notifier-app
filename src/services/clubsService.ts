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
      .select('id, slug, name, category, verification_code, code_hash, image_url, created_at')
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
    return (data || []).map((row: any) => ({
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      category: row.category || 'Other',
      verification_code: row.verification_code || '',
      code_hash: row.code_hash || '',
      image_url: row.image_url || null,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('[clubsService] Error listing clubs:', error);
    return [];
  }
};

/**
 * Update club verification codes in Supabase
 * Only updates code_hash (your DB does NOT have member/moderator columns)
 */
export const updateClubCodes = async (
  clubId: string,
  options: { newCode?: string }
): Promise<Club> => {
  try {
    const updateData: any = {};

    // Your DB only has ONE code_hash field — so we update only that
    if (options.newCode) {
      const hash = await sha256(options.newCode);
      updateData.code_hash = hash;
    }

    const { data, error } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', clubId) // id is stored as string in TS + Supabase bigint → leave as string
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
      slug: data.slug,
      name: data.name,
      category: data.category || 'Other',
      verification_code: data.verification_code || '',
      code_hash: data.code_hash || '',
      image_url: data.image_url || null,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error updating club codes:', error);
    throw error;
  }
};
