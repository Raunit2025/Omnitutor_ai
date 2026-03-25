'use client'
import React from 'react'

import "@xyflow/react/dist/style.css";

import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { useParams, useRouter } from 'next/navigation';
import { useCanvas } from './CanvasContext';
import FullPlan from './FullPlan';
import { buildPlannerUrl } from './utils/urlParams';
import { Background, ReactFlow } from '@xyflow/react';
import { nodeTypes, type FileNodeData, type ChatNodeData, type PositionLoggerNodeData, type SlideNodeData } from './nodes';
import { edgeTypes } from './edges';
import PromptBar from './PromptBar';
import type { Message } from 'ai';
import NavProfile from '@/components/landing/NavProfile';

interface FileInfo {
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileFormat: string;
}


const PlannerPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const { nodes, edges, onNodesChange, onEdgesChange, setNodes, addNode, canvasId, chatWithTutoringSession } = useCanvas();

    const {
        selectedDate,
        setSelectedDate,
        setGoalId,
        isCanvasLoading,
        isParamsLoading,
        goalId,
        todayGoals
    } = useCanvas();

    console.log(nodes, "nodessss")


    // Handle date change with proper URL updating
    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            console.log('Date changed to:', date);
            setGoalId(null);
            setNodes([]);
            // Update URL with new date and clear canvas/goal params
            const newUrl = buildPlannerUrl(`/planner/${id}`, { date });
            router.push(newUrl);
            setSelectedDate(date);
        }
    };

    const addChat = (data: PositionLoggerNodeData | FileNodeData | ChatNodeData | SlideNodeData, forceOffset?: { x: number, y: number }, type?: string) => {
        try {
            // Only handle ChatNodeData for chat operations
            if (!('conversation' in data)) {
                console.warn('addChat called with non-chat data:', data);
                return;
            }

            const chatNodeData = data as ChatNodeData;
            const fileNodesData = nodes.filter(node => node.type === "file").map(node => node.data as FileNodeData);
            const selectedFileNodesData = fileNodesData.filter((node: FileNodeData) => node.isSelected);
            console.log(forceOffset, "forceOffset", type);

            const fileNodesDataset: FileInfo[] = selectedFileNodesData.map((fileNode: FileNodeData) => ({
                fileName: fileNode.fileName,
                fileSize: fileNode.fileSize,
                fileURL: fileNode.fileURL,
                fileFormat: fileNode.fileFormat
            }));

            const allFileNodes: FileInfo[] = fileNodesData.map((fileNode: FileNodeData) => ({
                fileName: fileNode.fileName,
                fileSize: fileNode.fileSize,
                fileURL: fileNode.fileURL,
                fileFormat: fileNode.fileFormat
            }));

            const chatNodesData = nodes.filter(node => node.type === "chat-node").map(node => node.data as ChatNodeData);

            const chatNodeId = addNode({ conversation: [{ role: "user", content: chatNodeData.conversation[0]?.content || "" }] }, "chat-node", { x: 1200, y: 0 });
            console.log(chatNodeId, "chatNodeId");
            const parsedMessages = chatNodesData.map((node: ChatNodeData) => node.conversation).flat();

            const messages: Message[] = parsedMessages.map((message) => {
                if (message.role === "user") {
                    return {
                        role: message.role,
                        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
                    };
                } else if (message.role === "assistant") {
                    return {
                        role: message.role,
                        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
                    };
                } else if (message.role === "system") {
                    return {
                        role: message.role,
                        content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
                    };
                }
                return undefined;
            }).filter((msg) => msg !== undefined) as Message[];

            messages.push({
                role: "user",
                id: chatNodeId,
                content: typeof chatNodeData.conversation[0]?.content === 'string'
                    ? chatNodeData.conversation[0]?.content
                    : JSON.stringify(chatNodeData.conversation[0]?.content)
            });

            console.log({
                canvasId: canvasId as string,
                files: fileNodesDataset.length > 0 ? fileNodesDataset : allFileNodes,
                messages: messages,
                chatNodeId: chatNodeId
            }, "messages");

            // Validate canvasId before making chat request
            if (!canvasId) {
                console.error('Cannot start chat session: No canvas ID available');
                return;
            }

            const slideNodesData = nodes.filter(node => node.type === "slide-node")[0]?.data.content;

            // Add a small delay to ensure the node is created and saved before making the chat request
            setTimeout(() => {
                console.log('Making chat request with node ID:', chatNodeId);
                chatWithTutoringSession({
                    canvasId: canvasId as string,
                    files: fileNodesDataset.length > 0 ? fileNodesDataset : allFileNodes,
                    messages: [{ role: "assistant", content: slideNodesData }, ...messages] as {
                        role: "user" | "assistant" | "system";
                        content: string;
                    }[],
                    chatNodeId: chatNodeId
                });
            }, 500); // 500ms delay to ensure node is created
        } catch (error) {
            console.error('Error in addChat:', error);
        }
    };

    // Show loading state when parameters are being loaded
    if (isParamsLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col">
            {/* Date Selector */}
            <div className="p-4 bg-transparent fixed z-50 top-1 right-5">
                <div className="flex items-center justify-end max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 border border-gray-200">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size={"lg"} className="justify-start text-left font-normal">
                                    <CalendarIcon className="mr-1 h-4 w-4 hidden sm:block" stroke='#8C75F2' />
                                    {format(selectedDate, "PPP")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 ">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FullPlan />
                        <NavProfile />

                    </div>
                </div>
            </div>

            {/* React Flow Canvas */}
            <div className="flex-1 relative">
                {/* Canvas Loading Indicator */}
                {isCanvasLoading && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-40">
                        <div className="flex items-center gap-2 bg-background/80 p-4 rounded-lg border">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading canvas...</span>
                        </div>
                    </div>
                )}

                <ReactFlow
                    nodes={nodes}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    edges={edges}
                    edgeTypes={edgeTypes}
                    onEdgesChange={onEdgesChange}
                    minZoom={0.1}
                    maxZoom={10}
                    fitViewOptions={{ padding: 0.2 }}
                    defaultEdgeOptions={{
                        animated: true,
                        style: { stroke: '#555' }
                    }}
                >
                    <Background />
                    {goalId && nodes.length > 0 && todayGoals?.goals.find(goal => goal.id === goalId)?.activity_type === "study" ? (
                        <PromptBar addNode={addChat} addDocuments={() => { }} />
                    ) : null}
                </ReactFlow>

            </div>
        </div>
    );
};

export default PlannerPage;