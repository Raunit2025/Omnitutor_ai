import { type Node, type NodeTypes, type BuiltInNode } from "@xyflow/react";
import ActionNode from "./ActionNode";
import { ChatNode, type AssistantConv } from "./ChatNode";
import { PositionLoggerNode } from "@/app/(protected)/planner/[id]/nodes/PositionLoggerNode";
import NotesNode from "@/app/(protected)/planner/[id]/nodes/NotesNode";
import TestNode from "@/app/(protected)/planner/[id]/nodes/TestNode";
import { SlideNode } from "./SlideNode";
import SyllabusNode from "./SyllabusNode";
import FileNode from "./FIleNode";
import { VideoNode } from "./VideoNode";
import type { VideoNodeData } from "@/types/video";


export type PositionLoggerNode = Node<
    PositionLoggerNodeData,
    "position-logger"
>;


export type PositionLoggerNodeData = {
    label?: string;
    background?: string;
    id?: string;
}


export type ActionNodeType = Node<
    {
        label?: string;
        background?: string;
        id?: string;
    },
    "action-node"
>;

export type SlideNodeData = {
    id: string;
    content: string;
}

export type SlideNodeType = Node<
    SlideNodeData,
    "slide-node"
>;


export type ChatNodeData = {
    conversation: {
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: AssistantConv | string,
        audio?: string,
        isAudioPlaying?: boolean
    }[];
}


export type TestNodeData = {
    testName: string;
    chapters: string;
    topics: string;
    level: 'easy' | 'medium' | 'hard' | string;
    assignmentType: 'mcq';
    correctAnswered: number;
    incorrectAnswered: number;
    skipped: number;
    questions: {
        question: string;
        options: string[];
        correctAnswer: string;
        selectedAnswer: string;
        ques_type: 'mcq' | string;
        explanation: string;
    }[];
    duration: number;
}

export type NotesNodeType = Node<
    NotesNodeData,
    "notes-node"
>;

export type TestNodeType = Node<
    TestNodeData,
    "test-node"
>;

export type ChatNodeType = Node<
    ChatNodeData,
    "chat-node"
>;

export type SyllabusNodeType = Node<
    SyllabusNodeData,
    "syllabus-node"
>;

export type NotesNodeData = {
    subject: string;
    exam: string;
    country_name: string;
    current_role: string;
    level: string;
    mode: string;
    preferred_language: string;
    chapters: string;
    topics: string;
    pages: {
        page: number;
        blocks: {
            type: string;
            content: string;
        }[];
    }[];
}
export type SyllabusNodeData = {
    subject: string;
    for: string;
    exam: string;
    chapters: {
        name: string;
        topics: {
            name: string;
            selected: boolean;
        }[];
    }[];
}
export type FileNodeData = {
    isSelected: boolean;
    isHidden: boolean;
    fileName: string;
    fileSize: number;
    fileURL: string;
    fileFormat: string;
}

export type FileNodeType = Node<
    FileNodeData,
    "file"
>;

export type VideoNodeType = Node<
    VideoNodeData,
    "video-node"
>;


export type AppNode = BuiltInNode | PositionLoggerNode | ActionNodeType | SlideNodeType | TestNodeType | ChatNodeType | NotesNodeType | FileNodeType | SyllabusNodeType | VideoNodeType

export const initialNodes: AppNode[] = [];

export const nodeTypes = {
    "position-logger": PositionLoggerNode,
    "action-node": ActionNode,
    "slide-node": SlideNode,
    "notes-node": NotesNode,
    "test-node": TestNode,
    "chat-node": ChatNode,
    "syllabus-node": SyllabusNode,
    "file": FileNode,
    "video-node": VideoNode,
    // Add any of your custom nodes here!
} satisfies NodeTypes;
