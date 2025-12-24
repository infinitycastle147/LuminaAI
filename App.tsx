
import React, { useState, useRef, useMemo } from 'react';
import { AppState, GenerationMode } from './types';
import { usePresentationGenerator } from './hooks/usePresentationGenerator';
import { createPptx } from './services/ppt';
import InputSection from './components/InputSection';
import SlidePreview from './components/SlidePreview';
import VideoPlayer from './components/VideoPlayer';
import { Download, ChevronLeft, ChevronRight, Loader2, RefreshCw, PlayCircle, Layers, MoreHorizontal, MonitorPlay } from 'lucide-react';

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

  const handleDownload = async () => {
    if (slides.length === 0 || isExporting) return;
    setIsExporting(true);
    
    // Defer processing to prevent UI lockup during heavy object serialization
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex flex-col text-slate-900 font-sans">
      <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 group cursor-default">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Layers className="text-white w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="hidden xs:block">
                    <span className="font-bold text-slate-900 text-base md:text-xl tracking-tight block leading-none">Lumina AI</span>
                    <span className="text-[8px] md:text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Engine</span>
                </div>
            </div>
            
            {(appState === AppState.PREVIEW || appState === AppState.VIDEO_PLAYER) && (
                <div className="flex items-center gap-2 md:gap-4">
                     <button onClick={reset} aria-label="Start new" className="text-slate-500 hover:text-slate-800 p-2 md:px-3 md:py-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2 text-sm font-medium">New</span>
                     </button>
                     
                     <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                     
                     <div className="flex items-center gap-2">
                        <button 
                            onClick={handleWatchVideo}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-full transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] active:scale-95"
                        >
                            <PlayCircle className="w-4 h-4" /> 
                            <span>Watch Video</span>
                        </button>
                        
                        <button 
                            onClick={handleDownload}
                            disabled={isExporting}
                            title="Export to PPTX"
                            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white p-2.5 md:px-5 md:py-2.5 rounded-full font-medium flex items-center gap-2 transition-all shadow-md active:scale-95"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span className="hidden md:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
                        </button>
                     </div>
                </div>
            )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 w-full max-w-full md:max-w-[95vw] xl:max-w-[85vw] mx-auto">
        {appState === AppState.INPUT && (
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <InputSection onStart={onStart} disabled={false} />
            </div>
        )}

        {(appState === AppState.GENERATING_STRUCTURE || appState === AppState.GENERATING_IMAGES || appState === AppState.GENERATING_VIDEO) && (
            <div className="text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                <div className="aspect-video w-full bg-slate-200/50 rounded-2xl mb-12 animate-pulse overflow-hidden flex items-center justify-center border border-slate-100">
                    <div className="w-32 h-2 bg-slate-200 rounded-full"></div>
                </div>

                <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-3xl shadow-xl border border-slate-100 mx-auto mb-8 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-purple-50 animate-pulse"></div>
                    <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-indigo-600 animate-spin relative z-10" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 tracking-tight">{progress.status}</h3>
                
                {(appState === AppState.GENERATING_IMAGES || appState === AppState.GENERATING_VIDEO) && (
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden border border-slate-200">
                        <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                            style={{ width: `${(progress.currentSlide / (progress.totalSlides || 1)) * 100}%` }}
                        ></div>
                    </div>
                )}
                
                <p className="text-slate-500 font-medium text-sm md:text-base">
                    {appState === AppState.GENERATING_STRUCTURE && "Our AI is parsing your documents..."}
                    {appState === AppState.GENERATING_IMAGES && `Rendering high-quality slide visuals...`}
                    {appState === AppState.GENERATING_VIDEO && `Synthesizing professional narration...`}
                </p>
            </div>
        )}

        {appState === AppState.ERROR && (
             <div className="text-center max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-red-50 ring-1 ring-red-100 animate-in shake duration-300">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-100">
                    <span className="text-2xl md:text-3xl font-bold">!</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-3">Generation Interrupted</h3>
                <p className="text-slate-600 mb-8 leading-relaxed text-sm md:text-base">{error}</p>
                <button 
                    onClick={reset}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    Try Again
                </button>
             </div>
        )}

        {appState === AppState.PREVIEW && slides.length > 0 && (
            <div className="w-full max-w-7xl flex flex-col items-center gap-6 md:gap-8 animate-in zoom-in-95 duration-500">
                <div className="w-full relative group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-2xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-10 blur group-hover:opacity-20 transition duration-1000"></div>
                    <div className="relative rounded-2xl overflow-hidden ring-1 ring-slate-900/5 aspect-video bg-white">
                        <SlidePreview slide={slides[currentSlideIdx]} />
                    </div>
                    
                    <button 
                        onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentSlideIdx === 0}
                        aria-label="Previous slide"
                        className="absolute left-2 md:left-[-25px] lg:left-[-50px] top-1/2 -translate-y-1/2 p-2 md:p-4 rounded-full bg-white shadow-xl border border-slate-100 text-slate-700 hover:text-indigo-600 disabled:opacity-0 hover:scale-110 transition-all z-20"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>

                    <button 
                        onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                        disabled={currentSlideIdx === slides.length - 1}
                        aria-label="Next slide"
                        className="absolute right-2 md:right-[-25px] lg:left-[-50px] top-1/2 -translate-y-1/2 p-2 md:p-4 rounded-full bg-white shadow-xl border border-slate-100 text-slate-700 hover:text-indigo-600 disabled:opacity-0 hover:scale-110 transition-all z-20"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white/60 p-4 md:p-6 rounded-2xl border border-slate-100 backdrop-blur-sm flex flex-col justify-center items-center shadow-sm">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2 text-center">Slide Track</span>
                        <div className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-slate-800">
                             <span>{currentSlideIdx + 1}</span>
                             <span className="text-slate-300 text-base md:text-lg">/</span>
                             <span className="text-slate-500">{slides.length}</span>
                        </div>
                    </div>

                    <div className="md:col-span-3 bg-white/60 border border-slate-100 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors"></div>
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                            <h4 className="text-[10px] md:text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                <MonitorPlay className="w-3 h-3" />
                                Narration Script
                            </h4>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Auto-Generated</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-serif text-base md:text-lg italic opacity-90 line-clamp-3 md:line-clamp-none">
                            "{slides[currentSlideIdx].speakerNotes}"
                        </p>
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
