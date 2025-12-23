
import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, Slide, GenerationProgress, GenerationMode } from '../types';
import { generatePresentationStructure, generateSlideImage, generateSpeech } from '../services/gemini';
import { pcmToWavBlob, getAudioDuration } from '../services/audioUtils';

export const usePresentationGenerator = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [progress, setProgress] = useState<GenerationProgress>({ currentSlide: 0, totalSlides: 0, status: '' });
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');

  const blobUrlsRef = useRef<Set<string>>(new Set());

  const registerBlobUrl = useCallback((url: string) => {
    blobUrlsRef.current.add(url);
    return url;
  }, []);

  const cleanupBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => cleanupBlobUrls();
  }, [cleanupBlobUrls]);

  const generatePresentation = async (inputTopic: string, fileData?: { data: string; mimeType: string }, mode: GenerationMode = 'create') => {
    setAppState(AppState.GENERATING_STRUCTURE);
    setError(null);
    setTopic(inputTopic || (fileData ? "Extracted Presentation" : "New AI Presentation"));

    try {
      const isConvert = mode === 'convert';
      setProgress({ 
        currentSlide: 0, totalSlides: 0, 
        status: isConvert ? 'Extracting original slide content...' : 'Designing new presentation...' 
      });
      
      const structure = await generatePresentationStructure(inputTopic, fileData, mode);
      setSlides(structure);
      setAppState(AppState.PREVIEW);
      
      // If we are converting, we don't generate new AI images - we keep it strictly about the source content
      if (isConvert) {
        setProgress({ currentSlide: structure.length, totalSlides: structure.length, status: 'Extraction complete.' });
        return;
      }

      // Staggered generation for 'create' mode to avoid rate limits
      const total = structure.length;
      setProgress({ currentSlide: 0, totalSlides: total, status: 'Creating AI visuals...' });

      for (let i = 0; i < structure.length; i++) {
        try {
          if (i > 0) await new Promise(r => setTimeout(r, 600)); // Rate limit protection
          const imageUrl = await generateSlideImage(structure[i].imagePrompt);
          setSlides(current => current.map((s, idx) => idx === i ? { ...s, imageUrl } : s));
          setProgress(prev => ({ ...prev, currentSlide: i + 1 }));
        } catch (err) {
          console.error("Skipping visual for slide", i);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to process document.");
      setAppState(AppState.ERROR);
    }
  };

  const generateVideoAssets = async () => {
    if (slides.length === 0) return;
    if (slides[0].audioUrl) { setAppState(AppState.VIDEO_PLAYER); return; }

    setAppState(AppState.GENERATING_VIDEO);
    const total = slides.length;
    setProgress({ currentSlide: 0, totalSlides: total, status: 'Generating narration...' });

    try {
      const audioPromises = slides.map(async (slide, index) => {
        const pcmBase64 = await generateSpeech(slide.speakerNotes);
        const wavBlob = pcmToWavBlob(pcmBase64);
        const audioUrl = registerBlobUrl(URL.createObjectURL(wavBlob));
        const duration = await getAudioDuration(wavBlob);
        
        setSlides(current => current.map((s, i) => i === index ? { ...s, audioUrl, duration } : s));
        if (index === 0) setAppState(AppState.VIDEO_PLAYER);
        setProgress(prev => ({ ...prev, currentSlide: prev.currentSlide + 1 }));
      });

      await Promise.all(audioPromises);
      setAppState(AppState.VIDEO_PLAYER);
    } catch (err: any) {
      if (appState !== AppState.VIDEO_PLAYER) {
        setError("Audio quota reached. Try again in a minute.");
        setAppState(AppState.PREVIEW);
      }
    }
  };

  const reset = () => {
    cleanupBlobUrls();
    setAppState(AppState.INPUT);
    setSlides([]);
    setTopic('');
    setError(null);
  };

  return { appState, setAppState, slides, progress, error, topic, generatePresentation, generateVideoAssets, reset };
};
