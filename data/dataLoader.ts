import clubsData from "./clubs.json"; // or "../data/snhu_clubs_with_hashes.json"

// Define the Club and Event types
export interface Event {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  clubId?: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  events?: Event[];
  [key: string]: any; // allows extra fields (like hashes)
}

// Return all clubs
export const getClubs = (): Club[] => {
  return clubsData as Club[];
};

// Return all events flattened with their club ID
export const getAllEvents = (): Event[] => {
  const data = clubsData as Club[];
  const events: Event[] = [];

  data.forEach((club) => {
    if (club.events) {
      club.events.forEach((event) => {
        events.push({ ...event, clubId: club.id });
      });
    }
  });

  return events;
};

// Return a single club by ID
export const getClubById = (id: string): Club | undefined => {
  return (clubsData as Club[]).find((club) => club.id === id);
};
