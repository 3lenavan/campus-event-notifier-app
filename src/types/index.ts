// User and Authentication Types
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'member';
  memberships: string[]; // Array of club IDs
}

// Club Types
export interface Club {
  id: string;
  name: string;
  category: string;
  codeHash: string;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  clubId: string;
  dateISO: string; // ISO date string
  location: string;
  createdBy: string; // User UID
  createdAt: number; // Timestamp
  status: "pending" | "approved" | "rejected";
  moderationNote?: string; // Optional note from moderator
}

// Service Types
export interface CreateEventInput {
  title: string;
  description: string;
  clubId: string;
  dateISO: string;
  location: string;
}

export interface VerifyClubInput {
  clubInput: string; // Club ID or name
  codePlaintext: string; // The verification code to hash and match
}
