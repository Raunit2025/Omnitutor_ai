import React from 'react';
import Navbar from '@/components/landing/Navbar';
import { Mail, MessageCircle, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Support - Omnitutor',
    description: 'Get help with Omnitutor.',
};

const SupportPage = () => {
    return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center">
            <div className="w-full max-w-6xl mt-4">
                <Navbar />
            </div>

            <main className="flex-1 w-full max-w-6xl px-4 py-20 flex flex-col items-center">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
                        How can we help you?
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Whether you found a bug or need help optimizing your study plan, our team is here for you.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mb-16">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start">
                        <MessageCircle className="w-8 h-8 text-[#754DFA] mb-4" />
                        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Live Chat</h2>
                        <p className="text-gray-600 mb-6 flex-1">Chat with our support team during regular academic hours for instant help.</p>
                        <Button variant="outline" className="w-full">Start Chat</Button>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start">
                        <Mail className="w-8 h-8 text-[#754DFA] mb-4" />
                        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Email Support</h2>
                        <p className="text-gray-600 mb-6 flex-1">Send us a detailed message and we'll get back to you within 24 hours.</p>
                        <Button variant="lime" className="w-full text-[#1A1A1A]">Contact Us</Button>
                    </div>
                </div>

                <div className="w-full max-w-3xl bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <FileQuestion className="w-6 h-6 text-[#1A1A1A]" />
                        <h2 className="text-2xl font-semibold text-[#1A1A1A]">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4 text-left">
                        <div>
                            <h3 className="font-semibold text-[#1A1A1A]">How do I reset my Appwrite login?</h3>
                            <p className="text-gray-600 text-sm">Navigate to the login screen and click "Forgot Password" to receive a reset link.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-[#1A1A1A]">Why did my study plan fail to generate?</h3>
                            <p className="text-gray-600 text-sm">Ensure your target date is set in the future and you haven't exceeded your daily AI quota.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SupportPage;