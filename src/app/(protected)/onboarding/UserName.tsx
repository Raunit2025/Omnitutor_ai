"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { useOnboarding } from "./OnboardingContext"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import type { UserDocument } from "@/types/user"

const nameSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")
        .regex(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces")
});

type UserNameForm = z.infer<typeof nameSchema>;

const UserName = () => {
    const { nextStep, userData, setUserDataValue } = useOnboarding();
    const { register, handleSubmit, formState: { errors } } = useForm<UserNameForm>({
        resolver: zodResolver(nameSchema)
    });

    const { mutate: updateUserName, isPending } = api.onboarding.updateUserName.useMutation({
        onSuccess: () => {
            toast.success("Name updated successfully");

            nextStep();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update name");
        }
    });

    const onSubmit = (data: UserNameForm) => {
        updateUserName(data);
        setUserDataValue({ ...userData, name: data.name } as UserDocument);
    }

    return (
        <div className="flex flex-col w-full flex-1 justify-center">
            <h1 className="font-bold  text-xl text-white mb-1 3xl:mb-2">What should we call you?</h1>
            <p className="text-white text-xs font-light  mb-4 3xl:mb-6">We&apos;ll use this name to personalize your experience.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 3xl:gap-4">
                <div className="flex flex-col gap-1 3xl:gap-2">
                    <Label htmlFor="name" className="block text-base  font-bold text-white mb-1">
                        Name
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        defaultValue={userData?.name ?? ''}
                        className={`bg-[#333] border-none text-white  placeholder:text-[#bdbdbd] h-11 px-4 text-base rounded-md ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Enter your name"
                        {...register('name')}
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}

                    <Button type="submit" className="w-full mt-3" disabled={isPending}>
                        {isPending ? 'Updating...' : 'Next'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default UserName