"use client"
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import type { ChatNodeType, ChatNodeData } from "./";
import React, { useState, useRef, useEffect } from "react";
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, Square } from "lucide-react";
import { correctAndFormatSVG } from "@/lib/utils";
import { useCanvas } from "../CanvasContext";
// --- Helper Components ---

type Block = {
    type: string;
    content: string;
}

export type AssistantConv = {
    header: string;
    body: Block[];
    footer: Block[];
}

// Math rendering with MathJax
function MathBlock({ content }: { content: string }) {
    return (
        <MathJaxContext>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 my-2 font-mono text-sm border border-purple-200 dark:border-purple-700 flex items-center gap-2">
                <span className="font-semibold">Math:</span>
                <span className="select-all">
                    <MathJax>
                        {content}
                    </MathJax>
                </span>
            </div>
        </MathJaxContext>
    );
}

// Code block with copy button
function CodeBlock({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };
    return (
        <div className="relative group my-2">
            <pre className="bg-gray-900 dark:bg-gray-800 text-green-200 rounded p-2 text-xs overflow-x-auto border border-gray-700">
                <span className="font-semibold text-green-400">Code:</span>
                <br />
                <code>{content}</code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs px-2 py-1 rounded hover:bg-green-600"
                title="Copy code"
                tabIndex={-1}
            >
                {copied ? "Copied!" : "Copy"}
            </button>
        </div>
    );
}

// Image block: if content is a URL, show image, else show prompt
function ImageBlock({ content }: { content: string }) {
    const isUrl = content.trim().startsWith('http');
    return (
        <div className="bg-white rounded-md p-2 my-2 border w-full  flex flex-col items-center">
            {isUrl ? (
                <img
                    width={1000}
                    height={1000}
                    src={content.trim()}
                    alt="Note visual"
                    className="max-h-[400px] w-full h-auto rounded-md shadow border "
                    loading="lazy"
                />
            ) : (
                <span className="text-xs text-blue-700 dark:text-blue-200">{content}</span>
            )}
        </div>
    );
}

// Quiz block with answer reveal
function QuestionBlock({ content }: { content: string }) {
    const [question] = content.split("|A:");
    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 rounded p-2 my-2 border border-yellow-200 dark:border-yellow-700">
            <span className="font-semibold">Quiz:</span>
            <div className="mt-1">{question?.replace(/^Q:\s*/, "")}</div>
        </div>
    );
}

function SVGBlock({ content }: { content: string }) {
    // Check if content is an SVG tag
    const isSvgContent = content.trim().startsWith('<svg');

    // Process content for markdown formatting
    const html = content.replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1 text-xs">$1</code>'
    ).replace(
        /\*\*([^*]+)\*\*/g,
        '<b>$1</b>'
    ).replace(
        /\*([^*]+)\*/g,
        '<i>$1</i>'
    );

    // Only process SVG if the content is actually SVG
    const processedContent = isSvgContent ? correctAndFormatSVG(content) : html;

    return (
        <div className="my-2 bg-white  flex  items-center justify-center rounded-md p-2 border ">
            {isSvgContent ? (
                <div
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                    aria-label="SVG diagram"
                    className="w-full h-full"
                />
            ) : (
                <span
                    dangerouslySetInnerHTML={{ __html: html }}
                    className="text-black"
                />
            )}
        </div>
    );
}

