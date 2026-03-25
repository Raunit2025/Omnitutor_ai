'use client'
import React, { useCallback } from 'react'

import "@xyflow/react/dist/style.css";

import { Loader2 } from 'lucide-react';

import { useCanvas } from './CanvasContext';
import { Background, ReactFlow } from '@xyflow/react';
import { nodeTypes, type FileNodeData, type ChatNodeData, type PositionLoggerNodeData, type SlideNodeData } from './nodes';
import { edgeTypes } from './edges';
import type { Message } from 'ai';
import PromptBar from './PromptBar';
import NavProfile from '@/components/landing/NavProfile';
// import PromptBar from '../../planner/[id]/PromptBar';

interface FileInfo {
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileFormat: string;
}


const PlannerPage = () => {

    const { nodes, edges, onNodesChange, onEdgesChange, setNodes, addNode, canvasId, chatWithTutoringSession } = useCanvas();

    const { isCanvasLoading, isParamsLoading } = useCanvas();



    const addDocuments = useCallback((fileInfoArray: { fileName: string, fileSize: number, fileURL: string, fileFormat: string }[]) => {
        console.log("In addDocuments, received:", fileInfoArray);

        if (!Array.isArray(fileInfoArray) || fileInfoArray.length === 0) {
            console.error("Invalid or empty fileInfoArray array:", fileInfoArray);
            return;
        }

        // Add each file as a separate node with different positions
        fileInfoArray.forEach((fileInfo) => {
            console.log("Adding node for:", fileInfo);

            // Calculate an offset for each file to ensure they're not stacked
            const offset = {
                x: 350, // Horizontal offset between nodes
                y: 150   // Slight vertical offset
            };

            // Add the node with the calculated offset
            addNode({ ...fileInfo, isSelected: false, isHidden: false }, "file", offset);
        });

    }, [addNode]);



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
                const initialMessage = {
                    role: "assistant" as const,
                    content: slideNodesData || "Hello, how can I help you today?"
                };

                const chatMessages = [initialMessage, ...messages];

                // Filter out any messages without content
                const validChatMessages = chatMessages.filter(message =>
                    message.content && message.content.trim() !== ""
                ).map(message => ({
                    role: message.role,
                    content: message.content
                })) as {
                    role: "user" | "assistant" | "system";
                    content: string;
                }[];

                chatWithTutoringSession({
                    canvasId: canvasId as string,
                    files: fileNodesDataset.length > 0 ? fileNodesDataset : allFileNodes,
                    messages: validChatMessages,
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
                    {/* <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 border border-gray-200"> */}
                    <NavProfile />

                    {/* </div> */}
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
                    <PromptBar addNode={addChat} addDocuments={addDocuments} />
                </ReactFlow>

            </div>
        </div>
    );
};

export default PlannerPage;