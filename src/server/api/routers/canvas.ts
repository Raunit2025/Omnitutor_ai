import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CanvasService } from "@/services/shared/canvas-service";
import { StudyPlannerService } from "@/services/shared/study-planner-service";
import { getConfig, getDatabase } from "@/lib/server/appwrite";
import type { UserDocument } from "@/types/user";
import { AIService, StudySlidesResponseSchema } from "@/services/shared/ai-service";
import { AudioService } from "@/services/shared/audio-service";
import type { Canvas } from "@/types/canvas";
import { ID, Query } from "node-appwrite";
import { VideoGenerationService } from '@/services/shared/video-service';



const canvasAiInputSchema = z.object({
    canvas_id: z.string(),
    target: z.string().optional(),
    topic: z.string().optional(),
    estimatedTime: z.number().optional(),
    files: z.array(z.object({
        fileName: z.string(),
        fileFormat: z.string(),
        fileURL: z.string(),
        fileSize: z.number().optional()
    })).optional(),
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
    })).optional(),
    forUser: z.string(),
})

export const canvasRouter = createTRPCRouter({
    createCanvas: protectedProcedure
        .input(z.object({
            target: z.string().optional(),
            topic: z.string(),
            title: z.string().optional(),
            goalId: z.string().optional(),
            planId: z.string().optional(),
            type: z.enum(['planner', 'custom', 'exam', 'topic']),
        }))
        .mutation(async ({ ctx, input }) => {
            const config = await getConfig();
            try {
                const { topic, goalId, planId, target, title, type } = input;
                const canvasService = CanvasService.getInstance();
                const studyPlannerService = StudyPlannerService.getInstance();
                const database = await getDatabase();
                const userData = await database.getDocument(
                    config.databaseId,
                    config.userCollectionId,
                    ctx.user.$id
                ) as UserDocument;
                // Create canvas
                const canvas = await canvasService.createCanvas(ctx.user.$id, {
                    title: title || topic,
                    type: type,
                    target: target,
                    topic: topic,
                    forUser: JSON.stringify({
                        name: userData.name,
                        current_role: userData.current_role,
                        current_course: userData.current_course,
                        country_name: userData.country_name
                    })
                });

                // Update goal with canvas ID
                if (planId && goalId) {
                    await studyPlannerService.updateGoalCanvas(planId, goalId, canvas.$id, ctx.user.$id);
                }

                if (type === "exam" || type === "topic") {
                    const aiService = AIService.getInstance();
                    // Generate syllabus
                    const syllabus = await aiService.generateSyllabus({
                        topic,
                        target: target || "Medium",
                        userData: {
                            name: userData.name!,
                            current_role: userData.current_role!,
                            current_course: userData.current_course!,
                            country_name: userData.country_name!
                        }
                    });

                    // Save syllabus node
                    await canvasService.saveNode(ctx.user.$id, {
                        canvas_id: canvas.$id,
                        node: {
                            id: ID.unique(),
                            type: 'syllabus-node',
                            data: JSON.stringify(syllabus),
                            position_x: 200,
                            position_y: 0,
                        }
                    });

                }

                return {
                    ...canvas,
                    goalId: goalId
                };
            } catch (error) {
                console.error('Error creating canvas:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to create canvas');
            }
        }),

    startTutoringSession: protectedProcedure
        .input(canvasAiInputSchema)
        .mutation(async ({ input, ctx }) => {
            try {
                const { target, topic, estimatedTime, files, messages, forUser } = input;
                const userData = JSON.parse(forUser) as { name: string, current_role: string, current_course: string, country_name: string };

                const aiService = AIService.getInstance();
                const audioService = AudioService.getInstance();
                // const usageService = UsageService.getInstance();

                // Generate AI tutoring session
                const response = await aiService.generateChatResponse({
                    userData: {
                        name: userData.name,
                        current_role: userData.current_role,
                        current_course: userData.current_course,
                        country_name: userData.country_name
                    },
                    files: files?.map(file => ({
                        type: 'file' as const,
                        data: file.fileURL,
                        mimeType: file.fileFormat,
                    })),
                    messages: messages || [],
                    isInitialSession: true,
                    context: {
                        target: target,
                        topic: topic,
                        estimatedTime: estimatedTime
                    }
                });

                // Generate audio
                const text = aiService.extractTextFromObject(response);
                const audioUrl = await audioService.generateAudio({ text });

                // Update usage if audio was generated
                // if (audioUrl) {
                //     await usageService.incrementUsage(ctx.user.$id, 'audioChatNodes');
                // }

                return {
                    object: response,
                    systemMessage: "You're an expert tutor who explains things like a great teacher",
                    audio: audioUrl || 'NA'
                };
            } catch (error) {
                console.error('Error in startTutoringSession:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to start tutoring session');
            }
        }),

    ChatWithTutoringSession: protectedProcedure
        .input(z.object({
            files: z.array(z.object({
                fileName: z.string(),
                fileFormat: z.string(),
                fileURL: z.string(),
                fileSize: z.number().optional()
            })),
            messages: z.array(z.object({
                role: z.enum(['user', 'assistant', 'system']),
                content: z.string()
            })),
            chatNodeId: z.string(),
            canvasId: z.string(),
            forUser: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const { files, messages, chatNodeId, forUser } = input;
                let userData: { name: string, current_role: string, current_course: string, country_name: string } = { name: "", current_role: "", current_course: "", country_name: "" };
                if (!forUser) {
                    const database = await getDatabase();
                    const config = await getConfig();
                    const userInfo = await database.getDocument(
                        config.databaseId,
                        config.userCollectionId,
                        ctx.user.$id
                    ) as UserDocument;
                    userData = {
                        name: userInfo.name!,
                        current_role: userInfo.current_role!,
                        current_course: userInfo.current_course!,
                        country_name: userInfo.country_name!
                    }
                } else {
                    userData = JSON.parse(forUser) as { name: string, current_role: string, current_course: string, country_name: string };
                }

                const aiService = AIService.getInstance();
                const audioService = AudioService.getInstance();
                // const usageService = UsageService.getInstance();

                // Convert files to AI service format
                const fileContents = files.map(file => ({
                    type: 'file' as const,
                    data: file.fileURL,
                    mimeType: 'application/pdf',
                }));

                // Generate AI response
                const response = await aiService.generateChatResponse({
                    userData,
                    files: fileContents,
                    messages
                });

                // Generate audio
                const text = aiService.extractTextFromObject(response);
                const audioUrl = await audioService.generateAudio({ text });

                // Update usage if audio was generated
                // if (audioUrl) {
                //     await usageService.incrementUsage(ctx.user.$id, 'audioChatNodes');
                // }

                return {
                    object: response,
                    chatNodeId,
                    audio: audioUrl || 'NA'
                };
            } catch (error) {
                console.error('Error in ChatWithTutoringSession:', error);
                throw new Error('Failed to continue tutoring session');
            }
        }),

    createTest: protectedProcedure
        .input(canvasAiInputSchema)
        .mutation(async ({ input }) => {
            try {
                const { target, topic, estimatedTime, files, messages, forUser } = input;
                const userData = JSON.parse(forUser) as { name: string, current_role: string, current_course: string, country_name: string };

                const aiService = AIService.getInstance();
                // const usageService = UsageService.getInstance();

                // Check usage limits
                // const canCreateTest = await usageService.checkUsageLimit(ctx.user.$id, 'testNodes');
                // if (!canCreateTest) {
                //     throw new Error("You have reached the maximum number of test nodes");
                // }

                // Generate test
                const test = await aiService.generateTest({
                    userData,
                    files: files?.map(file => ({
                        type: 'file' as const,
                        data: file.fileURL,
                        mimeType: file.fileFormat,
                    })),
                    messages: messages || [],
                    context: {
                        level: 'medium',
                        numberOfQuestions: Math.min(10, Math.floor((estimatedTime || 0) / 2)),
                        target: target,
                        topic: topic
                    }
                });

                return test
            } catch (error) {
                console.error('Error creating test:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to create test');
            }
        }),

    createNotes: protectedProcedure
        .input(canvasAiInputSchema)
        .mutation(async ({ input }) => {
            try {
                const { target, topic, estimatedTime, files, messages, forUser } = input;
                const userData = JSON.parse(forUser) as { name: string, current_role: string, current_course: string, country_name: string };

                const aiService = AIService.getInstance();
                // const usageService = UsageService.getInstance();

                // Check usage limits
                // const canCreateNotes = await usageService.checkUsageLimit(ctx.user.$id, 'notesNodes');
                // if (!canCreateNotes) {
                //     throw new Error("You have reached the maximum number of notes nodes");
                // }

                // Generate notes
                const notes = await aiService.generateNotes({
                    userData,
                    files: files?.map(file => ({
                        type: 'file' as const,
                        data: file.fileURL,
                        mimeType: file.fileFormat,
                    })),
                    messages: messages || [],
                    context: {
                        target: target,
                        topic: topic,
                        estimatedTime: estimatedTime
                    }
                });

                return notes;
            } catch (error) {
                console.error('Error creating notes:', error);
                throw new Error(error instanceof Error ? error.message : 'Failed to create notes');
            }
        }),
    generateStudySlide: protectedProcedure.input(canvasAiInputSchema).mutation(async ({ input }) => {
        const { target, topic, estimatedTime, forUser } = input;
        const userData = JSON.parse(forUser) as { name: string, current_role: string, current_course: string, country_name: string };

        const aiService = AIService.getInstance();
        // const usageService = UsageService.getInstance();

        const result = await aiService.generateStudySlide({
            target: target || 'LLM',
            topic: topic || 'LLM',
            userData,
            estimatedTime: estimatedTime || 10,
        });

        // const htmlResult = await aiService.generateStudySlideHtml(result);

        // No audio generation on backend for faster response
        // All audio will be generated on frontend asynchronously

        return result;
    }),
    generateAudioForSlide: protectedProcedure.input(z.object({
        nodeId: z.string(),
        slides: StudySlidesResponseSchema,
        pageIndex: z.number(),
    })).mutation(async ({ input }) => {
        const { slides, pageIndex, nodeId } = input;
        const aiService = AIService.getInstance();
        const audioService = AudioService.getInstance();
        // const usageService = UsageService.getInstance();
        const text = aiService.extractTextFromStudySlide(slides, pageIndex);
        const audioUrl = await audioService.generateAudio({ text });

        // Update usage if audio was generated
        // if (audioUrl) {
        //     await usageService.incrementUsage(ctx.user.$id, 'audioChatNodes');
        // }

        return {
            audioUrl,
            nodeId
        };
    }),
    getCanvas: protectedProcedure
        .input(z.object({
            id: z.string(),
        }))
        .query(async ({ input }) => {
            try {
                const { id } = input;
                const database = await getDatabase();
                const config = await getConfig();
                const canvas = await database.getDocument(
                    config.databaseId,
                    config.newCanvasCollectionId,
                    id
                ) as Canvas;

                return {
                    ...canvas,
                };
            } catch (error) {
                console.error('Error getting canvas:', error);
                throw new Error('Failed to retrieve canvas');
            }
        }),
    saveNode: protectedProcedure
        .input(z.object({
            canvas_id: z.string(),
            node: z.object({
                id: z.string(),
                type: z.string(),
                data: z.string(),
                position_x: z.number(),
                position_y: z.number(),
            }),
            edge: z.object({
                source: z.string().optional(),
                target: z.string().optional(),
                id: z.string(),
            }).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
                const canvasService = CanvasService.getInstance();
                const updatedCanvas = await canvasService.saveNode(ctx.user.$id, input, true);
                return updatedCanvas;
            } catch (error) {
                console.error('Error saving node:', error);
                throw new Error('Failed to save node');
            }
        }),
    updateNodePosition: protectedProcedure
        .input(z.object({
            nodeId: z.string(),
            position: z.object({
                x: z.number(),
                y: z.number(),
            }),
        }))
        .mutation(async ({ input }) => {
            const canvasService = CanvasService.getInstance();
            await canvasService.updateNodePosition(input.nodeId, input.position);
        }),

    updateNodeData: protectedProcedure
        .input(z.object({
            nodeId: z.string(),
            data: z.string(),
        }))
        .mutation(async ({ input }) => {
            try {
                const canvasService = CanvasService.getInstance();
                await canvasService.updateNode(input.nodeId, { data: input.data });
                return { success: true };
            } catch (error) {
                console.error('Error updating node data:', error);
                throw new Error('Failed to update node data');
            }
        }),
    getCanvases: protectedProcedure
        .query(async ({ ctx }) => {
            const database = await getDatabase();
            const config = await getConfig();
            try {
                const canvases = await database.listDocuments(
                    config.databaseId,
                    config.newCanvasCollectionId,
                    [Query.equal("user_id", ctx.user.$id), Query.notEqual("type", "planner")]
                );
                return canvases.documents;
            } catch (error) {
                console.error('Error getting canvases:', error);
                throw new Error('Failed to retrieve canvases');
            }
        }),
    deleteCanvas: protectedProcedure.input(z.object({
        canvas_id: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const { canvas_id } = input;
        const canvasService = CanvasService.getInstance();
        return await canvasService.deleteCanvas(canvas_id, ctx.user.$id);
    }),
    getFunFactsAboutTopic: protectedProcedure.input(z.object({
        topic: z.string(),
    })).mutation(async ({ input }) => {
        const { topic } = input;
        const aiService = AIService.getInstance();
        return await aiService.generateFunFactsAboutTopic(topic);
    }),

    generateVideo: protectedProcedure.input(z.object({
        topic: z.string(),
        style: z.enum(['fun', 'professional', 'educational', 'casual']).optional().default('fun'),
        canvas_id: z.string(),
        forUser: z.string(),
        target: z.string().optional(),
    })).mutation(async ({ input }) => {
        try {
            const { topic, style, canvas_id, forUser, target } = input;

            // Directly use your Veo model/service here
            const videoService = VideoGenerationService.getInstance();
            const result = await videoService.generateWithVeo({
                topic,
                style,
                canvas_id,
                forUser,
                target,
            });

            return {
                id: ID.unique(),
                topic,
                style,
                videoUrl: result.videoUrl,
                status: result.status,
            };
        } catch (error) {
            throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : String(error)}`);
        }
    }),
});