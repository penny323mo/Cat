export interface CatProfile {
  id: string
  user_id: string
  name: string
  breed?: string
  gender?: 'male' | 'female' | 'unknown'
  birthday?: string
  adopted_date?: string
  avatar_url?: string
  color?: string
  microchip_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FeedingLog {
  id: string
  cat_id: string
  fed_at: string
  food_type: 'dry' | 'wet' | 'treat' | 'other'
  food_brand?: string
  amount_g?: number
  notes?: string
  created_at: string
}

export interface WeightLog {
  id: string
  cat_id: string
  measured_at: string
  weight_kg: number
  notes?: string
  created_at: string
}

export interface VetRecord {
  id: string
  cat_id: string
  visit_date: string
  vet_name?: string
  reason?: string
  diagnosis?: string
  treatment?: string
  cost?: number
  next_visit_date?: string
  notes?: string
  report_url?: string
  created_at: string
}

export type ReminderType = 'vaccine' | 'deworming' | 'vet_visit' | 'custom'

export interface Reminder {
  id: string
  cat_id: string
  type: ReminderType
  title: string
  due_date: string
  is_done: boolean
  recurrence_days?: number
  notes?: string
  created_at: string
}

export type MoodType = 'happy' | 'playful' | 'sleepy' | 'anxious' | 'sick' | 'angry'

export interface MoodLog {
  id: string
  cat_id: string
  logged_at: string
  mood: MoodType
  energy_level: 1 | 2 | 3 | 4 | 5
  note?: string
  created_at: string
}

export interface Milestone {
  id: string
  cat_id: string
  date: string
  title: string
  description?: string
  photo_url?: string
  created_at: string
}

export interface PhotoAlbum {
  id: string
  cat_id: string
  name: string
  cover_url?: string
  created_at: string
}

export interface Photo {
  id: string
  cat_id: string
  album_id?: string
  url: string
  caption?: string
  taken_at: string
  tags?: string[]
  created_at: string
}

export type ExpenseCategory = 'food' | 'medical' | 'toy' | 'grooming' | 'other'

export interface Expense {
  id: string
  cat_id: string
  date: string
  category: ExpenseCategory
  amount: number
  description?: string
  created_at: string
}

export interface User {
  id: string
  email: string
}
