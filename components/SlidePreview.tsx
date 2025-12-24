
import React from 'react';
import { Slide } from '../types';
import { ExternalLink } from 'lucide-react';

interface SlidePreviewProps {
  slide: Slide;
}

const SlidePreview: React.FC<SlidePreviewProps> = React.memo(({ slide }) => {
  const isExtracted = slide.source === 'extracted';
  const hasOriginal = !!slide.originalImageUrl;

  // Inner content renderer to keep 16:9 consistency
  const renderContent = () => {
    if (hasOriginal) {
      return (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
          <img 
            src={slide.originalImageUrl} 
            className="w-full h-full object-contain" 
            alt={`Slide ${slide.id}`}
          />
          <div className="absolute bottom-4 right-6 bg-slate-900/80 text-white text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full shadow-lg backdrop-blur-sm tracking-widest uppercase ring-1 ring-white/10 z-20 pointer-events-none">
            Verified Asset
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full h-full flex flex-col transition-colors duration-500 ${isExtracted ? 'bg-slate-50' : 'bg-white'}`}>
        {/* Slide Header */}
        <div className="h-[12%] bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 shrink-0">
          <h3 className="text-xs md:text-sm font-bold text-slate-400 truncate max-w-[60%] tracking-widest uppercase">
            {isExtracted ? 'Direct Extraction' : 'AI Composition'}
          </h3>
          <div className="flex gap-2 items-center">
            {isExtracted && (
              <div className="flex items-center gap-1.5 bg-indigo-50 px-2 md:px-3 py-1 rounded-full border border-indigo-100">
                <span className="text-[8px] md:text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Source-Matched</span>
              </div>
            )}
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-8 md:p-14 relative overflow-hidden flex flex-col justify-center">
          {isExtracted ? (
            <div className="max-w-5xl mx-auto w-full space-y-6">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight border-l-4 md:border-l-8 border-indigo-500 pl-4 md:pl-8 hyphens-auto">
                {slide.title}
              </h1>
              <div className="space-y-3 md:space-y-4 pl-4 md:pl-10">
                {slide.content.map((point, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-indigo-400 font-mono text-sm md:text-xl mr-3 md:mr-6 mt-1 opacity-50">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-700 font-medium leading-relaxed hyphens-auto">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1">
                {slide.layout === 'title' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 md:space-y-8">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tighter max-w-[95%] hyphens-auto">
                      {slide.title}
                    </h1>
                    <div className="h-1 md:h-2 w-20 md:w-32 bg-indigo-600 rounded-full shadow-lg"></div>
                    <div className="space-y-2 md:space-y-4 max-w-4xl mx-auto">
                      {slide.content.map((point, idx) => (
                        <p key={idx} className="text-lg sm:text-2xl md:text-3xl text-slate-500 font-medium hyphens-auto italic">{point}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`flex h-full gap-8 md:gap-12 items-center ${slide.layout === 'content_right' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-full md:w-3/5 flex flex-col justify-center">
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-6 md:mb-8 leading-tight hyphens-auto">{slide.title}</h2>
                      <ul className="space-y-4 md:space-y-6">
                        {slide.content.map((point, idx) => (
                          <li key={idx} className="flex items-start">
                            <div className="w-6 h-6 md:w-10 md:h-10 flex items-center justify-center text-[10px] md:text-base font-bold text-indigo-600 bg-indigo-50 rounded-xl mt-1 mr-3 md:mr-5 shrink-0 border border-indigo-100 shadow-sm">{idx + 1}</div>
                            <span className="text-base sm:text-xl md:text-2xl lg:text-3xl text-slate-600 font-medium leading-snug hyphens-auto">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="hidden md:block md:w-2/5 h-[80%] relative">
                      {slide.imageUrl && (
                        <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100">
                          <img src={slide.imageUrl} className="w-full h-full object-cover" alt={slide.title} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Research Sources link footer inside slide area */}
              {!isExtracted && slide.sources && slide.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100/50">
                  <div className="flex flex-wrap gap-2">
                    {slide.sources.slice(0, 2).map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-full border border-slate-100 hover:border-indigo-100 text-[10px] font-bold transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-[200px] uppercase tracking-wider">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Slide Footer */}
        <div className="h-[8%] bg-white border-t border-slate-50 flex items-center justify-between px-8 md:px-12 shrink-0">
          <span className="text-[9px] md:text-[11px] text-slate-300 font-black tracking-[0.4em] uppercase italic">
            Lumina Studio Sync
          </span>
          <span className="text-[10px] md:text-xs font-bold text-slate-400">
            {slide.id < 10 ? `0${slide.id}` : slide.id}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full aspect-video shadow-2xl overflow-hidden relative select-none">
      {renderContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.slide.id === nextProps.slide.id &&
    prevProps.slide.imageUrl === nextProps.slide.imageUrl &&
    prevProps.slide.originalImageUrl === nextProps.slide.originalImageUrl &&
    prevProps.slide.title === nextProps.slide.title &&
    JSON.stringify(prevProps.slide.content) === JSON.stringify(nextProps.slide.content) &&
    JSON.stringify(prevProps.slide.sources) === JSON.stringify(nextProps.slide.sources)
  );
});

export default SlidePreview;
