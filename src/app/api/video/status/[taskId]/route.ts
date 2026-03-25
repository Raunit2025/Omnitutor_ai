import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        
        if (!taskId) {
            return NextResponse.json(
                { error: 'Task ID is required' },
                { status: 400 }
            );
        }

        // Make request to your video generation backend to check status
        const videoApiUrl = process.env.VIDEO_API_URL || 'http://localhost:8000';
        const response = await fetch(`${videoApiUrl}/status/${taskId}`);

        if (!response.ok) {
            throw new Error(`Video API responded with status: ${response.status}`);
        }

        const statusData = await response.json();
        return NextResponse.json(statusData);
    } catch (error) {
        console.error('Video status check error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to check video status', 
                message: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
