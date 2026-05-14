import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';

export const metadata = {
    title: 'Pricing - Omnitutor',
    description: 'Simple, transparent pricing for your AI study companion.',
};

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center">
            <div className="w-full max-w-6xl mt-4">
                <Navbar />
            </div>

            <main className="flex-1 w-full max-w-6xl px-4 py-20 flex flex-col items-center">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Start for free, upgrade when you need more power. 
                        Omnitutor is built to scale with your academic journey.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                    {/* Free Tier */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col">
                        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Basic Scholar</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-[#1A1A1A]">₹0</span>
                            <span className="text-gray-500">/month</span>
                        </div>
                        <p className="text-gray-600 mb-8 border-b border-gray-100 pb-8">
                            Perfect for students just getting started with AI-assisted learning.
                        </p>
                        
                        <ul className="flex flex-col gap-4 mb-8 flex-1">
                            {['Up to 3 Study Canvases', 'Basic AI Study Plans', 'Standard PDF uploads', 'Community Support'].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-700">
                                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className="w-full">
                            <Button variant="outline" className="w-full py-6 text-lg">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Pro Tier */}
                    <div className="bg-[#1A1A1A] rounded-2xl p-8 shadow-xl border border-gray-800 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-[#754DFA] text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                            Most Popular
                        </div>
                        <h2 className="text-2xl font-semibold text-white mb-2">Omni Pro</h2>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">₹499</span>
                            <span className="text-gray-400">/month</span>
                        </div>
                        <p className="text-gray-400 mb-8 border-b border-gray-800 pb-8">
                            Advanced features for serious exam preparation and deep learning.
                        </p>
                        
                        <ul className="flex flex-col gap-4 mb-8 flex-1">
                            {[
                                'Unlimited Study Canvases', 
                                'Advanced Veo Video Generation', 
                                'Unlimited AI Tutoring Chats', 
                                'Priority Audio Generation',
                                'Export Study Plans to PDF'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <Check className="h-5 w-5 text-[#754DFA] flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <Link href="/signup" className="w-full">
                            <Button variant="lime" className="w-full py-6 text-lg font-semibold text-[#1A1A1A]">
                                Upgrade to Pro
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PricingPage;