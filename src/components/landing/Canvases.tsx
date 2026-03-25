import { api } from '@/trpc/react'
import React from 'react'
import CanvasCard from './CanvasCard'
import type { Canvas } from '@/types/canvas'
import { Skeleton } from '../ui/skeleton'
import { Card } from '../ui/card'

const Canvases = () => {
    const { data: canvases, isLoading } = api.canvas.getCanvases.useQuery()
    if (isLoading) {
        return (
            <div className='flex flex-col gap-3'>
                <div className='bg-white p-4 rounded-md border border-gray-300/50'>
                    <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className='flex w-full flex-col gap-2 bg-white mx-auto p-5 rounded-md border border-gray-300/50 space-y-2'>
                            {/* Header Skeleton */}
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>

                            {/* Progress Timeline Skeleton */}
                            <div className=" items-center justify-between hidden">
                                <div className="flex items-center flex-1 gap-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <React.Fragment key={i}>
                                            <Skeleton className="w-6 h-6 rounded-full" />
                                            {i < 5 && <Skeleton className="h-1 flex-1" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Task Cards Skeleton */}
                            <div className="space-y-2 ">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <Card key={i} className="p-2 bg-white border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-6 w-16 rounded-lg" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Bottom Section Skeleton */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className='flex flex-col gap-3'>
            <div className='bg-white p-4 rounded-md border border-gray-300/50'>
                Manage and track all your study canvas in one place
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-6'>
                {canvases?.map((canvas, index) => (
                    <CanvasCard key={canvas.$id} canvas={canvas as Canvas} index={index} />
                )).reverse()}
            </div>
        </div>
    )
}

export default Canvases