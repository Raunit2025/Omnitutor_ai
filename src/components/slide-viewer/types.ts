import type { StudySlidesHtmlResponse, StudySlidesResponse } from "@/services/shared/ai-service";

export interface StudySlideElement {
    type: 'text' | 'google_images' | 'ai_images' | 'image' | 'audio' | 'video' | 'svg' | 'code' | 'question';
    content: string;
    options?: {
        fontSize?: number;
        bold?: boolean;
        align?: 'left' | 'center' | 'right';
        h?: string;
        w?: string;
    };
}

export interface StudySlide {
    id: number;
    title: string;
    elements: StudySlideElement[];
    audio?: string;
}

export interface StudySlideData {
    result: StudySlidesResponse;
    htmlResult: StudySlidesHtmlResponse | null;
}

export type ViewMode = 'structured' | 'html';

export type AudioGenerationStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface AudioGenerationProgress {
    [slideIndex: number]: AudioGenerationStatus;
}

export interface SlideNavigationProps {
    currentSlide: number;
    totalSlides: number;
    onPrevious: () => void;
    onNext: () => void;
    onGoToSlide: (index: number) => void;
    audioProgress?: AudioGenerationProgress;
}

export interface SlideViewerProps {
    slide: StudySlide | null;
    htmlSlide?: { html: string } | null;
    viewMode: ViewMode;
    isFullscreen: boolean;
    currentIndex: number;
    totalSlides: number;
    onToggleFullscreen: () => void;
    onPrevious: () => void;
    onNext: () => void;
    autoPlayAudio?: boolean;
    onAudioEnd?: () => void;
    onAudioStart?: () => void;
}

export interface SlideGeneratorProps {
    onGenerate: (topic: string, estimatedTime: number) => void;
    isGenerating: boolean;
    error: string | null;
    elapsedTime: number;
}

export interface AudioPlayerProps {
    audioUrl?: string;
    title?: string;
    autoPlay?: boolean;
    onAudioEnd?: () => void;
    onAudioStart?: () => void;
}

export interface SlideThumbnailsProps {
    slides: StudySlide[];
    currentSlide: number;
    audioProgress: AudioGenerationProgress;
    onSlideClick: (index: number) => void;
}

export interface AudioProgressTrackerProps {
    slides: StudySlide[];
    audioProgress: AudioGenerationProgress;
}

export interface VoiceInteractionProps {
    isActive: boolean;
    onUserResponse: (response: string) => void;
    onTimeout: () => void;
    countdown: number;
}

export interface AutoPlayState {
    isEnabled: boolean;
    isWaitingForNextSlide: boolean;
    countdown: number;
    currentSlideHasAudio: boolean;
}

export const TOPIC_EXAMPLES = [
    'Functions in Python programming',
    'World War II major events',
    'Photosynthesis process',
    'Basic algebra equations',
    'Shakespeare\'s literary themes',
    'Calculus derivatives and integrals',
    'Cell biology and mitosis',
    'American Civil War timeline',
    'Quantum physics basics',
    'Database design principles'
] as const; 