import React from 'react';
import { Slide } from '../types';

interface SlidePreviewProps {
  slide: Slide;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ slide }) => {
  return (
    <div className="w-full h-full bg-white shadow-2xl overflow-hidden relative flex flex-col select-none">
      {/* Slide Header / Status Bar Aesthetic */}
      <div className="h-[10%] min-h-[40px] max-h-[60px] bg-gradient-to-b from-white to-slate-50 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
        <h3 className="text-base md:text-lg font-bold text-slate-800 truncate max-w-[80%]">{slide.title}</h3>
        <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
        </div>
      </div>

      {/* Slide Body */}
      <div className="flex-1 p-6 md:p-10 relative overflow-hidden bg-white">
        {/* Layout: Title (Center) */}
        {slide.layout === 'title' && (
          <div className="h-full flex flex-col items-center justify-center text-center z-10 relative">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 md:mb-8 leading-tight tracking-tight drop-shadow-sm max-w-[90%]">
                {slide.title}
            </h1>
            <div className="space-y-3 max-w-3xl mx-auto overflow-y-auto max-h-[50%]">
                {slide.content.map((point, idx) => (
                    <p key={idx} className="text-lg md:text-2xl text-slate-600 font-light leading-relaxed">{point}</p>
                ))}
            </div>
            {/* Background Decoration */}
            {slide.imageUrl && (
              <div className="absolute inset-0 z-[-1] opacity-[0.07]">
                 <img src={slide.imageUrl} className="w-full h-full object-cover filter grayscale contrast-125" alt="Background" />
              </div>
            )}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
          </div>
        )}

        {/* Layout: Content Left (Image Right) */}
        {slide.layout === 'content_left' && (
          <div className="flex h-full gap-6 md:gap-10 items-center">
            <div className="w-1/2 h-full flex flex-col justify-center overflow-y-auto pr-2">
              <ul className="space-y-4 md:space-y-6 py-2">
                {slide.content.map((point, idx) => (
                  <li key={idx} className="flex items-start text-base md:text-lg lg:text-xl text-slate-700 leading-relaxed">
                    <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full mt-1 mr-3 md:mr-4 shrink-0 border border-indigo-100">
                        {idx + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-1/2 h-full flex items-center justify-center p-2 relative">
               {slide.imageUrl ? (
                   <img src={slide.imageUrl} alt="Visual" className="rounded-xl shadow-lg border border-slate-100 max-h-full max-w-full object-contain bg-slate-50" />
               ) : (
                   <div className="w-full aspect-square max-h-[80%] bg-slate-100/50 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Loading Visual...</div>
               )}
            </div>
          </div>
        )}

        {/* Layout: Content Right (Image Left) */}
        {slide.layout === 'content_right' && (
          <div className="flex h-full gap-6 md:gap-10 flex-row-reverse items-center">
             <div className="w-1/2 h-full flex flex-col justify-center overflow-y-auto pl-2">
              <ul className="space-y-4 md:space-y-6 py-2">
                {slide.content.map((point, idx) => (
                  <li key={idx} className="flex items-start text-base md:text-lg lg:text-xl text-slate-700 leading-relaxed">
                    <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full mt-1 mr-3 md:mr-4 shrink-0 border border-indigo-100">
                        {idx + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-1/2 h-full flex items-center justify-center p-2 relative">
               {slide.imageUrl ? (
                   <img src={slide.imageUrl} alt="Visual" className="rounded-xl shadow-lg border border-slate-100 max-h-full max-w-full object-contain bg-slate-50" />
               ) : (
                   <div className="w-full aspect-square max-h-[80%] bg-slate-100/50 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Loading Visual...</div>
               )}
            </div>
          </div>
        )}

         {/* Layout: Diagram Center */}
         {slide.layout === 'diagram_center' && (
          <div className="flex flex-col h-full gap-4 md:gap-6">
             <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 md:p-6 relative overflow-hidden">
               {slide.imageUrl ? (
                   <img src={slide.imageUrl} alt="Diagram" className="max-h-full max-w-full object-contain shadow-sm rounded" />
               ) : (
                   <div className="text-slate-400 flex flex-col items-center">
                       <span className="animate-spin text-2xl mb-3">⟳</span>
                       <span className="font-medium">Generating Diagram...</span>
                   </div>
               )}
            </div>
             <div className="shrink-0 bg-slate-50 p-3 md:p-5 rounded-lg border border-slate-100">
               <ul className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-2">
                {slide.content.map((point, idx) => (
                  <li key={idx} className="flex items-center text-xs md:text-sm lg:text-base text-slate-600 font-medium">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 md:mr-3 shrink-0"></div>
                    <span className="truncate">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Branding */}
      <div className="absolute bottom-3 right-6 flex items-center gap-2 opacity-40 z-10">
        <div className="w-3 h-3 md:w-4 md:h-4 bg-slate-800 rounded-sm"></div>
        <span className="text-[10px] text-slate-800 font-bold tracking-widest uppercase">Lumina</span>
      </div>
    </div>
  );
};

export default SlidePreview;