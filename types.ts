
export interface SlideSource {
  uri: string;
  title: string;
}

export interface Slide {
  id: number;
  title: string;
  content: string[]; // Bullet points
  speakerNotes: string;
  imagePrompt: string;
  imageUrl?: string; // Generated image URL (base64)
  originalImageUrl?: string; // High-fidelity page capture (e.g. from PDF)
  layout: 'title' | 'content_right' | 'content_left' | 'diagram_center';
  audioUrl?: string; // Blob URL for the audio
  duration?: number; // Duration in seconds
  source?: 'extracted' | 'generated';
  sources?: SlideSource[]; // Grounding sources from Google Search
}

export interface PresentationData {
  topic: string;
  slides: Slide[];
}

export enum AppState {
  INPUT = 'INPUT',
  GENERATING_STRUCTURE = 'GENERATING_STRUCTURE',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  PREVIEW = 'PREVIEW',
  VIDEO_PLAYER = 'VIDEO_PLAYER',
  ERROR = 'ERROR'
}

export type GenerationMode = 'create' | 'convert';

export interface GenerationProgress {
  currentSlide: number;
  totalSlides: number;
  status: string;
}
