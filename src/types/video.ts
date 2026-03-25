export interface VideoGenerationOptions {
  topic: string;
  target: string;
  estimatedTime?: number;
}

export interface VideoGenerationTask {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  progress?: number;
  script?: VideoScript;
}

export interface VideoScript {
  title: string;
  scenes: {
    scene: number;
    text: string;
    visuals: string;
  }[];
}

export interface VideoNodeData extends Record<string, unknown> {
  id: string;
  topic: string;
  target: string;
  taskId?: string;
  videoUrl?: string;
  status: 'generating' | 'completed' | 'error' | 'pending';
  progress?: number;
  errorMessage?: string;
}

