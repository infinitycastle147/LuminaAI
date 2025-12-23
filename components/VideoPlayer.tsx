
import React, { useState, useRef, useEffect } from 'react';
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
  
  const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || 0), 0);
  const pendingSeekRef = useRef<number | null>(null);

  const slideStartTimes = slides.reduce((acc, slide, idx) => {
    if (idx === 0) return [0];
    const prevStart = acc[idx - 1];
    const prevDuration = slides[idx - 1].duration || 0;
    return [...acc, prevStart + prevDuration];
  }, [] as number[]);

  useEffect(() => {
    setCurrentSlideIndex(0);
    setTotalElapsedTime(0);
    setIsPlaying(false);
  }, []);

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

  const handleTimeUpdate = () => {
    if (audioRef.current && progressBarRef.current && timeDisplayRef.current) {
      const time = audioRef.current.currentTime;
      const elapsed = (slideStartTimes[currentSlideIndex] || 0) + time;
      
      // Direct DOM manipulation for performance
      const progressPercent = (elapsed / totalDuration) * 100;
      progressBarRef.current.style.width = `${progressPercent}%`;
      timeDisplayRef.current.innerText = formatTime(elapsed);
    }
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

    if (targetIndex !== currentSlideIndex) {
        pendingSeekRef.current = timeInTargetSlide;
        setCurrentSlideIndex(targetIndex);
    } else if (audioRef.current) {
        audioRef.current.currentTime = timeInTargetSlide;
    }
    
    setTotalElapsedTime(targetGlobalTime);
    handleTimeUpdate();
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-[90vw] xl:max-w-7xl flex justify-between items-center mb-4 text-white shrink-0">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                 <MonitorPlay className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h2 className="text-xl font-bold tracking-tight">Presentation Mode</h2>
                 <p className="text-xs text-indigo-300 font-medium hidden sm:block">Lumina AI Video Player</p>
             </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 group">
            <X className="w-5 h-5 text-slate-300 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center min-h-0 mb-4">
        <div className="relative w-full max-w-[90vw] xl:max-w-7xl aspect-video bg-black shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10 group">
            <div className="w-full h-full"> 
                {slides[currentSlideIndex] && <SlidePreview slide={slides[currentSlideIndex]} />}
            </div>

            <audio 
                ref={audioRef}
                src={slides[currentSlideIndex]?.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleSlideEnd}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
            />

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            )}

            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-6 px-6 md:px-12 transition-opacity duration-300 flex flex-col justify-end z-30 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-4 mb-4 select-none">
                    <span ref={timeDisplayRef} className="text-xs font-mono text-indigo-300 w-10 text-right">{formatTime(totalElapsedTime)}</span>
                    <div ref={timelineRef} onClick={handleSeek} className="flex-1 h-2 bg-white/20 rounded-full cursor-pointer relative group/timeline">
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                             <div 
                                ref={progressBarRef}
                                className="h-full bg-indigo-500 relative shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-100 linear"
                                style={{ width: `${(totalElapsedTime / totalDuration) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 w-10">{formatTime(totalDuration)}</span>
                </div>

                <div className="flex items-center justify-center gap-6 md:gap-10">
                    <button 
                        onClick={() => currentSlideIndex > 0 && setCurrentSlideIndex(prev => prev - 1)}
                        disabled={currentSlideIndex === 0}
                        className="p-2 text-white/50 hover:text-white disabled:opacity-20 transition-colors"
                    >
                        <SkipBack className="w-8 h-8" />
                    </button>

                    <button onClick={togglePlay} className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all active:scale-95">
                        {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current ml-1 w-6 h-6" />}
                    </button>
                    
                    <button 
                        onClick={() => currentSlideIndex < slides.length - 1 && setCurrentSlideIndex(prev => prev + 1)}
                        disabled={currentSlideIndex === slides.length - 1}
                        className="p-2 text-white/50 hover:text-white disabled:opacity-20 transition-colors"
                    >
                        <SkipForward className="w-8 h-8" />
                    </button>
                </div>
            </div>
        </div>
      </div>
      
      <div className="w-full max-w-4xl text-center bg-black/60 p-4 rounded-xl border border-white/10 backdrop-blur-sm shrink-0 min-h-[80px]">
          <p className="text-indigo-100 text-base md:text-lg font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-2 line-clamp-3">
            "{slides[currentSlideIndex]?.speakerNotes}"
          </p>
      </div>
    </div>
  );
};

export default VideoPlayer;
