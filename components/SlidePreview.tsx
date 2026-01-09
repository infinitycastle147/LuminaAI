
import React, { useRef, useState, useEffect } from 'react';
import { Slide } from '../types';
import { ExternalLink } from 'lucide-react';

interface SlidePreviewProps {
  slide: Slide;
}

const SlidePreview: React.FC<SlidePreviewProps> = React.memo(({ slide }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const isExtracted = slide.source === 'extracted';
  const hasOriginal = !!slide.originalImageUrl;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setScale(width / 1920);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Inner content renderer (Fixed 1920x1080)
  const renderContent = () => {
    if (hasOriginal) {
      return (
        <div className="w-[1920px] h-[1080px] bg-slate-900 flex items-center justify-center overflow-hidden relative">
          <img 
            src={slide.originalImageUrl} 
            className="w-full h-full object-contain" 
            alt={`Slide ${slide.id}`}
          />
          <div className="absolute bottom-8 right-12 bg-slate-900/80 text-white text-2xl font-black px-6 py-2 rounded-full shadow-lg backdrop-blur-sm tracking-widest uppercase ring-2 ring-white/10 z-20 pointer-events-none">
            Verified Asset
          </div>
        </div>
      );
    }

    return (
      <div className={`w-[1920px] h-[1080px] flex flex-col transition-colors duration-500 ${isExtracted ? 'bg-slate-50' : 'bg-white'}`}>
        {/* Slide Header (Height: ~140px) */}
        <div className="h-[140px] bg-white border-b-2 border-slate-100 flex items-center justify-between px-16 shrink-0">
          <h3 className="text-3xl font-bold text-slate-400 truncate max-w-[60%] tracking-[0.2em] uppercase">
            {isExtracted ? 'Direct Extraction' : 'AI Composition'}
          </h3>
          <div className="flex gap-4 items-center">
            {isExtracted && (
              <div className="flex items-center gap-3 bg-indigo-50 px-6 py-2 rounded-full border-2 border-indigo-100">
                <span className="text-xl font-bold text-indigo-700 uppercase tracking-widest">Source-Matched</span>
              </div>
            )}
            <div className="w-5 h-5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-20 relative overflow-hidden flex flex-col justify-center">
          {isExtracted ? (
            <div className="max-w-[1600px] mx-auto w-full space-y-12">
              <h1 className="text-8xl font-black text-slate-900 leading-tight tracking-tight border-l-[16px] border-indigo-500 pl-12 hyphens-auto">
                {slide.title}
              </h1>
              <div className="space-y-8 pl-16">
                {slide.content.map((point, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-indigo-400 font-mono text-4xl mr-8 mt-2 opacity-50">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-5xl text-slate-700 font-medium leading-relaxed hyphens-auto max-w-[90%]">
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
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-16">
                    <h1 className="text-[120px] font-extrabold text-slate-900 leading-[1.1] tracking-tighter max-w-[90%] hyphens-auto">
                      {slide.title}
                    </h1>
                    <div className="h-4 w-48 bg-indigo-600 rounded-full shadow-lg"></div>
                    <div className="space-y-6 max-w-[1400px] mx-auto">
                      {slide.content.map((point, idx) => (
                        <p key={idx} className="text-5xl text-slate-500 font-medium hyphens-auto italic leading-relaxed">{point}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`flex h-full gap-24 items-center ${slide.layout === 'content_right' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-3/5 flex flex-col justify-center pl-8">
                      <h2 className="text-7xl font-black text-slate-900 mb-16 leading-tight hyphens-auto">{slide.title}</h2>
                      <ul className="space-y-10">
                        {slide.content.map((point, idx) => (
                          <li key={idx} className="flex items-start">
                            <div className="w-16 h-16 flex items-center justify-center text-3xl font-bold text-indigo-600 bg-indigo-50 rounded-2xl mt-2 mr-8 shrink-0 border-2 border-indigo-100 shadow-sm">{idx + 1}</div>
                            <span className="text-5xl text-slate-600 font-medium leading-normal hyphens-auto">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="w-2/5 h-[85%] relative">
                      {slide.imageUrl && (
                        <div className="w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-slate-200">
                          <img src={slide.imageUrl} className="w-full h-full object-cover" alt={slide.title} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Research Sources link footer inside slide area */}
              {!isExtracted && slide.sources && slide.sources.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex flex-wrap gap-4">
                    {slide.sources.slice(0, 3).map((src, idx) => (
                      <div 
                        key={idx} 
                        className="inline-flex items-center gap-3 px-6 py-2 bg-white text-slate-400 rounded-full border border-slate-200 text-xl font-bold"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span className="truncate max-w-[400px] uppercase tracking-wider">{src.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Slide Footer (Height: ~100px) */}
        <div className="h-[100px] bg-white border-t-2 border-slate-50 flex items-center justify-between px-16 shrink-0">
          <span className="text-2xl text-slate-300 font-black tracking-[0.4em] uppercase italic">
            Lumina Studio Sync
          </span>
          <span className="text-2xl font-bold text-slate-400">
            {slide.id < 10 ? `0${slide.id}` : slide.id}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full aspect-video shadow-2xl overflow-hidden relative select-none bg-slate-100"
    >
      <div 
        style={{ 
          width: 1920, 
          height: 1080, 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left' 
        }}
        className="origin-top-left"
      >
        {renderContent()}
      </div>
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
