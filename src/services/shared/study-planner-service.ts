import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { ID, Query } from 'node-appwrite';
import { getConfig, getDatabase } from '@/lib/server/appwrite';
import type { UserDocument } from '@/types/user';
import type { DailyGoal, MonthlyPlan, WeeklyPlan, DailyPlan, StudyPlan, StudyProgress } from '@/types/study-plan';

// Shared schemas
export const StudyPlanSchema = z.object({
    monthly_plan: z.array(z.object({
        month: z.number(),
        year: z.number(),
        goals: z.array(z.string()),
        milestones: z.array(z.string()),
        weeks: z.array(z.object({
            week_number: z.number(),
            weekly_goals: z.array(z.string()),
            daily_plans: z.array(z.object({
                day: z.number(),
                goals: z.array(z.object({
                    id: z.string(),
                    topic: z.string(),
                    activity_type: z.enum(['study', 'practice', 'revision', 'test']),
                    estimated_time: z.number(),
                    difficulty: z.enum(['easy', 'medium', 'hard']),
                    completed: z.boolean().default(false)
                })),
                total_study_time: z.number()
            }))
        }))
    }))
});

interface CreateStudyPlanInput {
    exam: string;
    timeline_option: 'manual' | 'auto';
    target_date?: string;
    daily_study_hours: number;
    today_date: string;
    userData: UserDocument;
}

interface UpdateGoalInput {
    planId: string;
    goalId: string;
    completed: boolean;
    studyTime?: number;
    userId: string;
}

interface GoalSearchInput {
    planId: string;
    date?: string;
    userId: string;
}

export class StudyPlannerService {
    private static instance: StudyPlannerService;

    private constructor() { }

    static getInstance(): StudyPlannerService {
        if (!StudyPlannerService.instance) {
            StudyPlannerService.instance = new StudyPlannerService();
        }
        return StudyPlannerService.instance;
    }

