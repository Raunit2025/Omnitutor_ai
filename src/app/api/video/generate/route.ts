import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { VideoGenerationService } from '@/services/shared/video-service';

const videoRequestSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    style: z.enum(['fun', 'professional', 'educational', 'casual']).optional().default('fun'),
    canvas_id: z.string().optional(),
    forUser: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const result = videoRequestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: result.error.format() },
                { status: 400 }
            );
        }

        const { topic, style } = result.data;
        const videoService = VideoGenerationService.getInstance();

        // You need to generate or obtain a taskId here; using topic as a placeholder
        const taskId = topic; // Replace with actual taskId logic if needed

        const videoResponse = videoService.connectToVideoProgress(
            taskId,
            (message: any) => {
                // Handle progress messages here if needed
                // For API route, you might not need to do anything
            }
        );

        return NextResponse.json(videoResponse);
    } catch (error) {
        console.error('Video generation API error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to generate video', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
