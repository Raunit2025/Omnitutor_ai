import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { toast } from 'sonner'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { format } from 'date-fns'
import { Input } from '../ui/input'
import { api } from '@/trpc/react'
import { useRouter } from 'next/navigation'

// Constants
const SAMPLE_TOPICS = [
    'JEE Mains',
    'JEE Advanced',
    'NEET UG',
    'UPSC',
    'Class Xth CBSE',
    'Class XIth CBSE Physics, Chemistry, Maths, English, Physical Education',
    'Python Programming',
] as const

const TYPING_SPEED = 100
const ERASING_SPEED = 50
const WAIT_TIME = 2000
const MIN_STUDY_HOURS = 1
const MAX_STUDY_HOURS = 12

// Types
type TimelineOption = 'manual' | 'auto'

interface TypingState {
    currentTextIndex: number
    currentText: string
    isTyping: boolean
    charIndex: number
}


interface LoadingDialog {
    loading: boolean;
    topic: string;
    funFacts: string[];
    duration: number;
}


const PlannerBox: React.FC<{ setLoadingDialog: (loadingDialog: LoadingDialog) => void, loadingDialog: LoadingDialog }> = ({ setLoadingDialog, loadingDialog }) => {
    // Core state
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [isCreatingCustomCanvas, setIsCreatingCustomCanvas] = useState(false)
    const [selectedExam, setSelectedExam] = useState<string>('')
    const [timelineOption, setTimelineOption] = useState<TimelineOption>('auto')
    const [targetDate, setTargetDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 30)))
    const [dailyStudyHours, setDailyStudyHours] = useState<number>(2)

    // Typing effect state
    const [typingState, setTypingState] = useState<TypingState>({
        currentTextIndex: 0,
        currentText: '',
        isTyping: true,
        charIndex: 0
    })

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

    const { mutate: createStudyPlan, isPending: isCreatingStudyPlan } = api.planner.createStudyPlan.useMutation({
        onSuccess: (data) => {
            toast.success('Study plan created successfully')
            router.push(`/planner/${data.studyPlan.$id}`)
            setLoadingDialog({ loading: false, topic: "", funFacts: [], duration: 10 })

        },
        onError: () => {
            toast.error('Failed to create study plan')
            setLoadingDialog({ loading: false, topic: "", funFacts: [], duration: 10 })
        }
    })

    // Memoized values
    const currentSample = useMemo(() =>
        SAMPLE_TOPICS[typingState.currentTextIndex],
        [typingState.currentTextIndex]
    )

    const placeholderText = useMemo(() =>
        `${typingState.currentText}${typingState.isTyping ? '|' : ''}`,
        [typingState.currentText, typingState.isTyping]
    )

    const studyHoursText = useMemo(() =>
        `${dailyStudyHours} hour${dailyStudyHours !== 1 ? 's' : ''}`,
        [dailyStudyHours]
    )

    const isSubmitDisabled = useMemo(() =>
        isPending || isCreatingCustomCanvas || !selectedExam.trim() || !timelineOption || !targetDate,
        [isPending, isCreatingCustomCanvas, selectedExam, timelineOption, targetDate]
    )

    // Typing effect with cleanup
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

    // Event handlers with useCallback for performance
    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSelectedExam(e.target.value)
    }, [])

    const handleTimelineSelect = useCallback((option: TimelineOption) => {
        setTimelineOption(option)
    }, [])

    const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value ? new Date(e.target.value) : undefined
        setTargetDate(date)
    }, [])

    const adjustStudyHours = useCallback((increment: boolean) => {
        setDailyStudyHours(prev => {
            if (increment) {
                return Math.min(MAX_STUDY_HOURS, prev + 1)
            }
            return Math.max(MIN_STUDY_HOURS, prev - 1)
        })
    }, [])

    const handleSubmit = useCallback(() => {
        if (!selectedExam.trim()) {
            toast.error('Please enter a topic to study')
            return
        }

        if (timelineOption === 'manual' && !targetDate) {
            toast.error('Please select a target date')
            return
        }

        // Validate future date for manual timeline
        if (timelineOption === 'manual' && targetDate && targetDate <= new Date()) {
            toast.error('Please select a future date')
            return
        }

        setLoadingDialog({
            ...loadingDialog,
            loading: true,
            topic: selectedExam,
            funFacts: [],
            duration: 100
        })

        createStudyPlan({
            exam: selectedExam,
            timeline_option: timelineOption,
            target_date: targetDate?.toISOString(),
            daily_study_hours: dailyStudyHours,
            today_date: new Date().toISOString()
        })

        getFunFacts({ topic: selectedExam })

    }, [selectedExam, timelineOption, targetDate])

    const formatDateForInput = useCallback((date: Date | undefined) => {
        return date ? format(date, "yyyy-MM-dd") : ''
    }, [])

    return (
        <Card className='w-full h-full p-4' role="main" aria-label="Study planner">
            <div className="flex flex-col">
                {/* Input Section */}
                <div className="relative">
                    <textarea
                        className="w-full p-2 bg-transparent outline-none resize-none overflow-y-auto placeholder-gray-500 text-sm sm:text-base border-none pr-4 focus:ring-2 focus:ring-purple-200 focus:ring-opacity-50 rounded-md transition-all duration-200"
                        style={{
                            minHeight: '60px',
                            height: 'auto',
                        }}
                        onChange={handleTextareaChange}
                        value={selectedExam}
                        placeholder={placeholderText}
                        disabled={isCreatingStudyPlan}
                        rows={1}
                        aria-label="Enter topic or subject to study"
                        aria-describedby="topic-help"
                    />
                    <div id="topic-help" className="sr-only">
                        Enter the topic or subject you want to create a study plan for
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2 justify-between mt-3">
                    <div className="grid grid-cols-2 items-center w-full sm:w-auto gap-2 relative">
                        {/* Timeline Selection Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    disabled={isCreatingStudyPlan}
                                    className="border relative border-[#E2E1D9] hover:bg-gray-50 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                                    aria-label="Select timeline option"
                                >
                                    Select Timeline
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="rounded-md bg-[#EFEFEF99] p-2 gap-2 border border-gray-300/50 backdrop-blur-sm"
                                align="start"
                                role="dialog"
                                aria-label="Timeline selection options"
                            >
                                <div className="space-y-3">
                                    {/* Manual Timeline Option */}
                                    <div
                                        className={`rounded-md  p-3 cursor-pointer transition-all duration-200 ${timelineOption === 'manual'
                                            ? 'bg-[var(--color-lime)] '
                                            : 'bg-white'
                                            }`}
                                        onClick={() => handleTimelineSelect('manual')}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={timelineOption === 'manual'}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleTimelineSelect('manual')
                                            }
                                        }}
                                    >
                                        <h3 className="font-medium text-sm text-gray-900">Manual</h3>
                                        <p className="text-xs text-gray-500 mt-1 mb-2">Set your own timeline (max 180 days)</p>
                                        {timelineOption === 'manual' && <Input
                                            type="date"
                                            value={formatDateForInput(targetDate)}
                                            onChange={handleDateChange}
                                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-purple-200 focus:border-transparent bg-white"
                                            min={format(new Date(), "yyyy-MM-dd")}
                                            max={format(new Date(new Date().setDate(new Date().getDate() + 180)), "yyyy-MM-dd")}
                                            aria-label="Select target date"
                                        />
                                        }
                                    </div>

                                    <p className="text-xs text-gray-500 text-center font-medium">or</p>

                                    {/* Auto Timeline Option */}
                                    <div
                                        className={`rounded-md  p-3 cursor-pointer transition-all duration-200  ${timelineOption === 'auto'
                                            ? 'bg-[var(--color-lime)] '
                                            : 'bg-white'
                                            }`}
                                        onClick={() => handleTimelineSelect('auto')}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={timelineOption === 'auto'}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleTimelineSelect('auto')
                                            }
                                        }}
                                    >
                                        <h3 className="font-medium text-sm text-gray-900">Auto</h3>
                                        <p className="text-xs text-gray-500 mt-1">Our AI will generate a timeline for you</p>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Study Hours Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    disabled={isCreatingStudyPlan}
                                    className="border border-[#E2E1D9] hover:bg-gray-50 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                                    aria-label={`Study hours: ${studyHoursText}`}
                                >
                                    Study Hours
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="rounded-md bg-[#EFEFEF99] p-2 gap-2 border border-gray-300/50 backdrop-blur-sm"
                                align="start"
                                role="dialog"
                                aria-label="Study hours configuration"
                            >
                                <div className="space-y-3">
                                    <div className="rounded-md bg-white p-3">
                                        <h3 className="font-medium text-sm text-gray-900">
                                            How many hours do you want to study daily?
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Recommended: 1-3 hrs per day
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between rounded-md bg-white p-3">
                                        <span
                                            className="font-medium text-gray-900 select-none"
                                            aria-live="polite"
                                            aria-label={`Current study hours: ${studyHoursText}`}
                                        >
                                            {studyHoursText}
                                        </span>
                                        <div className="flex items-center gap-2" role="group" aria-label="Adjust study hours">
                                            <Button
                                                variant="purple"
                                                size="sm"
                                                className="h-8 w-8 rounded-full p-0 transition-all duration-200"
                                                onClick={() => adjustStudyHours(false)}
                                                disabled={dailyStudyHours <= MIN_STUDY_HOURS}
                                                aria-label="Decrease study hours"
                                                title="Decrease study hours"
                                            >
                                                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                            </Button>
                                            <Button
                                                variant="purple"
                                                size="sm"
                                                className="h-8 w-8 rounded-full p-0 transition-all duration-200"
                                                onClick={() => adjustStudyHours(true)}
                                                disabled={dailyStudyHours >= MAX_STUDY_HOURS}
                                                aria-label="Increase study hours"
                                                title="Increase study hours"
                                            >
                                                <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="purple"
                                        aria-label="Create study plan"
                                        type="submit"
                                        onClick={handleSubmit}
                                        disabled={isSubmitDisabled || isCreatingStudyPlan}
                                        className="transition-all w-full sm:w-auto duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >

                                        <span className=' sm:hidden mr-2'>Create Study Plan</span>
                                        <ArrowRight className="w-6 h-6" aria-hidden="true" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Create study plan</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default PlannerBox