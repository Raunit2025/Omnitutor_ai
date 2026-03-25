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
import { useEffect, useState } from "react"
import type { UserDocument } from "@/types/user"


const countrySchema = z.object({
    country_name: z.string()
        .min(2, "Country name must be at least 2 characters")
        .max(50, "Country name must be less than 50 characters")
        .regex(/^[a-zA-Z\s]*$/, "Country name can only contain letters and spaces")
});

type CountryNameForm = z.infer<typeof countrySchema>;

const Country = () => {
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CountryNameForm>({
        resolver: zodResolver(countrySchema)
    });
    const { nextStep, previousStep, setIsStepValid, isSubmitting, setIsSubmitting, userData, setUserDataValue } = useOnboarding();
    const countryName = watch('country_name');
    const [isLoadingCountry, setIsLoadingCountry] = useState(false);

    // Update step validity when country name changes
    useEffect(() => {
        setIsStepValid(!!countryName && countryName.length >= 2);
    }, [countryName, setIsStepValid]);

    const { mutate: updateCountryName } = api.onboarding.updateCountryName.useMutation({
        onSuccess: () => {
            toast.success("Country updated successfully");
            setIsSubmitting(false);

            nextStep();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update country");
            setIsSubmitting(false);
        }
    });

    const onSubmit = (data: CountryNameForm) => {
        setIsSubmitting(true);
        updateCountryName(data);
        setUserDataValue({ ...userData, country_name: data.country_name } as UserDocument);
    }

    // Get user's country based on IP address
    useEffect(() => {
        const detectCountry = async () => {
            if (userData?.country_name) return;

            try {
                setIsLoadingCountry(true);
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                if (data.country_name) {
                    setValue('country_name', data.country_name);
                }
            } catch (error) {
                console.error('Error detecting country:', error);
            } finally {
                setIsLoadingCountry(false);
            }
        };

        detectCountry();
    }, [setValue, userData?.country_name]);

    return (
        <div className="flex flex-col w-full flex-1 justify-center">
            <h1 className="font-bold  text-xl text-white mb-1 3xl:mb-2">Where are you from?</h1>
            <p className="text-white text-xs font-light  mb-4 3xl:mb-6">Tell us your country name</p>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 3xl:gap-4">
                <div className="flex flex-col gap-1 3xl:gap-2">
                    <Label htmlFor="country" className="block text-base  font-bold text-white mb-1">
                        Country Name
                    </Label>
                    <Input
                        id="country"
                        type="text"
                        defaultValue={userData?.country_name ?? ''}
                        className={`bg-[#333] border-none text-white  placeholder:text-[#bdbdbd] h-11 px-4 text-base rounded-md ${errors.country_name ? 'border-red-500' : ''
                            }`}
                        placeholder={isLoadingCountry ? "Detecting your country..." : "Enter your country name"}
                        {...register('country_name')}
                    />
                    {errors.country_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.country_name.message}</p>
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
                        disabled={isSubmitting || !countryName || isLoadingCountry}
                        className="w-full py-5"
                    >
                        {isSubmitting ? "Updating..." : "Next"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default Country