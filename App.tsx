
import React, { useState, useRef, useMemo } from 'react';
import { AppState, GenerationMode } from './types';
import { usePresentationGenerator } from './hooks/usePresentationGenerator';
import { createPptx } from './services/ppt';
import InputSection from './components/InputSection';
import SlidePreview from './components/SlidePreview';
import VideoPlayer from './components/VideoPlayer';
import { Download, ChevronLeft, ChevronRight, Loader2, RefreshCw, PlayCircle, Layers } from 'lucide-react';

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

  const handleDownload = async () => {
    if (slides.length === 0) return;
    try {
        const pptx = await createPptx(slides, topic);
        await pptx.writeFile({ fileName: `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'presentation'}.pptx` });
    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to export PPTX");
    }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-default">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Layers className="text-white w-6 h-6" />
                </div>
                <div>
                    <span className="font-bold text-slate-900 text-xl tracking-tight block leading-none">Lumina AI</span>
                    <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Presentation Engine</span>
                </div>
            </div>
            
            {(appState === AppState.PREVIEW || appState === AppState.VIDEO_PLAYER) && (
                <div className="flex items-center gap-3">
                     <button onClick={reset} className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <RefreshCw className="w-4 h-4" /> New
                     </button>
                     <div className="h-6 w-px bg-slate-200"></div>
                     <button 
                        onClick={handleWatchVideo}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100 transition-all ring-1 ring-indigo-200 shadow-sm"
                     >
                        <PlayCircle className="w-4 h-4" /> Watch Video
                     </button>
                    <button 
                        onClick={handleDownload}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export PPTX
                    </button>
                </div>
            )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-[95vw] xl:max-w-[85vw] mx-auto">
        {appState === AppState.INPUT && (
            <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <InputSection onStart={onStart} disabled={false} />
            </div>
        )}

        {(appState === AppState.GENERATING_STRUCTURE || appState === AppState.GENERATING_IMAGES || appState === AppState.GENERATING_VIDEO) && (
            <div className="text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-slate-100 mx-auto mb-8 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-purple-50 animate-pulse"></div>
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">{progress.status}</h3>
                
                {(appState === AppState.GENERATING_IMAGES || appState === AppState.GENERATING_VIDEO) && (
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden border border-slate-200">
                        <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                            style={{ width: `${(progress.currentSlide / (progress.totalSlides || 1)) * 100}%` }}
                        ></div>
                    </div>
                )}
                
                <p className="text-slate-500 font-medium">
                    {appState === AppState.GENERATING_STRUCTURE && "Our AI is analyzing the inputs..."}
                    {appState === AppState.GENERATING_IMAGES && `Crafting professional visuals...`}
                    {appState === AppState.GENERATING_VIDEO && `Generating narration...`}
                </p>
            </div>
        )}

        {appState === AppState.ERROR && (
             <div className="text-center max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-red-50 ring-1 ring-red-100 animate-in shake duration-300">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-100">
                    <span className="text-3xl font-bold">!</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Generation Halted</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">{error}</p>
                <button 
                    onClick={reset}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
                >
                    Try Again
                </button>
             </div>
        )}

        {appState === AppState.PREVIEW && slides.length > 0 && (
            <div className="w-full max-w-7xl flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500">
                <div className="w-full relative group shadow-2xl rounded-2xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 blur group-hover:opacity-30 transition duration-1000"></div>
                    <div className="relative rounded-2xl overflow-hidden ring-1 ring-slate-900/5">
                        <SlidePreview slide={slides[currentSlideIdx]} />
                    </div>
                    
                    <button 
                        onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentSlideIdx === 0}
                        className="absolute left-4 md:left-[-30px] lg:left-[-50px] top-1/2 -translate-y-1/2 p-4 rounded-full bg-white shadow-xl border border-slate-100 text-slate-700 hover:text-indigo-600 disabled:opacity-0 hover:scale-110 transition-all z-20"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button 
                        onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                        disabled={currentSlideIdx === slides.length - 1}
                        className="absolute right-4 md:right-[-30px] lg:right-[-50px] top-1/2 -translate-y-1/2 p-4 rounded-full bg-white shadow-xl border border-slate-100 text-slate-700 hover:text-indigo-600 disabled:opacity-0 hover:scale-110 transition-all z-20"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/60 p-6 rounded-2xl border border-slate-100 backdrop-blur-sm flex flex-col justify-center items-center shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Slide Navigation</span>
                        <div className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                             <span>{currentSlideIdx + 1}</span>
                             <span className="text-slate-300 text-lg">/</span>
                             <span className="text-slate-500">{slides.length}</span>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-white/60 border border-slate-100 rounded-2xl p-6 backdrop-blur-sm shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                             Speaker Notes
                        </h4>
                        <p className="text-slate-700 leading-relaxed font-serif text-lg italic opacity-90">
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
