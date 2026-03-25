import { api } from '@/trpc/react'
import type { DailyPlan, MonthlyPlan, StudyPlan, StudyProgress } from '@/types/study-plan'
import React from 'react'
import { Card, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Clock, Eye, Info, StopCircle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

const Plans = () => {
    const { data: studyPlans, isLoading } = api.planner.getStudyPlans.useQuery()
    const utils = api.useUtils();
    const { mutate: deleteStudyPlan, isPending } = api.planner.deleteStudyPlan.useMutation({
        onSuccess: () => {
            utils.planner.getStudyPlans.invalidate();
        },
        onError: (error: any) => {
            console.error(error);
        }
    });
    const router = useRouter();

    const getTodaysGoals = (plan: StudyPlan) => {
        const monthlyPlan = plan.monthly_plan as MonthlyPlan[];
        const targetDateString = new Date().toISOString().split('T')[0];
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
                                progress: plan.current_progress as StudyProgress
                            } as DailyPlan & { progress: StudyProgress };
                        }
                    }
                }
            }
        }
    }


    const handleDeletePlan = (planId: string) => {
        if (confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) {
            deleteStudyPlan({ planId });
        }
    };

    if (isLoading) {
        return (
            <div className='flex flex-col gap-3'>
                <div className='bg-white p-4 rounded-md border border-gray-300/50'>
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className='flex w-full flex-col gap-2 bg-white mx-auto p-5 rounded-md border border-gray-300/50 space-y-2'>
                            {/* Header Skeleton */}
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>

                            {/* Progress Timeline Skeleton */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1 gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <React.Fragment key={i}>
                                            <Skeleton className="w-6 h-6 rounded-full" />
                                            {i < 5 && <Skeleton className="h-1 flex-1" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Task Cards Skeleton */}
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i} className="p-2 bg-white border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-6 w-16 rounded-lg" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Bottom Section Skeleton */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-3'>
            <div className='bg-white p-4 rounded-md border border-gray-300/50'>
                Manage and track all your study canvas in one place
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studyPlans?.map((plan) => {
                    const progress = JSON.parse(plan.current_progress);
                    const createdDate = new Date(plan.$createdAt);

                    const planData = {
                        ...plan,
                        current_progress: progress,
                        monthly_plan: JSON.parse(plan.monthly_plan),
                        created_at: new Date(plan.$createdAt),
                        updated_at: new Date(plan.$updatedAt),
                    } as StudyPlan;

                    const completionPercentage = (progress.completed_goals / progress.total_goals) * 100;

                    const todaysGoals = getTodaysGoals(planData);


                    return (
                        <div className='flex flex-col gap-2 bg-white mx-auto p-5 rounded-md border w-full border-gray-300/50 space-y-2' key={planData.$id}>
                            {/* Header */}

                            <div onClick={() => router.push(`/planner/${planData.$id}`)} className='cursor-pointer'>

                                <div className="flex items-center justify-between">
                                    <h1 className=" font-bold text-gray-900">{planData.exam}</h1>
                                    <div className="  rounded-full border border-gray-300 hover:bg-gray-50 cursor-pointer">
                                        <Info className="h-4 w-4 text-gray-600" />
                                    </div>
                                </div>
                            </div>


                            {/* Progress Timeline */}
                            <div className="flex items-center justify-between ">
                                <div className="flex items-center flex-1">
                                    {Array.from({ length: 6 }, (_, index) => {
                                        const stepPercentage = (index + 1) * (100 / 6);
                                        const isCompleted = completionPercentage >= stepPercentage;
                                        const isLast = index === 5;

                                        return (
                                            <React.Fragment key={index}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isCompleted ? 'bg-[var(--color-lime)]' : 'bg-gray-300'
                                                    }`}>
                                                    {isCompleted && (
                                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                {!isLast && (
                                                    <div className={`h-1 flex-1 mx-2 ${completionPercentage > stepPercentage ? 'bg-[var(--color-lime)]' : 'bg-gray-300'
                                                        }`}></div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                            <div onClick={() => router.push(`/planner/${planData.$id}`)}
                                className='cursor-pointer'
                            >

                                {/* Task Cards */}
                                <div className="space-y-2">
                                    {todaysGoals?.goals.map((activity) => (
                                        <Card key={activity.id} className="p-2 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`px-4 py-2 rounded-lg text-xs font-medium  ${activity.activity_type === 'study'
                                                        ? 'bg-[var(--color-purple)] text-white'
                                                        : 'bg-[var(--color-lime)] text-black'
                                                        }`}>
                                                        {activity.activity_type}
                                                    </div>
                                                    <span className="text-gray-500  text-xs">{activity.topic}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            {/* Bottom Section */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-sm font-medium">{Math.floor(todaysGoals?.total_study_time ?? 0) > 4 ? Math.floor(todaysGoals?.total_study_time ?? 0) / 60 + " h" : Math.floor(todaysGoals?.total_study_time ?? 0) + " h"}/day</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => {
                                        handleDeletePlan(planData.$id);
                                    }}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                    );
                }).reverse()}
            </div>
        </div>
    )
}

export default Plans