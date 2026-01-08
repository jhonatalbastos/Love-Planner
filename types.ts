
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
  MonthlyReview = 'MonthlyReview',
  Meditation = 'Meditation',
  Gallery = 'Gallery',
  Quiz = 'Quiz',
  VisionBoard = 'VisionBoard',
  Roulette = 'Roulette'
}

export interface NavItem {
  id: Screen;
  label: string;
  icon: string;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  user_metadata?: {
    names?: string;
    start_date?: string;
    [key: string]: any;
  };
}

export interface UserProfile {
  names: string;
  startDate: string;
  photoUrl: string;
  pairingCode: string;
  partnerName?: string;
  partnerId?: string;
  connectionStatus: 'single' | 'connected';
  cycleData?: CycleData;
  mood?: 'happy' | 'calm' | 'tired' | 'stressed' | 'excited' | 'sad';
  energy?: 'low' | 'medium' | 'high';
}

export interface CycleData {
  enabled: boolean;
  shareWithPartner: boolean;
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
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
  condition?: (stats: UserStats, logs: LogEntry[]) => boolean;
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

export interface Vision {
  id: string;
  created_by: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface DecisionList {
  id: string;
  created_by: string;
  title: string;
  items: string[];
  created_at: string;
}

export interface Quiz {
  id: string;
  created_by: string;
  question: string;
  options?: string[]; // Array of strings e.g. ["Blue", "Red"]
  correct_answer: string;
  partner_answer?: string;
  status: 'pending' | 'completed';
  created_at: string;
}

declare global {
  interface Window {
    median?: {
      onesignal?: {
        externalUserId: {
          set: (data: { externalId: string }) => void;
        };
        tags: {
          set: (data: { tags: Record<string, string | number | boolean> }) => void;
        };
      };
    };
  }
}