// Text block with markdown support (basic)
function TextBlock({ content, className }: { content: string, className?: string }) {
    // Simple markdown: bold, italic, code
    const renderMarkdown = (text: string) => {
        // Replace **bold**, *italic*, `code`
        const html = text
            .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 rounded px-1 text-xs">$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
            .replace(/\*([^*]+)\*/g, '<i>$1</i>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };
    return (
        <div className={`my-2   leading-relaxed ${className ? className : "text-black"}`}>{renderMarkdown(content)}</div>
    );
}

// Block renderer
function renderBlock(block: { type: string; content: string }, idx: number) {
    switch (block.type) {
        case "math":
            return <MathBlock key={idx} content={block.content} />;
        case "code":
            return <CodeBlock key={idx} content={block.content} />;
        case "image":
            return <ImageBlock key={idx} content={block.content} />;
        case "question":
            return <QuestionBlock key={idx} content={block.content} />;
        case "svg":
            return <SVGBlock key={idx} content={block.content} />;
        default:
            return <TextBlock key={idx} content={block.content} />;
    }
}

// --- Main ChatNode Component ---
export function ChatNode({
    data,
}: NodeProps<ChatNodeType>) {
    // Extract conversations based on their roles
    const userMessage = data.conversation.find(msg => msg.role === 'user')?.content as string || '';
    const systemMessage = data.conversation.find(msg => msg.role === 'system')?.content as string || '';
    const assistantData = data.conversation.find(msg => msg.role === 'assistant')?.content as AssistantConv;
    const assistantMessage = data.conversation.find(msg => msg.role === 'assistant');
    const audio = assistantMessage?.audio as string;
    const isAudioPlaying = assistantMessage?.isAudioPlaying as boolean;
    const { setNodes, getNodes } = useReactFlow();
    const { setPlayingAudioLink } = useCanvas();

    // State for audio player
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioProgress, setAudioProgress] = useState(0);

    const setAudioPlaying = (isPlaying: boolean) => {
        const currentNode = getNodes().find(node => node.data === data);
        if (!currentNode) return;

        setNodes(nodes => nodes.map(node => {
            if (node.id === currentNode.id) {
                const updatedConversation = (node.data as ChatNodeData).conversation.map(msg => {
                    if (msg.role === 'assistant') {
                        return { ...msg, isAudioPlaying: isPlaying };
                    }
                    return msg;
                });

                return {
                    ...node,
                    data: {
                        ...node.data,
                        conversation: updatedConversation
                    }
                };
            }
            return node;
        }));
    };

    // Toggle audio playback
    const toggleAudio = () => {
        if (audioRef.current) {
            if (isAudioPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    // Play audio from the beginning
    const restartAudio = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    };

    // Effect to update playing state and progress when audio plays/ends
    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) return;

        const handlePlay = () => setAudioPlaying(true);
        const handlePause = () => setAudioPlaying(false);
        const handleEnded = () => {
            setAudioPlaying(false);
            setAudioProgress(0);
        };

        const handleTimeUpdate = () => {
            if (audioElement) {
                const progress = (audioElement.currentTime / audioElement.duration) * 100;
                setAudioProgress(progress);
            }
        };

        audioElement.addEventListener('play', handlePlay);
        audioElement.addEventListener('pause', handlePause);
        audioElement.addEventListener('ended', handleEnded);
        audioElement.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            audioElement.removeEventListener('play', handlePlay);
            audioElement.removeEventListener('pause', handlePause);
            audioElement.removeEventListener('ended', handleEnded);
            audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [audioRef.current]);

    useEffect(() => {
        if (audio === 'NA') return;
        if (audioRef.current && isAudioPlaying) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        }
    }, [audio]);

    return (
        <Card className={`rounded-md  p-4  border border-border shadow-md relative bg-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${isAudioPlaying ? 'animate-pulse' : ''}`}
            style={{
                boxShadow: isAudioPlaying ? '0 0 10px rgba(195, 255, 0, 0.7)' : '',
                animation: isAudioPlaying ? 'glowChat 2s infinite' : 'none',
                borderColor: isAudioPlaying ? 'var(--lime)' : ''
            }}
        >
            {/* Header with title and audio control */}
            {/* <div className="  items-center justify-between hidden">
                <div className="flex-1">
                    <h3 className="font-bold text-base text-foreground truncate">
                        {assistantData?.header || "AI Assistant"}
                    </h3>
                    {systemMessage && (
                        <div className="text-xs hidden text-muted-foreground truncate italic mt-0.5">
                            System: {systemMessage.substring(0, 60)}{systemMessage.length > 60 ? '...' : ''}
                        </div>
                    )}
                </div>


            </div> */}


            {/* Assistant content */}

            <div className="flex flex-col items-center justify-between w-[600px] bg-white rounded-md  gap-5  p-4  ">
                <div className=" bg-white h-full  space-y-2 rounded-md w-full">
                    {userMessage && (
                        <div className=" p-3 w-full border-b border-gray-200   ">

                            <div className="text-black">{userMessage}</div>
                        </div>
                    )}
                    <div className="w-max max-w-[600px]">
                        {assistantData?.body && assistantData.body.length > 0 && (
                            <div className="space-y-2 transition-all duration-200  w-full">
                                {assistantData.body.filter(block => block.type == 'image' || block.type == 'svg').map((block, idx) => (
                                    <div key={idx} className="animate-fadeIn w-max max-w-full" style={{ animationDelay: `${idx * 100}ms` }}>
                                        {renderBlock(block, idx)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {assistantData?.body && assistantData.body.length > 0 ? (
                        <div className="space-y-2 transition-all duration-200 ">
                            {assistantData.body.filter(block => block.type !== 'image' && block.type !== 'svg').map((block, idx) => (
                                <div key={idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                                    {renderBlock(block, idx)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground italic text-sm my-6 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                            <span className="ml-3">Generating response...</span>
                        </div>
                    )}
                </div>

                {/* Footer content with additional information */}
                {assistantData?.footer && assistantData.footer.length > 0 && (
                    <div className=" p-3 border-t w-full mx-auto border-gray-200 bg-[var(--color-lime)] dark:border-gray-700 rounded-md ">
                        {/* <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Additional Information</div> */}
                        <div className="space-y-2 text-black">
                            {assistantData.footer.filter(block => block.type !== 'image' && block.type !== 'svg').map((block, idx) => <TextBlock key={idx} content={block.content} className="text-black" />)}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-between  rounded-md  -mt-4 gap-2   ">

                {audio && audio !== 'NA' ? (
                    <div className="flex items-center gap-1  justify-center ">
                        <audio
                            ref={audioRef}
                            src={audio}
                            autoPlay={isAudioPlaying}
                            onPlay={() => setAudioPlaying(true)}
                            onPause={() => setAudioPlaying(false)}
                            onEnded={() => setAudioPlaying(false)}
                        />

                        {/* Audio progress bar */}
                        <div className="w-24 h-1 hidden bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-100 ease-linear"
                                style={{ width: `${audioProgress}%` }}
                            />
                        </div>


                        <div className={`flex items-center w-[200px]  border rounded-l-full rounded-r-md justify-center gap-1 p-2  bg-[#fff] `}>
                            <svg viewBox="0 0 90 40" width="200" height="60" xmlns="http://www.w3.org/2000/svg">
                                <g fill="#000">
                                    {[...Array(10)].map((_, i) => {
                                        const x = i * 10;
                                        // Create different animation patterns based on index
                                        const maxHeight = 15 + (i % 4) * 5; // Values between 15-30
                                        const minY = 15 - (maxHeight - 10) / 2; // Calculate y to keep bar centered
                                        const animationDuration = 0.8 + Math.random() * 0.4; // Random duration between 0.8-1.2s

                                        return (
                                            <rect
                                                key={i}
                                                x={x}
                                                y={isAudioPlaying ? minY : 15}
                                                width="4"
                                                height={isAudioPlaying ? maxHeight : 10}
                                                className="audio-bar"
                                            >
                                                {isAudioPlaying && (
                                                    <animate
                                                        attributeName="height"
                                                        values={`10;${maxHeight};10`}
                                                        dur={`${animationDuration}s`}
                                                        repeatCount="indefinite"
                                                        begin="0s"
                                                    />
                                                )}
                                                {isAudioPlaying && (
                                                    <animate
                                                        attributeName="y"
                                                        values={`15;${minY};15`}
                                                        dur={`${animationDuration}s`}
                                                        repeatCount="indefinite"
                                                        begin="0s"
                                                    />
                                                )}
                                            </rect>
                                        );
                                    })}
                                </g>
                            </svg>

                        </div>


                        <div className="flex items-center ">

                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={audioProgress === 0}
                                onClick={restartAudio}
                                className="h-8 w-8 rounded-full hidden hover:bg-primary/10 transition-all duration-200"
                                title="Restart audio"
                            >
                                <Square className="w-4 h-4" />
                            </Button>

                            <button
                                onClick={toggleAudio}
                                className="h-[77px] w-[77px] rounded-r-full p-0 border-none bg-white "
                                title={isAudioPlaying ? 'Pause audio' : 'Play audio'}
                            >
                                {isAudioPlaying ? (
                                    <div className="flex items-center justify-center">
                                        <Pause fill="#000" className="w-10 h-10" />
                                    </div>
                                ) : (

                                    <div className="flex items-center justify-center">
                                        <Play fill="#000" className="w-10 h-10" />
                                    </div>

                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <span className="text-muted-foreground  text-sm">{audio === 'NA' ? 'No audio available' : ''}</span>
                    </div>
                )}
            </div>

            {/* Node handles with improved styling */}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-primary !border-2 !border-background !w-3 !h-3"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-blue-500 !border-2 !border-background !w-3 !h-3"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
        </Card>
    );
}

export default ChatNode;