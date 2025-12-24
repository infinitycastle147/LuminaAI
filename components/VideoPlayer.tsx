
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slide } from '../types';
import SlidePreview from './SlidePreview';
import { Play, Pause, X, SkipForward, SkipBack, Volume2, MonitorPlay, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  slides: Slide[];
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slides, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || 0), 0);
  const pendingSeekRef = useRef<number | null>(null);
  const requestRef = useRef<number>(null);

  const slideStartTimes = slides.reduce((acc, slide, idx) => {
    if (idx === 0) return [0];
    const prevStart = acc[idx - 1];
    const prevDuration = slides[idx - 1].duration || 0;
    return [...acc, prevStart + prevDuration];
  }, [] as number[]);

  const animateProgress = useCallback(() => {
    if (audioRef.current && isPlaying) {
      const time = audioRef.current.currentTime;
      const elapsed = (slideStartTimes[currentSlideIndex] || 0) + time;
      
      setTotalElapsedTime(elapsed);
      
      if (progressBarRef.current) {
        const progressPercent = (elapsed / totalDuration) * 100;
        progressBarRef.current.style.width = `${progressPercent}%`;
      }
      if (timeDisplayRef.current) {
        timeDisplayRef.current.innerText = formatTime(elapsed);
      }
    }
    requestRef.current = requestAnimationFrame(animateProgress);
  }, [isPlaying, currentSlideIndex, slideStartTimes, totalDuration]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateProgress);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animateProgress]);

  useEffect(() => {
    containerRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
      if (e.key === 'ArrowRight') {
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      }
      if (e.key === 'ArrowLeft') {
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, slides.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playAudio = async () => {
      try {
        setIsLoading(true);
        await audio.play();
        setIsLoading(false);
      } catch (err) {
        console.warn("Play interrupted", err);
        setIsLoading(false);
      }
    };

    if (isPlaying && slides[currentSlideIndex]?.audioUrl) {
      playAudio();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSlideIndex, slides]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSlideEnd = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setTotalElapsedTime(totalDuration);
    }
  };

  const handleLoadedMetadata = () => {
    if (pendingSeekRef.current !== null && audioRef.current) {
        audioRef.current.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
        setIsLoading(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const targetGlobalTime = percentage * totalDuration;

    let accumulated = 0;
    let targetIndex = 0;
    let timeInTargetSlide = 0;

    for (let i = 0; i < slides.length; i++) {
        const duration = slides[i].duration || 0;
        if (targetGlobalTime <= accumulated + duration) {
            targetIndex = i;
            timeInTargetSlide = targetGlobalTime - accumulated;
            break;
        }
        accumulated += duration;
    }

    setIsLoading(true);
    if (targetIndex !== currentSlideIndex) {
        pendingSeekRef.current = timeInTargetSlide;
        setCurrentSlideIndex(targetIndex);
    } else if (audioRef.current) {
        audioRef.current.currentTime = timeInTargetSlide;
        setIsLoading(false);
    }
    
    setTotalElapsedTime(targetGlobalTime);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div 
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 lg:p-10 animate-in fade-in duration-300 outline-none overflow-hidden"
      role="dialog"
      aria-label="Video presentation player"
    >
      {/* Header Info */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 text-white shrink-0">
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                 <MonitorPlay className="w-6 h-6 text-white" />
             </div>
             <div>
                 <h2 className="text-xl md:text-2xl font-black tracking-tight">Presentation Stage</h2>
                 <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em]">Lumina Cinema Engine</p>
             </div>
        </div>
        <button 
          onClick={onClose} 
          aria-label="Close player"
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group hover:rotate-90"
        >
            <X className="w-6 h-6 text-slate-300 group-hover:text-white" />
        </button>
      </div>

      {/* Main Content Area (Visuals) */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
        <div className="relative w-full max-w-7xl aspect-video bg-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] rounded-2xl overflow-hidden ring-1 ring-white/10 group">
            {/* The Slide Visual Stage */}
            <div className="w-full h-full relative z-10"> 
                {slides[currentSlideIndex] && <SlidePreview slide={slides[currentSlideIndex]} />}
            </div>

            <audio 
                ref={audioRef}
                src={slides[currentSlideIndex]?.audioUrl}
                onEnded={handleSlideEnd}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-40">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-14 h-14 text-white animate-spin" />
                        <span className="text-white text-[10px] font-black tracking-[0.3em] uppercase">Buffering Narration</span>
                    </div>
                </div>
            )}

            {/* In-Video Overlay Controls (Only visible on hover) */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 pb-8 px-10 transition-opacity duration-300 z-30 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-6 mb-6 select-none">
                    <span ref={timeDisplayRef} className="text-sm font-black text-indigo-400 w-12 text-right">{formatTime(totalElapsedTime)}</span>
                    <div 
                      ref={timelineRef} 
                      onClick={handleSeek} 
                      className="flex-1 h-2 bg-white/20 rounded-full cursor-pointer relative group/timeline"
                      role="slider"
                      aria-valuemin={0}
                      aria-valuemax={totalDuration}
                      aria-valuenow={totalElapsedTime}
                    >
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                             <div 
                                ref={progressBarRef}
                                className="h-full bg-indigo-500 relative shadow-[0_0_15px_rgba(99,102,241,1)]"
                                style={{ width: `${(totalElapsedTime / totalDuration) * 100}%` }}
                            ></div>
                        </div>
                        {/* Playhead handle visible on hover */}
                        <div 
                          className="absolute h-5 w-5 bg-white rounded-full top-1/2 -translate-y-1/2 -ml-2.5 opacity-0 group-hover/timeline:opacity-100 transition-opacity shadow-lg border-2 border-indigo-500 pointer-events-none"
                          style={{ left: `${(totalElapsedTime / totalDuration) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-black text-slate-400 w-12">{formatTime(totalDuration)}</span>
                </div>

                <div className="flex items-center justify-center gap-8 md:gap-14">
                    <button 
                        onClick={() => currentSlideIndex > 0 && setCurrentSlideIndex(prev => prev - 1)}
                        disabled={currentSlideIndex === 0}
                        aria-label="Previous slide"
                        className="p-3 text-white/50 hover:text-white disabled:opacity-10 transition-all hover:scale-110"
                    >
                        <SkipBack className="w-10 h-10" />
                    </button>

                    <button 
                      onClick={togglePlay} 
                      aria-label={isPlaying ? "Pause" : "Play"}
                      className="w-20 h-20 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-95 shadow-xl"
                    >
                        {isPlaying ? <Pause className="fill-current w-8 h-8" /> : <Play className="fill-current ml-1 w-8 h-8" />}
                    </button>
                    
                    <button 
                        onClick={() => currentSlideIndex < slides.length - 1 && setCurrentSlideIndex(prev => prev + 1)}
                        disabled={currentSlideIndex === slides.length - 1}
                        aria-label="Next slide"
                        className="p-3 text-white/50 hover:text-white disabled:opacity-10 transition-all hover:scale-110"
                    >
                        <SkipForward className="w-10 h-10" />
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      {/* Subtitles / Narration Area (Separate from content for visibility) */}
      <div className="w-full max-w-5xl mt-8 mb-4 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-50"></div>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                Live Narration Script
              </h4>
              <p className="text-white text-lg md:text-xl lg:text-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-500 italic">
                "{slides[currentSlideIndex]?.speakerNotes}"
              </p>
          </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
