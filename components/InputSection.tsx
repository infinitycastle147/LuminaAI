import React, { useState, useRef } from 'react';
import { Upload, FileText, Type, Sparkles, Command } from 'lucide-react';

interface InputSectionProps {
  onStart: (text: string, file?: { data: string; mimeType: string }) => void;
  disabled: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onStart, disabled }) => {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setFile({
          name: selectedFile.name,
          data: base64String,
          mimeType: selectedFile.type
        });
      };
      
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !file) return;
    onStart(inputText, file ? { data: file.data, mimeType: file.mimeType } : undefined);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Hero Text */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          Transform ideas into <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">visual stories.</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto">
          Generate professional presentations with AI-curated content, diagrams, and voiceovers in seconds.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden backdrop-blur-sm relative">
        {/* Decorative Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          
          {/* Text Input Area */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
              What would you like to present?
            </label>
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none h-36 text-slate-700 placeholder:text-slate-400 text-lg leading-relaxed shadow-inner"
                placeholder="Describe your presentation topic in detail..."
                disabled={disabled}
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded-md border border-slate-100">
                AI Powered
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optionally</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-indigo-500" />
              Upload Source Material
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt,.md"
                disabled={disabled}
              />
              <div className="flex flex-col items-center justify-center transition-transform group-hover:scale-105 duration-300">
                {file ? (
                  <>
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-indigo-900">{file.name}</span>
                    <span className="text-xs text-indigo-500 mt-1">Ready to analyze</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-slate-600 font-medium">Click to upload a document</p>
                    <p className="text-xs text-slate-400 mt-1">Support for PDF, TXT, MD</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={disabled || (!inputText && !file)}
            className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transform active:scale-[0.99]"
          >
            {disabled ? (
                <>Processing...</>
            ) : (
                <>
                    Generate Presentation <Sparkles className="w-5 h-5 animate-pulse" />
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputSection;