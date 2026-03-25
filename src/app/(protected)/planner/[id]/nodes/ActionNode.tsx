"use client"

import { type NodeProps } from "@xyflow/react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type ActionNodeType, type NotesNodeType, type TestNodeType, type VideoNodeType } from "./index"
import { useCanvas } from "../CanvasContext"
import { api } from "@/trpc/react"
import { ID } from "node-appwrite"
import { useParams } from "next/navigation"
import { toast } from "sonner"

const ActionNode = ({ }: NodeProps<ActionNodeType>) => {

    const { id } = useParams();
    const { addNode, goalId, todayGoals, canvasId, studyPlan, canvas } = useCanvas();

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


    const handleCreateSlide = () => {
        createSlide({
            topic: todayGoals?.goals.find(goal => goal.id === goalId)?.topic || "",
            estimatedTime: Number(todayGoals?.goals.find(goal => goal.id === goalId)?.estimated_time) * 60 || 10,
            canvas_id: canvasId as string,
            forUser: canvas?.forUser || "",
            target: studyPlan?.exam,
        });
    }

    const handleCreatePracticeTest = () => {

        createTest({
            canvas_id: canvasId as string,
            forUser: canvas?.forUser || "",
            topic: todayGoals?.goals.find(goal => goal.id === goalId)?.topic as string,
            target: studyPlan?.exam,
            estimatedTime: Number(todayGoals?.goals.find(goal => goal.id === goalId)?.estimated_time) * 60 || 10
        });
    }

    const handleCreateNotes = () => {
        createNotes({
            canvas_id: canvasId as string,
            forUser: canvas?.forUser || "",
            topic: todayGoals?.goals.find(goal => goal.id === goalId)?.topic as string,
            target: studyPlan?.exam,
        });
    }

    const handleGenerateVideo = () => {
        const currentGoal = todayGoals?.goals.find(goal => goal.id === goalId);
        if (!currentGoal?.topic) {
            toast.error("No topic found for video generation");
            return;
        }

        generateVideo({
            canvas_id: canvasId as string,
            forUser: canvas?.forUser || "",
            topic: currentGoal.topic,
            target: studyPlan?.exam,
            style: "educational"
        });
    }


    return (
        <Card className=" rounded-lg min-w-[320px] bg-gray-100 w-max max-w-[350px] relative p-5">
            <div className="flex flex-col gap-4">
                <h3 className="font-semibold  ">Select Action</h3>

                {/* Tutoring Session Button */}
                {todayGoals?.goals.find(goal => goal.id === goalId)?.activity_type === "study" && <div className="flex flex-col gap-2 ">  <div className="flex flex-col gap-2 ">
                    <Button
                        variant="outline"
                        onClick={handleCreateSlide}
                        disabled={isCreatingSlide}
                    >
                        <div className="flex items-center justify-center">
                            <span>Learn from Tutor {isCreatingSlide ? "..." : ""}</span>
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
                </div>}

                {
                    todayGoals?.goals.find(goal => goal.id === goalId)?.activity_type === "practice" && <div className="flex flex-col gap-2 ">
                        <Button
                            variant="outline"
                            disabled={isCreatingTest}
                            onClick={handleCreatePracticeTest}
                        >
                            <div className="flex items-center justify-center">
                                <span>Generate a Practice Test {isCreatingTest ? "..." : ""}</span>
                            </div>
                        </Button>
                    </div>
                }
                {
                    todayGoals?.goals.find(goal => goal.id === goalId)?.activity_type === "test" && <div className="flex flex-col gap-2 ">
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
                }
                {
                    todayGoals?.goals.find(goal => goal.id === goalId)?.activity_type === "revision" && <div className="flex flex-col gap-2 ">
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
                }

                {/* Test Creation Section */}




            </div>

            {/* Flow Handles */}
            {/* <Handle
                type="source"
                position={Position.Right}
                className="!bg-blue-500 !border-2 !border-white !w-3 !h-3"
                id="source-handle"
            /> */}
            {/* <Handle
                type="target"
                position={Position.Left}
                className="!bg-purple-500 !border-2 !border-white !w-3 !h-3"
                id="target-handle"
            /> */}
        </Card>
    )
}


export default ActionNode