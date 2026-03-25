import React from 'react';
import { type SlideThumbnailsProps, type StudySlide, type StudySlideElement } from './types';

const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
    slides,
    currentSlide,
    audioProgress,
    onSlideClick
}) => {
    const getAudioStatusIcon = (slideIndex: number, audioUrl?: string) => {
        const status = audioProgress[slideIndex];

        if (audioUrl && status === 'completed') {
            return (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L6.269 15H4a1 1 0 01-1-1V6a1 1 0 011-1h2.269l2.114-1.816z" clipRule="evenodd" />
                        <path d="M14 5.5a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zm1.5 2.5a.5.5 0 000 1h2a.5.5 0 000-1h-2zm0 3a.5.5 0 000 1h3a.5.5 0 000-1h-3zm0 3a.5.5 0 000 1h1a.5.5 0 000-1h-1z" />
                    </svg>
                </div>
            );
        }

        if (status === 'generating') {
            return (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        if (status === 'error') {
            return (
                <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }

        if (status === 'pending') {
            return (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }

        return null;
    };

    const getSlidePreview = (slide: StudySlide) => {
        // Find the first text element for preview
        const textElement = slide.elements?.find((el: StudySlideElement) => el.type === 'text');
        if (textElement) {
            return textElement.content.slice(0, 100) + (textElement.content.length > 100 ? '...' : '');
        }

        // Find other content types
        const imageElement = slide.elements?.find((el: StudySlideElement) => el.type === 'image');
        if (imageElement) return 'Contains image content';

        const codeElement = slide.elements?.find((el: StudySlideElement) => el.type === 'code');
        if (codeElement) return 'Contains code snippet';

        const questionElement = slide.elements?.find((el: StudySlideElement) => el.type === 'question');
        if (questionElement) return 'Contains practice question';

        return 'No preview available';
    };

    const getSlideTypeIcon = (slide: StudySlide) => {
        const hasImage = slide.elements?.some((el: StudySlideElement) => el.type === 'image');
        const hasCode = slide.elements?.some((el: StudySlideElement) => el.type === 'code');
        const hasQuestion = slide.elements?.some((el: StudySlideElement) => el.type === 'question');
        const hasSvg = slide.elements?.some((el: StudySlideElement) => el.type === 'svg');

        if (hasQuestion) {
            return (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
            );
        }

        if (hasCode) {
            return (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            );
        }

        if (hasImage || hasSvg) {
            return (
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            );
        }

        return (
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">All Slides</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Audio Ready</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>Generating</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span>Waiting</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => onSlideClick(index)}
                        className={`
                            relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md text-left
                            ${index === currentSlide
                                ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-600 ring-opacity-20'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                            }
                        `}
                    >
                        {/* Audio Status Indicator */}
                        {getAudioStatusIcon(index, slide.audio)}

                        {/* Slide Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <span className={`
                                    text-xs font-medium px-2 py-1 rounded-full
                                    ${index === currentSlide
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }
                                `}>
                                    #{index + 1}
                                </span>
                                {getSlideTypeIcon(slide)}
                            </div>
                        </div>

                        {/* Slide Title */}
                        <h4 className={`
                            font-medium mb-2 line-clamp-2 text-sm
                            ${index === currentSlide ? 'text-blue-900' : 'text-gray-800'}
                        `}>
                            {slide.title}
                        </h4>

                        {/* Slide Preview */}
                        <p className={`
                            text-xs line-clamp-3 leading-relaxed
                            ${index === currentSlide ? 'text-blue-700' : 'text-gray-600'}
                        `}>
                            {getSlidePreview(slide)}
                        </p>

                        {/* Slide Elements Count */}
                        <div className="mt-3 flex items-center justify-between">
                            <span className={`
                                text-xs flex items-center
                                ${index === currentSlide ? 'text-blue-600' : 'text-gray-500'}
                            `}>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                {slide.elements?.length || 0} elements
                            </span>

                            {index === currentSlide && (
                                <div className="flex items-center text-xs text-blue-600">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-1 animate-pulse"></div>
                                    Current
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        {slides.length} slide{slides.length !== 1 ? 's' : ''} total
                    </span>
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">Click</kbd>
                            to navigate
                        </span>
                        <span className="flex items-center">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">←</kbd>
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-1">→</kbd>
                            keyboard shortcuts
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlideThumbnails; 