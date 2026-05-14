import React from 'react';
import Navbar from '@/components/landing/Navbar';
import { PlayCircle, BookOpen, Presentation } from 'lucide-react';

export const metadata = {
    title: 'Tutorials - Omnitutor',
    description: 'Learn how to maximize your studying with Omnitutor.',
};

const TutorialsPage = () => {
    const tutorials = [
        { title: "Getting Started with AI Canvases", icon: <Presentation className="w-6 h-6" />, duration: "5 min read" },
        { title: "How to Generate the Perfect Study Plan", icon: <BookOpen className="w-6 h-6" />, duration: "8 min read" },
        { title: "Using Veo to Generate Custom Video Explanations", icon: <PlayCircle className="w-6 h-6" />, duration: "10 min video" }
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
                        Master your AI study companion with our quick-start guides and advanced workflow tutorials.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 w-full">
                    {tutorials.map((tutorial, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col items-center text-center group">
                            <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#754DFA] mb-4 group-hover:scale-110 transition-transform">
                                {tutorial.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{tutorial.title}</h3>
                            <p className="text-sm text-gray-500 mt-auto">{tutorial.duration}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default TutorialsPage;