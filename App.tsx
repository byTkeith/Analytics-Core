
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { parseUltiSalesFile, IngestionLog } from './services/parser';
import { analyzeDataWithGemini } from './services/gemini';
import { DataFile, ChatMessage, MessageRole } from './types';
import Visualizer from './components/Visualizer';

const CREDENTIALS = {
  username: 'paintByO25',
  password: 'Gr_!135$'
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('og_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [files, setFiles] = useState<DataFile[]>([]);
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [input, setInput] = useState('');
  const [previewFile, setPreviewFile] = useState<DataFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername === CREDENTIALS.username && loginPassword === CREDENTIALS.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem('og_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid Decision Engine Credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('og_auth');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    setIsParsing(true);
    const newFiles: DataFile[] = [];
    const newLogs: IngestionLog[] = [];
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const { dataFile, log } = await parseUltiSalesFile(uploadedFiles[i]);
        newFiles.push(dataFile);
        newLogs.push(log);
      }
      setFiles(prev => [...prev, ...newFiles]);
      setLogs(prev => [...newLogs, ...prev]);
    } catch (err) {
      console.error("Error parsing files", err);
      alert("Failed to parse some files. Ensure they are UltiSales Excel exports.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim() || files.length === 0) return;

    const userMsg: ChatMessage = { role: MessageRole.USER, content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsAnalyzing(true);

    try {
      const result = await analyzeDataWithGemini(currentInput, files);
      setMessages(prev => [...prev, { 
        role: MessageRole.ASSISTANT, 
        content: result.summary, 
        result 
      }]);
    } catch (err) {
      console.error("Analysis error", err);
      setMessages(prev => [...prev, { 
        role: MessageRole.ASSISTANT, 
        content: "Sorry, I encountered an error. Please ensure your query relates to the columns found in your legacy file." 
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-emerald-500 tracking-tight">O'GRADYS<span className="text-white">CORE</span></h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Decision Engine Authentication Required</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 ml-1">Personnel ID</label>
                <input 
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  placeholder="Username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 ml-1">Security Cipher</label>
                <input 
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold"
                  placeholder="Password"
                  autoComplete="current-password"
                />
              </div>
              
              {loginError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/40 uppercase tracking-widest text-sm"
              >
                Access Terminal
              </button>
            </form>
          </div>
          <p className="text-center text-slate-500 text-[10px] font-medium tracking-widest uppercase">
            Protected Corporate Asset &bull; Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar - File Management */}
      <div className="no-print w-full md:w-80 bg-white border-r border-slate-200 flex flex-col p-6 space-y-6 overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-emerald-600 tracking-tight">O'GRADYS<span className="text-slate-800">CORE</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Legacy POS Ingestion Engine</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-slate-600 transition-colors" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 overflow-hidden flex flex-col">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 shrink-0 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-y-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>Import Excel</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".xlsx,.xls,.csv" className="hidden" />
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Datasets ({files.length})</h3>
              <div className="space-y-2">
                {files.map(f => (
                  <div key={f.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-emerald-300 transition-all cursor-pointer" onClick={() => setPreviewFile(f)}>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold truncate text-slate-700 w-4/5">{f.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(file => file.id !== f.id)); }} className="text-slate-300 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                       <span className="text-[10px] text-emerald-600 font-bold">{f.rowCount.toLocaleString()} rows</span>
                       <span className="text-[10px] text-slate-400">•</span>
                       <span className="text-[10px] text-slate-500 underline decoration-dotted">Open Data Preview</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {logs.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Telemetry</h3>
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={i} className="text-[10px] font-mono text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-emerald-700 font-bold mb-1 truncate">{log.file}</p>
                      <p className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                        Skipped {log.noiseLinesSkipped} noise rows
                      </p>
                      <p className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                        Mapped {log.headersFound.length} columns
                      </p>
                      {log.metadataFound.map((m, j) => (
                        <p key={j} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                          {m}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Analysis View */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="no-print bg-white border-b border-slate-200 p-4 md:px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-black text-slate-800 uppercase tracking-tight text-sm">Decision Engine</h2>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Neural Link Active</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Processor Load</p>
              <p className="text-xs font-black text-slate-700">OPTIMAL</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
              <div className="relative">
                <div className="w-32 h-32 bg-white border border-slate-200 rounded-[2.5rem] flex items-center justify-center text-emerald-600 shadow-2xl shadow-emerald-100 rotate-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-5xl font-black text-slate-800 tracking-tighter leading-tight">Corporate Data, <br/><span className="text-emerald-600">Reimagined.</span></h3>
                <p className="text-slate-500 leading-relaxed font-medium text-lg">
                  O'GradysCore strips noise from legacy UltiSales exports and delivers actionable intelligence in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4">
                <button 
                  className="p-6 bg-white border border-slate-200 rounded-3xl text-left hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden" 
                  onClick={() => setInput("Show me the sales trend for blue paint for the last month.")}
                >
                  <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">"Sales trend for blue paint last month?"</p>
                </button>
                <button 
                  className="p-6 bg-white border border-slate-200 rounded-3xl text-left hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-50 transition-all group relative overflow-hidden" 
                  onClick={() => setInput("Identify the top 5 selling reps by value.")}
                >
                   <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">"Who are our top selling reps?"</p>
                </button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[100%] md:max-w-[90%] ${m.role === MessageRole.USER ? 'bg-slate-800 text-white p-5 rounded-3xl rounded-tr-none shadow-xl' : 'w-full'}`}>
                  {m.role === MessageRole.USER ? (
                    <p className="font-bold text-lg tracking-tight">{m.content}</p>
                  ) : (
                    <Visualizer result={m.result!} />
                  )}
                </div>
              </div>
            ))
          )}
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-xl w-full md:w-3/4 space-y-8 animate-pulse">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Inference Engine</span>
                    <span className="text-2xl font-black text-slate-700 tracking-tight">Synthesizing Datasets...</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-slate-50 rounded-full w-full"></div>
                  <div className="h-4 bg-slate-50 rounded-full w-5/6"></div>
                  <div className="h-4 bg-slate-50 rounded-full w-4/6"></div>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="no-print p-6 md:p-10 bg-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto relative group">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder={files.length === 0 ? "⚠️ Import legacy files to begin..." : "What would you like to know about the current data?"}
              disabled={files.length === 0 || isAnalyzing}
              className="w-full pl-8 pr-24 py-6 bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-3xl transition-all font-bold text-slate-800 disabled:opacity-50 shadow-inner text-xl placeholder:text-slate-400"
            />
            <button 
              onClick={handleAnalyze}
              disabled={!input.trim() || isAnalyzing || files.length === 0}
              className="absolute right-4 top-4 bottom-4 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] font-black transition-all disabled:opacity-50 flex items-center shadow-lg shadow-emerald-200 uppercase text-xs tracking-widest"
            >
              Ask
            </button>
          </div>
        </footer>
      </div>

      {/* Data Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-12">
          <div className="bg-white w-full h-full max-w-7xl rounded-[3rem] flex flex-col overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <div>
                <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">{previewFile.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cleaned UltiSales Map</span>
                   <span className="text-slate-300">•</span>
                   <span className="text-[10px] font-bold text-slate-500">{previewFile.rowCount.toLocaleString()} Rows Decoded</span>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-slate-100 hover:rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-0">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="sticky top-0 z-10">
                    {previewFile.headers.map((h, idx) => (
                      <th key={idx} className="p-4 bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest border-b border-r border-slate-100 backdrop-blur-md">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewFile.rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-emerald-50/50 transition-colors border-b border-slate-50">
                      {previewFile.headers.map((h, j) => (
                        <td key={j} className="p-4 text-sm text-slate-600 border-r border-slate-50 whitespace-nowrap font-medium">
                          {row[h]?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewFile.rowCount > 100 && (
                <div className="p-10 text-center bg-slate-50/50">
                  <p className="text-slate-400 font-bold italic">Preview limited to first 100 rows. Ingestion engine has processed all {previewFile.rowCount.toLocaleString()} rows for analysis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
