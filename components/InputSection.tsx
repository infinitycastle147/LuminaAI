
import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, X, Presentation, Video, PlusCircle, MonitorPlay, FileCheck } from 'lucide-react';
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          Lumina AI <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Video Deck Engine</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-lg mx-auto">
          Generate new presentations or convert existing ones into narrated video experiences effortlessly.
        </p>
      </div>

      <div className="flex justify-center mb-12 bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto shadow-inner border border-slate-200">
        <button 
          onClick={() => { setActiveTab('create'); setError(null); }}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <PlusCircle className="w-5 h-5" />
          Create New
        </button>
        <button 
          onClick={() => { setActiveTab('convert'); setError(null); }}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all ${activeTab === 'convert' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Presentation className="w-5 h-5" />
          Convert Existing
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 overflow-hidden backdrop-blur-sm relative transition-all duration-500">
        <div className={`h-2 w-full bg-gradient-to-r transition-all duration-500 ${activeTab === 'create' ? 'from-indigo-500 to-violet-500' : 'from-indigo-600 to-blue-500'}`}></div>
        
        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                Prompt / Topic
              </label>
              <textarea
                value={createTopic}
                onChange={(e) => setCreateTopic(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none h-32 text-slate-700 text-lg shadow-inner"
                placeholder="Ex: Explain the future of renewable energy in modern cities..."
                disabled={disabled}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                Knowledge Source (PDF, TXT, MD)
              </label>
              <div 
                onClick={() => !disabled && createFileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all ${createFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
              >
                <input type="file" ref={createFileInputRef} onChange={(e) => handleFileChange(e, 'create')} className="hidden" accept=".pdf,.txt,.md" />
                <div className="flex items-center justify-center gap-3">
                  {createFile ? (
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-100">
                        <FileCheck className="w-4 h-4 text-green-500" />
                        <span className="text-indigo-600 font-bold truncate max-w-xs">{createFile.name}</span>
                        <X className="w-4 h-4 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setCreateFile(null); }} />
                    </div>
                  ) : (
                    <span className="text-slate-500 font-medium">Click to upload supplemental data</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={disabled || (!createTopic && !createFile)}
              className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-bold text-xl py-6 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Build Presentation <Sparkles className="w-6 h-6" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleConvertSubmit} className="p-8 md:p-12 space-y-10 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-100">
                <Video className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900">Restore & Narrate</h3>
              <p className="text-slate-500 text-lg leading-relaxed">
                Upload an existing <strong>PDF</strong> or <strong>PPTX</strong>. We will extract its slides exactly as they are and prepare them for video narration.
              </p>
            </div>

            <div 
              onClick={() => !disabled && convertFileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-[2rem] p-12 text-center transition-all min-h-[220px] flex flex-col items-center justify-center ${convertFile ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
            >
              <input type="file" ref={convertFileInputRef} onChange={(e) => handleFileChange(e, 'convert')} className="hidden" accept=".pptx,.pdf" />
              {convertFile ? (
                <div className="flex flex-col items-center gap-5">
                  <div className="px-8 py-4 bg-white shadow-lg rounded-3xl border border-indigo-100 flex items-center gap-4">
                    <Presentation className="w-6 h-6 text-indigo-500" />
                    <span className="text-indigo-900 font-extrabold text-lg">{convertFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setConvertFile(null); }} className="p-1 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="text-indigo-600 bg-indigo-100/50 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> Ready for direct conversion
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-14 h-14 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-slate-700 font-extrabold text-xl">Upload Presentation</p>
                    <p className="text-slate-400 font-medium">PPTX or PDF (Max 15MB)</p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={disabled || !convertFile}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xl py-6 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Transform to Video <MonitorPlay className="w-7 h-7" />
            </button>
          </form>
        )}
        
        {error && (
          <div className="mx-8 mb-8 flex items-center gap-3 text-red-600 bg-red-50 p-5 rounded-2xl border border-red-100 animate-in slide-in-from-top-2">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;
