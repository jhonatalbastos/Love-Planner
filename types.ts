
export enum Screen {
  DailyLog = 'DailyLog',
  Dashboard = 'Dashboard',
  Goals = 'Goals',
  Agreements = 'Agreements',
  Settings = 'Settings',
  TimeCapsule = 'TimeCapsule',
  SpecialDates = 'SpecialDates',
  Journal = 'Journal',
  Milestones = 'Milestones',
  Export = 'Export',
  AICoach = 'AICoach',
  MonthlyReview = 'MonthlyReview'
}

export interface NavItem {
  id: Screen;
  label: string;
  icon: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface UserProfile {
  names: string;
  startDate: string;
  photoUrl: string;
  pairingCode: string;
  partnerName?: string;
  connectionStatus: 'single' | 'connected';
}

export interface ActionOption {
  label: string;
  icon: string;
}

export interface UserPreferences {
  dailyReminder: boolean;
  coachTips: boolean;
  biometrics: boolean;
  defaultScreen: Screen;
  partnerActionOptions: ActionOption[];
  myActionOptions: ActionOption[];
  intimacyReasons: string[];
  conflictReasons: string[];
  aiConfig: {
    groqKey: string;
  };
}

export interface LogEntry {
  id: string;
  date: string;
  rating: number;
  partnerActions: string[];
  myActions: string[];
  partnerLoveLanguages?: string[];
  myLoveLanguages?: string[];
  discussionReason?: string;
  conflict?: boolean;
  intimacy?: boolean;
  noIntimacyReason?: string;
  summary: string;
  gratitude: string;
  timestamp: number;
  photo?: string;
  isLocked?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  icon: string;
  completed: boolean;
  completedDates: string[];
  history?: string[]; // Stores dates of all increments for 'count' goals
  type: 'count' | 'check';
  startDate?: string;
  endDate?: string;
}

export interface Agreement {
  id: string;
  title: string;
  details?: string;
  tag: string;
  timeInfo: string;
  color: 'blue' | 'purple' | 'pink';
  completedDates: string[];
  skippedDates: string[];
  startDate?: string;
  endDate?: string;
  responsibility?: 'me' | 'partner' | 'both';
}

export interface SpecialDate {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
  type: 'upcoming' | 'past';
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface UserStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  daysTogether: number;
  soulmateScore: number;
}

export interface Memory {
  id: string;
  dateCreated: string;
  title: string;
  content: string;
  relatedLogIds: string[];
  mood: 'happy' | 'reflective' | 'love';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface JournalQuestion {
  id: string; // UUID from DB
  text: string;
  category: string;
  created_by?: string; // null for system, user_id for AI generated
  created_at?: string;
}

export interface JournalAnswer {
  id: string;
  question_id: string;
  user_id: string;
  text: string;
  created_at: string;
}