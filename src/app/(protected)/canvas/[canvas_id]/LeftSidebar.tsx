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

        isParamsLoading,
        isCanvasLoading,
        currentSlideIndex,
        setCurrentSlideIndex,
        canvas
    } = useCanvas();


    const { nodes } = useCanvas();

    const slideData = JSON.parse(nodes.filter(node => node.type === "slide-node")[0]?.data.content || "{}") as StudySlidesResponse

    // Show skeleton while data is loading
    if (isParamsLoading || isCanvasLoading) {
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
                {canvas?.type == "exam" && (
                    ` ${canvas?.target} | ${canvas?.topic}`
                )}
                {canvas?.type == "topic" && (
                    ` ${canvas?.topic}`
                )}
                {canvas?.type == "custom" && (
                    ` ${canvas?.title}`
                )}

            </div>

            <div className="space-y-4">





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
