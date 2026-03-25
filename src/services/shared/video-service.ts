import { AIService } from './ai-service';
import {
  type VideoGenerationOptions,
  type VideoGenerationTask,
  type VideoScript,
} from '@/types/video';
import { v4 as uuidv4 } from 'uuid';
import type { UserDocument } from '@/types/user';

// In-memory store for video generation tasks.
// In a production environment, this should be replaced with a persistent store like Redis or a database.
const videoTasks = new Map<string, VideoGenerationTask>();

export class VideoGenerationService {
  /**
   * Simulate a WebSocket connection for video progress updates.
   * Calls the callback with progress messages and final video URL.
   */
  connectToVideoProgress(taskId: string, onMessage: (message: string) => void) {
    let lastStatus: string | undefined;
    let intervalId: NodeJS.Timeout | null = null;
    let closed = false;

    const checkStatus = () => {
      if (closed) return;
      const task = videoTasks.get(taskId);
      if (!task) return;

      // Send progress updates
      if (task.status === 'processing') {
        onMessage(`Progress: ${task.progress ?? 0}%`);
      }
      if (task.status === 'completed' && task.videoUrl) {
        onMessage(`DONE:${task.videoUrl}`);
        cleanup();
      } else if (task.status === 'failed' && task.error) {
        onMessage(`ERROR:${task.error}`);
        cleanup();
      }
    };

    function cleanup() {
      if (intervalId) clearInterval(intervalId);
      closed = true;
    }

    // Start polling every 2 seconds
    intervalId = setInterval(checkStatus, 2000);

    // Return a fake WebSocket-like object
    return {
      close: cleanup
    };
  }
  private static instance: VideoGenerationService;
  private aiService: AIService;

  private constructor() {
    this.aiService = AIService.getInstance();
  }

  public static getInstance(): VideoGenerationService {
    if (!VideoGenerationService.instance) {
      VideoGenerationService.instance = new VideoGenerationService();
    }
    return VideoGenerationService.instance;
  }

  async startVideoGeneration(
    options: VideoGenerationOptions,
    userData: UserDocument,
  ): Promise<{ taskId: string }> {
    const taskId = uuidv4();
    videoTasks.set(taskId, { taskId, status: 'pending', progress: 0 });

    // Process video generation asynchronously
    this.processVideoGeneration(taskId, options, userData);

    return { taskId };
  }

  getStatus(taskId: string): VideoGenerationTask | undefined {
    return videoTasks.get(taskId);
  }

  private async processVideoGeneration(
    taskId: string,
    options: VideoGenerationOptions,
    userData: UserDocument,
  ) {
    try {
      videoTasks.set(taskId, { ...videoTasks.get(taskId)!, status: 'processing', progress: 10 });

      // Step 1: Generate script
      const script = await this.generateScript(options, userData);
      videoTasks.set(taskId, { ...videoTasks.get(taskId)!, status: 'processing', progress: 30, script });

      // Step 2: Simulate calling Veo API
      // In a real scenario, you would make an API call to the Veo service here.
      await new Promise(resolve => setTimeout(resolve, 15000)); // Simulate 15s video generation

      videoTasks.set(taskId, { ...videoTasks.get(taskId)!, status: 'processing', progress: 80 });

      // Step 3: Finalize and get video URL
      // This would be the URL returned from your video service or Google Cloud Storage
      const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      videoTasks.set(taskId, { ...videoTasks.get(taskId)!, status: 'completed', progress: 100, videoUrl });

    } catch (error) {
      console.error(`Video generation failed for task ${taskId}:`, error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      videoTasks.set(taskId, { ...videoTasks.get(taskId)!, status: 'failed', error: message });
    }
  }

  private async generateScript(options: VideoGenerationOptions, userData: UserDocument): Promise<VideoScript> {
    const userDataForAI = {
      name: userData.name ?? 'Student',
      current_role: userData.current_role ?? 'learner',
      current_course: userData.current_course ?? 'topic of interest',
      country_name: userData.country_name ?? 'world',
    };

    const slides = await this.aiService.generateStudySlide({
      topic: options.topic,
      target: options.target,
      userData: userDataForAI,
      estimatedTime: options.estimatedTime ?? 10,
    });

    const scenes = slides.slides.map((slide, index) => ({
      scene: index + 1,
      text: slide.elements.filter(e => e.type === 'text').map(e => e.content).join(' '),
      visuals: slide.elements.filter(e => e.type !== 'text').map(e => `[${e.type}: ${e.content}]`).join(', '),
    }));

    return {
      title: options.topic,
      scenes,
    };
  }
}

export const videoGenerationService = VideoGenerationService.getInstance();
