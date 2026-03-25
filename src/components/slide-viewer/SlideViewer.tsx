import React, { useEffect, useCallback } from 'react';
import { type SlideViewerProps } from './types';
import SlideElement from './SlideElement';
import AudioPlayer from './AudioPlayer';

const SlideViewer: React.FC<SlideViewerProps> = ({
    slide,
    isFullscreen,
    currentIndex,
    totalSlides,
    onToggleFullscreen,
    onPrevious,
    onNext,
    autoPlayAudio,
    onAudioEnd,
    onAudioStart
}) => {
    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (!slide) return;

        switch (event.key) {
            case 'ArrowRight':
            case ' ':
                event.preventDefault();
                onNext();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                onPrevious();
                break;
            case 'Escape':
                if (isFullscreen) {
                    onToggleFullscreen();
                }
                break;
            case 'f':
            case 'F':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    onToggleFullscreen();
                }
                break;
        }
    }, [slide, isFullscreen, onNext, onPrevious, onToggleFullscreen]);

    useEffect(() => {
        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyPress);
            document.body.style.overflow = 'hidden';
            return () => {
                document.removeEventListener('keydown', handleKeyPress);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isFullscreen, handleKeyPress]);


    const slideContent = (
        <div className={`bg-gray-100 p-3  overflow-hidden space-y-4 ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
            {/* Slide Header */}
            <div className="bg-[var(--color-purple)] text-white p-6 rounded-lg flex justify-between items-center">
                <h3 className="text-xl font-bold truncate">{slide?.title || 'Untitled Slide'}</h3>
            </div>

            {/* Slide Content - Switch between structured and HTML view */}
            {
                <div className={`flex w-full justify-between gap-4`}>
                    <div className={`space-y-4 ${slide?.elements?.filter(element => element.type === "image" || element.type === "google_images" || element.type === "ai_images" || element.type === "svg").length ?? 0 > 0 ? 'w-[60%]' : 'w-0'} rounded-lg flex justify-start `}>
                        {slide?.elements?.length ? (
                            slide.elements.filter(element => element.type === "image" || element.type === "google_images" || element.type === "ai_images" || element.type === "svg").map((element, index) => (
                                <SlideElement
                                    key={`${currentIndex}-${index}`}
                                    element={element}
                                    index={index}
                                />
                            ))
                        ) : (
                            <div className="text-gray-600 text-center py-12">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-lg font-medium">No content available</p>
                                <p className="text-sm">This slide appears to be empty.</p>
                            </div>
                        )}
                    </div>

                    <div className={`space-y-4 ${slide?.elements?.filter(element => element.type !== "audio" && element.type !== "image" && element.type !== "google_images" && element.type !== "ai_images" && element.type !== "svg").length ?? 0 > 0 ? 'w-[100%]' : 'w-[40%]'} bg-white rounded-lg p-4`}>
                        {slide?.elements?.length ? (
                            slide.elements.filter(element => element.type !== "audio" && element.type !== "image" && element.type !== "google_images" && element.type !== "ai_images" && element.type !== "svg").map((element, index) => (
                                <SlideElement
                                    key={`${currentIndex}-${index}`}
                                    element={element}
                                    index={index}
                                />
                            ))
                        ) : (
                            <div className="text-gray-600 text-center py-12">
                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-lg font-medium">No content available</p>
                                <p className="text-sm">This slide appears to be empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            }

            {/* Audio Player */}
            <AudioPlayer
                audioUrl={slide?.audio}
                title={`${slide?.title || 'Slide'} - Audio Narration`}
                autoPlay={autoPlayAudio}
                onAudioEnd={onAudioEnd}
                onAudioStart={onAudioStart}
            />
        </div>
    );

    return slideContent;
};

export default SlideViewer; 