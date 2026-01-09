import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, X, Presentation, Video, PlusCircle, MonitorPlay, FileCheck, ArrowRight } from 'lucide-react';
import { GenerationMode } from '../types';

interface InputSectionProps {
  onStart: (text: string, file?: { data: string; mimeType: string }, mode?: GenerationMode) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE_MB = 15;

const InputSection: React.FC<InputSectionProps> = ({ onStart, disabled }) => {
  const [activeTab, setActiveTab] = useState<GenerationMode>('create');
  
  // Create Tab State
  const [createTopic, setCreateTopic] = useState('');
  const [createFile, setCreateFile] = useState<File | null>(null);
  
  // Convert Tab State
  const [convertFile, setConvertFile] = useState<File | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const convertFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tab: GenerationMode) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }
      
      if (tab === 'convert') {
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext !== 'pptx' && ext !== 'pdf') {
          setError("Direct conversion only supports .pptx and .pdf files.");
          return;
        }
        setConvertFile(file);
      } else {
        setCreateFile(file);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTopic.trim() && !createFile) {
      setError("Please provide a description or source document.");
      return;
    }
    
    let filePayload = undefined;
    if (createFile) {
      const base64 = await fileToBase64(createFile);
      filePayload = { data: base64, mimeType: createFile.type };
    }
    onStart(createTopic, filePayload, 'create');
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertFile) {
      setError("Please upload a file to convert.");
      return;
    }
    
    const base64 = await fileToBase64(convertFile);
    onStart("DIRECT EXTRACTION", { data: base64, mimeType: convertFile.type }, 'convert');
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4 drop-shadow-lg">
          Lumina<span className="text-indigo-500">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto font-light leading-relaxed">
          The professional video deck engine. Convert documents to narrated presentations in seconds.
        </p>
      </div>

      {/* Toggle Controls */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900 p-1.5 rounded-full inline-flex border border-slate-800 shadow-xl relative">
            <div 
                className="absolute top-1.5 bottom-1.5 rounded-full bg-indigo-600 transition-all duration-300 ease-out shadow-lg shadow-indigo-900/50"
                style={{ 
                    left: activeTab === 'create' ? '0.375rem' : '50%', 
                    width: 'calc(50% - 0.375rem)'
                }}
            />
            <button 
                onClick={() => { setActiveTab('create'); setError(null); }}
                className={`relative px-8 py-3 rounded-full text-sm font-bold transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'create' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <PlusCircle className="w-4 h-4" />
                Create New
            </button>
            <button 
                onClick={() => { setActiveTab('convert'); setError(null); }}
                className={`relative px-8 py-3 rounded-full text-sm font-bold transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'convert' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
                <Presentation className="w-4 h-4" />
                Convert File
            </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <label className="text-sm font-bold text-indigo-400 flex items-center uppercase tracking-wider pl-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Topic & Direction
              </label>
              <div className="relative group">
                <textarea
                    value={createTopic}
                    onChange={(e) => setCreateTopic(e.target.value)}
                    className="w-full p-6 rounded-2xl border border-slate-700 bg-slate-950/50 focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none resize-none h-40 text-slate-200 text-lg placeholder:text-slate-600 shadow-inner leading-relaxed"
                    placeholder="Describe your presentation topic... (e.g., 'The impact of AI on digital marketing in 2025')"
                    disabled={disabled}
                />
                <div className="absolute bottom-4 right-4 text-xs text-slate-600 font-medium bg-slate-900/80 px-2 py-1 rounded">
                    Generate with Gemini 2.5
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-indigo-400 flex items-center uppercase tracking-wider pl-1">
                <FileText className="w-4 h-4 mr-2" />
                Source Material (Optional)
              </label>
              <div 
                onClick={() => !disabled && createFileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 group
                    ${createFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50'}`}
              >
                <input type="file" ref={createFileInputRef} onChange={(e) => handleFileChange(e, 'create')} className="hidden" accept=".pdf,.txt,.md" />
                <div className="flex items-center justify-center min-h-[64px]">
                  {createFile ? (
                    <div className="flex items-center gap-3 bg-indigo-500/20 px-5 py-3 rounded-full border border-indigo-500/30">
                        <FileCheck className="w-5 h-5 text-indigo-400" />
                        <span className="text-indigo-200 font-semibold truncate max-w-xs">{createFile.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setCreateFile(null); }} className="hover:bg-indigo-500/20 rounded-full p-1 transition-colors">
                            <X className="w-4 h-4 text-indigo-300" />
                        </button>
                    </div>
                  ) : (
                    <span className="text-slate-500 font-medium group-hover:text-slate-300 transition-colors flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Click to attach PDF or TXT context
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
                <button
                type="submit"
                disabled={disabled || (!createTopic && !createFile)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-[0.99] border border-indigo-400/20"
                >
                <span className="tracking-wide">Generate Presentation</span>
                <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConvertSubmit} className="p-8 md:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10 shadow-xl">
                <Video className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-3xl font-bold text-white">Restoration Mode</h3>
              <p className="text-slate-400 text-lg">
                Extract slides from <strong className="text-indigo-400">PDF</strong> or <strong className="text-indigo-400">PPTX</strong>. We preserve the visuals and generate a synchronized narration script.
              </p>
            </div>

            <div 
              onClick={() => !disabled && convertFileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-[2rem] p-12 text-center transition-all min-h-[240px] flex flex-col items-center justify-center group
                  ${convertFile ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50'}`}
            >
              <input type="file" ref={convertFileInputRef} onChange={(e) => handleFileChange(e, 'convert')} className="hidden" accept=".pptx,.pdf" />
              {convertFile ? (
                <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                  <div className="px-8 py-5 bg-slate-900 shadow-2xl rounded-2xl border border-indigo-500/30 flex items-center gap-4">
                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                        <Presentation className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-slate-200 font-bold text-lg">{convertFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setConvertFile(null); }} className="p-2 hover:bg-red-500/10 rounded-full text-slate-500 hover:text-red-400 transition-colors ml-2">
                        <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-emerald-500/20">
                      <FileCheck className="w-4 h-4" /> Valid Format Detected
                  </div>
                </div>
              ) : (
                <div className="space-y-4 group-hover:scale-105 transition-transform duration-300">
                  <Upload className="w-16 h-16 text-slate-700 group-hover:text-indigo-500 transition-colors mx-auto" />
                  <div>
                    <p className="text-slate-300 font-bold text-xl">Upload Deck</p>
                    <p className="text-slate-500 font-medium mt-1">PDF or PPTX (Max 15MB)</p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={disabled || !convertFile}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-3 active:scale-[0.99] border border-white/10"
            >
              <MonitorPlay className="w-6 h-6" />
              Start Video Conversion
            </button>
          </form>
        )}
        
        {error && (
          <div className="mx-8 mb-8 flex items-center gap-3 text-red-200 bg-red-900/30 p-5 rounded-2xl border border-red-500/30 animate-in slide-in-from-top-2">
            <AlertCircle className="w-6 h-6 shrink-0 text-red-400" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;