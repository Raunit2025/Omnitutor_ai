import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { StudyPlan, DailyPlan, StudyProgress } from '@/types/study-plan';
import { Position, useReactFlow, useNodesState, useEdgesState, type Edge, type OnEdgesChange, type OnNodesChange } from '@xyflow/react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import type { Canvas, Node as CanvasNode } from "@/types/canvas";
import { toast } from 'sonner';
import { parseUrlParams, validateCanvasId, validateGoalId, buildPlannerUrl, validateParameterConsistency } from '@/app/(protected)/planner/[id]/utils/urlParams';
import { api } from '@/trpc/react';
import client from '@/lib/appwrite/appwrite';
import type { AppNode, ChatNodeData, ChatNodeType, FileNodeData, NotesNodeData, PositionLoggerNodeData, SlideNodeData, TestNodeData } from './nodes';
import { ID } from 'node-appwrite';
import type { StudySlidesResponse } from '@/services/shared/ai-service';
import type { AssistantConv } from '../../planner/[id]/nodes/ChatNode';

interface FileInfo {
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileFormat: string;
}

interface ChatSessionParams {
    canvasId: string;
    files: FileInfo[];
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    chatNodeId: string;
}

function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout;

    const debounced = ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    }) as T & { cancel: () => void };

    debounced.cancel = () => clearTimeout(timeoutId);

    return debounced;
}
type CanvasContextType = {
    // Node and Canvas management
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<AppNode>;
    addNode: (data: PositionLoggerNodeData | SlideNodeData | TestNodeData | ChatNodeData | NotesNodeData | FileNodeData, type: string, forceOffset?: { x: number, y: number }) => string;
    playingAudioLink: string;
    setPlayingAudioLink: (link: string) => void;
    onEdgesChange: OnEdgesChange<Edge>;
    setNodes: (nodes: AppNode[]) => void;
    setSlideAudio: (nodeId: string, slideIndex: number, audio: string) => void;
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;
    addChatNode: (message: { object: AssistantConv | string, systemMessage: string, audio: string }) => void;
    // State management


    // Canvas data
    canvas: Canvas | null;
    canvasId: string | null;



    // Chat functionality
    chatWithTutoringSession: (params: ChatSessionParams) => void;

    // Loading states
    isCanvasLoading: boolean;

    isParamsLoading: boolean;
};

export const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvas must be used within a CanvasProvider');
    }
    return context;
};



