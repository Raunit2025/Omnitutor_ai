import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type AudioPlayerProps } from './types';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    audioUrl,
    title = "Audio Narration",
    autoPlay = false,
    onAudioEnd,
    onAudioStart
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [userHasInteracted, setUserHasInteracted] = useState(false);
    const [showEnableAudioPrompt, setShowEnableAudioPrompt] = useState(false);
    const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const hasAutoPlayedRef = useRef(false);
    const pendingAutoPlayRef = useRef(false);

    // Detect user interaction globally
    useEffect(() => {
        const handleUserInteraction = () => {
            setUserHasInteracted(true);
            setShowEnableAudioPrompt(false);

            // Try to play pending audio if there's any
            if (pendingAutoPlayRef.current) {
                pendingAutoPlayRef.current = false;
                // Use the ref to avoid dependency issues
                const audio = audioRef.current;
                if (audio) {
                    audio.play().then(() => {
                        setIsPlaying(true);
                        onAudioStart?.();
                    }).catch(error => {
                        console.error('Error playing pending audio:', error);
                        setIsPlaying(false);
                    });
                }
            }
        };

        // Listen for various user interaction events
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, handleUserInteraction, { once: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserInteraction);
            });
        };
    }, [onAudioStart]); // Only depend on onAudioStart

    // Keyboard shortcuts for volume control
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    adjustVolume(0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    adjustVolume(-0.1);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [volume, isMuted]);

    const playAudio = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            await audio.play();
            setIsPlaying(true);
            onAudioStart?.();
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);

            // If autoplay failed due to lack of user interaction, show prompt
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                setShowEnableAudioPrompt(true);
                pendingAutoPlayRef.current = true;
            }
        }
    }, [onAudioStart]);

    // Reset auto-play state when audioUrl changes
    useEffect(() => {
        hasAutoPlayedRef.current = false;
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setShowEnableAudioPrompt(false);
        pendingAutoPlayRef.current = false;
    }, [audioUrl]);

    // Handle auto-play when autoPlay prop changes
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl || !autoPlay || hasAutoPlayedRef.current) return;

        // If audio is already loaded and ready, try to play
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            hasAutoPlayedRef.current = true;
            if (userHasInteracted) {
                playAudio();
            } else {
                // Store the intention to autoplay for after user interaction
                pendingAutoPlayRef.current = true;
                setShowEnableAudioPrompt(true);
            }
        }
    }, [autoPlay, audioUrl, playAudio, userHasInteracted]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => {
            setIsLoading(false);
            // Set playback rate when audio is ready
            audio.playbackRate = playbackRate;
            // Auto-play if enabled and hasn't auto-played yet
            if (autoPlay && !hasAutoPlayedRef.current) {
                hasAutoPlayedRef.current = true;
                if (userHasInteracted) {
                    playAudio();
                } else {
                    // Store the intention to autoplay for after user interaction
                    pendingAutoPlayRef.current = true;
                    setShowEnableAudioPrompt(true);
                }
            }
        };
        const handleEnded = () => {
            setIsPlaying(false);
            onAudioEnd?.();
        };
        const handlePause = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('play', handlePlay);

        // Trigger load if src is set
        audio.load();

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('play', handlePlay);
        };
    }, [audioUrl, autoPlay, onAudioEnd, playAudio, playbackRate, userHasInteracted]);

    // Update playback rate when it changes
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Update audio volume when volume or mute state changes
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const togglePlayPause = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                await playAudio();
            }
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            setVolume(previousVolume > 0 ? previousVolume : 0.5);
        } else {
            setPreviousVolume(volume);
            setIsMuted(true);
        }
    };

    const adjustVolume = (delta: number) => {
        const newVolume = Math.max(0, Math.min(1, volume + delta));
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
        if (newVolume === 0) {
            setIsMuted(true);
        }
    };

    const handleEnableAudio = () => {
        setUserHasInteracted(true);
        setShowEnableAudioPrompt(false);
        if (pendingAutoPlayRef.current) {
            pendingAutoPlayRef.current = false;
            // Use the ref to avoid dependency issues
            const audio = audioRef.current;
            if (audio) {
                audio.play().then(() => {
                    setIsPlaying(true);
                    onAudioStart?.();
                }).catch(error => {
                    console.error('Error playing pending audio:', error);
                    setIsPlaying(false);
                });
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
        if (newVolume === 0) {
            setIsMuted(true);
        }
    };

    const handlePlaybackRateChange = (rate: number) => {
        setPlaybackRate(rate);
    };

    // Get volume icon based on current volume level
    const getVolumeIcon = () => {
        if (isMuted || volume === 0) {
            return (
                <VolumeX className="w-5 h-5 text-gray-500" />
            );
        } else if (volume < 0.3) {
            return (
                <Volume className="w-5 h-5 text-gray-500" />
            );
        } else if (volume < 0.7) {
            return (
                <Volume1 className="w-5 h-5 text-gray-500" />
            );
        } else {
            return (
                <Volume2 className="w-5 h-5 text-gray-500" />
            );
        }
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const volumePercentage = Math.round((isMuted ? 0 : volume) * 100);

    if (!audioUrl) {
        return (
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                </div>
                <div className="flex-1 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-8 h-6 bg-gray-300 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Enable Audio Prompt */}
            {showEnableAudioPrompt && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L6.269 15H4a1 1 0 01-1-1V6a1 1 0 011-1h2.269l2.114-1.816zM15.5 6.5a1 1 0 011.414 0 5.5 5.5 0 010 7.778 1 1 0 01-1.414-1.414 3.5 3.5 0 000-4.95 1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-purple-800">
                            Click to enable audio autoplay for this lesson
                        </span>
                    </div>
                    <button
                        onClick={handleEnableAudio}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                        Enable Audio
                    </button>
                </div>
            )}

            {/* Audio Player */}
            <div className="flex items-center bg-white rounded-lg px-4 py-3 space-x-4 shadow-sm border border-gray-200">
                <audio ref={audioRef} src={audioUrl} preload="metadata" />

                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm6 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* Enhanced Volume Control */}
                <div className="flex items-center space-x-2 group">
                    {/* Mute/Unmute Button */}
                    <button
                        onClick={toggleMute}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                        onMouseEnter={() => setShowVolumeTooltip(true)}
                        onMouseLeave={() => setShowVolumeTooltip(false)}
                    >
                        {getVolumeIcon()}
                    </button>

                    {/* Volume Slider */}
                    <div className="relative flex items-center space-x-2">
                        <div className="relative w-20 h-6 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 hover:bg-gray-300 transition-colors"
                                style={{
                                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volumePercentage}%, #e5e7eb ${volumePercentage}%, #e5e7eb 100%)`
                                }}
                                aria-label="Volume"
                            />
                            {/* Volume slider thumb */}
                            <style jsx>{`
                                input[type="range"]::-webkit-slider-thumb {
                                    appearance: none;
                                    width: 16px;
                                    height: 16px;
                                    border-radius: 50%;
                                    background: #8b5cf6;
                                    cursor: pointer;
                                    border: 2px solid white;
                                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                                }
                                input[type="range"]::-moz-range-thumb {
                                    width: 16px;
                                    height: 16px;
                                    border-radius: 50%;
                                    background: #8b5cf6;
                                    cursor: pointer;
                                    border: 2px solid white;
                                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                                }
                            `}</style>
                        </div>

                        {/* Volume Percentage Display */}
                        <span className="text-xs font-medium text-gray-500 w-8 text-center">
                            {volumePercentage}%
                        </span>

                        {/* Volume Tooltip */}
                        {showVolumeTooltip && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                                {isMuted ? 'Unmute' : 'Mute'} (M)
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="flex-1 relative">
                    <div className="w-full h-2 bg-gray-300 rounded-full">
                        <div
                            className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                        aria-label="Seek audio"
                    />
                </div>

                {/* Playback Speed Control */}
                <button
                    onClick={() => {
                        const currentIndex = playbackRates.indexOf(playbackRate);
                        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % playbackRates.length : 0;
                        const nextRate = playbackRates[nextIndex];
                        if (nextRate) {
                            handlePlaybackRateChange(nextRate);
                        }
                    }}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    aria-label="Playback speed"
                >
                    {playbackRate}x
                </button>
            </div>

            {/* Keyboard Shortcuts Info */}

        </div>
    );
};

export default AudioPlayer; 