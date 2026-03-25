"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"
import { toast } from "sonner"
import { useOnboarding } from "./OnboardingContext"
import { useState, useEffect } from "react"
import type { UserDocument } from "@/types/user"

const PreparingFor = () => {
    const { nextStep, previousStep, setIsStepValid, isSubmitting, setIsSubmitting, userData, setUserDataValue } = useOnboarding();
    const [inputValue, setInputValue] = useState("");
    const [preparingForItems, setPreparingForItems] = useState<string[]>([]);

    useEffect(() => {
        setPreparingForItems(userData?.preparing_for ?? []);
        setIsStepValid(preparingForItems.length > 0);
    }, [userData, setIsStepValid]);

    const { mutate: updatePreparingFor } = api.onboarding.updatePreparingFor.useMutation({
        onSuccess: () => {
            toast.success("Preparing for updated successfully");
            setIsSubmitting(false);

            nextStep();
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update preparing for");
            setIsSubmitting(false);
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addItem();
        }
    };

    const addItem = () => {
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !preparingForItems.includes(trimmedValue)) {
            setPreparingForItems([...preparingForItems, trimmedValue]);
            setInputValue("");
        }
    };

    const removeItem = (index: number) => {
        const newItems = [...preparingForItems];
        newItems.splice(index, 1);
        setPreparingForItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (preparingForItems.length > 0) {
            setIsSubmitting(true);
            updatePreparingFor({ preparing_for: preparingForItems });
            setUserDataValue({ ...userData, preparing_for: preparingForItems } as UserDocument);
        } else {
            toast.error("Please add at least one item");
        }
    };

    return (
        <div className="flex flex-col w-full flex-1 justify-center">
            <h1 className="font-bold  text-xl text-white mb-1 3xl:mb-2">What are you preparing for?</h1>
            <p className="text-white text-xs font-light  mb-4 3xl:mb-6">Tell us what you are preparing for (press Enter or comma to add)</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 3xl:gap-4">
                <div className="flex flex-col gap-1 3xl:gap-2">
                    <Label htmlFor="preparing_for" className="block text-base  font-bold text-white mb-1">
                        Preparing For
                    </Label>
                    <Input
                        id="preparing_for"
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="bg-[#333] border-none text-white  placeholder:text-[#bdbdbd] h-11 px-4 text-base rounded-md"
                        placeholder="Type and press Enter or comma to add"
                    />

                    {preparingForItems.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {preparingForItems.map((item, index) => (
                                <div key={index} className="bg-[#444] text-white px-3 py-1 rounded-full flex items-center">
                                    <span className="mr-2">{item}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-xs text-white hover:text-red-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
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
                        disabled={isSubmitting || preparingForItems.length === 0}
                        className="w-full py-5"
                    >
                        {isSubmitting ? "Updating..." : "Submit"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default PreparingFor