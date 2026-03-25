import React, { useEffect, useState } from 'react';
import { type VoiceInteractionProps } from './types';

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
    isActive,
    onUserResponse,
    onTimeout,
    countdown
}) => {
    const [userClicked, setUserClicked] = useState<string | null>(null);

    // Reset clicked state when becoming active
    useEffect(() => {
        if (isActive) {
            setUserClicked(null);
        }
    }, [isActive]);

    // Handle timeout when countdown reaches 0
    useEffect(() => {
        if (countdown <= 0 && isActive && !userClicked) {
            console.log('Countdown reached 0, triggering timeout');
            onTimeout();
        }
    }, [countdown, isActive, onTimeout, userClicked]);

    // Play voice prompt when countdown starts
    useEffect(() => {
        if (isActive && countdown === 5 && !userClicked) {
            try {
                // if ('speechSynthesis' in window) {
                //     // Cancel any ongoing speech
                //     window.speechSynthesis.cancel();

                //     const utterance = new SpeechSynthesisUtterance("Are you ready to move to the next slide?");
                //     utterance.rate = 1;
                //     utterance.pitch = 1;
                //     utterance.volume = 0.8;
                //     utterance.lang = 'en-US';

                //     setTimeout(() => {
                //         window.speechSynthesis.speak(utterance);
                //     }, 100); // Small delay to ensure speech synthesis is ready
                // }
                setUserClicked('yes');
                onUserResponse('yes');
            } catch (error) {
                console.error('Error playing voice prompt:', error);
            }
        }
    }, [isActive, countdown, userClicked]);

    if (!isActive) return null;

    return (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm transition-all duration-300 ease-in-out z-50 hidden">
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">Ready for Next Slide?</h3>
                    <p className="text-xs text-gray-600">Auto-advancing in {countdown}s</p>
                </div>
            </div>

            <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2 mb-3">
                {userClicked === 'no' ? (
                    <div className="flex items-center space-x-2 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>✓ Staying on this slide</span>
                    </div>
                ) : userClicked === 'yes' ? (
                    <div className="flex items-center space-x-2 text-xs text-purple-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span>Moving to next slide...</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 text-xs text-purple-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span>Auto-advancing in {countdown} seconds</span>
                    </div>
                )}

                {!userClicked && (
                    <p className="text-xs text-gray-500">
                        Click "Stay Here" if you need more time on this slide
                    </p>
                )}
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={() => {
                        console.log('Stay Here button clicked');
                        setUserClicked('no');
                        onUserResponse('no');
                    }}
                    disabled={userClicked !== null}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 ${userClicked === 'no'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : userClicked
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200 focus:ring-red-500'
                        }`}
                >
                    {userClicked === 'no' ? '✓ Staying' : '🛑 Stay Here'}
                </button>
                <button
                    onClick={() => {
                        console.log('Next Slide button clicked');
                        setUserClicked('yes');
                        onUserResponse('yes');
                    }}
                    disabled={userClicked !== null}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 ${userClicked === 'yes'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : userClicked
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 focus:ring-green-500'
                        }`}
                >
                    {userClicked === 'yes' ? '→ Moving...' : '➡️ Next Slide'}
                </button>
            </div>

            <div className="mt-2 text-center">
                <p className="text-xs text-gray-400">
                    Or use keyboard: Space/→ for next, ← for previous
                </p>
            </div>
        </div>
    );
};

export default VoiceInteraction; 