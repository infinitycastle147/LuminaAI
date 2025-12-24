
import { useState, useRef, useEffect, useCallback } from 'react';
import { AppState, Slide, GenerationProgress, GenerationMode } from '../types';
import { generatePresentationStructure, generateSlideImage, generateSpeech } from '../services/gemini';
import { pcmToWavBlob, getAudioDuration } from '../services/audioUtils';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const usePresentationGenerator = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INPUT);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [progress, setProgress] = useState<GenerationProgress>({ currentSlide: 0, totalSlides: 0, status: '' });
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');

  const blobUrlsRef = useRef<Set<string>>(new Set());
  const generationLockRef = useRef<boolean>(false);

  const registerBlobUrl = useCallback((url: string) => {
    blobUrlsRef.current.add(url);
    return url;
  }, []);

  const cleanupBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => cleanupBlobUrls();
  }, [cleanupBlobUrls]);

  const renderPdfToImages = async (base64: string): Promise<string[]> => {
    const pdfData = atob(base64);
    const uint8Array = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
      uint8Array[i] = pdfData.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL('image/png'));
      
      setProgress(prev => ({
        ...prev,
        currentSlide: i,
        totalSlides: pdf.numPages,
        status: `Capturing page ${i} of ${pdf.numPages}...`
      }));
    }
    return images;
  };

  const generatePresentation = async (inputTopic: string, fileData?: { data: string; mimeType: string }, mode: GenerationMode = 'create') => {
    if (generationLockRef.current) return;
    generationLockRef.current = true;

    // Preventive memory cleanup
    cleanupBlobUrls();
    
    setAppState(AppState.GENERATING_STRUCTURE);
    setError(null);
    setTopic(inputTopic || (fileData ? "Uploaded Document" : "New Presentation"));

    try {
      const isConvert = mode === 'convert';
      let originalPageImages: string[] = [];

      if (isConvert && fileData?.mimeType === 'application/pdf') {
        originalPageImages = await renderPdfToImages(fileData.data);
      }

      setProgress({ 
        currentSlide: 0, totalSlides: 0, 
        status: isConvert ? 'Analyzing content for narration...' : 'Designing new presentation...' 
      });
      
      const structure = await generatePresentationStructure(inputTopic, fileData, mode);
      
      const enrichedStructure = structure.map((slide, idx) => ({
        ...slide,
        originalImageUrl: isConvert ? originalPageImages[idx] : undefined,
        source: isConvert ? 'extracted' : 'generated'
      }));

      setSlides(enrichedStructure);
      setAppState(AppState.PREVIEW);
      
      if (isConvert) {
        setProgress({ currentSlide: enrichedStructure.length, totalSlides: enrichedStructure.length, status: 'Conversion complete.' });
        generationLockRef.current = false;
        return;
      }

      const total = enrichedStructure.length;
      setProgress({ currentSlide: 0, totalSlides: total, status: 'Creating AI visuals...' });

      // Visual generation loop
      for (let i = 0; i < enrichedStructure.length; i++) {
        try {
          if (i > 0) await new Promise(r => setTimeout(r, 600));
          const imageUrl = await generateSlideImage(enrichedStructure[i].imagePrompt);
          
          setSlides(current => {
            const next = [...current];
            next[i] = { ...next[i], imageUrl };
            return next;
          });
          
          setProgress(prev => ({ ...prev, currentSlide: i + 1 }));
        } catch (err) {
          console.error("Skipping visual", i);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to process document.");
      setAppState(AppState.ERROR);
    } finally {
      generationLockRef.current = false;
    }
  };

  const generateVideoAssets = async () => {
    if (slides.length === 0 || generationLockRef.current) return;
    if (slides[0].audioUrl) { setAppState(AppState.VIDEO_PLAYER); return; }

    generationLockRef.current = true;
    setAppState(AppState.GENERATING_VIDEO);
    
    const total = slides.length;
    setProgress({ currentSlide: 0, totalSlides: total, status: 'Generating narration...' });

    try {
      // Process in sequence to avoid hitting quota/memory limits simultaneously
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const pcmBase64 = await generateSpeech(slide.speakerNotes);
        const wavBlob = pcmToWavBlob(pcmBase64);
        const audioUrl = registerBlobUrl(URL.createObjectURL(wavBlob));
        const duration = await getAudioDuration(wavBlob);
        
        setSlides(current => {
          const next = [...current];
          next[i] = { ...next[i], audioUrl, duration };
          return next;
        });

        setProgress(prev => ({ ...prev, currentSlide: i + 1 }));
      }
      
      setAppState(AppState.VIDEO_PLAYER);
    } catch (err: any) {
      setError("Audio quota reached. Try again in a minute.");
      setAppState(AppState.PREVIEW);
    } finally {
      generationLockRef.current = false;
    }
  };

  const reset = () => {
    if (generationLockRef.current) return;
    cleanupBlobUrls();
    setAppState(AppState.INPUT);
    setSlides([]);
    setTopic('');
    setError(null);
  };

  return { appState, setAppState, slides, progress, error, topic, generatePresentation, generateVideoAssets, reset };
};
