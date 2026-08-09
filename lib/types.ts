export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  streak_count: number;
  longest_streak: number;
  last_study_date: string | null;
  created_at: string;
}

export interface Tractate {
  id: number;
  seder: string;
  seder_he: string;
  name_he: string;
  slug: string;
  chapter_count: number;
  mishna_count: number;
  sort_order: number;
}

export interface Mishna {
  id: number;
  tractate_id: number;
  chapter: number;
  mishna_num: number;
  text_he: string | null;
  sefaria_ref: string;
  sort_order: number;
}

export type DedicationType = "neshama" | "refuah";
export type StudyPageMode = "solo" | "group";
export type StudyPagePace = "year" | "six_years" | "custom";

export interface StudyPage {
  id: number;
  owner_user_id: number;
  name_he: string;
  passing_date_gregorian: string | null;
  passing_hebrew_month: string | null;
  passing_hebrew_day: number | null;
  dtype: DedicationType;
  notes: string | null;
  mode: StudyPageMode;
  pace: StudyPagePace;
  start_date: string;
  target_end_date: string;
  invite_code: string | null;
  is_active: number;
  created_at: string;
}

export interface StudyPageWithRole extends StudyPage {
  role: "owner" | "member";
  member_count: number;
}

export interface PageStats {
  total: number;
  learned: number;
  percent: number;
}

export interface UserStats {
  total_mishnayot: number;
  learned: number;
  percent: number;
  streak: number;
  longest_streak: number;
}

export interface Achievement {
  id: number;
  code: string;
  name_he: string;
  description: string;
  icon: string;
  criteria_type: "streak" | "total_mishnayot" | "tractate_complete";
  criteria_value: number;
  sort_order: number;
}

export interface NotificationPreferences {
  user_id: number;
  whatsapp_enabled: number;
  phone_e164: string | null;
  email_enabled: number;
  frequency: "off" | "daily_if_behind" | "weekly_summary";
}
