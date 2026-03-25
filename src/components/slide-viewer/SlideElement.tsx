import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { type StudySlideElement } from './types';
import {
    Carousel,
    CarouselContent,
    CarouselItem,

} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface SlideElementProps {
    element: StudySlideElement;
    index: number;
}

const CAROUSEL_AUTO_PLAY_INTERVAL = 4000; // 4 seconds for better readability
const FADE_IN_ANIMATION_STAGGER = 150; // Slightly slower stagger for smoother effect

const SlideElement: React.FC<SlideElementProps> = ({ element, index }) => {
    // Memoize animation styles
    const animationStyles = useMemo(() => ({
        animationDelay: `${index * FADE_IN_ANIMATION_STAGGER}ms`,
        animationFillMode: 'both' as const,
    }), [index]);

    // Memoize base styles with better defaults
    const baseStyles = useMemo(() => ({
        fontSize: element.options?.fontSize ? `${element.options.fontSize}px` : undefined,
        fontWeight: element.options?.bold ? '600' : 'normal', // Use 600 instead of bold for better readability
        textAlign: element.options?.align as 'left' | 'center' | 'right' | undefined,
        height: element.options?.h === 'auto' ? undefined : element.options?.h,
        width: element.options?.w === 'auto' ? undefined : element.options?.w,
        maxWidth: '100%', // Ensure responsive behavior
    }), [element.options]);

    // Carousel state with better management
    const [api, setApi] = useState<CarouselApi>();
    const [isHovered, setIsHovered] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Memoized event handlers
    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    // Enhanced auto-play functionality with better error handling
    useEffect(() => {
        if (!api) return;

        const startAutoPlay = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(() => {
                if (!isHovered && api) {
                    try {
                        if (api.canScrollNext()) {
                            api.scrollNext();
                        } else {
                            api.scrollTo(0);
                        }
                    } catch (error) {
                        console.warn('Carousel auto-play error:', error);
                    }
                }
            }, CAROUSEL_AUTO_PLAY_INTERVAL);
        };

        startAutoPlay();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [api, isHovered]);

    // Enhanced error handling for images
    const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        img.style.display = 'none';
        console.warn('Failed to load image:', img.src);
    }, []);

    // Enhanced image loading with better UX
    const renderImage = useCallback((src: string, alt: string, additionalClasses = '', showHover = true) => (
        <img
            src={src.trim()}
            alt={alt}
            className={`w-full h-auto max-h-[400px] rounded-lg shadow-md loading-image ${showHover ? 'transition-all duration-300 hover:scale-105 hover:shadow-lg' : ''
                } ${additionalClasses}`}
            style={baseStyles}
            onError={handleImageError}

        />
    ), [baseStyles, handleImageError]);

    switch (element.type) {
        case 'text':
            const renderMarkdown = (text: string) => {
                // Replace **bold**, *italic*, `code`
                const html = text
                    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1 text-xs">$1</code>')
                    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
                    .replace(/\*([^*]+)\*/g, '<i>$1</i>');
                return <span dangerouslySetInnerHTML={{ __html: html }} />;
            };

            return (
                <div
                    className="mb-6 prose prose-lg max-w-none animate-fade-in"
                    style={animationStyles}
                >
                    <div
                        className="text-gray-800 leading-relaxed selection:bg-blue-100"
                        style={baseStyles}
                    >
                        {renderMarkdown(element.content)}
                    </div>
                </div>
            );

        case 'image':
            return (
                <div
                    className="mb-6 flex justify-center animate-fade-in"
                    style={animationStyles}
                >
                    {renderImage(element.content, "Study content", "cursor-zoom-in")}
                </div>
            );

        case 'google_images':
        case 'ai_images':
            const images = element.content.split(',').filter(img => img.trim());

            if (images.length === 0) {
                return (
                    <div
                        className="mb-6 p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500 animate-fade-in"
                        style={animationStyles}
                    >
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium">No images available</p>
                        <p className="text-sm text-gray-400 mt-1">Images will appear here when loaded</p>
                    </div>
                );
            }

            if (images.length === 1) {
                return (
                    <div
                        className="mb-6 flex justify-center animate-fade-in"
                        style={animationStyles}
                    >
                        {renderImage(images[0] || "", "Study content")}
                    </div>
                );
            }

            // Enhanced multi-image carousel
            return (
                <div
                    className=" animate-fade-in group"
                    style={animationStyles}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Carousel
                        setApi={setApi}
                        className="w-full"
                        opts={{
                            align: "center",
                            loop: true,
                            skipSnaps: false,
                        }}
                    >
                        <div className="relative">
                            <CarouselContent className="">
                                {images.map((image, imgIndex) => (
                                    <CarouselItem key={imgIndex} className="">
                                        <div className="relative flex justify-center items-center">
                                            {renderImage(
                                                image,
                                                `Study content ${imgIndex + 1} of ${images.length}`,
                                                "w-full h-full",
                                                false
                                            )}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                        </div>

                    </Carousel>
                </div>
            );

        case 'audio':
            return (
                <div
                    className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl animate-fade-in"
                    style={animationStyles}
                >
                    <div className="flex items-center mb-3">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.764l-4.153-3.124A1 1 0 014 13.002V7.002a1 1 0 01.23-.636l4.153-3.124z" clipRule="evenodd" />
                            <path d="M14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.895-4.21-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">Audio Content</span>
                    </div>
                    <audio
                        controls
                        className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                        style={baseStyles}
                        preload="metadata"
                    >
                        <source src={element.content} type="audio/mpeg" />
                        <source src={element.content} type="audio/wav" />
                        <source src={element.content} type="audio/ogg" />
                        <p className="text-red-600 text-sm mt-2">
                            Your browser does not support audio playback.
                            <a href={element.content} className="underline hover:text-red-800" download>
                                Download the audio file
                            </a>
                        </p>
                    </audio>
                </div>
            );

        case 'video':
            return (
                <div
                    className="mb-6 flex justify-center animate-fade-in"
                    style={animationStyles}
                >
                    <div className="relative w-full max-w-4xl">
                        <video
                            controls
                            className="w-full h-auto rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={baseStyles}
                            preload="metadata"
                            poster="" // Add poster if available
                        >
                            <source src={element.content} type="video/mp4" />
                            <source src={element.content} type="video/webm" />
                            <source src={element.content} type="video/ogg" />
                            <p className="text-red-600 p-4">
                                Your browser does not support video playback.
                                <a href={element.content} className="underline hover:text-red-800" download>
                                    Download the video file
                                </a>
                            </p>
                        </video>
                    </div>
                </div>
            );

        case 'svg':
            return (
                <div
                    className="mb-6 flex justify-center animate-fade-in"
                    style={animationStyles}
                >
                    <div
                        className="svg-container transition-transform hover:scale-105"
                        style={baseStyles}
                        dangerouslySetInnerHTML={{ __html: element.content }}
                    />
                </div>
            );

        case 'code':
            return (
                <div
                    className="mb-6 animate-fade-in"
                    style={animationStyles}
                >
                    <div className="relative group">
                        <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2 rounded-t-lg">
                            <span className="text-sm font-medium">Code</span>
                            <button
                                onClick={() => navigator.clipboard?.writeText(element.content)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded text-xs"
                                title="Copy to clipboard"
                            >
                                Copy
                            </button>
                        </div>
                        <pre
                            className="text-gray-800 bg-gray-50 p-4 rounded-b-lg overflow-x-auto text-sm border-2 border-gray-200 selection:bg-blue-100"
                            style={baseStyles}
                        >
                            <code className="language-javascript">{element.content}</code>
                        </pre>
                    </div>
                </div>
            );

        case 'question':
            return (
                <div
                    className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-r-xl shadow-sm animate-fade-in"
                    style={animationStyles}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4">
                            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-amber-800 font-semibold mb-2">Think About This</h4>
                            <p className="text-amber-700 leading-relaxed" style={baseStyles}>
                                {element.content}
                            </p>
                        </div>
                    </div>
                </div>
            );

        default:
            return (
                <div
                    className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-xl animate-fade-in"
                    style={animationStyles}
                >
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <p className="text-gray-700 leading-relaxed" style={baseStyles}>
                            {element.content}
                        </p>
                    </div>
                </div>
            );
    }
};

export default SlideElement;