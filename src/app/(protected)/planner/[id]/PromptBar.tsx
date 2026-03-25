"use client"

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowUp, Plus, X, Mic, ArrowRight } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type ChangeEvent, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { type FileNodeData, type ChatNodeData, type PositionLoggerNodeData } from './nodes';
import { useReactFlow } from '@xyflow/react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCanvas } from './CanvasContext';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
    error: { message: string; error: string };
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

// Extend Window interface to include Speech Recognition
declare global {
    interface Window {
        // @ts-expect-error Speech Recognition API is not fully typed in standard DOM types
        SpeechRecognition?: SpeechRecognitionConstructor;
        // @ts-expect-error WebKit Speech Recognition API is not fully typed in standard DOM types
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

interface FileInfo {
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileFormat: string;
}

interface PromptBarProps {
    addNode: (
        data: PositionLoggerNodeData | FileNodeData | ChatNodeData,
        forceOffset: { x: number; y: number; } | undefined,
        type: string
    ) => void;
    addDocuments: (fileInfoArray: FileInfo[]) => void;
}

const PromptBar: React.FC<PromptBarProps> = ({ addNode, addDocuments }) => {
    // State management
    const [inputValue, setInputValue] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isConversationActive, setIsConversationActive] = useState<boolean>(false);
    const [audioVolume, setAudioVolume] = useState<number>(0);
    const { playingAudioLink } = useCanvas();

    // Audio analysis refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Hooks
    const { getNodes } = useReactFlow();

    // Check if there are file nodes on the canvas
    const hasFileNodes = useCallback((): boolean => {
        return getNodes().length > 0;
    }, [getNodes]);

    /**
     * Setup audio analysis for volume and frequency data
     */
    const setupAudioAnalysis = useCallback(async (audioElement: HTMLAudioElement) => {
        try {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
            }

            const audioContext = audioContextRef.current;

            // Resume context if suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Create analyser node
            if (!analyserRef.current) {
                analyserRef.current = audioContext.createAnalyser();
                analyserRef.current.fftSize = 256;
                analyserRef.current.smoothingTimeConstant = 0.8;
            }

            // Create audio source and connect to analyser
            const source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContext.destination);

            // Setup data array for frequency data
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            console.log('Audio analysis setup complete');
        } catch (error) {
            console.warn('Error setting up audio analysis:', error);
        }
    }, []);

    /**
     * Analyze audio and update volume/frequency data
     */
    const analyzeAudio = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        try {
            // Get frequency data
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);

            // Calculate average volume (0-1 range)
            const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
            const normalizedVolume = average / 255;

            setAudioVolume(normalizedVolume);

            // Continue animation
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        } catch (error) {
            console.warn('Error analyzing audio:', error);
        }
    }, []);

    /**
     * Start audio analysis
     */
    const startAudioAnalysis = useCallback((audioElement: HTMLAudioElement) => {
        setupAudioAnalysis(audioElement).then(() => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            analyzeAudio();
        });
    }, [setupAudioAnalysis, analyzeAudio]);

    /**
     * Stop audio analysis
     */
    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setAudioVolume(0);
    }, []);

    /**
     * Cleanup audio analysis
     */
    const cleanupAudioAnalysis = useCallback(() => {
        stopAudioAnalysis();

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        dataArrayRef.current = null;
    }, [stopAudioAnalysis]);

    /**
     * Cleanup speech recognition
     */
    const cleanupSpeechRecognition = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                recognitionRef.current.abort();
            } catch (error) {
                console.warn('Error cleaning up speech recognition:', error);
            }
            recognitionRef.current = null;
        }
    }, []);

    /**
     * Handles speech recognition
     */
    const startSpeechRecognition = useCallback(async (): Promise<void> => {
        setError(null);
        setIsProcessing(true);

        try {
            // Check browser compatibility
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Speech recognition not supported in this browser');
            }

            // Clean up any existing recognition
            cleanupSpeechRecognition();

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported in this browser');
            }
            const recognition = new SpeechRecognition();
            // @ts-expect-error Speech Recognition instance assignment to ref
            recognitionRef.current = recognition;

            // Configure recognition
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            // Handle recognition results
            recognition.onresult = (event) => {
                try {
                    const transcript = event.results[0]?.[0]?.transcript;
                    if (transcript) {
                        // Process transcript to avoid duplicating words
                        const prevWords = inputValue.trim().split(/\s+/);
                        const newWords = transcript.split(/\s+/);
                        const uniqueNewWords = newWords.filter(word => !prevWords.includes(word));

                        // Combine existing input with new transcript
                        const text = uniqueNewWords.length === 0
                            ? inputValue
                            : inputValue.trim()
                                ? `${inputValue} ${uniqueNewWords.join(' ')}`.trim()
                                : uniqueNewWords.join(' ').trim();

                        setInputValue(text);

                        // Auto-submit if we have text
                        if (text.trim()) {
                            handleSubmit(text);
                        }
                    }
                } catch (error) {
                    console.error('Error processing speech result:', error);
                } finally {
                    setIsProcessing(false);
                    setIsRecording(false);
                }
            };

            // Error handling
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setError(`Speech recognition error: ${event.error}`);
                setIsProcessing(false);
                setIsRecording(false);
            };

            // Cleanup when recognition ends
            recognition.onend = () => {
                setIsProcessing(false);
                setIsRecording(false);
            };

            // Start recognition
            recognition.start();
            setIsRecording(true);

        } catch (error) {
            console.error('Error using speech recognition:', error);
            setError(error instanceof Error ? error.message : 'Failed to process audio');
            setIsProcessing(false);
            setIsRecording(false);
            toast.error('Could not use speech recognition');
        }
    }, [inputValue, cleanupSpeechRecognition]);

    /**
     * Stops the speech recognition process
     */
    const stopRecording = useCallback((): void => {
        cleanupSpeechRecognition();
        setIsRecording(false);
        setIsProcessing(false);
    }, [cleanupSpeechRecognition]);

    /**
     * Handles input changes in the textarea
     */
    const handleInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
        setInputValue(e.target.value);
        adjustTextareaHeight();
    }, []);

    /**
     * Adjusts textarea height based on content
     */
    const adjustTextareaHeight = useCallback((): void => {
        if (textareaRef.current) {
            // Reset height to auto to get the correct scrollHeight
            textareaRef.current.style.height = 'auto';
            // Set the height to the scrollHeight, with a maximum limit
            const maxHeight = 220;
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
        }
    }, []);

    /**
     * Handles prompt submission
     */
    const handleSubmit = useCallback(async (text?: string): Promise<void> => {
        const value = text || inputValue;
        if (!value.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);

            // Stop recording if active
            if (isRecording) {
                stopRecording();
            }

            // Validate that there are file nodes on the canvas
            if (!hasFileNodes()) {
                toast.error("You need to add a file to the canvas before you can submit a prompt");
                return;
            }

            // Add chat node with user message
            addNode(
                { conversation: [{ role: "user", content: value }] },
                undefined,
                "chat-node"
            );

            // Clear the input after successful submission
            setInputValue('');

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (error) {
            console.error('Error submitting prompt:', error);
            toast.error('Failed to submit prompt');
        } finally {
            setIsSubmitting(false);
        }
    }, [inputValue, isSubmitting, isRecording, stopRecording, hasFileNodes, addNode]);

    /**
     * Handles keyboard shortcuts
     */
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>): void => {
        // Submit on Enter without Shift
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Enter' && e.shiftKey) {
            // Adjust height after adding a new line
            setTimeout(adjustTextareaHeight, 0);
        }
    }, [handleSubmit, adjustTextareaHeight]);

    /**
     * Handles file uploads
     */
    const handleFilesUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploadingFiles(true);
        setError(null);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            // Upload files
            const response = await fetch('/api/file-upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            const res = await response.json();

            if (res.success && res.files) {
                // Process file information
                const fileInfoArray: FileInfo[] = res.files.map((file: {
                    fileName: string,
                    fileSize: number,
                    fileUrl: string,
                    mimeType: string
                }) => ({
                    fileName: file.fileName,
                    fileSize: file.fileSize,
                    fileURL: file.fileUrl,
                    fileFormat: file.mimeType.split('/')[1] // Extract format from mimeType
                }));

                // Add documents to the canvas
                addDocuments([...fileInfoArray]);
                toast.success(`Successfully uploaded ${fileInfoArray.length} file(s)`);
            } else {
                throw new Error(res.error || "File upload failed");
            }
        } catch (error) {
            console.error("File upload error:", error);
            setError(error instanceof Error ? error.message : 'Failed to upload files');
            toast.error('File upload failed');
        } finally {
            // Reset the input so the same files can be selected again
            e.target.value = '';
            setUploadingFiles(false);
        }
    }, [addDocuments]);

    // Focus textarea on mount and set up resize observer
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();

            // Create a ResizeObserver to adjust height when window resizes
            resizeObserverRef.current = new ResizeObserver(() => {
                adjustTextareaHeight();
            });

            resizeObserverRef.current.observe(textareaRef.current);
        }

        // Cleanup function
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
            cleanupSpeechRecognition();
        };
    }, [adjustTextareaHeight, cleanupSpeechRecognition]);

    // Monitor audio elements globally for audio analysis
    useEffect(() => {
        if (!playingAudioLink) {
            stopAudioAnalysis();
            return;
        }

        // Find audio element playing the current link
        const audioElements = document.querySelectorAll('audio');
        let targetAudio: HTMLAudioElement | null = null;

        for (const audio of audioElements) {
            if (audio.src === playingAudioLink && !audio.paused) {
                targetAudio = audio;
                break;
            }
        }

        if (targetAudio) {
            startAudioAnalysis(targetAudio);

            // Listen for audio end to stop analysis
            const handleAudioEnd = () => stopAudioAnalysis();
            const handleAudioPause = () => stopAudioAnalysis();

            targetAudio.addEventListener('ended', handleAudioEnd);
            targetAudio.addEventListener('pause', handleAudioPause);

            return () => {
                targetAudio?.removeEventListener('ended', handleAudioEnd);
                targetAudio?.removeEventListener('pause', handleAudioPause);
            };
        }
    }, [playingAudioLink, startAudioAnalysis, stopAudioAnalysis]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupSpeechRecognition();
            cleanupAudioAnalysis();
        };
    }, [cleanupSpeechRecognition, cleanupAudioAnalysis]);

    return (
        <>
            {/* Audio visualization styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes audioFlow {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    
                    @keyframes glowChat {
                        0%, 100% { box-shadow: 0 0 10px rgba(195, 255, 0, 0.3); }
                        50% { box-shadow: 0 0 20px rgba(195, 255, 0, 0.8), 0 0 30px rgba(195, 255, 0, 0.4); }
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `
            }} />

            <div className="fixed left-1/2 bottom-4 -translate-x-1/2 z-10 w-[95%] max-w-[600px]">
                {/* Audio Playing Indicator */}
                {playingAudioLink && <div className='absolute top-0 left-0 right-0 -translate-y-full'>
                    <div
                        className='h-7 translate-y-1/2 w-full rounded-t-lg shadow-lg'
                        style={{
                            background: 'linear-gradient(90deg, #514CE0, #57E9FF, #BC49FF, #F421D8, #514CE0)',
                            backgroundSize: '200% 100%',
                            animation: `audioFlow ${Math.max(0.5, 3 - audioVolume * 1.5)}s linear infinite`,
                            // opacity: Math.max(0.8, audioVolume * 1.2),
                            // filter: `brightness(${1.2 + audioVolume * 0.3})`,
                            boxShadow: `0 -2px 10px rgba(244, 33, 216, ${0.4 + audioVolume * 0.3})`
                        }}
                    />
                </div>}

                <div className={`absolute inset-0 transition-all duration-300 ${isConversationActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <Card
                        className="bg-[#C3FF00] h-[115px] flex flex-row justify-between items-center rounded-lg px-4 py-3 shadow-lg"
                    >
                        <div
                            className='flex items-center justify-center gap-4 w-[300px] cursor-pointer hover:opacity-90 transition-opacity duration-200'
                            onClick={() => {
                                if (!isRecording) {
                                    startSpeechRecognition();
                                } else {
                                    stopRecording();
                                }
                            }}
                        >
                            <div className='w-[120px] h-[60px] relative'>
                                <Image
                                    src={isRecording ? "/assets/icons/voice.svg" : "/assets/icons/voice-s.svg"}
                                    alt="Voice"
                                    fill
                                    className='object-contain transition-all duration-300'
                                    style={{
                                        transform: isRecording ? 'scale(1.1)' : 'scale(1)',
                                        filter: isRecording ? 'brightness(1.1)' : 'brightness(1)'
                                    }}
                                />
                            </div>
                            <p className='text-[#6F9103] text-xs w-[120px] transition-all duration-300'>
                                {isRecording ? "Listening..." : "Tap to speak"}
                            </p>
                        </div>
                        <Button
                            variant={"destructive"}
                            className='transition-all duration-300 hover:scale-105 hover:opacity-90'
                            onClick={() => {
                                stopRecording();
                                setIsConversationActive(false);
                            }}
                        >
                            <X className='h-6 w-6 text-white' />
                        </Button>
                    </Card>
                </div>

                {/* Text input UI */}
                <div className={`transition-all duration-300 ${!isConversationActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <Card className="rounded-lg px-4 py-3 shadow-lg">
                        {error && (
                            <div className="absolute -top-12 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm animate-in fade-in-0 duration-300">
                                {error}
                            </div>
                        )}
                        <div className="flex items-end">
                            <textarea
                                ref={textareaRef}
                                className="flex-1 bg-transparent outline-none resize-none overflow-hidden placeholder-gray-500 text-base border-none"
                                placeholder={isProcessing ? "Transcribing..." : "Ask me..."}
                                style={{
                                    minHeight: '90px',
                                    height: 'auto',
                                }}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                disabled={isSubmitting || isProcessing || isRecording}
                                aria-label="Prompt input"
                            />
                            <div className="flex items-center  ml-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={"ghost"}

                                                disabled={!hasFileNodes()}
                                                onClick={() => {
                                                    setIsConversationActive(true);
                                                }}
                                                aria-label="Voice input"
                                            >
                                                <div className='flex items-center justify-center gap-3'>
                                                    <svg width="17" height="24" viewBox="0 0 17 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M8.502 14.916C7.49506 14.916 6.63916 14.5636 5.93429 13.8587C5.22943 13.1539 4.877 12.298 4.877 11.291V4.04102C4.877 3.03407 5.22943 2.17817 5.93429 1.47331C6.63916 0.768446 7.49506 0.416016 8.502 0.416016C9.50895 0.416016 10.3649 0.768446 11.0697 1.47331C11.7746 2.17817 12.127 3.03407 12.127 4.04102V11.291C12.127 12.298 11.7746 13.1539 11.0697 13.8587C10.3649 14.5636 9.50895 14.916 8.502 14.916ZM7.29367 22.166V19.6587C5.44089 19.3969 3.85495 18.6115 2.53586 17.3025C1.21676 15.9934 0.416239 14.4025 0.134295 12.5296C0.0940171 12.1872 0.184642 11.8952 0.40617 11.6535C0.627698 11.4118 0.909642 11.291 1.252 11.291C1.59436 11.291 1.88134 11.4068 2.11294 11.6384C2.34454 11.87 2.50061 12.157 2.58117 12.4993C2.86311 13.9091 3.56294 15.0671 4.68065 15.9733C5.79836 16.8796 7.07214 17.3327 8.502 17.3327C9.952 17.3327 11.2308 16.8745 12.3385 15.9582C13.4461 15.0419 14.1409 13.8889 14.4228 12.4993C14.5034 12.157 14.6595 11.87 14.8911 11.6384C15.1227 11.4068 15.4096 11.291 15.752 11.291C16.0944 11.291 16.3763 11.4118 16.5978 11.6535C16.8194 11.8952 16.91 12.1872 16.8697 12.5296C16.5878 14.3622 15.7923 15.9431 14.4833 17.2723C13.1742 18.6014 11.5833 19.3969 9.71034 19.6587V22.166C9.71034 22.5084 9.59454 22.7954 9.36294 23.027C9.13134 23.2586 8.84436 23.3743 8.502 23.3743C8.15964 23.3743 7.87266 23.2586 7.64107 23.027C7.40947 22.7954 7.29367 22.5084 7.29367 22.166Z" fill="#3F3F3F" />
                                                    </svg>
                                                </div>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {hasFileNodes() ? "Click for conversation mode" : "Add a file to the canvas first"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="purple"
                                                aria-label="Submit prompt"
                                                disabled={!inputValue.trim() || !hasFileNodes()}
                                                onClick={() => handleSubmit()}
                                                type="submit"
                                            >
                                                <ArrowRight className="h-5 w-5 text-white" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {hasFileNodes() && inputValue.trim() ? "Click to submit" : "Add a file and a prompt first"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider >
                                    <Tooltip >
                                        <TooltipTrigger asChild className='hidden'>
                                            <label
                                                htmlFor="file-upload"
                                                className={`cursor-pointer hidden bg-gray-200 rounded-full p-2 ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
                                                aria-label="Upload files"
                                            >
                                                {uploadingFiles ? (
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                                                ) : (
                                                    <Plus className="h-6 w-6 text-gray-500" />
                                                )}
                                            </label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {uploadingFiles ? "Uploading..." : "Upload files"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    onChange={handleFilesUpload}
                                    className="hidden"
                                    disabled={uploadingFiles}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default PromptBar;