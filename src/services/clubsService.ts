import { sha256 } from '../lib/hash';
import { getLS, LS_KEYS, setLS } from '../lib/localStorage';
import { Club } from '../types';

export const listClubs = async (): Promise<Club[]> => {
  return (await getLS<Club[]>(LS_KEYS.CLUBS, [])) || [];
};

export const updateClubCodes = async (
  clubId: string,
  options: { newMemberCode?: string; newModeratorCode?: string }
): Promise<Club> => {
  const clubs = (await getLS<Club[]>(LS_KEYS.CLUBS, [])) || [];
  const index = clubs.findIndex(c => c.id === clubId);
  if (index === -1) throw new Error('Club not found');

  const club = { ...clubs[index] };

  if (options.newMemberCode) {
    const hash = await sha256(options.newMemberCode);
    club.codeHash_member = hash;
    // keep legacy in sync for compatibility
    club.codeHash = club.codeHash ?? hash;
  }

  if (options.newModeratorCode) {
    const hash = await sha256(options.newModeratorCode);
    club.codeHash_moderator = hash;
  }

  clubs[index] = club;
  await setLS(LS_KEYS.CLUBS, clubs);
  return club;
};


