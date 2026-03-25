"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type ActionNodeType, type AppNode, type FileNodeData, type ChatNodeData, type NotesNodeType, type SyllabusNodeData, type TestNodeType, type VideoNodeType } from "./index"
import { useCanvas } from "../CanvasContext"
import { api } from "@/trpc/react"
import { ID } from "node-appwrite"
import { toast } from "sonner"
import type { AssistantConv } from "@/app/(protected)/planner/[id]/nodes/ChatNode"
import type { Message } from "ai"
interface FileInfo {
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileFormat: string;
}

const ActionNode = ({ }: NodeProps<ActionNodeType>) => {

    const { addNode, canvasId, canvas, nodes, setNodes, onEdgesChange, edges, addChatNode } = useCanvas();

    const canvasType = canvas?.type as "topic" | "exam" | "custom" | "planner";
    const { mutate: createSlide, isPending: isCreatingSlide } = api.canvas.generateStudySlide.useMutation({
        onSuccess: (data) => {
            console.log(data, "Slide created successfully")
            addNode(
                {
                    content: JSON.stringify(data),
                    id: ID.unique(),
                },
                "slide-node",
                { x: 500, y: 700 }
            );
        },
        onError: (error) => {
            console.error('Error creating slide:', error);
        }
    });
    const { mutate: createTest, isPending: isCreatingTest } = api.canvas.createTest.useMutation({
        onSuccess: (data) => {
            addNode(data as unknown as TestNodeType, "test-node", { x: 500, y: 700 });
        }
    });

    const { mutate: createNotes, isPending: isCreatingNotes } = api.canvas.createNotes.useMutation({
        onSuccess: (data) => {
            addNode(data as unknown as NotesNodeType, "notes-node", { x: 500, y: 700 });
        }
    });

    const { mutate: generateVideo, isPending: isGeneratingVideo } = api.canvas.generateVideo.useMutation({
        onSuccess: (data) => {
            addNode(data as unknown as VideoNodeType, "video-node", { x: 500, y: 700 });
        },
        onError: (error) => {
            console.error('Error generating video:', error);
            toast.error(error.message);
        }
    });


    const { mutate: startTutoringSession, isPending: isStartingTutoringSession } = api.canvas.startTutoringSession.useMutation({
        onSuccess: (data) => {
            console.log(data);
            if (data && typeof data === 'object') {
                // const text = 'text' in data && typeof data.text === 'string' ? data.text : "";
                const systemMessage = 'systemMessage' in data && typeof data.systemMessage === 'string' ? data.systemMessage : "";
                const audio = 'audio' in data && typeof data.audio === 'string' ? data.audio : "";

                addChatNode({
                    object: data.object,
                    systemMessage,
                    audio
                });
            }
        },
        onError: (error) => {

            console.log(error, "from action node");
            toast.error(error.message);
        }
    });

    const handleCreateSlide = () => {


        if (canvasType === "exam" || canvasType === "topic") {
            const syllabus = nodes.find(node => node.type === "syllabus-node")?.data as SyllabusNodeData;

            if (!syllabus) {
                toast.error("Please add a syllabus first");
                return;
            }
            const selectedTopics = syllabus.chapters.flatMap(chapter => chapter.topics.filter(topic => topic.selected));
            if (selectedTopics.length === 0) {
                try {
                    toast.error("Please select at least one topic from syllabus");
                } catch (error) {
                    console.error(error);
                }
                return;
            }

            createSlide({
                topic: selectedTopics.map(topic => topic.name).join(", "),
                target: canvas?.target,
                estimatedTime: 30,
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
            });
        }

    }


    const handleStartTutoringSession = () => {

        if (canvasType === "exam" || canvasType === "topic") {
            const syllabus = nodes.find(node => node.type === "syllabus-node")?.data as SyllabusNodeData;

            if (!syllabus) {
                toast.error("Please add a syllabus first");
                return;
            }
            const selectedTopics = syllabus.chapters.flatMap(chapter => chapter.topics.filter(topic => topic.selected));
            if (selectedTopics.length === 0) {
                toast.error("Please select at least one topic from syllabus");
                return;
            }
            startTutoringSession({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                topic: selectedTopics.map(topic => topic.name).join(", "),
                target: canvas?.target,
            });
        } else {

            const fileNodesData = nodes.filter(node => node.type === "file").map(node => node.data as FileNodeData);
            const selectedFileNodesData = fileNodesData.filter((node: FileNodeData) => node.isSelected);

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

            startTutoringSession({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                files: fileNodesDataset.length > 0 ? fileNodesDataset : allFileNodes,
                messages: messages as {
                    role: "user" | "assistant" | "system";
                    content: string;
                }[],
            });
        }
    }

    const handleCreatePracticeTest = () => {

        if (canvasType === "exam" || canvasType === "topic") {
            const syllabus = nodes.find(node => node.type === "syllabus-node")?.data as SyllabusNodeData;

            if (!syllabus) {
                toast.error("Please add a syllabus first");
                return;
            }
            const selectedTopics = syllabus.chapters.flatMap(chapter => chapter.topics.filter(topic => topic.selected));
            if (selectedTopics.length === 0) {
                toast.error("Please select at least one topic from syllabus");
                return;
            }
            createTest({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                topic: selectedTopics.map(topic => topic.name).join(", "),
                target: canvas?.target,
                estimatedTime: 10,
            });
        } else {
            const fileNodesData = nodes.filter(node => node.type === "file").map(node => node.data as FileNodeData);
            const selectedFileNodesData = fileNodesData.filter((node: FileNodeData) => node.isSelected);

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

            createTest({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                files: fileNodesDataset.length > 0 ? fileNodesDataset : allFileNodes,
                messages: messages as {
                    role: "user" | "assistant" | "system";
                    content: string;
                }[],
                estimatedTime: 10,
            });
        }
    }

    const handleCreateNotes = () => {


        if (canvasType === "exam" || canvasType === "topic") {
            const syllabus = nodes.find(node => node.type === "syllabus-node")?.data as SyllabusNodeData;

            if (!syllabus) {
                toast.error("Please add a syllabus first");
                return;
            }
            const selectedTopics = syllabus.chapters.flatMap(chapter => chapter.topics.filter(topic => topic.selected));
            if (selectedTopics.length === 0) {
                toast.error("Please select at least one topic from syllabus");
                return;
            }
            createNotes({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                topic: selectedTopics.map(topic => topic.name).join(", "),
                target: canvas?.target,
                estimatedTime: 20,
            });
        } else {
            const fileNodesData = nodes.filter(node => node.type === "file").map(node => node.data as FileNodeData);
            const selectedFileNodesData = fileNodesData.filter((node: FileNodeData) => node.isSelected);

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

            createTest({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                files: fileNodesDataset.length > 0 ? fileNodesDataset : allFileNodes,
                messages: messages as {
                    role: "user" | "assistant" | "system";
                    content: string;
                }[],
                estimatedTime: 10,
            });
        }
    }

    const handleGenerateVideo = () => {
        if (canvasType === "exam" || canvasType === "topic") {
            const syllabus = nodes.find(node => node.type === "syllabus-node")?.data as SyllabusNodeData;

            if (!syllabus) {
                toast.error("Please add a syllabus first");
                return;
            }
            const selectedTopics = syllabus.chapters.flatMap(chapter => chapter.topics.filter(topic => topic.selected));
            if (selectedTopics.length === 0) {
                toast.error("Please select at least one topic from syllabus");
                return;
            }
            generateVideo({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                topic: selectedTopics.map(topic => topic.name).join(", "),
                target: canvas?.target,
                style: "educational"
            });
        } else {
            // For custom canvas, use file content or a general topic
            const fileNodesData = nodes.filter(node => node.type === "file").map(node => node.data as FileNodeData);
            const selectedFileNodesData = fileNodesData.filter((node: FileNodeData) => node.isSelected);
            
            if (selectedFileNodesData.length === 0 && fileNodesData.length === 0) {
                toast.error("Please add some files or content first");
                return;
            }

            // Use the first file name as the topic or a generic topic
            const topic = selectedFileNodesData.length > 0 
                ? selectedFileNodesData[0]?.fileName?.replace(/\.[^/.]+$/, "") || "Educational Content"
                : fileNodesData[0]?.fileName?.replace(/\.[^/.]+$/, "") || "Educational Content";

            generateVideo({
                canvas_id: canvasId as string,
                forUser: canvas?.forUser || "",
                topic: topic,
                style: "educational"
            });
        }
    }


    return (
        <Card className=" rounded-lg min-w-[320px] bg-gray-100 w-max max-w-[350px] relative p-5">
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold  ">Select Action</h3>

                {/* Tutoring Session Button */}
                <div className="flex flex-col gap-2 ">  <div className="flex flex-col gap-2 ">
                    <Button
                        variant="outline"
                        onClick={handleCreateSlide}
                        disabled={isCreatingSlide}
                    >
                        <div className="flex items-center justify-center">
                            <span>Learn from Slides {isCreatingSlide ? "..." : ""}</span>
                        </div>
                    </Button>
                </div>
                </div>
                <div className="flex flex-col gap-2 ">
                    <Button
                        variant="outline"
                        disabled={isStartingTutoringSession}
                        onClick={handleStartTutoringSession}
                    >
                        <div className="flex items-center justify-center">
                            <span>Learn from conversation {isStartingTutoringSession ? "..." : ""}</span>
                        </div>
                    </Button>
                </div>
                <div className="flex flex-col gap-2 ">
                    <Button
                        variant="outline"
                        disabled={isCreatingTest}
                        onClick={handleCreatePracticeTest}

                    >
                        <div className="flex items-center justify-center">
                            <span>Generate a Test {isCreatingTest ? "..." : ""}</span>
                        </div>
                    </Button>
                </div>
                <div className="flex flex-col gap-2 ">
                    <Button
                        variant="outline"
                        disabled={isCreatingNotes}
                        onClick={handleCreateNotes}
                    >
                        <div className="flex items-center justify-center">
                            <span>Generate High Quality Notes {isCreatingNotes ? "..." : ""}</span>
                        </div>
                    </Button>
                </div>
                <div className="flex flex-col gap-2 ">
                    <Button
                        variant="outline"
                        disabled={isGeneratingVideo}
                        onClick={handleGenerateVideo}
                    >
                        <div className="flex items-center justify-center">
                            <span>Learn from Video {isGeneratingVideo ? "..." : ""}</span>
                        </div>
                    </Button>
                </div>


                {/* Test Creation Section */}




            </div>

            {/* Flow Handles */}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-blue-500 !border-2 !border-white !w-3 !h-3"
                id="source-handle"
            />
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
                id="target-handle"
            />
        </Card>
    )
}


export default ActionNode