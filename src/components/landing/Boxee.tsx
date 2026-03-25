import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button';
import { TooltipContent } from '@/components/ui/tooltip';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { UserDocument } from '@/types/user';
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormMessage } from '@/components/ui/form';
import { FormLabel } from '@/components/ui/form';
import { FormItem } from '@/components/ui/form';
import { FormField } from '@/components/ui/form';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { ArrowRight } from 'lucide-react';

// Web Speech API Types
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
    onspeechend: (() => void) | null;
    onaudiostart: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

// Extend Window interface to include Speech Recognition
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}
const SAMPLE_TOPICS = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Python Programming',
    'Biology',
    'English',
    'Social Studies',
    'Computer Science',
    'History',
    'Geography',
    'Economics',
    'Political Science',
    'Philosophy',
    'Psychology',
] as const

const TYPING_SPEED = 100
const ERASING_SPEED = 50
const WAIT_TIME = 2000

const formSchema = z.object({
    canvasType: z.enum(['exam', 'topic', 'custom'], {
        required_error: "Please select a canvas type",
    }),
    category: z.string().optional(),
    subject: z.string().optional(),
    topic: z.string().optional(),
    title: z.string().optional(),
}).refine((data) => {
    if (data.canvasType === 'exam') {
        return !!data.category && data.category !== "Not in the list" && !!data.subject;
    } else if (data.canvasType === 'topic') {
        return !!data.subject;
    } else if (data.canvasType === 'custom') {
        return !!data.title;
    }
    return false;
}, {
    message: "Please fill in all required fields for the selected canvas type"
});

interface LoadingDialog {
    loading: boolean;
    topic: string;
    funFacts: string[];
    duration: number;
}
interface TypingState {
    currentTextIndex: number
    currentText: string
    isTyping: boolean
    charIndex: number
}

