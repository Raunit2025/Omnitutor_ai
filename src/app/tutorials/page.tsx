"use client"
import React, { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import { PlayCircle, BookOpen, Presentation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TutorialsPage = () => {
    // Tracks which tutorial video is currently open
    const [activeVideo, setActiveVideo] = useState<number | null>(null);

    const tutorials = [
        { 
            id: 1, 
            title: "Welcome to Omnitutor", 
            icon: <Presentation className="w-6 h-6" />, 
            duration: "2 min video",
            // Change this to the exact name of your video file in the public folder!
            videoSrc: "/videos/omnitutor-intro.mp4" 
        },
        { 
            id: 2, 
            title: "Generate the Perfect Study Plan", 
            icon: <BookOpen className="w-6 h-6" />, 
            duration: "8 min guide",
            videoSrc: "/videos/omnitutor-intro.mp4" // You can add other videos later
        },
        { 
            id: 3, 
            title: "Using Veo for Custom Videos", 
            icon: <PlayCircle className="w-6 h-6" />, 
            duration: "5 min guide",
            videoSrc: "/videos/omnitutor-intro.mp4" // You can add other videos later
        }
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center">
            <div className="w-full max-w-6xl mt-4">
                <Navbar />
            </div>

            <main className="flex-1 w-full max-w-6xl px-4 py-20 flex flex-col items-center">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
                        Omnitutor Tutorials
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Master your AI study companion with our interactive quick-start guides and workflow tutorials.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 w-full">
                    {tutorials.map((tutorial) => (
                        <div key={tutorial.id} className="flex flex-col">
                            <div 
                                onClick={() => setActiveVideo(activeVideo === tutorial.id ? null : tutorial.id)}
                                className={`bg-white p-6 rounded-2xl border ${activeVideo === tutorial.id ? 'border-[#754DFA] shadow-md' : 'border-gray-200 shadow-sm'} hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group`}
                            >
                                <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#754DFA] mb-4 group-hover:scale-110 transition-transform">
                                    {tutorial.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{tutorial.title}</h3>
                                <p className="text-sm text-gray-500 mt-auto">{tutorial.duration}</p>
                            </div>

                            {/* Interactive Video Expansion - Now uses native HTML5 Video */}
                            <AnimatePresence>
                                {activeVideo === tutorial.id && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="w-full overflow-hidden rounded-2xl bg-black relative aspect-video shadow-lg"
                                    >
                                        <button 
                                            onClick={() => setActiveVideo(null)}
                                            className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        
                                        {/* HTML5 Native Video Player */}
                                        <video 
                                            src={tutorial.videoSrc}
                                            controls
                                            autoPlay
                                            className="w-full h-full object-contain bg-black outline-none"
                                            controlsList="nodownload"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default TutorialsPage;