import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type SlideNodeType } from "./";
import SlideViewer from "@/components/slide-viewer/SlideViewer";
import { type AudioGenerationProgress, type AutoPlayState, type ViewMode } from "@/components/slide-viewer/types";
import { type StudySlidesResponse } from "@/services/shared/ai-service";
import { api } from "@/trpc/react";
import { useCanvas } from "../CanvasContext";
import VoiceInteraction from "@/components/slide-viewer/VoiceInteraction";

export function SlideNode({
    data, id
}: NodeProps<SlideNodeType>) {


    // Use useMemo to prevent recreating slidesData on every render
    const slidesData = useMemo(() => {
        try {
            return JSON.parse(data.content) as StudySlidesResponse;
        } catch (error) {
            console.error('Error parsing slide data:', error);
            return { slides: [], title: "" } as StudySlidesResponse;
        }
    }, [data.content]);

    const { setSlideAudio, currentSlideIndex, setCurrentSlideIndex } = useCanvas();
    const [autoPlayState, setAutoPlayState] = useState<AutoPlayState>({
        isEnabled: true, // Enable auto-play by default
        isWaitingForNextSlide: false,
        countdown: 5,
        currentSlideHasAudio: false
    });
    const countdownRef = useRef<NodeJS.Timeout | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Add ref to track if audio generation has been initiated
    const audioGenerationInitiated = useRef(false);

    const { mutate: generateAudioForSlide } = api.canvas.generateAudioForSlide.useMutation({
        onSuccess: ({ audioUrl, nodeId }, { pageIndex }) => {
            console.log(`Audio generated for slide ${pageIndex}:`, audioUrl);

            // Update the study data with the new audio URL
            console.log("calling setSlideAudio", id, pageIndex, nodeId)
            setSlideAudio(id, pageIndex, audioUrl || "");

            // Note: currentSlideHasAudio will be updated automatically by the useEffect
            // that watches currentSlide?.audio when the studyData is updated above
        },
        onError: (error, { pageIndex }) => {
            console.error(`Error generating audio for slide ${pageIndex}:`, error);

        },
    });

    // Audio generation function
    const generateAudioForAllSlides = useCallback(() => {
        if (!slidesData?.slides || slidesData.slides.length === 0) return;

        // Prevent multiple calls
        if (audioGenerationInitiated.current) {
            console.log('Audio generation already initiated, skipping...');
            return;
        }

        console.log('Initiating audio generation for all slides...');
        audioGenerationInitiated.current = true;

        // Generate audio for slides that don't have audio
        slidesData.slides.forEach((slide, index) => {
            // Skip if audio already exists for this slide
            if (slide?.audio) {
                console.log(`Slide ${index} already has audio, skipping...`);
                return;
            }

            console.log(`Scheduling audio generation for slide ${index}`);
            // Stagger the requests to avoid overwhelming the server
            setTimeout(() => {
                generateAudioForSlide({
                    nodeId: id,
                    slides: slidesData,
                    pageIndex: index
                });
            }, index * 2000); // 2 second delay between each request
        });
    }, [slidesData, generateAudioForSlide, id]);

    // Start countdown when audio ends
    const startCountdown = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
        }

        setAutoPlayState(prev => ({
            ...prev,
            isWaitingForNextSlide: true,
            countdown: 5
        }));

        countdownRef.current = setInterval(() => {
            setAutoPlayState(prev => {
                const newCountdown = prev.countdown - 1;
                return {
                    ...prev,
                    countdown: newCountdown
                };
            });
        }, 1000);
    }, []);

    // Stop countdown
    const stopCountdown = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        setAutoPlayState(prev => ({
            ...prev,
            isWaitingForNextSlide: false,
            countdown: 5
        }));
    }, []);

    // Move to next slide
    const moveToNextSlide = useCallback(() => {
        if (slidesData?.slides && currentSlideIndex < slidesData.slides.length - 1) {
            const newIndex = currentSlideIndex + 1;
            setCurrentSlideIndex(newIndex);
            stopCountdown();
        }
    }, [slidesData, currentSlideIndex, setCurrentSlideIndex, stopCountdown]);

    // Audio playback handlers
    const handleAudioEnd = useCallback(() => {
        console.log('Audio ended for slide:', currentSlideIndex);

        if (!autoPlayState.isEnabled || currentSlideIndex >= (slidesData?.slides?.length || 0) - 1) {
            console.log('Auto-play disabled or last slide reached');
            return;
        }

        // Start the countdown for moving to next slide
        startCountdown();
    }, [autoPlayState.isEnabled, currentSlideIndex, slidesData?.slides?.length, startCountdown]);

    const handleAudioStart = useCallback(() => {
        console.log('Audio started playing for slide:', currentSlideIndex);
        // Stop any ongoing countdown when audio starts
        stopCountdown();
    }, [currentSlideIndex, stopCountdown]);

    // Voice interaction handlers
    const handleVoiceResponse = useCallback((response: string) => {
        console.log('User response:', response);

        // Clear the countdown timer immediately
        stopCountdown();

        if (response === 'no') {
            // User wants to stay on current slide - stop all auto-progression
            console.log('User chose to stay on current slide');
        } else {
            // User agrees to move to next slide or response is 'yes'
            console.log('User chose to move to next slide');
            moveToNextSlide();
        }
    }, [stopCountdown, moveToNextSlide]);

    const handleVoiceTimeout = useCallback(() => {
        // Timeout reached, auto-advance to next slide
        console.log('Voice interaction timeout - auto-advancing to next slide');
        moveToNextSlide();
    }, [moveToNextSlide]);

    // Navigation handlers
    const handlePrevious = useCallback(() => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
            stopCountdown();
        }
    }, [currentSlideIndex, setCurrentSlideIndex, stopCountdown]);

    const handleNext = useCallback(() => {
        moveToNextSlide();
    }, [moveToNextSlide]);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    const slides = slidesData.slides || [];
    const currentSlide = slides[currentSlideIndex] || null;

    // Generate audio for all slides on component mount (only once)
    useEffect(() => {
        if (slidesData?.slides && slidesData.slides.length > 0) {
            generateAudioForAllSlides();
        }
    }, [generateAudioForAllSlides]);

    // Update currentSlideHasAudio when current slide changes
    useEffect(() => {
        const hasAudio = Boolean(currentSlide?.audio);
        setAutoPlayState(prev => ({
            ...prev,
            currentSlideHasAudio: hasAudio
        }));
    }, [currentSlide?.audio]);

    // Cleanup countdown on unmount
    useEffect(() => {
        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, []);

    if (!slides.length) {
        return (
            <div className="bg-background rounded-md p-4 border border-border max-w-[1200px]">
                <div className="text-center py-8">
                    <p className="text-gray-500">No slides available</p>
                </div>
                <Handle type="source" position={Position.Right} />
                <Handle type="target" position={Position.Left} />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 w-[1000px] rounded-md p-2 border border-border max-w-[1200px]">
            <SlideViewer
                slide={currentSlide}
                htmlSlide={null}
                viewMode={"structured"}
                isFullscreen={isFullscreen}
                currentIndex={currentSlideIndex}
                totalSlides={slides.length}
                onToggleFullscreen={toggleFullscreen}
                onPrevious={handlePrevious}
                onNext={handleNext}
                autoPlayAudio={autoPlayState.currentSlideHasAudio}
                onAudioEnd={handleAudioEnd}
                onAudioStart={handleAudioStart}
            />
            <VoiceInteraction
                isActive={autoPlayState.isWaitingForNextSlide}
                onUserResponse={handleVoiceResponse}
                onTimeout={handleVoiceTimeout}
                countdown={autoPlayState.countdown}
            />
            <Handle type="source" position={Position.Right} />
            <Handle type="target" position={Position.Left} />
        </div>
    );
}
