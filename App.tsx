
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Trash2, 
  History, 
  Copy, 
  Check, 
  Loader2, 
  ChevronRight, 
  FileText,
  AlertCircle,
  Zap,
  Layout,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react';
import { generateExecutionPlan, refinePlan, quickBrainstorm } from './geminiService';
import { ExecutionPlan, HistoryItem, Task } from './types';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<ExecutionPlan | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'plan' | 'brainstorm'>('plan');
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persistence
  useEffect(() => {
    const savedHistory = localStorage.getItem('clear_path_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedTasks = localStorage.getItem('clear_path_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, []);

  // Save persistence
  useEffect(() => {
    localStorage.setItem('clear_path_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('clear_path_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setBrainstormResult(null);

    try {
      if (mode === 'plan') {
        const plan = await generateExecutionPlan(input);
        setCurrentPlan(plan);
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          input: input,
          plan: plan
        };
        setHistory(prev => [newItem, ...prev].slice(0, 20));
      } else {
        const result = await quickBrainstorm(input);
        setBrainstormResult(result);
      }
      
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || !currentPlan || isRefining) return;
    setIsRefining(true);
    try {
      const plan = await refinePlan(currentPlan.rawMarkdown, refineInput);
      setCurrentPlan(plan);
      setRefineInput('');
    } catch (err: any) {
      setError('Refinement failed: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const addTask = (text: string) => {
    const cleanText = text.replace(/^\d+\.\s*/, '').trim();
    if (tasks.some(t => t.text === cleanText)) return; // Avoid duplicates
    const newTask: Task = {
      id: Date.now().toString(),
      text: cleanText,
      completed: false,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const handleCopy = () => {
    if (!currentPlan) return;
    navigator.clipboard.writeText(currentPlan.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInput(item.input);
    setCurrentPlan(item.plan);
    setMode('plan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center pb-20">
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <ArrowRight className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">CLEAR PATH</h1>
          </div>
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('plan')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'plan' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Layout className="w-4 h-4" /> Roadmap
            </button>
            <button 
              onClick={() => setMode('brainstorm')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'brainstorm' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4" /> Brainstorm
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-8 px-4 py-8">
        {/* Main Content Area */}
        <main className="flex-grow">
          {/* Input Area */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-md">
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>{mode === 'plan' ? 'Execution Objective' : 'Quick Brainstorm Prompt'}</span>
                {mode === 'brainstorm' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">FAST (FLASH)</span>}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'plan' ? "Input messy idea, goal, or brain dump..." : "Flash brainstorm: e.g. 5 titles for a mystery novel about a code-breaking squirrel..."}
                className="w-full h-40 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none text-slate-800 text-lg leading-relaxed transition-all"
              />
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <p className="text-sm text-slate-400">
                {mode === 'plan' ? 'Pro reasoning for precise planning.' : 'Flash reasoning for instant ideas.'}
              </p>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 ${mode === 'plan' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <> {mode === 'plan' ? 'Build Plan' : 'Brainstorm'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </section>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Plan Results */}
          {mode === 'plan' && currentPlan && (
            <div ref={scrollRef} className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layout className="w-5 h-5 text-slate-400" /> Roadmap
                </h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">Core Objective</label>
                  <p className="text-lg font-medium leading-relaxed italic">&ldquo;{currentPlan.objective}&rdquo;</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentPlan.steps.map((step, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:border-slate-300 transition-all group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-900 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-grow pt-1">
                        <p className="text-slate-700 leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</p>
                      </div>
                      <button 
                        onClick={() => addTask(step)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg transition-all"
                        title="Add to checklist"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                        <h3 className="font-bold text-emerald-900 uppercase text-xs tracking-widest">First Action</h3>
                      </div>
                      <button onClick={() => addTask(currentPlan.firstAction)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-emerald-800 font-medium text-lg leading-relaxed">{currentPlan.firstAction}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-slate-400" />
                      <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Avoid These</h3>
                    </div>
                    <ul className="space-y-3">
                      {currentPlan.commonMistakes.map((mistake, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Refinement Interface */}
                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Refine this roadmap</h3>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={refineInput}
                      onChange={(e) => setRefineInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      placeholder="e.g. 'Make it more technical' or 'Break step 3 down further'..."
                      className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-sm"
                    />
                    <button 
                      onClick={handleRefine}
                      disabled={isRefining || !refineInput.trim()}
                      className="px-6 bg-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Brainstorm Results */}
          {mode === 'brainstorm' && brainstormResult && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Quick Insights
                </h3>
                <button 
                  onClick={() => { navigator.clipboard.writeText(brainstormResult); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-900"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-li:my-1 text-slate-700">
                {brainstormResult.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Sidebar: Tasks & History */}
        <aside className="lg:w-80 shrink-0 space-y-8">
          {/* Active Tasks Checklist */}
          <section className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl sticky top-24">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Action Items
              </h3>
              {tasks.length > 0 && (
                <button onClick={clearCompleted} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider">
                  Clear Done
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              {tasks.length === 0 ? (
                <div className="p-6 text-center text-slate-500 italic text-sm">
                  Roadmap items you add will appear here.
                </div>
              ) : (
                <div className="space-y-1">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800 group transition-colors">
                      <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0">
                        {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-700 group-hover:text-slate-500" />}
                      </button>
                      <span className={`text-sm leading-snug flex-grow ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {task.text}
                      </span>
                      <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-950/50 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                {tasks.filter(t => t.completed).length}/{tasks.length} Completed
              </div>
            </div>
          </section>

          {/* Mini History */}
          {history.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-slate-400" /> History
              </h3>
              <div className="space-y-3">
                {history.slice(0, 5).map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                  >
                    <p className="text-xs font-bold text-slate-800 truncate mb-0.5">{item.plan.objective}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <footer className="w-full py-8 px-4 border-t border-slate-200 mt-auto bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <ArrowRight className="text-white w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">CLEAR PATH</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            AI-Powered Execution. Gemini 3 Pro + Gemini 3 Flash.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