const Boxee = ({ userData, setLoadingDialog, loadingDialog }: { userData: UserDocument | null, setLoadingDialog: (loadingDialog: LoadingDialog) => void, loadingDialog: LoadingDialog }) => {
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [interimTranscript, setInterimTranscript] = useState('');
    const [currentFieldName, setCurrentFieldName] = useState<'subject' | 'title'>('subject');
    const [newExamInput, setNewExamInput] = useState('');
    const [examList, setExamList] = useState<string[]>([]);
    const [hasLocalUpdates, setHasLocalUpdates] = useState(false);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const lastTranscriptRef = useRef<string>('');
    const isProcessingRef = useRef<boolean>(false);
    const [typingState, setTypingState] = useState<TypingState>({
        currentTextIndex: 0,
        currentText: '',
        isTyping: true,
        charIndex: 0
    })

    const router = useRouter();
    const { mutate: getFunFacts } = api.canvas.getFunFactsAboutTopic.useMutation({
        onSuccess: (data) => {
            setLoadingDialog({
                ...loadingDialog,
                funFacts: data
            })
        },
        onError: () => {
            setLoadingDialog({ loading: false, topic: "", funFacts: [], duration: 10 })
        }
    })
    const { mutate: createCanvas, isPending } = api.canvas.createCanvas.useMutation({
        onSuccess: (data) => {
            toast.success("Canvas created successfully");
            router.push(`/canvas/${data?.$id}`);
            setLoadingDialog({ loading: false, topic: "", funFacts: [], duration: 10 })
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const utils = api.useUtils();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            canvasType: 'topic',
            category: "",
            subject: "",
            topic: "",
            title: "",
        },
    });
    const { mutate: updatePreparingFor, isPending: isUpdatingPreparingFor } = api.onboarding.updatePreparingFor.useMutation({
        onSuccess: async () => {
            const newExamName = newExamInput.trim();

            // Update examList using callback form to get the latest state
            setExamList(prev => {
                const updated = [...prev, newExamName];
                console.log('Updated exam list:', updated);
                return updated;
            });

            // Mark that we have local updates
            setHasLocalUpdates(true);

            // Invalidate user data to sync with backend
            await utils.user.getUser.invalidate();

            toast.success("New exam added successfully");

            // Reset form to default values with canvasType as 'exam' and category as newExamName
            form.reset({
                canvasType: 'exam',
                category: newExamName,
                subject: "",
                topic: "",
                title: "",
            });

            setNewExamInput('');

            // Reset local updates flag after successful backend sync
            setTimeout(() => {
                setHasLocalUpdates(false);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to add new exam");
        }
    });

    // Compute effective exam list - use local state if it has updates, otherwise use userData
    const effectiveExamList = useMemo(() => {
        if (hasLocalUpdates) {
            return examList;
        }
        return userData?.preparing_for || [];
    }, [examList, userData?.preparing_for, hasLocalUpdates]);

    // Sync examList with userData.preparing_for only on initial load
    useEffect(() => {
        if (userData?.preparing_for && !hasLocalUpdates) {
            setExamList(userData.preparing_for);
        }
    }, [userData?.preparing_for, hasLocalUpdates]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        console.log("Submitting form with values:", values);
        try {
            if (!userData) {
                toast.error("Please login to create a canvas");
                return;
            }

            if (values.canvasType === 'exam') {
                if (!userData.current_course) {
                    toast.error("Please set your current course in settings");
                    return;
                }
                setLoadingDialog({
                    ...loadingDialog,
                    loading: true,
                    topic: values.subject!,
                    funFacts: [],
                    duration: 40
                })
                createCanvas({
                    type: "exam",
                    topic: values.subject!,
                    target: values.category!,
                });

                getFunFacts({ topic: values.subject! })
            } else if (values.canvasType === 'topic') {
                if (!userData.current_course) {
                    toast.error("Please set your current course in settings");
                    return;
                }
                setLoadingDialog({
                    ...loadingDialog,
                    loading: true,
                    topic: values.subject!,
                    funFacts: [],
                    duration: 30
                })
                createCanvas({
                    type: "topic",
                    topic: values.subject!,
                });
                getFunFacts({ topic: values.subject! })
            } else if (values.canvasType === 'custom') {
                setLoadingDialog({
                    ...loadingDialog,
                    loading: true,
                    topic: values.title!,
                    funFacts: [],
                    duration: 10
                })
                createCanvas({
                    type: "custom",
                    topic: values.title!,
                });
            }
        } catch (error) {
            console.error("Failed to create canvas:", error);
            toast.error("Failed to create canvas. Please try again.");
        }
    };

    // Check if speech recognition is supported
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
            setSpeechSupported(isSupported);

            if (!isSupported) {
                console.log('Speech recognition is not supported in this browser');
            }
        }
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        if (!speechSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // Configure recognition
        recognition.continuous = false; // Changed to false to prevent duplicate issues
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('Speech recognition started');
            setIsListening(true);
            isProcessingRef.current = false;
            lastTranscriptRef.current = '';
            setInterimTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            if (isProcessingRef.current) return;

            let finalTranscript = '';
            let currentInterimTranscript = '';

            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result?.[0]?.transcript?.trim() || '';

                if (result?.isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    currentInterimTranscript = transcript;
                }
            }

            // Update interim transcript for visual feedback
            setInterimTranscript(currentInterimTranscript);

            // Only update the form field with final results to prevent duplicates
            if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
                lastTranscriptRef.current = finalTranscript;
                const currentValue = form.getValues(currentFieldName) || '';
                const newValue = currentValue + (currentValue ? ' ' : '') + finalTranscript.trim();
                form.setValue(currentFieldName, newValue);
                setInterimTranscript(''); // Clear interim when final is processed
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setInterimTranscript('');

            let errorMessage = 'Error with voice recognition.';

            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone found. Please check your microphone.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'network':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                case 'aborted':
                    // Don't show error for manual stop
                    return;
                default:
                    errorMessage = `Voice recognition error: ${event.error}`;
            }

            toast.error(errorMessage);
        };

        recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsListening(false);
            setInterimTranscript('');

            // If continuous mode, restart (but we're not using continuous now)
            // This prevents the duplicate issue
        };

        recognition.onspeechend = () => {
            console.log('Speech ended');
            // Automatically stop after speech ends to process final result
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, [speechSupported, currentFieldName, form]);

    const toggleListening = useCallback(() => {
        if (!speechSupported) {
            toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        const recognition = recognitionRef.current;
        if (!recognition) {
            toast.error('Speech recognition could not be initialized.');
            return;
        }

        if (isListening) {
            isProcessingRef.current = true;
            recognition.stop();
            setIsListening(false);
            setInterimTranscript('');
            toast.info('Voice recognition stopped.');
        } else {
            // Request microphone permission first
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    try {
                        // Determine which field to update based on canvas type
                        const canvasType = form.getValues('canvasType');
                        if (canvasType === 'custom') {
                            setCurrentFieldName('title');
                        } else {
                            setCurrentFieldName('subject');
                        }

                        recognition.start();
                        toast.success('Listening... Speak now!');
                    } catch (error) {
                        console.error('Error starting speech recognition:', error);
                        if (error instanceof Error && error.message && error.message.includes('already started')) {
                            recognition.stop();
                            setTimeout(() => {
                                recognition.start();
                            }, 100);
                        } else {
                            toast.error('Failed to start voice recognition. Please try again.');
                        }
                    }
                })
                .catch((error) => {
                    console.error('Microphone permission denied:', error);
                    toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
                });
        }
    }, [isListening, speechSupported, form]);

    const currentSample = useMemo(() =>
        SAMPLE_TOPICS[typingState.currentTextIndex],
        [typingState.currentTextIndex]
    )
    const placeholderText = useMemo(() =>
        `${typingState.currentText}${typingState.isTyping ? '|' : ''}`,
        [typingState.currentText, typingState.isTyping]
    )


    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current && isListening) {
                recognitionRef.current.abort();
            }
        };
    }, [isListening]);

    useEffect(() => {
        if (!currentSample) return

        let timeoutId: NodeJS.Timeout

        const { isTyping, charIndex } = typingState

        if (isTyping) {
            if (charIndex < currentSample.length) {
                timeoutId = setTimeout(() => {
                    setTypingState(prev => ({
                        ...prev,
                        currentText: currentSample.slice(0, charIndex + 1),
                        charIndex: charIndex + 1
                    }))
                }, TYPING_SPEED)
            } else {
                timeoutId = setTimeout(() => {
                    setTypingState(prev => ({ ...prev, isTyping: false }))
                }, WAIT_TIME)
            }
        } else {
            if (charIndex > 0) {
                timeoutId = setTimeout(() => {
                    setTypingState(prev => ({
                        ...prev,
                        currentText: currentSample.slice(0, charIndex - 1),
                        charIndex: charIndex - 1
                    }))
                }, ERASING_SPEED)
            } else {
                setTypingState(prev => ({
                    ...prev,
                    currentTextIndex: (prev.currentTextIndex + 1) % SAMPLE_TOPICS.length,
                    isTyping: true
                }))
            }
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [typingState, currentSample])


    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        form.setValue('subject', e.target.value);
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleAddNewExam = () => {
        const trimmedValue = newExamInput.trim();
        console.log('Adding new exam:', trimmedValue);
        console.log('Current userData:', userData);

        if (trimmedValue && userData) {
            const currentPreparingFor = effectiveExamList || [];
            console.log('Current preparing_for:', currentPreparingFor);

            if (!currentPreparingFor.includes(trimmedValue)) {
                const updatedPreparingFor = [...currentPreparingFor, trimmedValue];
                console.log('Updated preparing_for:', updatedPreparingFor);
                updatePreparingFor({ preparing_for: updatedPreparingFor });
                form.setValue('canvasType', 'exam');
            } else {
                toast.info("Exam already exists in your list");
                form.setValue('category', trimmedValue);
                setNewExamInput('');
            }
        } else {
            if (!trimmedValue) {
                toast.error("Please enter an exam name");
            }
            if (!userData) {
                toast.error("User data not available");
            }
        }
    };

    const handleNewExamKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewExam();
        }
    };

    return (
        <>
            <Card className="w-full h-full p-4" role="main" aria-label="AI Canvas Creator">
                <div className="flex flex-col">
                    <div className="relative">
                        <textarea
                            className="w-full p-2 bg-transparent outline-none resize-none overflow-y-auto placeholder-gray-500 text-sm sm:text-base border-none pr-4 focus:ring-2 focus:ring-purple-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
                            style={{
                                minHeight: '60px',
                                height: 'auto',
                            }}
                            onChange={handleTextareaChange}
                            value={form.watch('subject')}
                            // placeholder="Ask Omnitutor to teach you a topic (e.g., 'Quantum Physics', 'Linear Algebra')"
                            rows={1}
                            placeholder={placeholderText}
                            aria-label="Prompt input"
                            disabled={isListening}
                        />
                        {interimTranscript && (
                            <div className="absolute bottom-0 left-0 text-sm text-gray-400 italic">
                                {interimTranscript}...
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 justify-between mt-3">
                        <div className="grid grid-cols-2 items-center w-full sm:w-auto gap-2 relative">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        size={'lg'}
                                        variant="secondary"
                                        className='border border-[#E2E1D9] hover:bg-gray-50 focus:ring-2 focus:ring-purple-200 transition-all duration-200 w-full sm:w-auto'
                                        disabled={isListening}
                                    >
                                        Select Exam
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    {userData ? (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">Create Exam Canvas</h3>
                                                <p className="text-sm text-gray-500">Create a canvas for exam preparation</p>
                                            </div>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="category"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>For</FormLabel>
                                                                <FormControl>
                                                                    <Select
                                                                        onValueChange={(value) => {
                                                                            field.onChange(value);
                                                                            form.setValue('canvasType', 'exam');
                                                                        }}
                                                                        value={field.value}
                                                                    >
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue placeholder="Select an exam" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {effectiveExamList && effectiveExamList.length > 0 ? (
                                                                                [...effectiveExamList, 'Not in the list'].map((category) => (
                                                                                    <SelectItem key={category} value={category}>
                                                                                        {category}
                                                                                    </SelectItem>
                                                                                ))
                                                                            ) : (
                                                                                <SelectItem value="" disabled>
                                                                                    No exams configured
                                                                                </SelectItem>
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Add new exam section */}
                                                    {form.watch('category') === 'Not in the list' && <div className="space-y-2">
                                                        <FormLabel>Don't see your exam? Add a new one:</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Enter new exam name"
                                                                value={newExamInput}
                                                                onChange={(e) => setNewExamInput(e.target.value)}
                                                                onKeyDown={handleNewExamKeyDown}
                                                                disabled={isListening}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                onClick={handleAddNewExam}
                                                                disabled={!newExamInput.trim() || isListening || isUpdatingPreparingFor}
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                {isUpdatingPreparingFor ? "Adding..." : "Add"}
                                                            </Button>
                                                        </div>
                                                    </div>}

                                                    <FormField
                                                        control={form.control}
                                                        name="subject"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Subject</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input
                                                                            placeholder="Enter a subject"
                                                                            {...field}
                                                                            disabled={isListening}
                                                                        />
                                                                        {speechSupported && (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant={isListening ? "destructive" : "secondary"}
                                                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                                                                onClick={() => {
                                                                                    setCurrentFieldName('subject');
                                                                                    toggleListening();
                                                                                }}
                                                                            >
                                                                                <Image
                                                                                    src="/assets/icons/voice-s.svg"
                                                                                    alt={isListening ? "Stop" : "Voice"}
                                                                                    width={16}
                                                                                    height={16}
                                                                                />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="submit"
                                                            disabled={isPending || isListening}
                                                            className="flex-1"
                                                        >
                                                            {isPending ? "Creating..." : "Create Canvas"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Form>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">Join Omnitutor</h3>
                                                <p className="text-sm text-gray-500">Create an account or login to start your learning journey</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Link href="/signup">
                                                    <Button variant="outline" className="w-full">
                                                        Sign up
                                                    </Button>
                                                </Link>
                                                <Link href="/login">
                                                    <Button className='bg-[#D9D9D92B] w-full text-[#C3FF00] border-[#C3FF00] hover:bg-[#d9d9d96d] hover:text-[#C3FF00] hover:border-[#C3FF00]'>
                                                        Login
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        size={'lg'}
                                        variant="secondary"
                                        className='border border-[#E2E1D9] hover:bg-gray-50 focus:ring-2 focus:ring-purple-200 transition-all duration-200 w-full sm:w-auto'
                                        disabled={isListening}
                                    >
                                        Custom Canvas
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    {userData ? (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">Create Custom Canvas</h3>
                                                <p className="text-sm text-gray-500">Create a custom canvas with your own title</p>
                                            </div>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="title"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Canvas Title</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <Input
                                                                            placeholder="Enter a title for your custom canvas"
                                                                            {...field}
                                                                            disabled={isListening}
                                                                            onChange={(e) => {
                                                                                field.onChange(e);
                                                                                form.setValue('canvasType', 'custom');
                                                                            }}
                                                                        />
                                                                        {speechSupported && (
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                variant={isListening ? "destructive" : "secondary"}
                                                                                className="absolute right-1 top-1/2 transform -translate-y-1/2 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                                                                onClick={() => {
                                                                                    setCurrentFieldName('title');
                                                                                    toggleListening();
                                                                                }}
                                                                            >
                                                                                <Image
                                                                                    src="/assets/icons/voice-s.svg"
                                                                                    alt={isListening ? "Stop" : "Voice"}
                                                                                    width={16}
                                                                                    height={16}
                                                                                />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="submit"
                                                            disabled={isPending || isListening}
                                                            className="flex-1"
                                                        >
                                                            {isPending ? "Creating..." : "Create Canvas"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </Form>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">Join Omnitutor</h3>
                                                <p className="text-sm text-gray-500">Create an account or login to start your learning journey</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Link href="/signup">
                                                    <Button variant="outline" className="w-full">
                                                        Sign up
                                                    </Button>
                                                </Link>
                                                <Link href="/login">
                                                    <Button className='bg-[#D9D9D92B] w-full text-[#C3FF00] border-[#C3FF00] hover:bg-[#d9d9d96d] hover:text-[#C3FF00] hover:border-[#C3FF00]'>
                                                        Login
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {speechSupported && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild >
                                            <Button
                                                variant={isListening ? "destructive" : "secondary"}
                                                onClick={toggleListening}
                                                aria-label={isListening ? "Stop voice input" : "Start voice input"}
                                                className={`border border-[#E2E1D9] hover:bg-gray-50 focus:ring-2 focus:ring-purple-200 transition-all duration-200 ${isListening ? 'animate-pulse border-red-300 hover:bg-red-50' : ''} hidden `}
                                            >
                                                <div className='flex items-center justify-center gap-2 sm:gap-3'>
                                                    <Image
                                                        src="/assets/icons/voice-s.svg"
                                                        alt={isListening ? "Stop" : "Voice"}
                                                        width={24}
                                                        height={24}
                                                    />
                                                    <span className='text-sm sm:text-base'>
                                                        {isListening ? 'Stop' : 'Voice'}
                                                    </span>
                                                </div>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{isListening ? 'Click to stop voice input' : 'Click to start voice input'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="purple"
                                                    className="transition-all w-full sm:w-auto duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                    aria-label="Submit prompt"
                                                    disabled={isListening || isPending}
                                                >
                                                    <span className='sm:hidden mr-2'>Create</span>
                                                    <ArrowRight className="w-6 h-6" aria-hidden="true" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                {userData ? (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold">Create Topic Canvas</h3>
                                                            <p className="text-sm text-gray-500">Create a canvas to study a specific topic</p>
                                                        </div>
                                                        <Form {...form}>
                                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="subject"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Topic</FormLabel>
                                                                            <FormControl>
                                                                                <div className="relative">
                                                                                    <Input
                                                                                        placeholder="Enter a topic to study"
                                                                                        {...field}
                                                                                        disabled={isListening}
                                                                                        onChange={(e) => {
                                                                                            field.onChange(e);
                                                                                            form.setValue('canvasType', 'topic');
                                                                                        }}
                                                                                    />
                                                                                    {speechSupported && (
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="sm"
                                                                                            variant={isListening ? "destructive" : "secondary"}
                                                                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                                                                                            onClick={() => {
                                                                                                setCurrentFieldName('subject');
                                                                                                toggleListening();
                                                                                            }}
                                                                                        >
                                                                                            <Image
                                                                                                src="/assets/icons/voice-s.svg"
                                                                                                alt={isListening ? "Stop" : "Voice"}
                                                                                                width={16}
                                                                                                height={16}
                                                                                            />
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        type="submit"
                                                                        disabled={isPending || isListening || !form.watch('subject')?.trim()}
                                                                        className="flex-1"
                                                                    >
                                                                        {isPending ? "Creating..." : "Create Canvas"}
                                                                    </Button>
                                                                </div>
                                                            </form>
                                                        </Form>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-lg font-semibold">Join Omnitutor</h3>
                                                            <p className="text-sm text-gray-500">Create an account or login to start your learning journey</p>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Link href="/signup">
                                                                <Button variant="outline" className="w-full">
                                                                    Sign up
                                                                </Button>
                                                            </Link>
                                                            <Link href="/login">
                                                                <Button className='bg-[#D9D9D92B] w-full text-[#C3FF00] border-[#C3FF00] hover:bg-[#d9d9d96d] hover:text-[#C3FF00] hover:border-[#C3FF00]'>
                                                                    Login
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Create new canvas</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </Card>
        </>
    )
}

export default Boxee