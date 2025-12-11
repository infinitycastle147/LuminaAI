export interface Slide {
  id: number;
  title: string;
  content: string[]; // Bullet points
  speakerNotes: string;
  imagePrompt: string;
  imageUrl?: string; // Generated image URL (base64)
  layout: 'title' | 'content_right' | 'content_left' | 'diagram_center';
  audioUrl?: string; // Blob URL for the audio
  duration?: number; // Duration in seconds
}

export interface PresentationData {
  topic: string;
  slides: Slide[];
}

export enum AppState {
  INPUT = 'INPUT',
  GENERATING_STRUCTURE = 'GENERATING_STRUCTURE',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  GENERATING_VIDEO = 'GENERATING_VIDEO', // New state
  PREVIEW = 'PREVIEW',
  VIDEO_PLAYER = 'VIDEO_PLAYER', // New state
  ERROR = 'ERROR'
}

export interface GenerationProgress {
  currentSlide: number;
  totalSlides: number;
  status: string;
}
