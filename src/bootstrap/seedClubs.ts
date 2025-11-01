import clubsData from '../../data/snhu_clubs_with_hashes.json';
import { getLS, LS_KEYS, setLS } from '../lib/localStorage';
import { Club } from '../types';

/**
 * Seed clubs data from JSON file into Local Storage
 * Only runs once - checks if clubs already exist
 */
export const seedClubsOnce = async (): Promise<void> => {
  try {
    // Check if clubs already exist
    const existingClubs = await getLS<Club[]>(LS_KEYS.CLUBS);
    
    if (existingClubs && existingClubs.length > 0) {
      console.log('Clubs already seeded, skipping...');
      return;
    }

    // Transform the JSON data to our Club interface
    // Initialize both member and moderator hashes with legacy codeHash
    const clubs: Club[] = clubsData.map((club: any) => ({
      id: club.id,
      name: club.name,
      category: club.category,
      codeHash: club.codeHash,
      codeHash_member: club.codeHash,
      codeHash_moderator: club.codeHash,
    }));

    // Store in Local Storage
    await setLS(LS_KEYS.CLUBS, clubs);
    console.log(`Seeded ${clubs.length} clubs into Local Storage`);
  } catch (error) {
    console.error('Error seeding clubs:', error);
    throw error;
  }
};
