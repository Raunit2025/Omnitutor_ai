import { getConfig, getDatabase } from "@/lib/server/appwrite";
import { ID } from "node-appwrite";
import type { Canvas } from "@/types/canvas";
import type { UserDocument } from "@/types/user";
import { USAGE_LIMITS } from "@/constants/limits";

export interface SaveNodeInput {
    canvas_id: string;
    node: {
        id: string;
        type: string;
        data: string;
        position_x: number;
        position_y: number;
    };
    edge?: {
        source?: string;
        target?: string;
        id: string;
    };
}

export interface CreateCanvasInput {
    title: string;
    type?: string;
    target?: string;
    topic?: string;
    forUser?: string;
}

export class CanvasService {
    private static instance: CanvasService;

    public static getInstance(): CanvasService {
        if (!CanvasService.instance) {
            CanvasService.instance = new CanvasService();
        }
        return CanvasService.instance;
    }

    async createCanvas(userId: string, input: CreateCanvasInput): Promise<Canvas> {
        const database = await getDatabase();
        const config = await getConfig();
        try {
            const userData = await database.getDocument(
                config.databaseId,
                config.userCollectionId,
                userId
            ) as UserDocument;

            // Check usage limits for syllabus nodes if applicable
            if (input.type === "exam " && userData.usage.syllabusNodes >= USAGE_LIMITS[userData.plan].syllabusNodes) {
                throw new Error("You have reached the maximum number of syllabus nodes");
            }

            const canvas = await database.createDocument(
                config.databaseId,
                config.newCanvasCollectionId,
                ID.unique(),
                {
                    type: input.type || "custom",
                    user_id: userId,
                    title: input.title,
                    target: input.target || "",
                    topic: input.topic || "",
                    forUser: input.forUser || "",
                }
            );

            return canvas as Canvas;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message, { cause: error });
            }
            throw new Error("Failed to create canvas");
        }
    }

    async saveNode(userId: string, input: SaveNodeInput, newNodee: boolean = false): Promise<Canvas> {
        try {
            const { node, edge, canvas_id } = input;
            const database = await getDatabase();
            const config = await getConfig();

            const userData = await database.getDocument(
                config.databaseId,
                config.userCollectionId,
                userId
            ) as UserDocument;

            const canvas = await database.getDocument(
                config.databaseId,
                config.newCanvasCollectionId,
                canvas_id
            ) as Canvas;

            // Find existing node and edge
            const existingNode = (canvas.nodes || []).find((n: any) => n.id === node.id);
            const existingEdge = edge ? (canvas.edges || []).find((e: any) => e.id === edge.id) : null;

            // Handle edge update
            if (existingEdge && edge) {
                await database.updateDocument(
                    config.databaseId,
                    config.edgeCollectionId,
                    existingEdge.$id,
                    {
                        source: edge.source,
                        target: edge.target,
                    }
                );
            }

            // Handle node update
            if (existingNode) {
                await database.updateDocument(
                    config.databaseId,
                    config.nodeCollectionId,
                    existingNode.$id,
                    {
                        data: node.data,
                        position_x: node.position_x,
                        position_y: node.position_y,
                    }
                );
                return canvas;
            }

            // Create new node and edge if they don't exist
            const newNode = await database.createDocument(
                config.databaseId,
                config.nodeCollectionId,
                node.id,
                {
                    type: node.type,
                    data: node.data,
                    position_x: node.position_x,
                    position_y: node.position_y,
                    id: node.id,
                    canvas_id: canvas_id,
                }
            );

            let newEdge = null;
            if (edge) {
                newEdge = await database.createDocument(
                    config.databaseId,
                    config.edgeCollectionId,
                    edge.id,
                    {
                        source: edge.source,
                        target: edge.target,
                        id: edge.id,
                    }
                );
            }

            // Update canvas with new node and edge
            const updatedCanvas = await database.updateDocument(
                config.databaseId,
                config.newCanvasCollectionId,
                canvas_id,
                {
                    nodes: [...(canvas.nodes || []), newNode.$id],
                    edges: newEdge ? [...(canvas.edges || []), newEdge.$id] : (canvas.edges || []),
                }
            );

            // Update user usage statistics
            await this.updateUserUsage(userId, node.type, userData);

            return updatedCanvas as Canvas;
        } catch (error) {
            console.error('Error saving node:', error);
            throw new Error('Failed to save node');
        }
    }



    private async updateUserUsage(userId: string, nodeType: string, userData: UserDocument): Promise<void> {
        try {
            const database = await getDatabase();
            const config = await getConfig();
            const usageUpdates: Partial<UserDocument['usage']> = {};

            switch (nodeType) {
                case "chat-node":
                    usageUpdates.chatNodes = userData.usage.chatNodes + 1;
                    break;
                case "notes-node":
                    usageUpdates.notesNodes = userData.usage.notesNodes + 1;
                    break;
                case "test-node":
                    usageUpdates.testNodes = userData.usage.testNodes + 1;
                    break;
            }

            if (Object.keys(usageUpdates).length > 0) {
                await database.updateDocument(
                    config.databaseId,
                    config.userCollectionId,
                    userId,
                    {
                        usage: {
                            ...userData.usage,
                            ...usageUpdates,
                        },
                    }
                );
            }
        } catch (error) {
            console.error('Error updating user usage:', error);
            // Don't throw here as this is not critical to the main operation
        }
    }

    async getCanvas(canvasId: string, userId: string): Promise<Canvas> {
        const database = await getDatabase();
        const config = await getConfig();
        const canvas = await database.getDocument(
            config.databaseId,
            config.newCanvasCollectionId,
            canvasId
        ) as Canvas;

        // Verify ownership
        if (canvas.user !== userId) {
            throw new Error('Unauthorized access to canvas');
        }

        return canvas;
    }

    async updateNode(nodeId: string, data: { data: string }): Promise<void> {
        try {
            const database = await getDatabase();
            const config = await getConfig();
            await database.updateDocument(
                config.databaseId,
                config.nodeCollectionId,
                nodeId,
                data
            );
        } catch (error) {
            console.error('Error updating node:', error);
            throw new Error('Failed to update node');
        }
    }

    async updateNodePosition(nodeId: string, position: { x: number, y: number }): Promise<void> {
        const database = await getDatabase();
        const config = await getConfig();
        try {
            console.log('Updating node position:', nodeId, position);
            await database.updateDocument(
                config.databaseId,
                config.nodeCollectionId,
                nodeId,
                {

                    position_x: position.x,
                    position_y: position.y,
                }
            );
        } catch (error) {
            console.error('Error updating node position:', error);
            throw new Error('Failed to update node position');
        }
    }

    async deleteCanvas(canvasId: string, userId: string): Promise<{ message: string }> {
        const database = await getDatabase();
        const config = await getConfig();


        try {
            await database.deleteDocument(config.databaseId, config.newCanvasCollectionId, canvasId);
            return {
                message: "Canvas deleted successfully"
            };
        } catch (error) {
            console.error(error);
            throw new Error('Failed to delete canvas');
        }

    }
} 