import { useState, useCallback } from 'react';
import { AppState, Slide, GenerationProgress } from '../types'; // Adjust path as needed
import { generatePresentationStructure, generateSlideImage, generateSpeech } from '../services/gemini';
import { pcmToWavBlob, getAudioDuration } from '../services/audioUtils';
import { createPptx } from '../services/ppt';

export const usePresentation = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [topic, setTopic] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [progress, setProgress] = useState<GenerationProgress>({ currentSlide: 0, totalSlides: 0, status: '' });
  const [error, setError] = useState<string | null>(null);

  const startGeneration = useCallback(async (inputTopic: string, fileData?: { data: string; mimeType: string }) => {
    setAppState(AppState.GENERATING_STRUCTURE);
    setError(null);
    setTopic(inputTopic || "Presentation from File");

    try {
      // Step 1: Generate Structure
      setProgress({ currentSlide: 0, totalSlides: 0, status: 'Analyzing topic and creating outline...' });
      const structure = await generatePresentationStructure(inputTopic, fileData);
      setSlides(structure);

      // Step 2: Generate Images
      setAppState(AppState.GENERATING_IMAGES);
      const total = structure.length;
      
      // We can update state incrementally if we want, but doing it in a batch for now to match original logic
      // Note: original logic mutated a copy then set it at the end. 
      // To improve UX, we could update one by one, but let's stick to working logic first.
      
      const slidesWithImages = [...structure];
      
      for (let i = 0; i < total; i++) {
        setProgress({ 
            currentSlide: i + 1, 
            totalSlides: total, 
            status: `Designing visual for slide ${i + 1}: ${structure[i].title}` 
        });
        
        // Generate image for this slide
        const imageUrl = await generateSlideImage(structure[i].imagePrompt);
        slidesWithImages[i] = { ...slidesWithImages[i], imageUrl };
      }

      setSlides(slidesWithImages);
      setAppState(AppState.PREVIEW);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during generation.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const generateVideo = useCallback(async () => {
    if (slides.length === 0) return;
    
    // Check if video is already generated
    if (slides[0].audioUrl) {
        setAppState(AppState.VIDEO_PLAYER);
        return;
    }

    setAppState(AppState.GENERATING_VIDEO);
    const total = slides.length;
    const slidesWithAudio = [...slides];

    try {
        for (let i = 0; i < total; i++) {
            setProgress({
                currentSlide: i + 1,
                totalSlides: total,
                status: `Synthesizing professional voiceover for slide ${i + 1}...`
            });

            // 1. Generate Raw PCM
            const pcmBase64 = await generateSpeech(slides[i].speakerNotes);
            
            // 2. Convert to WAV Blob
            const wavBlob = pcmToWavBlob(pcmBase64);
            const audioUrl = URL.createObjectURL(wavBlob);
            
            // 3. Get Duration
            const duration = await getAudioDuration(wavBlob);

            slidesWithAudio[i] = { ...slidesWithAudio[i], audioUrl, duration };
        }

        setSlides(slidesWithAudio);
        setAppState(AppState.VIDEO_PLAYER);

    } catch (err: any) {
        console.error("Video Generation Error", err);
        setError("Failed to generate video voiceovers.");
        setAppState(AppState.PREVIEW); 
        // Note: Alert was here in original, maybe handle in UI or keep it simple?
        // We'll expose error state instead of alerting immediately if possible, or just catch in component.
        // For now, let's just set Error state if meaningful or just log.
        // The original code reset to PREVIEW, so let's do that.
    }
  }, [slides]);

  const downloadPPTX = useCallback(async () => {
    if (slides.length === 0) return;
    try {
        const pptx = await createPptx(slides, topic);
        await pptx.writeFile({ fileName: `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'presentation'}.pptx` });
    } catch (e) {
        console.error("Export failed", e);
        // In a hook, better to return error or set generic error state, but for now we log.
    }
  }, [slides, topic]);

  const resetApp = useCallback(() => {
    slides.forEach(s => {
        if (s.audioUrl) URL.revokeObjectURL(s.audioUrl);
    });
    setAppState(AppState.INPUT);
    setSlides([]);
    setTopic('');
    setCurrentSlideIdx(0);
    setError(null);
  }, [slides]);

  const setSlideIndex = (idx: number) => {
      setCurrentSlideIdx(idx);
  };

  const closeVideoPlayer = () => setAppState(AppState.PREVIEW);

  return {
    appState,
    topic,
    slides,
    currentSlideIdx,
    progress,
    error,
    startGeneration,
    generateVideo,
    downloadPPTX,
    resetApp,
    setSlideIndex,
    closeVideoPlayer,
  };
};
