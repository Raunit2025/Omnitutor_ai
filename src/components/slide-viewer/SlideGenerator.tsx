import React, { useState, useCallback } from 'react';
import { type SlideGeneratorProps, TOPIC_EXAMPLES } from './types';

const SlideGenerator: React.FC<SlideGeneratorProps> = ({
    onGenerate,
    isGenerating,
    error,
    elapsedTime
}) => {
    const [topic, setTopic] = useState('');
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [validationErrors, setValidationErrors] = useState<{
        topic?: string;
        estimatedTime?: string;
    }>({});

    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const validateForm = () => {
        const errors: { topic?: string; estimatedTime?: string } = {};

        if (!topic.trim()) {
            errors.topic = 'Please enter a study topic';
        } else if (topic.trim().length < 3) {
            errors.topic = 'Topic must be at least 3 characters long';
        } else if (topic.trim().length > 200) {
            errors.topic = 'Topic must be less than 200 characters';
        }

        if (estimatedTime < 5) {
            errors.estimatedTime = 'Duration must be at least 5 minutes';
        } else if (estimatedTime > 120) {
            errors.estimatedTime = 'Duration must be less than 120 minutes';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onGenerate(topic.trim(), estimatedTime);
        }
    };

    const handleTopicChange = (value: string) => {
        setTopic(value);
        if (validationErrors.topic) {
            setValidationErrors(prev => ({ ...prev, topic: undefined }));
        }
    };

    const handleTimeChange = (value: number) => {
        setEstimatedTime(value);
        if (validationErrors.estimatedTime) {
            setValidationErrors(prev => ({ ...prev, estimatedTime: undefined }));
        }
    };

    const selectRandomTopic = () => {
        const randomTopic = TOPIC_EXAMPLES[Math.floor(Math.random() * TOPIC_EXAMPLES.length)];
        setTopic(randomTopic || "");
        setValidationErrors(prev => ({ ...prev, topic: undefined }));
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Study Slide Generator
                </h1>
                <p className="text-gray-600">
                    Create interactive study slides with AI-generated audio narration
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Topic Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Study Topic *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => handleTopicChange(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${validationErrors.topic
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-gray-300 focus:border-blue-500'
                                    }`}
                                placeholder="e.g., Functions in Python programming"
                                disabled={isGenerating}
                                list="topic-suggestions"
                                maxLength={200}
                            />
                            <datalist id="topic-suggestions">
                                {TOPIC_EXAMPLES.map((example, index) => (
                                    <option key={index} value={example} />
                                ))}
                            </datalist>

                            {/* Random topic button */}
                            <button
                                type="button"
                                onClick={selectRandomTopic}
                                disabled={isGenerating}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                                title="Get random topic suggestion"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {validationErrors.topic && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {validationErrors.topic}
                            </p>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                            {topic.length}/200 characters
                        </div>
                    </div>

                    {/* Duration Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Study Duration (minutes) *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={estimatedTime}
                                onChange={(e) => handleTimeChange(Number(e.target.value))}
                                className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${validationErrors.estimatedTime
                                    ? 'border-red-300 focus:border-red-500'
                                    : 'border-gray-300 focus:border-blue-500'
                                    }`}
                                min="5"
                                max="120"
                                step="5"
                                disabled={isGenerating}
                            />

                            {/* Quick time buttons */}
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                                {[15, 30, 45, 60].map((time) => (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => handleTimeChange(time)}
                                        disabled={isGenerating}
                                        className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors focus:outline-none"
                                    >
                                        {time}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        {validationErrors.estimatedTime && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {validationErrors.estimatedTime}
                            </p>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                            Recommended: 15-45 minutes for optimal learning
                        </p>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <p className="mt-1 text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="text-center">
                    <button
                        type="submit"
                        disabled={isGenerating || !topic.trim() || estimatedTime < 5 || estimatedTime > 120}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {isGenerating ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Study Slides...
                            </div>
                        ) : (
                            <span className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Generate Study Slides
                            </span>
                        )}
                    </button>
                </div>

                {/* Generation Progress */}
                {isGenerating && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                                <div>
                                    <p className="text-blue-800 font-medium">Creating your personalized study slides...</p>
                                    <p className="text-blue-600 text-sm">Please wait while we generate content and audio</p>
                                </div>
                            </div>
                            <div className="text-blue-600 font-mono font-semibold text-lg">
                                {formatTime(elapsedTime)}
                            </div>
                        </div>

                        <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full animate-pulse"></div>
                        </div>

                        <div className="mt-3 text-xs text-blue-600 flex items-center justify-between">
                            <span>Estimated time: 30-90 seconds</span>
                            <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Audio for first slide included
                            </span>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default SlideGenerator; 