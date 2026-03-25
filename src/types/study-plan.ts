import type { Models } from "node-appwrite";

export type TimelineOption = 'manual' | 'auto';

export type StudyPlan = Models.Document & {
    exam: string;
    subject: string;
    user: string;
    timeline_option: TimelineOption;
    target_date?: Date;
    daily_study_hours?: number;
    monthly_plan: MonthlyPlan[];
    current_progress: StudyProgress;
    created_at: Date;
    updated_at: Date;
};

export type MonthlyPlan = {
    month: number; // 1-12
    year: number;
    weeks: WeeklyPlan[];
    goals: string[];
    milestones: string[];
};

export type WeeklyPlan = {
    week_number: number;
    start_date: Date;
    end_date: Date;
    daily_plans: DailyPlan[];
    weekly_goals: string[];
};

export type DailyPlan = {
    date: Date;
    day: number;
    goals: DailyGoal[];
    total_study_time: number; // in minutes
    completed: boolean;
    completion_percentage: number;
};

export type DailyGoal = {
    id: string;
    topic: string;
    canvas_id: string;
    activity_type: 'study' | 'practice' | 'revision' | 'test';
    estimated_time: number; // in minutes
    completed: boolean;
    notes?: string;
    difficulty: 'easy' | 'medium' | 'hard';
};

export type StudyProgress = {
    total_goals: number;
    completed_goals: number;
    streak_days: number;
    last_streak_date: Date;
    total_study_time: number; // in minutes
    weekly_progress: number; // percentage
    monthly_progress: number; // percentage
}; 