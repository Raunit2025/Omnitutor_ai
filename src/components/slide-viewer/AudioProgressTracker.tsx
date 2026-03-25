import React from 'react';
import { type AudioProgressTrackerProps } from './types';

const AudioProgressTracker: React.FC<AudioProgressTrackerProps> = ({
    slides,
    audioProgress
}) => {
    if (Object.keys(audioProgress).length === 0) {
        return null;
    }

    const totalSlides = slides.length;
    const completedCount = Object.values(audioProgress).filter(status => status === 'completed').length;
    const generatingCount = Object.values(audioProgress).filter(status => status === 'generating').length;
    const errorCount = Object.values(audioProgress).filter(status => status === 'error').length;
    const completionPercentage = totalSlides > 0 ? (completedCount / totalSlides) * 100 : 0;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'generating':
                return (
                    <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                );
            case 'pending':
                return (
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Audio Ready';
            case 'generating':
                return 'Generating...';
            case 'pending':
                return 'Waiting...';
            case 'error':
                return 'Failed';
            default:
                return 'Unknown';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'generating':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'pending':
                return 'text-gray-600 bg-gray-50 border-gray-200';
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Audio Generation Progress</h3>
                <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600 font-medium">
                        {completedCount}/{totalSlides} Complete
                    </span>
                    {generatingCount > 0 && (
                        <span className="text-blue-600 font-medium">
                            {generatingCount} Generating
                        </span>
                    )}
                    {errorCount > 0 && (
                        <span className="text-red-600 font-medium">
                            {errorCount} Failed
                        </span>
                    )}
                </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(completionPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Individual Slide Progress */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {slides.map((slide, index) => {
                    const status = audioProgress[index];
                    if (!status) return null;

                    return (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${getStatusColor(status)}`}
                        >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {getStatusIcon(status)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        Slide {index + 1}: {slide.title}
                                    </p>
                                    <p className="text-xs opacity-75">
                                        {getStatusText(status)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {status === 'completed' && slide.audio && (
                                    <div className="flex items-center text-xs text-green-600">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L6.269 15H4a1 1 0 01-1-1V6a1 1 0 011-1h2.269l2.114-1.816z" clipRule="evenodd" />
                                            <path d="M14 5.5a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zm1.5 2.5a.5.5 0 000 1h2a.5.5 0 000-1h-2zm0 3a.5.5 0 000 1h3a.5.5 0 000-1h-3zm0 3a.5.5 0 000 1h1a.5.5 0 000-1h-1z" />
                                        </svg>
                                        Ready
                                    </div>
                                )}

                                {status === 'generating' && (
                                    <div className="text-xs text-blue-600">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-1"></div>
                                            Processing
                                        </div>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <button
                                        className="text-xs text-red-600 hover:text-red-800 transition-colors flex items-center"
                                        onClick={() => {
                                            // This would trigger a retry - implement in parent component
                                            console.log('Retry audio generation for slide', index);
                                        }}
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        Retry
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                        Audio generation happens in the background
                    </span>
                    <div className="flex items-center space-x-4">
                        {generatingCount > 0 && (
                            <span className="flex items-center">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-1"></div>
                                Generating {generatingCount} audio{generatingCount !== 1 ? 's' : ''}...
                            </span>
                        )}
                        {completedCount === totalSlides && (
                            <span className="flex items-center text-green-600">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                All audio ready!
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioProgressTracker; 