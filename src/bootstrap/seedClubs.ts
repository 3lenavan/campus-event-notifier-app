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
    const clubsToInsert = clubsData.map((club: any) => ({
      id: parseInt(club.id),
      name: club.name,
      category: club.category || 'Other',
    //  code_hash: club.codeHash,
    // code_hash_member: club.codeHash,
    // code_hash_moderator: club.codeHash,
    }));

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
