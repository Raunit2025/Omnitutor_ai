import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import Image from 'next/image'
import { Progress } from '../ui/progress'
import { motion, AnimatePresence } from 'motion/react'

interface LoadingWaitingProps {
    duration?: number; // Duration in seconds
    topic?: string;
    funFacts?: string[];
}

const LoadingWaiting = ({ duration = 10, topic, funFacts = [] }: LoadingWaitingProps) => {
    const [progress, setProgress] = useState(0)
    const [currentFact, setCurrentFact] = useState(0)


    useEffect(() => {
        // Prevent scrolling
        document.body.style.overflow = 'hidden'

        const interval = setInterval(() => {
            setProgress(prev => {
                let increment = 100 / (duration * 10) // Update 10 times per second, max 80%

                // Slow down by 10x after 80%

                if (prev >= 50) {
                    increment = increment / 2
                } else if (prev >= 70) {
                    increment = increment / 3
                } else if (prev >= 80) {
                    increment = increment / 4
                } else if (prev >= 90) {
                    increment = increment / 5
                } else if (prev >= 95) {
                    increment = increment / 15
                }


                const newProgress = Math.min(prev + increment, 99)

                if (newProgress >= 99) {
                    clearInterval(interval)
                }

                return newProgress
            })
        }, 100)



        return () => {
            clearInterval(interval)
            document.body.style.overflow = 'unset'
        }
    }, [duration])

    useEffect(() => {
        if (funFacts.length === 0) return

        // Change fun fact every 3 seconds
        const factInterval = setInterval(() => {
            setCurrentFact(prev => (prev + 1) % funFacts.length)
        }, 5000)

        return () => {
            clearInterval(factInterval)
        }
    }, [funFacts.length])

    // Reset currentFact when funFacts change
    useEffect(() => {
        setCurrentFact(0)
    }, [funFacts])

    return (
        <div className='fixed inset-0 w-screen h-screen z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2'>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Card className='bg-[#efefef]  p-2 md:p-4 border-0 overflow-hidden max-w-md w-full'>
                    <div className='p-4 space-y-6 bg-white rounded-lg'>
                        <div className='flex justify-center'>
                            <Image
                                src='/assets/loadingbanner.png'
                                alt='loading'
                                width={400}
                                height={200}
                                className=' shadow-lg'
                            />
                        </div>

                        <div className='text-center space-y-2'>
                            <motion.h3
                                className='text-xl font-bold text-gray-800'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {topic ? `Creating Your Personalized Lesson for ${topic}...` : 'Creating Your Personalized Lesson...'}
                            </motion.h3>
                        </div>

                        <div className='space-y-3'>
                            <div className='hidden justify-between text-xs text-gray-500'>
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress
                                value={progress}
                                className='w-full h-2 bg-[#F3F3F5]'
                                indicatorColor="bg-[#C3FF00]"
                            />
                        </div>

                        {funFacts.length > 0 && (
                            <motion.div
                                className='bg-[#F9FFE8] p-4 rounded-xl'
                                layout
                            >
                                <div className='flex items-start space-x-2'>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={`fact-${currentFact}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className='text-sm text-gray-700 leading-relaxed'
                                        >
                                            {funFacts[currentFact] || ''}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}


                    </div>
                </Card>
            </motion.div>
        </div>
    )
}

export default LoadingWaiting