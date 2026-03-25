import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { StudyPlan, DailyPlan, StudyProgress } from '@/types/study-plan';
import { Position, useReactFlow, useNodesState, useEdgesState, type Edge, type OnEdgesChange, type OnNodesChange } from '@xyflow/react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import type { Canvas, Node as CanvasNode } from "@/types/canvas";
import { toast } from 'sonner';
import { parseUrlParams, validateCanvasId, validateGoalId, buildPlannerUrl, validateParameterConsistency } from './utils/urlParams';
import { api } from '@/trpc/react';
import client from '@/lib/appwrite/appwrite';
import type { AppNode, ChatNodeData, ChatNodeType, NotesNodeData, PositionLoggerNodeData, SlideNodeData, TestNodeData } from './nodes';
import { ID } from 'node-appwrite';
import type { StudySlidesResponse } from '@/services/shared/ai-service';

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
    addNode: (data: PositionLoggerNodeData | SlideNodeData | TestNodeData | ChatNodeData | NotesNodeData, type: string, forceOffset?: { x: number, y: number }) => string;
    playingAudioLink: string;
    setPlayingAudioLink: (link: string) => void;
    onEdgesChange: OnEdgesChange<Edge>;
    setNodes: (nodes: AppNode[]) => void;
    setSlideAudio: (nodeId: string, slideIndex: number, audio: string) => void;
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;

    // State management
    studyPlan: StudyPlan | null;
    setStudyPlan: (plan: StudyPlan | null) => void;
    todayGoals: (DailyPlan & { progress: StudyProgress; }) | null;
    setTodayGoals: (goals: (DailyPlan & { progress: StudyProgress; }) | null) => void;
    goalId: string | null;
    setGoalId: (goalId: string | null) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;

    // Canvas data
    canvas: Canvas | null;
    canvasId: string | null;

    // Goal management
    handleGoalToggle: (goalId: string, completed: boolean, estimatedTime: number) => void;
    createCanvasHandler: (params: { subject: string, exam: string, goalId: string, canvas_id: string }) => void;

    // Chat functionality
    chatWithTutoringSession: (params: ChatSessionParams) => void;

    // Loading states
    isCanvasLoading: boolean;
    isCreatingCanvas: boolean;
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
    const { id: planId } = useParams();
    const router = useRouter();

    // Parse URL parameters with validation using useMemo for immediate availability
    const urlParams = useMemo(() => {
        return parseUrlParams(searchParams);
    }, [searchParams]);

    // State management
    const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
    const [todayGoals, setTodayGoals] = useState<(DailyPlan & { progress: StudyProgress; }) | null>(null);
    const [goalId, setGoalId] = useState<string | null>(urlParams.goalId);
    const [selectedDate, setSelectedDate] = useState(urlParams.date);
    const [canvasId, setCanvasId] = useState<string | null>(urlParams.canvas_id);
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

    const { data: studyPlanData, refetch: refetchStudyPlan } = api.planner.getStudyPlan.useQuery(
        { planId: planId as string },
        {
            enabled: !!planId,
            retry: 3
        }
    );

    const { data: selectedDateData, refetch: refetchGoalsForDate } = api.planner.getGoalsForDate.useQuery({
        planId: planId as string,
        date: selectedDate.toISOString()
    }, {
        enabled: !!planId,
        retry: 3
    });



    const { mutate: updateGoalCompletion } = api.planner.updateGoalCompletion.useMutation({
        onSuccess: () => {
            toast.success('Goal updated successfully!');
            // Refetch both study plan and goals for the selected date
            refetchStudyPlan();
            refetchGoalsForDate();
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update goal');
        }
    });

    const { mutate: createCanvas, isPending: isCreatingCanvas } = api.canvas.createCanvas.useMutation({
        onSuccess: (data) => {
            console.log(data, "Canvas created successfully");
            if (data?.$id && data?.goalId) {
                const newUrl = buildPlannerUrl(`/planner/${planId}`, {
                    canvas_id: data.$id,
                    goalId: data.goalId,
                    date: selectedDate
                });
                router.push(newUrl);
            } else {
                console.error('Canvas created but missing required data:', data);
                toast.error('Canvas created but navigation failed');
            }
        },
        onError: (error) => {
            console.error('Error creating canvas:', error);
            toast.error('Failed to create canvas');
        }
    });

    const { data: canvas, refetch: refetchCanvas, isLoading: isCanvasLoading, error: canvasError } = api.canvas.getCanvas.useQuery({
        id: canvasId as string,
    }, {
        enabled: !!canvasId && validateCanvasId(canvasId as string),
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

    // Add after TRPC queries (around line 105)
    const debouncedRefetch = useCallback(
        debounce(() => {
            console.log('Debounced canvas refetch triggered for canvas:', canvasId);
            refetchCanvas();
        }, 1000),
        [refetchCanvas, canvasId]
    );

    useEffect(() => {
        if (!canvasId) return;

        refetchCanvas();

        // Subscribe to canvas-level changes
        const canvasUnsubscribe = client.subscribe(
            `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_NEW_CANVAS_COLLECTION_ID}.documents.${canvasId}`,
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

                if (nodeCanvasId === canvasId) {
                    console.log('✅ Relevant node update for canvas:', canvasId);

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
    }, [canvasId, refetchCanvas, debouncedRefetch]);

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

                        // Schedule database update after state update completes
                        if (canvasId) {
                            setTimeout(() => {
                                const updatedNodeData = {
                                    ...node.data,
                                    conversation: updatedConversation
                                };

                                console.log('Saving node data to database:', updatedNodeData);

                                updateNodeData({
                                    nodeId: node.id,
                                    data: JSON.stringify(updatedNodeData)
                                });
                            }, 0);
                        }

                        return updatedNode;
                    }
                    return node;
                });

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
        setCanvasId(urlParams.canvas_id);
        setGoalId(urlParams.goalId);
        setSelectedDate(urlParams.date);

        setIsParamsLoading(false);

    }, [urlParams]);



    // Handle study plan data
    useEffect(() => {
        if (studyPlanData) {
            console.log('Study plan loaded:', studyPlanData);
            setStudyPlan(studyPlanData);
        }
    }, [studyPlanData]);

    // Handle selected date data 
    useEffect(() => {
        if (selectedDateData?.goals) {
            console.log("Loading goals for date:", selectedDate, selectedDateData);


            setTodayGoals(selectedDateData as DailyPlan & { progress: StudyProgress });
        }
    }, [selectedDateData, canvasId, selectedDate]);

    // Validate goal ID against loaded goals (separate effect to prevent loops)
    useEffect(() => {
        if (goalId && selectedDateData?.goals) {
            const goalExists = selectedDateData.goals.some(goal => goal.id === goalId);
            if (!goalExists) {
                console.warn('Goal ID not found in loaded goals:', goalId);
                toast.warning('Selected goal not found for this date');
                // Use timeout to prevent immediate re-render loop
                setTimeout(() => setGoalId(null), 0);
            }
        }
    }, [goalId, selectedDateData?.goals]);





    // Goal completion handler
    const handleGoalToggle = useCallback((goalId: string, completed: boolean, estimatedTime: number) => {
        updateGoalCompletion({
            planId: planId as string,
            goalId,
            completed,
            studyTime: completed ? estimatedTime : 0
        });
    }, [updateGoalCompletion, planId]);

    // Canvas creation handler with better validation
    const createCanvasHandler = useCallback(({ subject, exam, goalId, canvas_id }: { subject: string, exam: string, goalId: string, canvas_id: string }) => {
        if (!goalId || !validateGoalId(goalId)) {
            console.error('Invalid goal ID provided to createCanvasHandler:', goalId);
            toast.error('Invalid goal ID');
            return;
        }

        setGoalId(goalId);

        if (canvas_id && validateCanvasId(canvas_id)) {
            console.log('Navigating to existing canvas:', canvas_id);
            const newUrl = buildPlannerUrl(`/planner/${planId}`, {
                canvas_id,
                goalId,
                date: selectedDate
            });
            router.push(newUrl);
        } else {
            console.log('Creating new canvas for goal:', goalId);
            createCanvas({
                type: "planner",
                topic: subject,
                planId: planId as string,
                goalId,
            });
        }
    }, [setGoalId, router, planId, selectedDate, createCanvas]);



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

                console.log('Canvas loaded successfully with', newNodes.length, 'nodes');
            } catch (error) {
                console.error('Error processing canvas data:', error);
                toast.error('Failed to process canvas data');
            }
        } else if (canvasId && !canvas?.nodes && !isCanvasLoading && !canvasError) {
            // Canvas exists but has no nodes, clear current nodes
            console.log('Canvas exists but has no nodes, clearing current state');
            setNodes([]);
            setEdges([]);
        }
    }, [canvas, canvasError, isCanvasLoading, setNodes, setEdges, canvasId]);


    const addNode = useCallback((
        data: PositionLoggerNodeData | SlideNodeData | TestNodeData | ChatNodeData | NotesNodeData,
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
            if (canvasId) {
                setTimeout(() => {
                    try {
                        saveNode({
                            canvas_id: canvasId as string,
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
    }, [getNodes, setNodes, setEdges, saveNode, canvasId, fitView, getNode]);

    // Auto-create action node when canvas is empty

    console.log(nodes, "nodes")


    useEffect(() => {
        const actionNode = nodes.find(node => node.type === "action-node");
        if (!actionNode && nodes.length < 1 && canvas && canvas.nodes.length < 1) {
            console.log('Auto-creating action node for empty canvas');
            addNode({ label: "NA" }, "action-node", { x: 0, y: 0 });
        }
    }, [nodes.length, canvas, addNode]);


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
        studyPlan,
        setStudyPlan,
        todayGoals,
        setTodayGoals,
        goalId,
        setGoalId,
        selectedDate,
        setSelectedDate,
        currentSlideIndex,
        setCurrentSlideIndex,

        // Goal management
        handleGoalToggle,
        createCanvasHandler,

        // Chat functionality
        chatWithTutoringSession,

        // Canvas data
        canvas: canvas as Canvas | null,
        canvasId: canvasId as string | null,

        // Loading states
        isParamsLoading,
        isCanvasLoading,
        isCreatingCanvas,

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