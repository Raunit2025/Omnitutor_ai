"use client"
import { Input } from "@/components/ui/input"
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

const courseSchema = z.object({
    current_course: z.string()
        .min(2, "Course name must be at least 2 characters")
        .max(100, "Course name must be less than 100 characters")
});

type CourseForm = z.infer<typeof courseSchema>;

const Course = () => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<CourseForm>({
        resolver: zodResolver(courseSchema)
    });
    const { nextStep, previousStep, setIsStepValid, isSubmitting, setIsSubmitting, userData, setUserDataValue } = useOnboarding();
    const courseName = watch('current_course');

    useEffect(() => {
        setIsStepValid(!!courseName && courseName.length >= 2);
    }, [courseName, setIsStepValid]);

    const { mutate: updateCourse } = api.onboarding.updateCourse.useMutation({
        onSuccess: () => {
            toast.success("Course updated successfully");
            setIsSubmitting(false);

            nextStep();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update course");
            setIsSubmitting(false);
        }
    });

    const onSubmit = (data: CourseForm) => {
        setIsSubmitting(true);
        updateCourse(data);
        setUserDataValue({ ...userData, current_course: data.current_course } as UserDocument);
    }

    return (
        <div className="flex flex-col w-full flex-1 justify-center">
            <h1 className="font-bold  text-xl text-white mb-1 3xl:mb-2">What are you studying?</h1>
            <p className="text-white text-xs font-light  mb-4 3xl:mb-6">Tell us your course name</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 3xl:gap-4">
                <div className="flex flex-col gap-1 3xl:gap-2">
                    <Label htmlFor="course" className="block text-base  font-bold text-white mb-1">
                        {userData?.current_role === "school_student" ? "Class Name" : (userData?.current_role === "college_student" ? "Course Name" : "Highest Qualification")}
                    </Label>
                    <Input
                        id="course"
                        type="text"
                        defaultValue={userData?.current_course ?? ''}
                        className={`bg-[#333] border-none text-white  placeholder:text-[#bdbdbd] h-11 px-4 text-base rounded-md ${errors.current_course ? 'border-red-500' : ''
                            }`}
                        placeholder={userData?.current_role === "school_student" ? "CBSE Class 12th Commerce with Maths" : (userData?.current_role === "college_student" ? "B.tech Computer Science 4th year" : "B.tech Computer Science graduate")}
                        {...register('current_course')}
                    />
                    {errors.current_course && (
                        <p className="text-red-500 text-sm mt-1">{errors.current_course.message}</p>
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
                        disabled={isSubmitting || !courseName}
                        className="w-full py-5"
                    >
                        {isSubmitting ? "Updating..." : "Next"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Course