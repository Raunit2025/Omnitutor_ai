"use client"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { useOnboarding } from "./OnboardingContext"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import type { UserDocument } from "@/types/user"

const roleSchema = z.object({
    current_role: z.string()
        .min(1, "Please select a role")
});

type RoleForm = z.infer<typeof roleSchema>;

const Role = () => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RoleForm>({
        resolver: zodResolver(roleSchema)
    });
    const { nextStep, previousStep, setIsStepValid, isSubmitting, setIsSubmitting, userData, setUserDataValue } = useOnboarding();
    const currentRole = watch('current_role');

    useEffect(() => {
        setIsStepValid(!!currentRole);
        setValue('current_role', userData?.current_role ?? '');
    }, [currentRole, setIsStepValid, userData]);

    const { mutate: updateRole } = api.onboarding.updateRole.useMutation({
        onSuccess: () => {
            toast.success("Role updated successfully");

            setIsSubmitting(false);
            nextStep();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update role");
            setIsSubmitting(false);
        }
    });

    const onSubmit = (data: RoleForm) => {
        setIsSubmitting(true);
        updateRole(data);
        setUserDataValue({ ...userData, current_role: data.current_role } as UserDocument);
    }

    const handleRoleSelect = (roleValue: string) => {
        setValue('current_role', roleValue);
    };

    return (
        <div className="flex flex-col w-full flex-1 justify-center">
            <h1 className="font-bold  text-xl text-white mb-1 3xl:mb-2">What is your current role?</h1>
            <p className="text-white text-xs font-light  mb-4 3xl:mb-6">Select your current occupation</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 3xl:gap-4">
                <div className="flex flex-col gap-1 3xl:gap-2">
                    <Label htmlFor="role" className="block text-base  font-bold text-white mb-1">
                        Current Role
                    </Label>
                    {[
                        { value: 'school_student', label: 'School Student', key: 'A' },
                        { value: 'college_student', label: 'College Student', key: 'B' },
                        { value: 'preparing_for_exam', label: 'Preparing for Exam', key: 'C' },
                    ].map((role) => (
                        <label
                            key={role.value}
                            className={`flex items-center gap-4 bg-[#333] rounded-md my-2 p-2 cursor-pointer shadow-md transition-all border border-transparent hover:border-[#8f7cfb] ${role.value === currentRole ? 'border-[#8f7cfb] bg-gray-600' : ''
                                }`}
                            onClick={() => handleRoleSelect(role.value)}
                        >
                            <span className="flex items-center justify-center w-12 h-12 bg-[#222] rounded-md text-white font-bold text-xl ">
                                {role.key}
                            </span>
                            <input
                                type="radio"
                                value={role.value}
                                checked={role.value === currentRole}
                                {...register('current_role')}
                                className="hidden"
                                onChange={() => handleRoleSelect(role.value)}
                            />
                            <span className="text-white text-xl  font-bold">{role.label}</span>
                        </label>
                    ))}
                    {errors.current_role && (
                        <p className="text-red-500 text-sm mt-1">{errors.current_role.message}</p>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                        type="button"
                        onClick={previousStep}
                        variant="secondary"
                        className="w-full py-5"
                    >
                        Previous
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || !currentRole}
                        className="w-full py-5"
                    >
                        {isSubmitting ? "Updating..." : "Next"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Role