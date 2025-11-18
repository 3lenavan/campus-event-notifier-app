import clubsData from '../../data/snhu_clubs_with_hashes.json';
import { supabase } from '../../data/supabaseClient';
import { listClubs } from '../services/clubsService';

/**
 * Seed clubs data from JSON file into Supabase
 * Only runs once - checks if clubs already exist
 */
export const seedClubsOnce = async (): Promise<void> => {
  try {
    // Check if clubs already exist in Supabase
    const existingClubs = await listClubs();
    
    if (existingClubs && existingClubs.length > 0) {
      console.log('Clubs already seeded in Supabase, skipping...');
      return;
    }

    // Transform the JSON data for Supabase insertion
    // The database expects INTEGER id, but JSON has string IDs
    // We'll use sequential integer IDs and store the original string ID in string_id field
    // If string_id column doesn't exist, we'll just use integer IDs and match by name
    const clubsToInsert = clubsData.map((club: any, index: number) => {
      const clubData: any = {
        id: index + 1, // Sequential integer IDs starting from 1
        name: club.name,
        category: club.category || 'Other',
        code_hash: club.codeHash,
        code_hash_member: club.codeHash,
        code_hash_moderator: club.codeHash,
      };
      
      // Try to include string_id if the column exists (won't fail if it doesn't)
      // We'll check for this column in the select query
      return clubData;
    });
    
    console.log(`[seedClubs] Preparing to insert ${clubsToInsert.length} clubs`);

    // Insert clubs into Supabase
    const { error } = await supabase
      .from('clubs')
      .insert(clubsToInsert);

    if (error) {
      console.error('Error seeding clubs to Supabase:', error);
      throw error;
    }

    console.log(`Seeded ${clubsToInsert.length} clubs into Supabase`);
  } catch (error) {
    console.error('Error seeding clubs:', error);
    throw error;
  }
};
