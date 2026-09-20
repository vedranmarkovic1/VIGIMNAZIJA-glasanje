export type UserRole =
  | 'support'                // Korisnička podrška (Super-admin)
  | 'president'              // Predsednik parlamenta
  | 'vice_president_even'    // Zamenik za parnu smenu
  | 'vice_president_odd'     // Zamenik za neparnu smenu
  | 'secretary'              // Zapisničar
  | 'teacher_advisor'        // Nastavnik-saradnik
  | 'student';               // Učenik

export type UserStatus = 'must_change_password' | 'active';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  surname: string;
  phone?: string;
  grade_class?: string;
  role: UserRole;
  status: UserStatus;
  temporary_password?: string;
  is_online: boolean;
}

export type PollType = 'classic' | 'multiple';
export type PollStatus = 'locked' | 'active' | 'closed';

export interface Poll {
  id: string;
  type: PollType;
  title?: string;
  question: string;
  options: string[];
  status: PollStatus;
  created_by: string;
  created_by_name: string;
  created_at: string;
  unlocked_at?: string | null;
  closed_at?: string | null;
}

export interface UserVote {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: string;
  casted_at: string;
}

export interface PollStatistics {
  totalVotes: number;
  registeredVoters: number;
  onlineVoters: number;
  turnoutPercentage: number;
  results: {
    option: string;
    count: number;
    percentage: number;
  }[];
  durationFormatted: string;
  durationSeconds: number;
}
