import { z } from 'zod';
import { protectedProcedure, publicProcedure, createTRPCRouter } from '../trpc';
import { getConfig, getDatabase } from '@/lib/server/appwrite';
import type { UserDocument } from '@/types/user';
import { StudyPlannerService } from '@/services/shared/study-planner-service';



export const plannerRouter = createTRPCRouter({
    createStudyPlan: protectedProcedure
        .input(z.object({
            exam: z.string(),
            timeline_option: z.enum(['manual', 'auto']),
            target_date: z.string().optional(),
            daily_study_hours: z.number(),
            today_date: z.string()
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const database = await getDatabase();
                const config = await getConfig();
                const userData = await database.getDocument(
                    config.databaseId,
                    config.userCollectionId,
                    ctx.user.$id
                ) as UserDocument;

                const studyPlannerService = StudyPlannerService.getInstance();

                const result = await studyPlannerService.createStudyPlan({
                    ...input,
                    userData
                });

                return result;
            } catch (error) {
                console.error('Error creating study plan:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to create study plan');
            }
        }),

    getStudyPlans: protectedProcedure
        .query(async ({ ctx }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.getStudyPlans(ctx.user.$id);
            } catch (error) {
                console.error('Error getting study plans:', error);
                throw new Error('Failed to retrieve study plans');
            }
        }),
    getStudyPlan: protectedProcedure
        .input(z.object({
            planId: z.string()
        }))
        .query(async ({ input, ctx }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.getStudyPlan(input.planId, ctx.user.$id);
            } catch (error) {
                console.error('Error getting study plan:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to retrieve study plan');
            }
        }),

    updateGoalCompletion: protectedProcedure
        .input(z.object({
            planId: z.string(),
            goalId: z.string(),
            completed: z.boolean(),
            studyTime: z.number().optional()
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.updateGoalCompletion({
                    ...input,
                    userId: ctx.user.$id
                });
            } catch (error) {
                console.error('Error updating goal completion:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to update goal completion');
            }
        }),

    getTodayGoals: protectedProcedure
        .input(z.object({
            planId: z.string()
        }))
        .query(async ({ input, ctx }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.getGoalsForDate({
                    planId: input.planId,
                    userId: ctx.user.$id
                });
            } catch (error) {
                console.error('Error getting today goals:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to retrieve today\'s goals');
            }
        }),

    getGoalsForDate: protectedProcedure
        .input(z.object({
            planId: z.string(),
            date: z.string()
        }))
        .query(async ({ input, ctx }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.getGoalsForDate({
                    planId: input.planId,
                    date: input.date,
                    userId: ctx.user.$id
                });
            } catch (error) {
                console.error('Error getting goals for date:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to retrieve goals for date');
            }
        }),

    getPendingGoalForDate: publicProcedure
        .input(z.object({
            date: z.string().optional()
        }))
        .query(async ({ input }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.getPendingGoalsForDate(input.date);
            } catch (error) {
                console.error('Error getting pending goals for date:', error);
                throw new Error('Failed to retrieve pending goals for the specified date');
            }
        }),

    deleteStudyPlan: protectedProcedure
        .input(z.object({
            planId: z.string()
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const studyPlannerService = StudyPlannerService.getInstance();
                return await studyPlannerService.deleteStudyPlan(input.planId, ctx.user.$id);
            } catch (error) {
                console.error('Error deleting study plan:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to delete study plan');
            }
        })
});
