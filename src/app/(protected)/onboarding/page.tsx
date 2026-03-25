'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';
import OnboardingFlow from './OnboardingFlow';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserDocument } from '@/types/user';

const OnboardingPage = () => {
    const router = useRouter();
    const { data: userData, isLoading, error } = api.onboarding.createUser.useQuery(undefined, {
        retry: 1,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        // Redirect to dashboard if user is already onboarded
        if (userData?.user?.onboarded_on) {
            router.push('/');
        }
    }, [userData, router]);

    // Handle error state
    if (error) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center">
                <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
                <p className="text-gray-500 mb-4">{error.message}</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Loading state with skeleton UI
    if (isLoading) {
        return (
            <div className="p-6 pt-20 space-y-6 min-h-screen bg-background">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-[#f3f3f5] bg-center bg-no-repeat"
        >
            {userData?.user && <OnboardingFlow userData={userData.user as UserDocument} />}
        </div>
    );
};

export default OnboardingPage;