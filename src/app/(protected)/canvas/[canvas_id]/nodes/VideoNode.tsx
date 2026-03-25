"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type VideoNodeData } from "@/types/video";
import { type Node } from "@xyflow/react";
import { Play, Pause, Volume2, VolumeX, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { VideoGenerationService } from "@/services/shared/video-service";

export type VideoNodeType = Node<VideoNodeData, "video-node">;

export function VideoNode({ data }: NodeProps<VideoNodeType>) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoStatus, setVideoStatus] = useState(data.status);
    const [progressMessage, setProgressMessage] = useState(data.progress || '');
    const [videoPath, setVideoPath] = useState(data.videoPath);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const videoService = VideoGenerationService.getInstance();

    // WebSocket connection for real-time updates
    useEffect(() => {
        if (data.taskId && videoStatus === 'generating') {
            videoService.connectToVideoProgress(data.taskId, (message) => {
                try {
                    if (message.startsWith('DONE:')) {
                        const videoPath = message.replace('DONE:', '');
                        setVideoPath(videoPath);
                        setVideoStatus('completed');
                        setProgressMessage('Video generation complete!');
                        toast.success('Video generated successfully!');
                    } else if (message.startsWith('ERROR:')) {
                        const errorMessage = message.replace('ERROR:', '');
                        setVideoStatus('error');
                        setProgressMessage(errorMessage);
                        toast.error(`Video generation failed: ${errorMessage}`);
                    } else {
                        setProgressMessage(message);
                    }
                } catch (error) {
                    console.error('Error parsing progress message:', error);
                }
            });

            // No wsRef.current assignment since connectToVideoProgress returns void

            return () => {
                // If you need to close the websocket, you should manage the instance inside VideoGenerationService
            };
        }
    }, [data.taskId, videoStatus, videoService]);

    // Video event handlers
    const handlePlay = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    }, []);

    const handlePause = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setCurrentTime(current);
            setProgress((current / total) * 100);
        }
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    }, []);

    const handleToggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    }, []);

    const handleDownload = useCallback(() => {
        if (typeof videoPath === 'string' && videoPath) {
            // Create a temporary link to download the video
            const link = document.createElement('a');
            link.href = videoPath;
            link.download = `${data.topic.replace(/\s+/g, '_')}_video.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [videoPath, data.topic]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getStatusColor = () => {
        switch (videoStatus) {
            case 'completed': return 'bg-green-500';
            case 'generating': return 'bg-blue-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = () => {
        switch (videoStatus) {
            case 'completed': return 'Ready';
            case 'generating': return 'Generating...';
            case 'error': return 'Error';
            default: return 'Pending';
        }
    };

    return (
        <Card className="rounded-lg min-w-[400px] max-w-[600px] bg-white shadow-lg border border-gray-200">
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg truncate">{data.topic}</h3>
                        <Badge className={`${getStatusColor()} text-white`}>
                            {getStatusText()}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded-full">
                            {String(data.style)}
                        </span>
                    </div>
                </div>

                {/* Video Container */}
                {videoStatus === 'completed' && videoPath ? (
                    <div className="relative mb-4">
                        <video
                            ref={videoRef}
                            className="w-full rounded-lg shadow-sm"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            src={typeof videoPath === 'string' ? videoPath : undefined}
                        >
                            Your browser does not support the video tag.
                        </video>
                        
                        {/* Video Controls */}
                        <div className="mt-3 space-y-2">
                            {/* Progress Bar */}
                            <div className="relative">
                                <Progress value={progress} className="h-2" />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>
                            
                            {/* Control Buttons */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={isPlaying ? handlePause : handlePlay}
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleToggleMute}
                                    >
                                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                    </Button>
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    className="flex items-center gap-1"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Loading/Error State */
                    <div className="mb-4">
                        <div className="bg-gray-50 rounded-lg p-6 text-center">
                            {videoStatus === 'generating' ? (
                                <div className="space-y-4">
                                    <RefreshCw className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                                    <div>
                                        <h4 className="font-medium text-gray-900">Generating Video...</h4>
                                        <p className="text-sm text-gray-600 mt-1">{progressMessage}</p>
                                    </div>
                                    <Progress value={75} className="w-full" />
                                </div>
                            ) : videoStatus === 'error' ? (
                                <div className="space-y-2">
                                    <div className="w-8 h-8 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                                        <span className="text-red-500 text-xl">!</span>
                                    </div>
                                    <h4 className="font-medium text-red-900">Generation Failed</h4>
                                    <p className="text-sm text-red-600">{progressMessage}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="w-8 h-8 mx-auto bg-gray-200 rounded-full"></div>
                                    <h4 className="font-medium text-gray-900">Waiting to Start</h4>
                                    <p className="text-sm text-gray-600">Video generation will begin shortly</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Video Info */}
                <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Topic:</strong> {data.topic}</p>
                    <p><strong>Style:</strong> {String(data.style)}</p>
                    {data.taskId && <p><strong>Task ID:</strong> {data.taskId}</p>}
                </div>
            </div>

            {/* Flow Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
                id="target-handle"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-blue-500 !border-2 !border-white !w-3 !h-3"
                id="source-handle"
            />
        </Card>
    );
}
