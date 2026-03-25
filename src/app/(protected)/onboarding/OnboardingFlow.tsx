"use client"
import { Card } from '@/components/ui/card';
import UserName from './UserName';
import Country from './Country';
import Role from './Role';
import Course from './Course';
import PreparingFor from './PreparingFor';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import type { UserDocument } from '@/types/user';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface OnboardingStep {
    id: string;
    component: React.ComponentType;
    title: string;
    isCompleted: boolean;
}

const OnboardingSteps = ({ userData }: { userData: UserDocument }) => {
    const { currentStep, setCurrentStep, setUserData } = useOnboarding();
    const [progress, setProgress] = useState(0);

    const steps: OnboardingStep[] = [
        {
            id: 'name',
            component: UserName,
            title: 'Name',
            isCompleted: !!userData?.name
        },
        {
            id: 'country',
            component: Country,
            title: 'Country',
            isCompleted: !!userData?.country_name
        },
        {
            id: 'role',
            component: Role,
            title: 'Role',
            isCompleted: !!userData?.current_role
        },
        {
            id: 'course',
            component: Course,
            title: 'Course',
            isCompleted: !!userData?.current_course
        },
        {
            id: 'preparing_for',
            component: PreparingFor,
            title: 'Preparing For',
            isCompleted: !!userData?.preparing_for?.length
        }
    ];

    useEffect(() => {
        setUserData(userData);
        // Calculate initial step based on completed fields
        const completedSteps = steps.filter(step => step.isCompleted).length;
        setProgress((completedSteps / steps.length) * 100);

        // Set initial step to first incomplete step
        const firstIncompleteStep = steps.findIndex(step => !step.isCompleted);
        if (firstIncompleteStep !== -1) {
            setCurrentStep(firstIncompleteStep);
        }

    }, [userData]);

    const CurrentStepComponent = steps[currentStep]?.component;

    return (
        <div className="flex flex-col w-full items-center">
            <div className="w-full max-w-md mb-6 hidden">
                <div className="flex justify-between mb-2">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`flex items-center ${index < currentStep ? 'text-green-500' :
                                index === currentStep ? 'text-white' : 'text-gray-500'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index < currentStep ? 'bg-green-500' :
                                index === currentStep ? 'bg-white' : 'bg-gray-500'
                                }`}>
                                {index + 1}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-16 h-1 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-500'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-sm text-white">
                    <span>Progress: {Math.round(progress)}%</span>
                    <span>Step {currentStep + 1} of {steps.length}</span>
                </div>
            </div>
            <Card className="w-full max-w-[480px] rounded-[24px] border p-5 gap-3 border-[#444] shadow-[0_2px_16px_0_rgba(0,0,0,0.45)] bg-gradient-to-b from-[rgba(19,19,19,0.8)] to-[rgba(0,0,0,0.6)] flex flex-col items-center overflow-hidden">
                {CurrentStepComponent && <CurrentStepComponent />}
            </Card>
        </div>
    );
};

const OnboardingFlow = ({ userData }: { userData: UserDocument }) => {
    return (
        <OnboardingProvider totalSteps={5}>
            <OnboardingSteps userData={userData} />
        </OnboardingProvider>
    );
};

export default OnboardingFlow; 