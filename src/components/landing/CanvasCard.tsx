import type { Canvas } from '@/types/canvas'
import React, { useState } from 'react'
import Link from 'next/link'
import { CalendarIcon, BookOpenIcon, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { api } from '@/trpc/react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

const headerColors = [
    "var(--color-purple)",
    "var(--color-pink)",
    "var(--color-lime)",
    "var(--color-teal)",
];
const textColors = [
    "#FFF",
    "#FFF",
    "#000",
    "#000",
];

const CanvasCard = ({ canvas, index }: { canvas: Canvas, index: number }) => {
    const headerBg = headerColors[index % headerColors.length];
    const headerText = textColors[index % textColors.length];
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const utils = api.useUtils();
    const { mutate: deleteCanvas, isPending } = api.canvas.deleteCanvas.useMutation({
        onSuccess: () => {
            setIsOpen(false);
            utils.canvas.getCanvases.invalidate();
        },
        onError: (error: any) => {
            console.error(error);
        }
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        deleteCanvas({ canvas_id: canvas.$id });
    };


    return (
        <div className="group block h-full relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
            <Card className="rounded-xl p-4 h-full shadow-sm transition hover:shadow-lg">
                {/* Header with Delete Button */}
                <div className="flex justify-between items-center">
                    <div
                        onClick={() => router.push(`/canvas/${canvas.$id}`)}
                        className="rounded-md cursor-pointer px-4 py-3 w-full text-xl"
                        style={{
                            background: headerBg,
                            color: headerText,
                        }}
                    >
                        {canvas.title || canvas.subject}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpenIcon className={`h-4 w-4 mr-2 ${canvas.subject ? '' : 'hidden'}`} />
                            {canvas.subject && <span>{canvas.subject}</span>}
                        </div>
                        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(true)}
                                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                                    title="Delete Canvas"

                                >
                                    <Trash2 className="h-5 w-5 text-red-500" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your canvas.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isPending}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        {isPending ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {canvas.exam && (
                        <div className="flex items-center text-gray-400 text-sm">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>Exam: {canvas.exam}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs mt-auto border-t pt-2">
                    <span className="text-gray-500">
                        {new Date(canvas.$createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                        })}
                    </span>
                    <div
                        onClick={() => router.push(`/canvas/${canvas.$id}`)}
                        className="cursor-pointer hover:underline"
                        style={{ color: headerBg }}
                    >
                        open canvas <span className="inline-block align-middle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <mask id="mask0_7791_281" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                                    <rect width="24" height="24" fill={headerBg} />
                                </mask>
                                <g mask="url(#mask0_7791_281)">
                                    <path d="M12 21C10.75 21 9.57917 20.7625 8.4875 20.2875C7.39583 19.8125 6.44583 19.1708 5.6375 18.3625C4.82917 17.5542 4.1875 16.6042 3.7125 15.5125C3.2375 14.4208 3 13.25 3 12C3 10.75 3.2375 9.57917 3.7125 8.4875C4.1875 7.39583 4.82917 6.44583 5.6375 5.6375C6.44583 4.82917 7.39583 4.1875 8.4875 3.7125C9.57917 3.2375 10.75 3 12 3V5C10.05 5 8.39583 5.67917 7.0375 7.0375C5.67917 8.39583 5 10.05 5 12C5 13.95 5.67917 15.6042 7.0375 16.9625C8.39583 18.3208 10.05 19 12 19V21ZM16 17L14.6 15.575L17.175 13H9V11H17.175L14.6 8.4L16 7L21 12L16 17Z" fill={headerBg} />
                                </g>
                            </svg>
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default CanvasCard