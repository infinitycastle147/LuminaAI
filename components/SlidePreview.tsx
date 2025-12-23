
import React from 'react';
import { Slide } from '../types';

interface SlidePreviewProps {
  slide: Slide;
}

const SlidePreview: React.FC<SlidePreviewProps> = React.memo(({ slide }) => {
  const isExtracted = slide.source === 'extracted';

  return (
    <div className={`w-full h-full shadow-2xl overflow-hidden relative flex flex-col select-none ${isExtracted ? 'bg-slate-50' : 'bg-white'}`}>
      <div className="h-[10%] min-h-[40px] max-h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
        <h3 className="text-base md:text-lg font-bold text-slate-800 truncate max-w-[80%]">
          {isExtracted ? 'Original Document Content' : slide.title}
        </h3>
        <div className="flex gap-1.5 items-center">
            {isExtracted && <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified Extraction</span>}
            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-12 relative overflow-hidden">
        {slide.layout === 'title' || isExtracted ? (
          <div className="h-full flex flex-col items-center justify-center text-center z-10 relative space-y-8">
            <h1 className={`${isExtracted ? 'text-4xl md:text-5xl' : 'text-3xl md:text-6xl'} font-extrabold text-slate-900 leading-tight tracking-tight max-w-[90%]`}>
                {slide.title}
            </h1>
            <div className="space-y-4 max-w-4xl mx-auto">
                {slide.content.map((point, idx) => (
                    <p key={idx} className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed">
                      {isExtracted ? point : `• ${point}`}
                    </p>
                ))}
            </div>
            {slide.imageUrl && (
              <div className="absolute inset-0 z-[-1] opacity-[0.05]">
                 <img src={slide.imageUrl} className="w-full h-full object-cover grayscale" alt="" />
              </div>
            )}
          </div>
        ) : (
          <div className={`flex h-full gap-10 items-center ${slide.layout === 'content_right' ? 'flex-row-reverse' : ''}`}>
            <div className="w-1/2 h-full flex flex-col justify-center overflow-y-auto">
              <ul className="space-y-6">
                {slide.content.map((point, idx) => (
                  <li key={idx} className="flex items-start text-lg md:text-xl text-slate-700 font-medium">
                    <span className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-full mt-1 mr-4 shrink-0 border border-indigo-100">
                        {idx + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-1/2 h-full flex items-center justify-center relative">
               {slide.imageUrl ? (
                   <img src={slide.imageUrl} className="rounded-2xl shadow-xl border border-slate-100 max-h-full object-contain bg-slate-50" alt="" />
               ) : (
                   <div className="w-full h-full bg-slate-100/30 rounded-2xl animate-pulse flex items-center justify-center text-slate-400">Loading Visual...</div>
               )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-8 flex items-center gap-2 opacity-30 z-10">
        <div className="w-4 h-4 bg-slate-800 rounded-sm"></div>
        <span className="text-[10px] text-slate-800 font-bold tracking-[0.2em] uppercase">Lumina Engine</span>
      </div>
    </div>
  );
});

export default SlidePreview;