// Provider component that manages the shared state
export const CanvasProvider = ({ children }: { children: React.ReactNode }) => {
    const searchParams = useSearchParams();
    const { canvas_id } = useParams();
    const router = useRouter();

    // Parse URL parameters with validation using useMemo for immediate availability
    const urlParams = useMemo(() => {
        return parseUrlParams(searchParams);
    }, [searchParams]);

    // State management
    const [isParamsLoading, setIsParamsLoading] = useState(false);
    const [playingAudioLink, setPlayingAudioLink] = useState<string>('');
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState<AppNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { getNodes, fitView, getNode } = useReactFlow();
    const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const positionUpdateTimeoutRef = useRef<{ [nodeId: string]: NodeJS.Timeout }>({});
    const chatUpdateInProgressRef = useRef<boolean>(false);
    const chatUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);







    const { data: canvas, refetch: refetchCanvas, isLoading: isCanvasLoading, error: canvasError } = api.canvas.getCanvas.useQuery({
        id: canvas_id as string,
    }, {
        enabled: !!canvas_id && validateCanvasId(canvas_id as string),
        refetchOnWindowFocus: false,
        refetchOnMount: true,

        retry: (failureCount, error) => {
            // Don't retry if it's a 404 (canvas not found)
            if (error?.data?.code === 'NOT_FOUND') {
                return false;
            }
            return failureCount < 3;
        }
    });

    useEffect(() => {
        if (canvas?.nodes) {
            fitView({
                padding: 0.1,
                duration: 800,
                minZoom: 0.1,
                maxZoom: 1.5,
            });
        }
    }, [isCanvasLoading]);

    // Add after TRPC queries (around line 105)
    const debouncedRefetch = useCallback(
        debounce(() => {
            console.log('Debounced canvas refetch triggered for canvas:', canvas_id);
            refetchCanvas();
        }, 1000),
        [refetchCanvas, canvas_id]
    );

    useEffect(() => {
        if (!canvas_id) return;

        refetchCanvas();

        // Subscribe to canvas-level changes
        const canvasUnsubscribe = client.subscribe(
            `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_NEW_CANVAS_COLLECTION_ID}.documents.${canvas_id}`,
            response => {
                console.log('Canvas update:', response);
                refetchCanvas();
            }
        );

        // Subscribe to ALL node updates but filter by canvas_id
        const nodesUnsubscribe = client.subscribe(
            `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_NODE_COLLECTION_ID}.documents`,
            response => {
                console.log('Node update received:', response);

                // ✅ KEY FILTER: Only react if this node belongs to our canvas
                const nodeCanvasId = (response.payload as { canvas_id: string }).canvas_id;

                if (nodeCanvasId === canvas_id) {
                    console.log('✅ Relevant node update for canvas:', canvas_id);

                    // Skip refetch if chat update is in progress
                    if (chatUpdateInProgressRef.current) {
                        console.log('🔄 Skipping refetch due to chat update in progress');
                        return;
                    }

                    if (response.events.includes("databases.*.collections.*.documents.*.update")) {
                        // Position updates - use debounced refetch
                        debouncedRefetch();
                    } else if (
                        response.events.includes("databases.*.collections.*.documents.*.create") ||
                        response.events.includes("databases.*.collections.*.documents.*.delete")
                    ) {
                        // Structural changes - immediate refetch
                        refetchCanvas();
                    }
                } else if (nodeCanvasId) {
                    console.log(`❌ Ignoring node update for different canvas: ${nodeCanvasId}`);
                }
            }
        );

        return () => {
            canvasUnsubscribe();
            nodesUnsubscribe();
            debouncedRefetch.cancel();
        };
    }, [canvas_id, refetchCanvas, debouncedRefetch]);

    const { mutate: saveNode } = api.canvas.saveNode.useMutation({
        onSuccess: (data) => {
            console.log(data, "Node saved successfully");
        },
        onError: (error) => {
            console.error('Error saving node:', error);
        }
    });

    const { mutate: updateNodePosition } = api.canvas.updateNodePosition.useMutation({
        onSuccess: () => {
            console.log("Node position updated successfully")
        },
        onError: (error) => {
            console.error('Error updating node position:', error);
        }
    });

    const { mutate: updateNodeData } = api.canvas.updateNodeData.useMutation({
        onSuccess: (data) => {
            console.log("Node data updated successfully:", data);
        },
        onError: (error) => {
            console.error('Error updating node data:', error);
            // Reset chat update flag if there's an error
            chatUpdateInProgressRef.current = false;
        }
    });



    const { mutate: chatMutation } = api.canvas.ChatWithTutoringSession.useMutation({
        onSuccess: (data) => {
            console.log('Chat response received:', data);

            // Set flag to prevent real-time refetch from overriding our update
            chatUpdateInProgressRef.current = true;

            // Clear any existing timeout
            if (chatUpdateTimeoutRef.current) {
                clearTimeout(chatUpdateTimeoutRef.current);
            }

            // Create the assistant response
            const assistantResponse = {
                role: "assistant" as const,
                content: data.object,
                audio: data.audio,
                isAudioPlaying: false // Set to false initially
            };

            // Update local state using callback to get fresh state
            setNodes((prevNodes: AppNode[]) => {
                const nodeToUpdate = prevNodes.find(node => node.id === data.chatNodeId);
                if (!nodeToUpdate || nodeToUpdate.type !== 'chat-node') {
                    console.error('Chat node not found:', data.chatNodeId);
                    console.log('Available nodes:', prevNodes.map(n => ({ id: n.id, type: n.type })));
                    chatUpdateInProgressRef.current = false; // Reset flag
                    return prevNodes;
                }

                const currentConversation = (nodeToUpdate.data as ChatNodeData).conversation;
                console.log('Current conversation before update:', currentConversation);

                // Add the assistant response to the conversation
                const updatedConversation = [
                    ...currentConversation,
                    assistantResponse
                ];

                console.log('Updated conversation after adding assistant response:', updatedConversation);

                const updatedNodes = prevNodes.map((node: AppNode) => {
                    if (node.id === data.chatNodeId && node.type === 'chat-node') {
                        const updatedNode = {
                            ...node,
                            data: {
                                ...node.data,
                                conversation: updatedConversation
                            }
                        } as ChatNodeType;

                        return updatedNode;
                    }
                    return node;
                });

                // Schedule the database save after state update completes
                setTimeout(() => {
                    const nodeToSave = updatedNodes.find(n => n.id === data.chatNodeId);
                    if (nodeToSave && canvas_id) {
                        const updatedNodeData = {
                            ...nodeToSave.data,
                            conversation: updatedConversation
                        };

                        console.log('Saving node data to database:', updatedNodeData);
                        const edge = edges.find(edge => edge.target === nodeToSave.id);
                        saveNode({
                            canvas_id: canvas_id as string,
                            node: {
                                id: nodeToSave.id,
                                type: nodeToSave.type,
                                data: JSON.stringify(updatedNodeData),
                                position_x: nodeToSave.position.x,
                                position_y: nodeToSave.position.y
                            },
                            edge: {
                                id: edge?.id as string,
                                source: edge?.source as string,
                                target: edge?.target as string,
                            }
                        });
                    }
                }, 0);

                // Reset flag after a delay to allow database update to complete
                chatUpdateTimeoutRef.current = setTimeout(() => {
                    chatUpdateInProgressRef.current = false;
                    console.log('🔄 Chat update flag reset');
                }, 3000); // Increased to 3 seconds to ensure database update completes

                return updatedNodes;
            });
        },
        onError: (error) => {
            console.error('Error in chat session:', error);
            toast.error('Failed to process chat message');
            chatUpdateInProgressRef.current = false; // Reset flag on error
            if (chatUpdateTimeoutRef.current) {
                clearTimeout(chatUpdateTimeoutRef.current);
            }
        }
    });

    // Handle URL parameter changes with proper validation and error handling
    useEffect(() => {
        console.log('URL parameters detected:', urlParams);
        setIsParamsLoading(true);

        // Validate parameter consistency and show warnings
        const warnings = validateParameterConsistency(urlParams);
        warnings.forEach(warning => {
            console.warn(warning);
            if (warning.includes('Invalid')) {
                toast.error(warning);
            }
        });

        // Update state based on URL parameters

        setIsParamsLoading(false);

    }, [urlParams]);










    // Cleanup function
    const cleanup = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        // Clear all position update timeouts
        Object.values(positionUpdateTimeoutRef.current).forEach(timeout => {
            clearTimeout(timeout);
        });
        positionUpdateTimeoutRef.current = {};
        // Clear chat update timeout
        if (chatUpdateTimeoutRef.current) {
            clearTimeout(chatUpdateTimeoutRef.current);
            chatUpdateTimeoutRef.current = null;
        }
    }, []);

    const chatWithTutoringSession = useCallback((params: ChatSessionParams) => {
        if (!params.canvasId || !validateCanvasId(params.canvasId)) {
            console.error('Invalid canvas ID for chat session:', params.canvasId);
            toast.error('Invalid canvas ID for chat session');
            return;
        }
        chatMutation({
            ...params,
            forUser: canvas?.forUser || ""
        });
    }, [chatMutation]);




    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);
    const onNodesChange = useCallback<OnNodesChange<AppNode>>((changes) => {
        // Apply changes to the internal state first
        onNodesChangeInternal(changes);

        // Check for position changes and update backend
        changes.forEach((change) => {
            if (change.type === 'position' && change.position && change.id) {
                // Clear any existing timeout for this node
                if (positionUpdateTimeoutRef.current[change.id]) {
                    clearTimeout(positionUpdateTimeoutRef.current[change.id]);
                }

                // Debounce the position update to avoid too many API calls
                positionUpdateTimeoutRef.current[change.id] = setTimeout(() => {
                    console.log('Updating node position:', change.id, change.position);
                    updateNodePosition({
                        nodeId: change.id,
                        position: {
                            x: change.position!.x,
                            y: change.position!.y,
                        }
                    });
                    // Clean up the timeout reference
                    delete positionUpdateTimeoutRef.current[change.id];
                }, 500); // 500ms debounce
            }
        });
    }, [onNodesChangeInternal, updateNodePosition]);


    // Handle canvas data changes with better error handling
    useEffect(() => {
        if (canvasError) {
            console.error('Canvas loading error:', canvasError);
            return;
        }

        // Skip canvas data loading if chat update is in progress
        if (chatUpdateInProgressRef.current) {
            console.log('🔄 Skipping canvas data loading due to chat update in progress');
            return;
        }

        if (canvas?.nodes) {
            console.log("Loading canvas data:", canvas);

            try {
                const newNodes = canvas.nodes.map((n: CanvasNode) => {
                    let parsedData;
                    try {
                        parsedData = JSON.parse(n.data as string);
                    } catch (error) {
                        console.error('Error parsing node data for node:', n.id, error);
                        parsedData = { label: 'Error parsing data' };
                    }

                    console.log(n, "parsedData")
                    return {
                        id: n.id,
                        type: n.type,
                        position: { x: n.position_x, y: n.position_y },
                        data: parsedData,
                        targetPosition: Position.Left,
                        sourcePosition: Position.Right
                    };
                });

                setNodes(newNodes as AppNode[]);
                setEdges(canvas.edges.map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    animated: true
                } as Edge)));

                // Fit view to all nodes on first load


                console.log('Canvas loaded successfully with', newNodes.length, 'nodes');
            } catch (error) {
                console.error('Error processing canvas data:', error);
                toast.error('Failed to process canvas data');
            }
        } else if (canvas_id && !canvas?.nodes && !isCanvasLoading && !canvasError) {
            // Canvas exists but has no nodes, clear current nodes
            console.log('Canvas exists but has no nodes, clearing current state');
            setNodes([]);
            setEdges([]);
        }
    }, [canvas, canvasError, isCanvasLoading, setNodes, setEdges, canvas_id, fitView]);


    const addNode = useCallback((
        data: PositionLoggerNodeData | SlideNodeData | TestNodeData | ChatNodeData | NotesNodeData | FileNodeData,
        type: string,
        forceOffset = { x: 20, y: 20 }
    ) => {
        try {
            const currentNodes = getNodes();

            // Node positioning logic
            const nodeWidth = 100;
            const nodeHeight = 100;
            const horizontalSpacing = 50;
            const verticalSpacing = 50;

            let newPosition = { x: 0, y: 0 };

            if (currentNodes.length > 0) {
                const lastNode = currentNodes[currentNodes.length - 1];
                const baseX = lastNode ? lastNode.position.x : 0;
                const baseY = lastNode ? lastNode.position.y : 0;

                const possiblePositions = [
                    { x: baseX + nodeWidth + horizontalSpacing, y: baseY },
                    { x: baseX, y: baseY + nodeHeight + verticalSpacing },
                    { x: baseX + nodeWidth + horizontalSpacing, y: baseY + nodeHeight + verticalSpacing },
                    { x: baseX - nodeWidth - horizontalSpacing, y: baseY },
                    { x: baseX, y: baseY - nodeHeight - verticalSpacing },
                ];

                for (let i = 2; i <= 5; i++) {
                    possiblePositions.push({ x: baseX + (nodeWidth + horizontalSpacing) * i, y: baseY });
                    possiblePositions.push({ x: baseX, y: baseY + (nodeHeight + verticalSpacing) * i });
                    possiblePositions.push({ x: baseX - (nodeWidth + horizontalSpacing) * i, y: baseY });
                    possiblePositions.push({ x: baseX, y: baseY - (nodeHeight + verticalSpacing) * i });
                }

                const hasCollision = (x: number, y: number) => {
                    return currentNodes.some(node => {
                        const nodeRight = node.position.x + nodeWidth;
                        const nodeBottom = node.position.y + nodeHeight;
                        const newNodeRight = x + nodeWidth;
                        const newNodeBottom = y + nodeHeight;

                        return !(
                            x > nodeRight + horizontalSpacing ||
                            newNodeRight < node.position.x - horizontalSpacing ||
                            y > nodeBottom + verticalSpacing ||
                            newNodeBottom < node.position.y - verticalSpacing
                        );
                    });
                };

                for (const pos of possiblePositions) {
                    if (!hasCollision(pos.x, pos.y)) {
                        newPosition = pos;
                        break;
                    }
                }
            }

            const uniqueId = ID.unique();
            const actionNode = currentNodes.filter(node => node.type === "action-node").pop();
            const lastChatNode = currentNodes.filter(node => node.type === "chat-node").pop();
            const lastTestNode = currentNodes.filter(node => node.type === "test-node").pop();
            const lastNotesNode = currentNodes.filter(node => node.type === "notes-node").pop();
            const lastFileNode = currentNodes.filter(node => node.type === "file").pop();
            const lastPositionLoggerNode = currentNodes.filter(node => node.type === "position-logger").pop();

            const newNode = {
                id: uniqueId,
                type: type,
                position: newPosition,
                targetPosition: Position.Left,
                sourcePosition: Position.Right,
                data: data
            } as AppNode;

            let sourceNode: string = actionNode?.id as string;

            if (type === "chat-node") {
                if (lastChatNode) {
                    sourceNode = lastChatNode.id;
                    newNode.position = {
                        x: lastChatNode.position.x + forceOffset?.x,
                        y: lastChatNode.position.y + forceOffset?.y
                    };
                }
            } else if (type === "test-node") {
                if (lastTestNode) {
                    sourceNode = lastTestNode.id;
                    newNode.position = {
                        x: lastTestNode.position.x + forceOffset?.x,
                        y: lastTestNode.position.y + forceOffset?.y
                    };
                }
            } else if (type === "notes-node") {
                if (lastNotesNode) {
                    sourceNode = lastNotesNode.id;
                    newNode.position = {
                        x: lastNotesNode.position.x + forceOffset?.x,
                        y: lastNotesNode.position.y + forceOffset?.y
                    };
                }
            } else if (type === "file") {
                if (lastFileNode) {
                    sourceNode = lastFileNode.id;
                    newNode.position = {
                        x: lastFileNode.position.x + forceOffset?.x,
                        y: lastFileNode.position.y + forceOffset?.y
                    };
                }
            } else if (type === "position-logger") {
                if (lastPositionLoggerNode) {
                    sourceNode = lastPositionLoggerNode.id;
                    newNode.position = {
                        x: lastPositionLoggerNode.position.x + forceOffset?.x,
                        y: lastPositionLoggerNode.position.y + forceOffset?.y
                    };
                }
            } else {
                sourceNode = actionNode?.id as string;
                if (actionNode) {
                    newNode.position = {
                        x: actionNode.position.x + forceOffset?.x,
                        y: actionNode.position.y + forceOffset?.y
                    };
                }
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                const node = getNode(uniqueId);
                if (node) {
                    fitView({
                        nodes: [node],
                        padding: 0.2,
                        duration: 800,
                        minZoom: 0.5,
                        maxZoom: 1,
                    });
                }
            }, 100);

            const edge = {
                id: ID.unique(),
                source: sourceNode,
                target: uniqueId,
                animated: true
            };

            setEdges(edges => [...edges, edge]);
            setNodes(nodes => [...nodes, newNode]);

            // Schedule database save after state updates complete
            if (canvas_id && newNode.type !== "chat-node") {
                setTimeout(() => {
                    try {
                        saveNode({
                            canvas_id: canvas_id as string,
                            node: {
                                id: newNode.id,
                                type: newNode.type as string,
                                data: JSON.stringify(newNode.data),
                                position_x: newNode.position.x,
                                position_y: newNode.position.y
                            },
                            edge: { id: edge.id, source: edge.source, target: edge.target }
                        });
                    } catch (error) {
                        console.error('Error saving node to backend:', error);
                    }
                }, 0);
            }

            return uniqueId;
        } catch (error) {
            console.error('Error in addNode:', error);
            return `error-node-${Date.now()}`;
        }
    }, [getNodes, setNodes, setEdges, saveNode, canvas_id, fitView, getNode]);

    // Auto-create action node when canvas is empty



    useEffect(() => {
        const actionNode = nodes.find(node => node.type === "action-node");
        if (!actionNode && nodes.length < 1 && canvas && canvas.nodes.length < 1 && canvas.type !== "custom") {
            console.log('Auto-creating action node for empty canvas');
            addNode({ label: "NA" }, "action-node", { x: 200, y: 0 });
        } else if (!actionNode && nodes.length == 1 && canvas && canvas.nodes.length == 1 && canvas.type === "custom") {
            console.log('Auto-creating action node for empty canvas');
            addNode({ label: "NA" }, "action-node", { x: 800, y: 0 });
        }
    }, [nodes.length, canvas, addNode]);

    // Auto-create action node after syllabus node
    useEffect(() => {
        if (nodes.length > 0 && (canvas?.type === "exam" || canvas?.type === "topic") && nodes[nodes.length - 1]?.type === "syllabus-node") {
            const lastNode = nodes[nodes.length - 1];
            if (!lastNode) return;

            const node = {
                id: ID.unique(),
                type: "action-node",
                position: { x: lastNode.position.x + 600, y: 300 },
                data: { label: "Action" },
                targetPosition: Position.Left,
                sourcePosition: Position.Right
            }
            setNodes((nds) => [...nds, node as AppNode]);
            const edge = {
                id: ID.unique(),
                source: lastNode.id,
                target: node.id,
                animated: true
            }
            setEdges((eds) => [...eds, edge]);

            // Schedule database save after state updates complete
            if (canvas_id) {
                setTimeout(() => {
                    saveNode({
                        canvas_id: canvas_id as string,
                        node: {
                            id: node.id,
                            type: node.type,
                            data: JSON.stringify(node.data),
                            position_x: node.position.x,
                            position_y: node.position.y
                        },
                        edge: {
                            id: edge.id,
                            source: edge.source,
                            target: edge.target,
                        }
                    });
                }, 0);
            }
        }
    }, [nodes]);


    const setSlideAudio = (nodeId: string, slideIndex: number, audio: string) => {
        console.log(nodeId, slideIndex, audio, "setSlideAudio")
        setNodes(nodes => nodes.map(node => {
            if (node.id === nodeId && node.type === "slide-node") {
                const slidesData = JSON.parse(node.data.content) as StudySlidesResponse;
                slidesData.slides[slideIndex]!.audio = audio;
                const newData = JSON.stringify(slidesData);

                const updatedNodeData = {
                    ...node.data,
                    content: newData
                };

                // Schedule database update after state update completes
                setTimeout(() => {
                    updateNodeData({
                        nodeId: nodeId,
                        data: JSON.stringify(updatedNodeData)
                    });
                }, 0);

                return {
                    ...node,
                    data: updatedNodeData
                }
            }
            return node;
        }))
    }
    const addChatNode = (message: { object: AssistantConv | string, systemMessage: string, audio: string }) => {

        const chatNodes = nodes.filter(node => node.type === "chat-node");

        const actionNode = nodes.find(node => node.type === "action-node");


        const baseX = chatNodes.length > 0 ? chatNodes[chatNodes.length - 1]?.position.x : actionNode?.position.x || 0;
        const newChatNodeId = ID.unique();
        const sourceNodeId = chatNodes.length > 0 ? chatNodes[chatNodes.length - 1]?.id : actionNode?.id || 0;

        const node = {
            id: newChatNodeId,
            type: "chat-node",
            position: { x: (baseX ?? 0) + 600, y: 300 },
            data: {
                conversation: [{
                    role: 'assistant' as const,
                    content: message.object,
                    audio: message.audio,
                    isAudioPlaying: message.audio && message.audio !== 'NA' ? true : false
                }]
            },
            targetPosition: Position.Left,
            sourcePosition: Position.Right
        }
        setNodes((nds: AppNode[]) => [...nds, node as AppNode]);

        const edge = {
            id: ID.unique(),
            source: `${sourceNodeId}`,
            target: `${newChatNodeId}`,
            animated: true
        }
        setEdges((eds) => [...eds, edge]);

        // Schedule database save after state updates complete
        setTimeout(() => {
            saveNode({
                canvas_id: canvas_id as string,
                node: {
                    id: node.id,
                    type: node.type,
                    data: JSON.stringify({
                        ...node.data,
                        conversation: node.data.conversation.map(message => ({
                            ...message,
                            audio: message.audio,
                            isAudioPlaying: false
                        }))
                    }),
                    position_x: node.position.x,
                    position_y: node.position.y
                },
                edge: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                }
            })
        }, 0);
    }

    const value: CanvasContextType = {
        // Node and Canvas management
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        addNode,
        setNodes,
        setSlideAudio,
        // State management

        currentSlideIndex,
        setCurrentSlideIndex,


        // Chat functionality
        chatWithTutoringSession,
        addChatNode,

        // Canvas data
        canvas: canvas as Canvas | null,
        canvasId: canvas_id as string | null,

        // Loading states
        isParamsLoading,
        isCanvasLoading,


        // Audio functionality
        playingAudioLink,
        setPlayingAudioLink,
    };

    return (
        <CanvasContext.Provider value={value}>
            {children}
        </CanvasContext.Provider>
    );
};