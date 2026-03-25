# Video Generation Integration

This document describes how the "Learn from Video" feature is integrated into the OmniTutor application.

## Overview

The video generation feature uses Manim (Mathematical Animation Engine) to create educational videos based on study topics. The integration consists of:

1. **Backend Video Service** - A FastAPI server that handles video generation using Manim
2. **Frontend Integration** - React components and API endpoints to manage video generation requests
3. **Real-time Updates** - WebSocket connections for progress tracking

## Architecture

```
Frontend (Next.js) ←→ Backend API (tRPC) ←→ Video Service (FastAPI + Manim)
                    ↑
                WebSocket (for real-time progress)
```

## Components Added

### 1. Video Service (`src/services/shared/video-service.ts`)
- Handles communication with the Manim video generation backend
- Provides WebSocket support for real-time progress updates
- Manages video generation requests and status checks

### 2. Video Node Component (`src/app/(protected)/canvas/[canvas_id]/nodes/VideoNode.tsx`)
- Displays video generation progress and final video
- Includes video player with controls (play, pause, volume, download)
- Shows generation status and progress messages
- Handles WebSocket connections for real-time updates

### 3. API Routes
- `/api/video/generate` - Initiates video generation
- `/api/video/status/[taskId]` - Checks generation status

### 4. tRPC Integration
- `canvas.generateVideo` - Mutation for creating video nodes
- Integrated into existing canvas router

### 5. Updated Action Nodes
- Canvas ActionNode: Added "Learn from Video" button
- Planner ActionNode: Added video generation for study activities

## Video Generation Backend

Your existing FastAPI backend (`main.py`) handles:
- Script generation for educational content
- Text-to-speech audio generation
- Image generation for visual elements
- Manim code generation and rendering
- Video composition and output

### WebSocket Communication
The backend provides real-time updates through WebSocket endpoints:
- Connection: `/ws/{task_id}`
- Progress messages: Text updates during generation
- Completion: `DONE:{video_path}` message
- Errors: `ERROR:{error_message}` message

## Environment Variables

Add to your `.env.local`:
```env
VIDEO_API_URL=http://localhost:8000
NEXT_PUBLIC_VIDEO_API_URL=http://localhost:8000
```

## Usage Flow

1. **User Initiates**: Clicks "Learn from Video" in ActionNode
2. **Request Sent**: Frontend sends topic and style to backend
3. **Video Generation**: Backend processes with Manim pipeline
4. **Real-time Updates**: WebSocket provides progress updates
5. **Completion**: Video is available for playback and download

## Video Styles Supported

- `educational` - Academic style with clear explanations
- `fun` - Engaging style with animations and colors
- `professional` - Clean, business-oriented presentation
- `casual` - Relaxed, informal approach

## File Locations

```
src/
├── services/shared/video-service.ts
├── types/video.ts
├── app/
│   ├── api/video/
│   │   ├── generate/route.ts
│   │   └── status/[taskId]/route.ts
│   └── (protected)/
│       ├── canvas/[canvas_id]/nodes/
│       │   ├── VideoNode.tsx
│       │   └── ActionNode.tsx (updated)
│       └── planner/[id]/nodes/
│           └── ActionNode.tsx (updated)
└── server/api/routers/canvas.ts (updated)
```

## Integration Points

### Canvas Flow
1. Syllabus selection → Action Node → Learn from Video → Video Node
2. File upload → Action Node → Learn from Video → Video Node

### Planner Flow
1. Study goal → Action Node → Learn from Video → Video Node

## Error Handling

- Network failures: Graceful degradation with error messages
- Generation failures: Error display in VideoNode
- WebSocket disconnection: Automatic reconnection attempts
- Invalid topics: Validation and user feedback

## Future Enhancements

- Video quality settings
- Custom animation styles
- Batch video generation
- Video sharing capabilities
- Integration with LMS platforms