    async createStudyPlan(input: CreateStudyPlanInput) {
        const database = await getDatabase();
        const config = await getConfig();
        const { today_date, exam, timeline_option, target_date, daily_study_hours, userData } = input;

        // Generate AI study plan
        const { object: aiPlan } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: StudyPlanSchema,
            maxTokens: 100000,
            prompt: `
Create a comprehensive study plan for ${exam} exam preparation.
Timeline option: ${timeline_option}
${target_date ? `Target date: ${target_date}` : 'Auto-generate optimal timeline based on exam difficulty'}
Today's date: ${today_date}
Daily study hours: ${daily_study_hours}
User profile: ${userData.current_role} in ${userData.country_name}

Generate a detailed month-by-month breakdown with:
1. Monthly goals and milestones specific to ${exam}
2. Weekly goals and focus areas
3. Daily study plans with specific topics for ${exam}
4. Mix of study, practice, revision, and test activities
5. Progressive difficulty levels (easy → medium → hard)
6. Realistic time allocations based on ${daily_study_hours} hours per day
7. Include unique IDs for each goal for tracking

Structure the plan to be practical and achievable for ${exam} preparation.
Start from today's date and create a logical progression.
Each goal should have a unique identifier (id field).

NOTE: MAXIMUM DAYS ARE 180 DAYS ONLY AND MAXIMUM DAILY STUDY HOURS ARE 3 HOURS ONLY
            `
        });

        // Save to database
        const studyPlan = await database.createDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            ID.unique(),
            {
                exam,
                user: userData.$id,
                timeline_option,
                target_date: target_date || null,
                daily_study_hours,
                monthly_plan: JSON.stringify(aiPlan.monthly_plan),
                current_progress: JSON.stringify({
                    total_goals: 0,
                    completed_goals: 0,
                    last_streak_date: null,
                    streak_days: 0,
                    total_study_time: 0,
                    weekly_progress: 0,
                    monthly_progress: 0
                }),
            }
        );

        return { success: true, studyPlan, aiPlan };
    }

    async getStudyPlans(userId: string) {
        const database = await getDatabase();
        const config = await getConfig();
        const studyPlans = await database.listDocuments(
            config.databaseId,
            config.studyPlanCollectionId,
            [Query.equal('user', userId)]
        );


        return studyPlans.documents;
    }

    async getStudyPlan(planId: string, userId: string): Promise<StudyPlan> {
        const database = await getDatabase();
        const config = await getConfig();
        const studyPlan = await database.getDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId
        );

        // Verify ownership
        if (studyPlan.user !== userId) {
            throw new Error('Unauthorized access to study plan');
        }

        return {
            ...studyPlan,
            current_progress: JSON.parse(studyPlan.current_progress),
            monthly_plan: JSON.parse(studyPlan.monthly_plan),
        } as StudyPlan;
    }

    async updateGoalCompletion(input: UpdateGoalInput) {
        const database = await getDatabase();
        const config = await getConfig();
        const { planId, goalId, completed, studyTime = 0, userId } = input;

        const studyPlan = await database.getDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId
        );

        if (studyPlan.user !== userId) {
            throw new Error('Unauthorized access to study plan');
        }

        const monthlyPlan = JSON.parse(studyPlan.monthly_plan);
        const currentProgress = JSON.parse(studyPlan.current_progress) as StudyProgress;

        // Update the specific goal
        let goalFound = false;
        for (const month of monthlyPlan) {
            for (const week of month.weeks) {
                for (const day of week.daily_plans) {
                    const goal = day.goals.find((g: DailyGoal) => g.id === goalId);
                    if (goal) {
                        goal.completed = completed;
                        goalFound = true;
                        break;
                    }
                }
                if (goalFound) break;
            }
            if (goalFound) break;
        }

        // Update progress metrics
        const totalGoals = this.calculateTotalGoals(monthlyPlan);
        const completedGoals = this.calculateCompletedGoals(monthlyPlan);
        const updatedProgress = this.updateStreakAndProgress(currentProgress, totalGoals, completedGoals, studyTime);

        await database.updateDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId,
            {
                monthly_plan: JSON.stringify(monthlyPlan),
                current_progress: JSON.stringify(updatedProgress),
            }
        );

        return { success: true, progress: updatedProgress };
    }

    async getGoalsForDate(input: GoalSearchInput) {
        const database = await getDatabase();
        const config = await getConfig();
        const { planId, date, userId } = input;

        const studyPlan = await database.getDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId
        );

        if (studyPlan.user !== userId) {
            throw new Error('Unauthorized access to study plan');
        }

        const monthlyPlan = JSON.parse(studyPlan.monthly_plan);
        const targetDateString = date ? date : new Date().toISOString().split('T')[0];
        const targetDate = new Date(targetDateString!);
        const targetDay = targetDate.getDate();
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();

        // Find goals for the specified date
        for (const month of monthlyPlan) {
            if (month.month === targetMonth && month.year === targetYear) {
                for (const week of month.weeks) {
                    for (const day of week.daily_plans) {
                        if (day.day === targetDay) {
                            return {
                                goals: day.goals,
                                total_study_time: day.total_study_time,
                                progress: JSON.parse(studyPlan.current_progress)
                            } as DailyPlan & { progress: StudyProgress };
                        }
                    }
                }
            }
        }

        return { goals: [], total_study_time: 0, progress: JSON.parse(studyPlan.current_progress) };
    }

    async updateGoalCanvas(planId: string, goalId: string, canvasId: string, userId: string) {
        const database = await getDatabase();
        const config = await getConfig();
        const studyPlan = await database.getDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId
        );

        if (studyPlan.user !== userId) {
            throw new Error('Unauthorized access to study plan');
        }

        const monthlyPlan = JSON.parse(studyPlan.monthly_plan);
        let goalFound = false;

        for (const month of monthlyPlan) {
            for (const week of month.weeks) {
                for (const day of week.daily_plans) {
                    const goal = day.goals.find((g: DailyGoal) => g.id === goalId);
                    if (goal) {
                        goal.canvas_id = canvasId;
                        goalFound = true;
                        break;
                    }
                }
                if (goalFound) break;
            }
            if (goalFound) break;
        }

        await database.updateDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId,
            {
                monthly_plan: JSON.stringify(monthlyPlan),
            }
        );
    }

    async deleteStudyPlan(planId: string, userId: string) {
        const database = await getDatabase();
        const config = await getConfig();
        const studyPlan = await database.getDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId
        );

        if (studyPlan.user !== userId) {
            throw new Error('Unauthorized access to study plan');
        }

        await database.deleteDocument(
            config.databaseId,
            config.studyPlanCollectionId,
            planId
        );

        return { success: true };
    }

    async getPendingGoalsForDate(date?: string) {
        const database = await getDatabase();
        const config = await getConfig();
        const targetDateString = date ? date : new Date().toISOString().split('T')[0];
        const targetDate = new Date(targetDateString!);
        const targetDay = targetDate.getDate();
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();

        // Get all study plans
        const studyPlans = await database.listDocuments(
            config.databaseId,
            config.studyPlanCollectionId
        );

        const usersWithPendingGoals: Array<{
            email: string;
            name: string;
            userId: string;
            pendingGoals: Array<{
                id: string;
                topic: string;
                activity_type: string;
                estimated_time: number;
                difficulty: string;
                exam: string;
            }>
        }> = [];

        // Process each study plan
        for (const studyPlan of studyPlans.documents) {
            try {
                const monthlyPlan = JSON.parse(studyPlan.monthly_plan);
                const pendingGoals: Array<{
                    id: string;
                    topic: string;
                    activity_type: string;
                    estimated_time: number;
                    difficulty: string;
                    exam: string;
                }> = [];

                // Find goals for the specified date
                for (const month of monthlyPlan) {
                    if (month.month === targetMonth && month.year === targetYear) {
                        for (const week of month.weeks) {
                            for (const day of week.daily_plans) {
                                if (day.day === targetDay) {
                                    // Filter uncompleted goals
                                    const uncompletedGoals = day.goals.filter((goal: DailyGoal) => !goal.completed);

                                    // Add exam information to each goal
                                    uncompletedGoals.forEach((goal: DailyGoal) => {
                                        pendingGoals.push({
                                            id: goal.id,
                                            topic: goal.topic,
                                            activity_type: goal.activity_type,
                                            estimated_time: goal.estimated_time,
                                            difficulty: goal.difficulty,
                                            exam: studyPlan.exam
                                        });
                                    });
                                    break;
                                }
                            }
                            if (pendingGoals.length > 0) break;
                        }
                        if (pendingGoals.length > 0) break;
                    }
                }

                // If user has pending goals, get their email and add to result
                if (pendingGoals.length > 0) {
                    try {
                        const userData = await database.getDocument(
                            config.databaseId,
                            config.userCollectionId,
                            studyPlan.user
                        ) as UserDocument;

                        usersWithPendingGoals.push({
                            email: userData.email,
                            name: userData.name || 'Unknown User',
                            userId: userData.$id,
                            pendingGoals
                        });
                    } catch (userError) {
                        console.error(`Failed to get user data for ${studyPlan.user}:`, userError);
                        // Continue with other users even if one fails
                    }
                }
            } catch (planError) {
                console.error(`Failed to process study plan ${studyPlan.$id}:`, planError);
                // Continue with other plans even if one fails
            }
        }

        return {
            date: targetDateString,
            totalUsersWithPendingGoals: usersWithPendingGoals.length,
            users: usersWithPendingGoals
        };
    }

    // Helper methods
    private calculateTotalGoals(monthlyPlan: MonthlyPlan[]): number {
        return monthlyPlan.reduce((total: number, month: MonthlyPlan) => {
            return total + month.weeks.reduce((weekTotal: number, week: WeeklyPlan) => {
                return weekTotal + week.daily_plans.reduce((dayTotal: number, day: DailyPlan) => {
                    return dayTotal + day.goals.length;
                }, 0);
            }, 0);
        }, 0);
    }

    private calculateCompletedGoals(monthlyPlan: MonthlyPlan[]): number {
        return monthlyPlan.reduce((total: number, month: MonthlyPlan) => {
            return total + month.weeks.reduce((weekTotal: number, week: WeeklyPlan) => {
                return weekTotal + week.daily_plans.reduce((dayTotal: number, day: DailyPlan) => {
                    return dayTotal + day.goals.filter((g: DailyGoal) => g.completed).length;
                }, 0);
            }, 0);
        }, 0);
    }

    private updateStreakAndProgress(currentProgress: StudyProgress, totalGoals: number, completedGoals: number, studyTime: number): StudyProgress {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastStreakDate = currentProgress.last_streak_date ? new Date(currentProgress.last_streak_date) : null;
        if (lastStreakDate) {
            lastStreakDate.setHours(0, 0, 0, 0);
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreakDays = currentProgress.streak_days;
        let shouldUpdateStreakDate = false;

        if (!lastStreakDate) {
            newStreakDays = 1;
            shouldUpdateStreakDate = true;
        } else if (lastStreakDate.getTime() === today.getTime()) {
            shouldUpdateStreakDate = false;
        } else if (lastStreakDate.getTime() === yesterday.getTime()) {
            newStreakDays = currentProgress.streak_days + 1;
            shouldUpdateStreakDate = true;
        } else {
            newStreakDays = 1;
            shouldUpdateStreakDate = true;
        }

        return {
            ...currentProgress,
            total_goals: totalGoals,
            completed_goals: completedGoals,
            last_streak_date: shouldUpdateStreakDate ? new Date() : currentProgress.last_streak_date,
            streak_days: newStreakDays,
            total_study_time: currentProgress.total_study_time + studyTime,
            weekly_progress: Math.round((completedGoals / totalGoals) * 100),
            monthly_progress: Math.round((completedGoals / totalGoals) * 100)
        };
    }
} 