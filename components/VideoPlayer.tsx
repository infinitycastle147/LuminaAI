
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Slide } from '../types';
import SlidePreview from './SlidePreview';
import { Play, Pause, X, SkipForward, SkipBack, Volume2, MonitorPlay, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  slides: Slide[];
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slides, onClose }) => {
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0); // Global time in seconds
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);

  // Calculations
  const totalDuration = useMemo(() => slides.reduce((acc, slide) => acc + (slide.duration || 0), 0), [slides]);
  
  const slideStartTimes = useMemo(() => {
    return slides.reduce((acc, slide, idx) => {
      if (idx === 0) return [0];
      const prevStart = acc[idx - 1];
      const prevDuration = slides[idx - 1].duration || 0;
      return [...acc, prevStart + prevDuration];
    }, [] as number[]);
  }, [slides]);

  const currentSlideStartTime = slideStartTimes[currentSlideIndex] || 0;

  // Format time helper (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Audio Event Handlers ---

  // Sync Audio Time -> Global Slider Time
  const handleTimeUpdate = () => {
    if (!audioRef.current || isDragging) return;
    const localTime = audioRef.current.currentTime;
    setCurrentTime(currentSlideStartTime + localTime);
  };

  // Handle Slide Transition when audio ends
  const handleSlideEnd = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      // Note: isPlaying remains true, so next slide's audio will auto-play via useEffect
    } else {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
      setShowControls(true);
    }
  };

  const handleLoadedMetadata = () => {
     // Apply pending seek if we jumped slides
     if (pendingSeekTimeRef.current !== null && audioRef.current) {
         audioRef.current.currentTime = pendingSeekTimeRef.current;
         pendingSeekTimeRef.current = null;
     }
     setIsBuffering(false);
  };

  const handleWaiting = () => setIsBuffering(true);
  const handleCanPlay = () => setIsBuffering(false);

  // --- Effects ---

  // Manage Play/Pause & Audio Source Loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Playback prevented:", error);
          // setIsPlaying(false); // Optional: pause UI if browser blocks autoplay
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSlideIndex]); // Re-run on slide change to play new source if isPlaying is true

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying(p => !p);
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

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isDragging) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying, isDragging]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);


  // --- User Interaction Handlers ---

  const handleSeekStart = () => {
    setIsDragging(true);
    // Don't hide controls while dragging
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(false);
    resetControlsTimeout();
    
    // Determine which slide falls at this timestamp
    const targetGlobalTime = parseFloat((e.currentTarget as HTMLInputElement).value);
    let targetIndex = 0;
    let targetLocalTime = 0;

    for (let i = 0; i < slides.length; i++) {
        const start = slideStartTimes[i];
        const duration = slides[i].duration || 0;
        // Check if time falls within this slide, or if it's the very last slide
        if (targetGlobalTime < start + duration || i === slides.length - 1) {
            targetIndex = i;
            targetLocalTime = Math.max(0, targetGlobalTime - start); // Ensure non-negative
            // Clamp to duration if strictly needed, but HTML audio handles overshoot usually
            if (targetLocalTime > duration) targetLocalTime = duration; 
            break;
        }
    }

    if (targetIndex !== currentSlideIndex) {
        // Change slide first
        pendingSeekTimeRef.current = targetLocalTime;
        setCurrentSlideIndex(targetIndex);
        setIsBuffering(true); // Expect loading delay
    } else {
        // Same slide, just jump audio
        if (audioRef.current) {
            audioRef.current.currentTime = targetLocalTime;
        }
    }
  };

  const skipForward = () => {
    if (currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const skipBack = () => {
    if (currentSlideIndex > 0) {
        setCurrentSlideIndex(prev => prev - 1);
    } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-4 text-white/90 drop-shadow-md">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                 <MonitorPlay className="w-5 h-5 text-white" />
             </div>
             <div className="hidden md:block">
                 <h2 className="text-lg font-bold tracking-tight leading-none">Presentation Preview</h2>
                 <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Lumina Player</p>
             </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 bg-black/40 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all backdrop-blur-md border border-white/10"
        >
            <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Stage */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
        <div className="relative w-full max-w-7xl aspect-video bg-black shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/10">
            
            {/* Slide Content */}
            <div className="w-full h-full"> 
                {slides[currentSlideIndex] && <SlidePreview slide={slides[currentSlideIndex]} />}
            </div>

            {/* Audio Element */}
            <audio 
                ref={audioRef}
                src={slides[currentSlideIndex]?.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleSlideEnd}
                onLoadedMetadata={handleLoadedMetadata}
                onWaiting={handleWaiting}
                onCanPlay={handleCanPlay}
                onError={(e) => console.error("Audio Error", e)}
            />

            {/* Buffering Overlay */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300">
                    <Loader2 className="w-12 h-12 text-white animate-spin drop-shadow-lg" />
                </div>
            )}

            {/* Click to Pause/Play Area (Invisible overlay) */}
            <div 
                className="absolute inset-0 z-20 cursor-pointer"
                onClick={(e) => {
                   // Only toggle if not clicking controls
                   if ((e.target as HTMLElement).closest('.controls-bar')) return;
                   setIsPlaying(!isPlaying);
                }}
            ></div>

            {/* Bottom Controls Bar */}
            <div className={`controls-bar absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-6 pt-20 z-40 transition-all duration-500 ease-out ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                
                {/* Progress Bar */}
                <div className="w-full flex items-center gap-4 mb-4 group/slider">
                    <span className="text-xs font-mono font-medium text-white/70 w-12 text-right">{formatTime(currentTime)}</span>
                    <div className="relative flex-1 h-6 flex items-center">
                        <input
                            type="range"
                            min={0}
                            max={totalDuration}
                            step={0.1}
                            value={currentTime}
                            onMouseDown={handleSeekStart}
                            onTouchStart={handleSeekStart}
                            onChange={handleSeekChange}
                            onMouseUp={handleSeekEnd}
                            onTouchEnd={handleSeekEnd}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            aria-label="Seek slider"
                        />
                        {/* Visual Track */}
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative z-10 pointer-events-none group-hover/slider:h-2 transition-all">
                             <div 
                                className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                            ></div>
                        </div>
                        {/* Visual Thumb */}
                        <div 
                            className="absolute h-4 w-4 bg-white rounded-full shadow-lg pointer-events-none z-10 transition-transform duration-100 scale-0 group-hover/slider:scale-100 top-1/2 -translate-y-1/2"
                            style={{ left: `${(currentTime / totalDuration) * 100}%`, transform: 'translate(-50%, -50%)' }}
                        ></div>
                    </div>
                    <span className="text-xs font-mono font-medium text-white/70 w-12">{formatTime(totalDuration)}</span>
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 w-1/3">
                         <div className="flex items-center gap-2 text-white/50 text-xs hidden md:flex">
                            <Volume2 className="w-4 h-4" />
                            <span>100%</span>
                         </div>
                    </div>

                    <div className="flex items-center justify-center gap-8 w-1/3">
                        <button 
                            onClick={skipBack}
                            className="text-white/70 hover:text-white hover:scale-110 transition-all active:scale-95"
                            aria-label="Previous Slide"
                        >
                            <SkipBack className="w-8 h-8" />
                        </button>
                        
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all active:scale-95"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>

                        <button 
                            onClick={skipForward}
                            className="text-white/70 hover:text-white hover:scale-110 transition-all active:scale-95"
                            aria-label="Next Slide"
                        >
                            <SkipForward className="w-8 h-8" />
                        </button>
                    </div>

                    <div className="w-1/3 flex justify-end">
                       <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 hidden md:block">
                           <p className="text-[10px] text-white/90 font-medium truncate max-w-[200px]">
                               Playing: <span className="opacity-70">{slides[currentSlideIndex]?.title || "Untitled Slide"}</span>
                           </p>
                       </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Slide Notes (Dynamic Position based on Controls) */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10 transition-all duration-500 hidden md:block
            ${showControls ? 'bottom-32' : 'bottom-8'}
        `}
      >
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Volume2 className="w-3 h-3" />
                Current Narration
              </h4>
              <p className="text-white/90 text-lg font-medium leading-relaxed italic text-center">
                "{slides[currentSlideIndex]?.speakerNotes}"
              </p>
          </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
