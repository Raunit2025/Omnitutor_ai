import type { Models } from "node-appwrite";
export type Canvas = Models.Document & {
    nodes: Node[];
    edges: Edge[];
    title: string;
    forUser: string;
    target: string;
    topic: string;
    type: string;
}

export type Node = Models.Document & {
    id: string;
    type: string;
    position_x: number;
    position_y: number;
    data: string;
}

export type Edge = Models.Document & {
    id: string;
    source: string;
    target: string;
}

