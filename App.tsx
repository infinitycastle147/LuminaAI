import React, { useState, useRef, useEffect } from 'react';
import { AppState, GenerationMode, Slide } from './types';
import { usePresentationGenerator } from './hooks/usePresentationGenerator';
import { createPptx } from './services/ppt';
import InputSection from './components/InputSection';
import SlidePreview from './components/SlidePreview';
import VideoPlayer from './components/VideoPlayer';
import { Download, ChevronLeft, ChevronRight, Loader2, RefreshCw, PlayCircle, Layers, MonitorPlay, FileText, Globe } from 'lucide-react';

// Thumbnail sub-component for the filmstrip
interface ThumbnailProps {
  slide: Slide;
  isActive: boolean;
  onClick: () => void;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ slide, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative flex-shrink-0 transition-all duration-200 ease-out group
      ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-105 opacity-100 z-10' : 'opacity-50 hover:opacity-80 hover:scale-105'}
    `}
    style={{ width: '192px', aspectRatio: '16/9' }}
  >
    <div className="w-full h-full rounded-lg overflow-hidden bg-slate-800 pointer-events-none shadow-xl border border-slate-700">
        <SlidePreview slide={slide} />
    </div>
    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold backdrop-blur-md border border-white/10">
        {slide.id}
    </div>
  </button>
);

const App: React.FC = () => {
  const {
    appState,
    setAppState,
    slides,
    progress,
    error,
    topic,
    generatePresentation,
    generateVideoAssets,
    reset
  } = usePresentationGenerator();

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Auto-scroll filmstrip when current slide changes
  useEffect(() => {
    if (filmstripRef.current && appState === AppState.PREVIEW) {
      const activeThumb = filmstripRef.current.children[currentSlideIdx] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentSlideIdx, appState]);

  const handleDownload = async () => {
    if (slides.length === 0 || isExporting) return;
    setIsExporting(true);
    
    setTimeout(async () => {
      try {
        const pptx = await createPptx(slides, topic);
        await pptx.writeFile({ fileName: `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'presentation'}.pptx` });
      } catch (e) {
        console.error("Export failed", e);
        alert("Failed to export PPTX. This may be due to browser memory limits with large images.");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const handleWatchVideo = async () => {
    try {
      await generateVideoAssets();
    } catch (e) {
      alert("Failed to generate video narration. Please try again.");
    }
  };

  const onStart = (text: string, file?: { data: string; mimeType: string }, mode: GenerationMode = 'create') => {
    setCurrentSlideIdx(0);
    generatePresentation(text, file, mode);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50 h-16 flex-none">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-default">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                    <Layers className="text-white w-5 h-5" />
                </div>
                <div>
                    <span className="font-bold text-white text-lg tracking-tight block leading-none">Lumina</span>
                    <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Presentation Engine</span>
                </div>
            </div>
            
            {(appState === AppState.PREVIEW || appState === AppState.VIDEO_PLAYER) && (
                <div className="flex items-center gap-4">
                     <button onClick={reset} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm font-medium">New Project</span>
                     </button>
                     
                     <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
                     
                     <div className="flex items-center gap-2">
                        <button 
                            onClick={handleWatchVideo}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-lg shadow-indigo-900/40 hover:shadow-indigo-600/50 active:scale-95 border border-indigo-400/20"
                        >
                            <PlayCircle className="w-4 h-4" /> 
                            <span>Watch Video</span>
                        </button>
                        
                        <button 
                            onClick={handleDownload}
                            disabled={isExporting}
                            className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-white p-2 px-4 rounded-full font-medium flex items-center gap-2 transition-all shadow-md active:scale-95 text-sm border border-slate-700"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>{isExporting ? 'Exporting...' : 'Export PPTX'}</span>
                        </button>
                     </div>
                </div>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {appState === AppState.INPUT && (
             <div className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-12 w-full">
                    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <InputSection onStart={onStart} disabled={false} />
                    </div>
                </div>
            </div>
        )}

        {(appState === AppState.GENERATING_STRUCTURE || appState === AppState.GENERATING_IMAGES || appState === AppState.GENERATING_VIDEO) && (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
                <div className="text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="aspect-video w-full bg-slate-900 rounded-2xl mb-12 animate-pulse overflow-hidden flex items-center justify-center border border-slate-800 relative">
                         <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 opacity-50"></div>
                         <div className="w-32 h-2 bg-slate-800 rounded-full relative z-10"></div>
                    </div>

                    <div className="w-20 h-20 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 mx-auto mb-8 flex items-center justify-center relative overflow-hidden">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{progress.status}</h3>
                    
                    {(appState === AppState.GENERATING_IMAGES || appState === AppState.GENERATING_VIDEO) && (
                        <div className="w-full bg-slate-900 rounded-full h-2 mb-6 overflow-hidden border border-slate-800">
                            <div 
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                                style={{ width: `${(progress.currentSlide / (progress.totalSlides || 1)) * 100}%` }}
                            ></div>
                        </div>
                    )}
                    
                    <p className="text-slate-500 font-medium">
                       AI is crafting your presentation. This usually takes about 30-60 seconds.
                    </p>
                </div>
            </div>
        )}

        {appState === AppState.ERROR && (
             <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
                <div className="text-center max-w-md bg-slate-900 p-10 rounded-3xl shadow-2xl border border-red-500/20 ring-1 ring-red-500/10 animate-in shake duration-300">
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400 border border-red-500/20">
                        <span className="text-3xl font-bold">!</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Generation Interrupted</h3>
                    <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
                    <button 
                        onClick={reset}
                        className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-700 transition-all shadow-lg active:scale-95 border border-slate-700"
                    >
                        Try Again
                    </button>
                </div>
             </div>
        )}

        {/* --- PREVIEW MODE (STUDIO LAYOUT) --- */}
        {appState === AppState.PREVIEW && slides.length > 0 && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden animate-in fade-in duration-500">
                
                {/* LEFT/CENTER: Stage & Filmstrip */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.15] pointer-events-none"></div>

                    {/* Stage Area - Increased padding to prevent navigation arrow clipping */}
                    <div className="flex-1 relative flex items-center justify-center p-12 md:p-24 overflow-hidden z-10">
                        <div className="relative w-full max-w-5xl aspect-video bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg ring-1 ring-white/10 group z-0">
                            <SlidePreview slide={slides[currentSlideIdx]} />
                            
                            {/* Navigation Arrows (Floating with extra clearance) */}
                            <button 
                                onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                                disabled={currentSlideIdx === 0}
                                className="absolute left-[-20px] md:left-[-70px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800 shadow-xl text-slate-200 hover:text-white hover:bg-indigo-600 disabled:opacity-0 hover:scale-110 transition-all z-20 border border-slate-700"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                                disabled={currentSlideIdx === slides.length - 1}
                                className="absolute right-[-20px] md:right-[-70px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800 shadow-xl text-slate-200 hover:text-white hover:bg-indigo-600 disabled:opacity-0 hover:scale-110 transition-all z-20 border border-slate-700"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Filmstrip */}
                    <div className="h-40 bg-slate-900 border-t border-slate-800 flex flex-col shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                        <div className="h-10 flex items-center px-6 justify-between bg-slate-950 text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-800">
                            <span className="flex items-center gap-2"><Layers className="w-3 h-3" /> Timeline</span>
                            <span>{slides.length} Slides</span>
                        </div>
                        <div 
                            ref={filmstripRef}
                            className="flex-1 overflow-x-auto flex items-center gap-4 px-6 py-4 scrollbar-hide bg-slate-950"
                        >
                            {slides.map((slide, idx) => (
                                <Thumbnail 
                                    key={slide.id} 
                                    slide={slide} 
                                    isActive={idx === currentSlideIdx} 
                                    onClick={() => setCurrentSlideIdx(idx)} 
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Inspector Panel */}
                <div className="w-full md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-30 shadow-2xl">
                    <div className="h-14 border-b border-slate-800 flex items-center px-6 bg-slate-900">
                        <h2 className="font-bold text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-indigo-500" />
                            Slide Inspector
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50">
                        {/* Narration Script Card */}
                        <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Narration Script</label>
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">Auto-Generated</span>
                             </div>
                             <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-sm leading-relaxed font-medium italic relative shadow-inner">
                                <div className="absolute top-5 left-0 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                "{slides[currentSlideIdx].speakerNotes}"
                             </div>
                        </div>

                        {/* Slide Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Layout</div>
                                <div className="text-sm font-semibold text-slate-300 capitalize">
                                    {slides[currentSlideIdx].layout.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950 shadow-sm">
                                <div className="text-xs text-slate-500 font-bold uppercase mb-1">Asset Source</div>
                                <div className="text-sm font-semibold text-slate-300 capitalize">
                                    {slides[currentSlideIdx].source === 'extracted' ? 'Original PDF' : 'AI Gen'}
                                </div>
                            </div>
                        </div>

                        {/* Research Sources List */}
                        {slides[currentSlideIdx].sources && slides[currentSlideIdx].sources!.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Globe className="w-3 h-3" /> Citations
                                </label>
                                <ul className="space-y-2">
                                    {slides[currentSlideIdx].sources!.map((src, i) => (
                                        <li key={i}>
                                            <a href={src.uri} target="_blank" rel="noreferrer" className="group flex items-start gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors p-2 hover:bg-slate-800 rounded-lg -mx-2">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-indigo-500 shrink-0"></div>
                                                <span className="line-clamp-2 font-medium">{src.title}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {appState === AppState.VIDEO_PLAYER && (
            <VideoPlayer 
                slides={slides} 
                onClose={() => setAppState(AppState.PREVIEW)} 
            />
        )}
      </main>
    </div>
  );
};

export default App;