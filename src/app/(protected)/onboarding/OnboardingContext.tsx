"use client"
import { createContext, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserDocument } from '@/types/user';

interface OnboardingContextType {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
    totalSteps: number;
    userData: UserDocument | null;
    setUserData: (userData: UserDocument) => void;
    isStepValid: boolean;
    setIsStepValid: (isValid: boolean) => void;
    isSubmitting: boolean;
    setIsSubmitting: (isSubmitting: boolean) => void;
    setUserDataValue: (userData: UserDocument) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children, totalSteps }: { children: ReactNode; totalSteps: number }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isStepValid, setIsStepValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const [userData, setUserData] = useState<UserDocument | null>(null);

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
            setIsStepValid(false); // Reset validation for next step
        } else {
            // Onboarding complete, redirect to dashboard or home
            router.push('/');
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setIsStepValid(true); // Previous step was already valid
        }
    };

    const setUserDataValue = (userData: UserDocument) => {
        setUserData(userData);
    }

    return (
        <OnboardingContext.Provider value={{
            currentStep,
            setCurrentStep,
            nextStep,
            previousStep,
            totalSteps,
            userData,
            setUserData,
            isStepValid,
            setIsStepValid,
            isSubmitting,
            setIsSubmitting,
            setUserDataValue
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}; 