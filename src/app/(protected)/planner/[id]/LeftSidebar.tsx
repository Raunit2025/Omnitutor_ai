"use client"

import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useCanvas } from "./CanvasContext";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ArrowRight, AudioLinesIcon, BookOpen, Clock, Eye } from "lucide-react";
import { Brain } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import type { SlideNodeData } from "./nodes";
import type { StudySlidesResponse } from "@/services/shared/ai-service";

// Visually hidden component for accessibility


function SidebarContents({ setIsSheetOpen, isMobile }: { setIsSheetOpen: (open: boolean) => void, isMobile: boolean }) {
    const {
        studyPlan,
        todayGoals,
        selectedDate,
        handleGoalToggle,
        createCanvasHandler,
        isCreatingCanvas,
        goalId,
        isParamsLoading,
        isCanvasLoading,
        currentSlideIndex,
        setCurrentSlideIndex
    } = useCanvas();

    const completedGoals = studyPlan?.current_progress.completed_goals || 0;
    const totalGoals = studyPlan?.current_progress.total_goals || 0;
    const { nodes } = useCanvas();

    const slideData = JSON.parse(nodes.filter(node => node.type === "slide-node")[0]?.data.content || "{}") as StudySlidesResponse

    // Show skeleton while data is loading
    if (!studyPlan?.exam || !todayGoals || isParamsLoading || isCanvasLoading) {
        return (
            <div className="p-4 space-y-4">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-6 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>

                {/* Progress skeleton */}
                <div className="space-y-2 mb-4">
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-20" />
                </div>

                {/* Tasks header skeleton */}
                <div className="space-y-3 mb-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                </div>

                {/* Task cards skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-3 bg-white">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-4" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:px-0 space-y-4">

            <div className="bg-white p-2 border border-gray-200 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between ">
                    <h2 className="text-black font-semibold text-lg">{studyPlan?.exam || 'Loading...'}</h2>
                    <div className="flex items-center gap-2">
                        {/* <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.58698 4.54694L4.58589 4.54748L4.58427 4.54856L4.58698 4.54694ZM9.97873 4.44565C9.94104 4.40929 9.89923 4.37747 9.85414 4.35085C9.79031 4.31327 9.71945 4.28918 9.64594 4.28007C9.57242 4.27097 9.49783 4.27703 9.42675 4.2979C9.35568 4.31876 9.28964 4.35398 9.23272 4.40138C9.17579 4.44879 9.1292 4.50736 9.09581 4.57348C8.90926 4.94123 8.65192 5.26852 8.33856 5.53656C8.3866 5.26657 8.41089 4.99288 8.41114 4.71865C8.41217 3.88455 8.19216 3.06508 7.77351 2.34367C7.35486 1.62225 6.75252 1.02466 6.02781 0.611728C5.94795 0.566352 5.85786 0.54203 5.76601 0.541047C5.67417 0.540064 5.58358 0.562453 5.50277 0.60611C5.42195 0.649766 5.35357 0.713256 5.30404 0.790611C5.25451 0.867966 5.22547 0.956645 5.21964 1.04831C5.18932 1.56187 5.05505 2.06392 4.82498 2.52406C4.59491 2.98419 4.27383 3.39283 3.88118 3.72523L3.7566 3.82652C3.34581 4.1029 2.98221 4.44364 2.67977 4.83565C2.20975 5.42775 1.88416 6.12122 1.72883 6.86107C1.57349 7.60092 1.59268 8.36678 1.78488 9.09792C1.97707 9.82906 2.33698 10.5054 2.83606 11.0732C3.33515 11.641 3.95967 12.0847 4.6601 12.3691C4.74234 12.4026 4.83154 12.4154 4.91986 12.4063C5.00817 12.3972 5.0929 12.3665 5.16658 12.3169C5.24025 12.2674 5.30062 12.2005 5.34237 12.1221C5.38411 12.0438 5.40596 11.9563 5.40598 11.8676C5.40552 11.8102 5.39639 11.7532 5.37889 11.6986C5.2577 11.243 5.22279 10.7689 5.27598 10.3005C5.78865 11.2672 6.61148 12.0333 7.61218 12.4759C7.73428 12.5304 7.87228 12.5378 7.99948 12.4964C8.79002 12.2412 9.50219 11.7881 10.0683 11.1802C10.6345 10.5723 11.0357 9.82966 11.2341 9.02295C11.4324 8.21626 11.4212 7.37224 11.2014 6.57111C10.9817 5.76997 10.5608 5.03831 9.97873 4.44565ZM7.86352 11.3958C7.39134 11.1565 6.9748 10.8206 6.64099 10.4098C6.30717 9.99896 6.06356 9.52249 5.92597 9.01135C5.88391 8.83922 5.85136 8.6649 5.82848 8.48919C5.81306 8.3773 5.76306 8.27302 5.68546 8.19095C5.60785 8.10888 5.50654 8.05312 5.39568 8.03148C5.3616 8.02486 5.32695 8.02159 5.29223 8.02173C5.19705 8.02164 5.10354 8.04662 5.02109 8.09417C4.93865 8.14171 4.87019 8.21014 4.8226 8.29256C4.37326 9.06782 4.14734 9.95236 4.16989 10.8481C3.77456 10.5409 3.44415 10.1582 3.19783 9.72223C2.9515 9.2863 2.79415 8.80581 2.73489 8.30862C2.67564 7.81142 2.71567 7.30742 2.85265 6.82581C2.98963 6.3442 3.22085 5.89457 3.53289 5.50298C3.76983 5.19522 4.05565 4.92843 4.37898 4.71323C4.39312 4.70415 4.40669 4.6942 4.4196 4.68344C4.4196 4.68344 4.57993 4.55073 4.58535 4.54802C5.35733 3.89534 5.90646 3.01807 6.15618 2.03848C6.74629 2.58414 7.13972 3.30937 7.27538 4.10156C7.41103 4.89375 7.28132 5.70857 6.90639 6.41948C6.85677 6.51437 6.83639 6.62183 6.84782 6.7283C6.85925 6.83477 6.90198 6.93546 6.97061 7.01765C7.03924 7.09984 7.13069 7.15985 7.23341 7.19009C7.33613 7.22034 7.44551 7.21945 7.54773 7.18756C8.37741 6.92736 9.10747 6.41923 9.63964 5.73156C9.9596 6.20402 10.1688 6.7426 10.2517 7.30717C10.3345 7.87173 10.2889 8.44771 10.1181 8.99218C9.9474 9.53664 9.65599 10.0356 9.26561 10.4517C8.87524 10.8679 8.39596 11.1906 7.86352 11.3958Z" fill="#C3FF00" />
                        </svg> */}
                        <span className=" text-black ">{studyPlan?.current_progress.streak_days || 0} Days</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Progress value={(completedGoals / totalGoals) * 100} indicatorColor="bg-[var(--color-purple)]" className="w-full h-4 rounded-md bg-gray-200" />
                    <span className="text-black text-sm  text-end  italic">{totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}% Completed</span>
                </div>
            </div>

            <div className="space-y-4">

                <div className="space-y-3">
                    <div className="bg-[var(--color-purple)] text-white px-3 py-2 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {selectedDate.toDateString() === new Date().toDateString()
                                ? "Today's Tasks"
                                : `Tasks for ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
                        </span>
                        <span className="text-sm">
                            {todayGoals?.goals.filter((goal) => goal.completed).length}/{todayGoals?.goals.length}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {todayGoals?.goals.map((goal) => (
                            <Card
                                key={goal.id}
                                className={`p-3 rounded-lg flex flex-col gap-3 transition-colors duration-200 border bg-white shadow-sm ${goal.completed
                                    ? 'bg-green-50 border-green-200'
                                    : 'hover:bg-gray-50 border-gray-200'
                                    } ${goalId === goal.id ? 'border-[var(--color-purple)]' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className={`font-medium text-sm text-black ${goal.completed ? 'text-green-600 line-through' : ''}`}>
                                        {goal.topic}
                                    </h3>

                                    <Checkbox
                                        checked={goal.completed}
                                        onCheckedChange={(checked) =>
                                            handleGoalToggle(goal.id, checked as boolean, goal.estimated_time)
                                        }
                                        className="mt-1"
                                    />

                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">

                                        <Button
                                            variant={goalId === goal.id ? "lime" : "outline"}
                                            size="sm"
                                            className={`w-max`}
                                            disabled={isCreatingCanvas || goalId === goal.id || isParamsLoading}
                                            onClick={() => {
                                                if (isMobile) {
                                                    setIsSheetOpen(false);
                                                }

                                                // Validate required data before proceeding
                                                if (!studyPlan?.exam) {
                                                    console.error('Cannot create canvas: Study plan exam not available');
                                                    return;
                                                }

                                                if (!goal.id) {
                                                    console.error('Cannot create canvas: Goal ID not available');
                                                    return;
                                                }

                                                createCanvasHandler({
                                                    subject: goal.topic,
                                                    exam: studyPlan.exam,
                                                    goalId: goal.id,
                                                    canvas_id: goal.canvas_id,
                                                })
                                            }}
                                        >
                                            <span className="flex items-center gap-2">
                                                {goal.activity_type === "study" ? "Study" : "Practice"}
                                            </span>
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1 text-gray-600">
                                            {goal.estimated_time} h
                                        </Button>

                                    </div>

                                    <Button variant="purple" size="sm"
                                        onClick={() => {
                                            if (isMobile) {
                                                setIsSheetOpen(false);
                                            }

                                            // Validate required data before proceeding
                                            if (!studyPlan?.exam) {
                                                console.error('Cannot create canvas: Study plan exam not available');
                                                return;
                                            }

                                            if (!goal.id) {
                                                console.error('Cannot create canvas: Goal ID not available');
                                                return;
                                            }

                                            createCanvasHandler({
                                                subject: goal.topic,
                                                exam: studyPlan.exam,
                                                goalId: goal.id,
                                                canvas_id: goal.canvas_id
                                            })
                                        }}
                                    >
                                        <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Enhanced Slide Navigation Section */}
                    {slideData.slides && slideData.slides.length > 0 && (
                        <div className="space-y-4 bg-white p-2 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    All Slides
                                </span>
                                <span className="text-sm text-gray-500">
                                    {currentSlideIndex + 1}/{slideData.slides.length}
                                </span>
                            </div>

                            {/* Slides List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {slideData.slides.map((slide, index) => {
                                    const isActive = currentSlideIndex === index;
                                    const isCompleted = index < currentSlideIndex;
                                    const hasAudio = Boolean(slide.audio);
                                    const elementCount = slide.elements?.length || 0;

                                    return (
                                        <Card
                                            key={index}
                                            className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${isActive
                                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 '

                                                : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                                                }`}
                                            onClick={() => setCurrentSlideIndex(index)}
                                        >
                                            {/* Active/Completed Indicator */}


                                            {/* Slide Content */}
                                            <div className="space-y-3">
                                                {/* Title and Status */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className={`font-semibold text-sm leading-tight ${isActive ? 'text-purple-800' : 'text-gray-800'
                                                        }`}>
                                                        {slide.title || `Slide ${index + 1}`}
                                                    </h3>

                                                    {/* Audio Status Indicator */}
                                                    {hasAudio && (
                                                        <div className={`flex items-center justify-center w-6 h-6 rounded-full ${isActive ? 'bg-purple-200' : 'bg-gray-200'
                                                            }`}>
                                                            <AudioLinesIcon className={`h-3 w-3 ${isActive ? 'text-purple-700' : 'text-gray-600'
                                                                }`} />
                                                        </div>
                                                    )}
                                                </div>




                                            </div>

                                        </Card>
                                    );
                                })}
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function LeftSidebar() {
    const [isMobile, setIsMobile] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(true);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>

                    <div className="fixed top-5 left-5 z-50 md:hidden  items-center gap-2 bg-gray-100 rounded-lg p-2 border border-gray-200">
                        <Button size={"lg"} className="bg-white" >
                            <svg
                                onClick={() => setIsSheetOpen(!isSheetOpen)}
                                width="40"
                                height="40"
                                viewBox="0 0 32 21"
                                fill="none"
                                className=" cursor-pointer"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <rect
                                    x="0.807692"
                                    y="0.807692"
                                    width="29.8846"
                                    height="19.3846"
                                    rx="3.23077"
                                    stroke="black"
                                    strokeWidth="1.61538"
                                />
                                <line
                                    x1="11.3075"
                                    y1="20.1923"
                                    x2="11.3075"
                                    y2="0.807646"
                                    stroke="black"
                                    strokeWidth="1.61538"
                                />
                            </svg>                    </Button>
                    </div>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0 bg-white">
                    <SheetTitle className="hidden">
                        Study Plan Navigation
                    </SheetTitle>
                    <div className="flex justify-center items-center p-4 border-b border-gray-200">
                        <Image
                            src="/assets/logo.png"
                            alt="Logo"
                            height={30}
                            width={20}
                        />
                    </div>
                    <SidebarContents setIsSheetOpen={setIsSheetOpen} isMobile={true} />
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div className={`w-[280px] ${isSheetOpen ? 'h-full max-h-[calc(100vh-40px)] overflow-y-auto' : 'h-auto'} bg-gray-100 backdrop-blur-sm border border-gray-200 rounded-lg absolute top-5 left-5 z-50 p-4`}>
            <div className="flex justify-center gap-4 items-center">
                <div className="flex items-center w-full justify-between ">
                    <Image
                        src="/assets/logo.png"
                        alt="Logo"
                        height={30}
                        width={20}
                    />
                    <svg
                        onClick={() => setIsSheetOpen(!isSheetOpen)}
                        width="32"
                        height="21"
                        viewBox="0 0 32 21"
                        fill="none"
                        className="hidden md:block cursor-pointer"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <rect
                            x="0.807692"
                            y="0.807692"
                            width="29.8846"
                            height="19.3846"
                            rx="3.23077"
                            stroke="black"
                            strokeWidth="1.61538"
                        />
                        <line
                            x1="11.3075"
                            y1="20.1923"
                            x2="11.3075"
                            y2="0.807646"
                            stroke="black"
                            strokeWidth="1.61538"
                        />
                    </svg>
                </div>

            </div>
            {isSheetOpen && <SidebarContents setIsSheetOpen={setIsSheetOpen} isMobile={false} />}
        </div>
    )
}
