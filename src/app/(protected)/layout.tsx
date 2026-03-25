"use client"
import { api } from '@/trpc/react';
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';

const layout = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const { data: profile, isLoading: isProfileLoading } = api.user.getProfile.useQuery();
    useEffect(() => {
        if (!isProfileLoading && !profile) {
            router.push('/login');
        }
    }, [profile, isProfileLoading, router]);
    return (
        <div>
            {children}
        </div>
    )
}

export default layout