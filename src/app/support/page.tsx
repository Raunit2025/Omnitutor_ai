"use client"
import React, { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import { Mail, MessageCircle, FileQuestion, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SupportPage = () => {
    const [emailMessage, setEmailMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailMessage.trim()) {
            toast.error("Please enter a message before sending.");
            return;
        }

        setIsSending(true);
        
        try {
            // Send the actual email via Web3Forms API
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    // PASTE YOUR KEY HERE
                    access_key: "bedf13dd-3eec-4070-a73d-7b787ff8ea01", 
                    subject: "New Support Ticket - Omnitutor",
                    from_name: "Omnitutor Support Bot",
                    message: emailMessage,
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                setEmailMessage("");
                toast.success("Support ticket sent! Check your email inbox.");
            } else {
                throw new Error("API rejected the message");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleLiveChat = () => {
        toast.info("All support agents are currently assisting other students. Please send us an email instead!");
    };

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
                    {/* Live Chat Feature */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start h-full">
                        <MessageCircle className="w-8 h-8 text-[#754DFA] mb-4" />
                        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Live Chat</h2>
                        <p className="text-gray-600 mb-6 flex-1">Chat with our support team during regular academic hours for instant help.</p>
                        <Button variant="outline" className="w-full" onClick={handleLiveChat}>
                            Start Chat
                        </Button>
                    </div>

                    {/* Interactive Email Feature */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start h-full">
                        <Mail className="w-8 h-8 text-[#754DFA] mb-4" />
                        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Email Support</h2>
                        <p className="text-gray-600 mb-4">Send us a detailed message and we'll get back to you within 24 hours.</p>
                        
                        <form onSubmit={handleSendEmail} className="w-full flex flex-col gap-3 mt-auto">
                            <textarea 
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#754DFA] resize-none text-sm"
                                rows={3}
                                placeholder="Describe your issue here..."
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                disabled={isSending}
                            />
                            <Button variant="lime" type="submit" className="w-full text-[#1A1A1A]" disabled={isSending}>
                                {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                {isSending ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
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