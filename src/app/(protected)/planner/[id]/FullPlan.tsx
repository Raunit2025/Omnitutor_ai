import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { DailyGoal, DailyPlan, MonthlyPlan, WeeklyPlan } from '@/types/study-plan';
import { BookOpen, Calendar, Target, Clock, X, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { useCanvas } from './CanvasContext';

interface FullPlanProps {
    className?: string;
}

const FullPlan: React.FC<FullPlanProps> = ({ className }) => {
    const { studyPlan, handleGoalToggle } = useCanvas();
    const monthlyPlan = studyPlan?.monthly_plan;

    const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
    const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

    const planStats = useMemo(() => {
        if (!monthlyPlan) return { totalGoals: 0, completedGoals: 0, totalTime: 0, completedTime: 0 };

        let totalGoals = 0;
        let completedGoals = 0;
        let totalTime = 0;
        let completedTime = 0;

        monthlyPlan.forEach(month => {
            month.weeks.forEach(week => {
                week.daily_plans.forEach(day => {
                    day.goals.forEach(goal => {
                        totalGoals++;
                        totalTime += goal.estimated_time;
                        if (goal.completed) {
                            completedGoals++;
                            completedTime += goal.estimated_time;
                        }
                    });
                });
            });
        });

        return { totalGoals, completedGoals, totalTime, completedTime };
    }, [monthlyPlan]);

    const completionPercentage = planStats.totalGoals > 0
        ? Math.round((planStats.completedGoals / planStats.totalGoals) * 100)
        : 0;

    const handleGoalChange = useCallback((goalId: string, completed: boolean, estimatedTime: number) => {
        handleGoalToggle(goalId, completed, estimatedTime);
    }, [handleGoalToggle]);

    const toggleMonthExpansion = (monthIndex: number) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(monthIndex)) {
            newExpanded.delete(monthIndex);
        } else {
            newExpanded.add(monthIndex);
        }
        setExpandedMonths(newExpanded);
    };

    const toggleWeekExpansion = (weekKey: string) => {
        const newExpanded = new Set(expandedWeeks);
        if (newExpanded.has(weekKey)) {
            newExpanded.delete(weekKey);
        } else {
            newExpanded.add(weekKey);
        }
        setExpandedWeeks(newExpanded);
    };

    if (!monthlyPlan || monthlyPlan.length === 0) {
        return (
            <div className={className}>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="text-sm">No Study Plan Available</span>
                </Button>
            </div>
        );
    }

    // Monthly View Component
    const MonthlyView = () => (
        <div className="space-y-4 sm:space-y-6">
            {monthlyPlan.map((month: MonthlyPlan, monthIndex: number) => (
                <Card key={monthIndex} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {new Date(month.year, month.month - 1).toLocaleDateString('en-US', {
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </h3>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-semibold text-gray-700">Monthly goals</span>
                            </div>
                            <Badge
                                className="bg-lime-400 text-black text-xs px-2 py-1 rounded-md cursor-pointer hover:bg-lime-500 transition-colors w-fit"
                                onClick={() => toggleMonthExpansion(monthIndex)}
                            >
                                {expandedMonths.has(monthIndex) ? 'Close' : 'Open'}
                                {expandedMonths.has(monthIndex) ?
                                    <ChevronDown className="h-3 w-3 ml-1" /> :
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                }
                            </Badge>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            {month.goals.map((goal: string, goalIndex: number) => (
                                <p key={goalIndex} className="text-sm text-gray-700 leading-relaxed">
                                    {goal}
                                </p>
                            ))}
                        </div>
                    </div>

                    {expandedMonths.has(monthIndex) && (
                        <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 border-t pt-4">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Weeks in this month:</h4>
                            {month.weeks.map((week: WeeklyPlan, weekIndex: number) => {
                                const weekStats = (() => {
                                    let completed = 0;
                                    let total = 0;
                                    week.daily_plans.forEach(day => {
                                        day.goals.forEach(goal => {
                                            total++;
                                            if (goal.completed) completed++;
                                        });
                                    });
                                    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
                                })();

                                return (
                                    <Card key={weekIndex} className="p-3 sm:p-4 bg-gray-50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-green-600" />
                                                <span className="font-medium text-gray-900">Week {week.week_number}</span>
                                            </div>
                                            <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md w-fit">
                                                {weekStats.completed}/{weekStats.total}
                                            </Badge>
                                        </div>
                                        <div className="w-full bg-green-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${weekStats.percentage}%` }}
                                            />
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </Card>
            ))}
        </div>
    );

    // Weekly View Component
    const WeeklyView = () => (
        <div className="space-y-4 sm:space-y-6">
            {monthlyPlan.map((month: MonthlyPlan, monthIndex: number) =>
                month.weeks.map((week: WeeklyPlan, weekIndex: number) => {
                    const weekStats = (() => {
                        let completed = 0;
                        let total = 0;
                        week.daily_plans.forEach(day => {
                            day.goals.forEach(goal => {
                                total++;
                                if (goal.completed) completed++;
                            });
                        });
                        return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
                    })();

                    const weekKey = `${monthIndex}-${weekIndex}`;

                    return (
                        <Card key={weekKey} className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        Week {week.week_number}
                                    </h3>
                                </div>
                            </div>

                            <div className="mb-4 sm:mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-gray-700">Weekly goals</span>
                                    </div>
                                    <Badge
                                        className="bg-lime-400 text-black text-xs px-2 py-1 rounded-md cursor-pointer hover:bg-lime-500 transition-colors w-fit"
                                        onClick={() => toggleWeekExpansion(weekKey)}
                                    >
                                        {expandedWeeks.has(weekKey) ? 'Close' : 'Open'}
                                        {expandedWeeks.has(weekKey) ?
                                            <ChevronDown className="h-3 w-3 ml-1" /> :
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                        }
                                    </Badge>
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    {week.weekly_goals.map((goal: string, goalIndex: number) => (
                                        <p key={goalIndex} className="text-sm text-gray-700 leading-relaxed">
                                            {goal}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            {expandedWeeks.has(weekKey) && (
                                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 border-t pt-4">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Daily plans for this week:</h4>
                                    {week.daily_plans.map((day: DailyPlan, dayIndex: number) => {
                                        const dayStats = (() => {
                                            const completed = day.goals.filter(g => g.completed).length;
                                            const total = day.goals.length;
                                            return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
                                        })();

                                        const dayDate = new Date(month.year, month.month - 1, day.day);
                                        const dayDateString = dayDate.toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'short'
                                        });

                                        return (
                                            <Card key={dayIndex} className="p-3 sm:p-4 bg-gray-50">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-blue-600" />
                                                        <span className="font-medium text-gray-900">{dayDateString}</span>
                                                    </div>
                                                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md w-fit">
                                                        {dayStats.completed}/{dayStats.total}
                                                    </Badge>
                                                </div>
                                                <div className="w-full bg-blue-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${dayStats.percentage}%` }}
                                                    />
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mb-4">
                                <div className="text-xs text-gray-600 mb-2">
                                    {weekStats.completed} of {weekStats.total} tasks completed
                                </div>
                                <div className="w-full bg-green-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${weekStats.percentage}%` }}
                                    />
                                </div>
                                <div className="text-right mt-2">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {weekStats.percentage}% Complete
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })
            )}
        </div>
    );

    // Daily View Component
    const DailyView = () => (
        <div className="space-y-4 sm:space-y-6">
            {monthlyPlan.map((month: MonthlyPlan, monthIndex: number) =>
                month.weeks.map((week: WeeklyPlan, weekIndex: number) =>
                    week.daily_plans.map((day: DailyPlan, dayIndex: number) => {
                        const dayStats = (() => {
                            const completed = day.goals.filter(g => g.completed).length;
                            const total = day.goals.length;
                            return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
                        })();

                        const dayDate = new Date(month.year, month.month - 1, day.day);

                        const dayDateString = dayDate.toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });


                        return (
                            <Card key={`${monthIndex}-${weekIndex}-${dayIndex}`} className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                            {dayDateString}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                                            {dayStats.completed}/{dayStats.total}
                                        </Badge>

                                    </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                    {day.goals.map((goal: DailyGoal, goalIndex: number) => (
                                        <div key={goalIndex} className="flex items-start sm:items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                                            <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                                                <Checkbox
                                                    checked={goal.completed}
                                                    onCheckedChange={(checked) =>
                                                        handleGoalChange(goal.id, checked as boolean, goal.estimated_time)
                                                    }
                                                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium break-words ${goal.completed ? 'line-through opacity-70' : ''}`}>
                                                    {goal.topic}
                                                </p>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs w-fit">
                                                        {goal.activity_type}
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        {goal.estimated_time} Hours
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">Daily Progress</span>
                                        <span className="font-semibold text-gray-900">{dayStats.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${dayStats.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Total Study Time</span>
                                        <span className="font-medium text-gray-900">{day.total_study_time} Hours</span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )
            )}
        </div>
    );

    return (
        <div className={className}>
            <Dialog >
                <DialogTrigger asChild>
                    <Button variant="outline" size={"lg"} className="gap-2 w-full sm:w-auto">
                        <BookOpen className="h-4 w-4 sm:hidden" />
                        <span className="text-sm hidden md:block">Study Plan</span>
                        {completionPercentage > 0 && (
                            <Badge variant="outline" className="ml-1 bg-[#8c75f255] hidden sm:block">
                                {completionPercentage}%
                            </Badge>
                        )}
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] flex flex-col bg-gray-100 border border-gray-200 p-4 py-10 sm:p-6 lg:p-8">
                    <DialogHeader className="p-4 sm:p-6 pb-4 border-b flex-shrink-0 hidden">
                        <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-semibold">
                            <div className="p-2 rounded-lg">
                                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            Study Planner overview
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 min-h-0">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'monthly' | 'weekly' | 'daily')} className="h-full w-full flex flex-col">
                            <div className="flex flex-col sm:flex-row sm:justify-between w-full items-start sm:items-center gap-3 sm:gap-0 mb-4">
                                <h1 className="text-lg sm:text-2xl font-semibold bg-white p-2 rounded-lg w-full sm:w-auto text-center sm:text-left">Study Planner overview</h1>
                                <TabsList className="grid grid-cols-3 w-full sm:w-1/2 lg:w-1/3 h-10 sm:h-full gap-1 sm:gap-2 p-1 sm:p-2 border border-gray-200">
                                    <TabsTrigger
                                        value="monthly"
                                        className="data-[state=active]:bg-[var(--color-lime)] data-[state=inactive]:bg-white data-[state=active]:text-black font-medium text-xs sm:text-sm"
                                    >
                                        Monthly
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="weekly"
                                        className="data-[state=active]:bg-[var(--color-lime)] data-[state=inactive]:bg-white data-[state=active]:text-black font-medium text-xs sm:text-sm"
                                    >
                                        Week
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="daily"
                                        className="data-[state=active]:bg-[var(--color-lime)] data-[state=inactive]:bg-white data-[state=active]:text-black font-medium text-xs sm:text-sm"
                                    >
                                        Days
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="h-[calc(100vh-16rem)] bg-white overflow-y-auto">
                                <TabsContent value="monthly" className="mt-0 p-2 sm:p-4 overflow-y-auto">
                                    <MonthlyView />
                                </TabsContent>
                                <TabsContent value="weekly" className="mt-0 p-2 sm:p-4">
                                    <WeeklyView />
                                </TabsContent>
                                <TabsContent value="daily" className="mt-0 p-2 sm:p-4">
                                    <DailyView />
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FullPlan;