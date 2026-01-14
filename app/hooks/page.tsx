'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, ChevronDown, ChevronUp, Copy, Check, 
  Send, Lightbulb, TrendingUp, Star
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Hook {
  id: string;
  text: string;
  hookType: string;
  outline: string[];
  scoring?: {
    scores: { scrollStop: number; curiosityGap: number; relatability: number; specificity: number };
    bonuses: string[];
    penalties: string[];
    totalScore: number;
    grade: string;
    reasoning: string;
    improvementTip: string;
  };
}

interface HookResult {
  analysis: { centralInsight: string; emotionalDriver: string; postArchetype: string };
  hooks: Hook[];
  scoring?: { scores: any[]; averageScore: number; bestHookId: string };
}

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'text-emerald-400', 'A': 'text-emerald-400', 'B+': 'text-teal-400', 
    'B': 'text-cyan-400', 'C+': 'text-amber-400', 'C': 'text-amber-500',
    'D': 'text-orange-500', 'F': 'text-red-500',
  };
  return colors[grade] || 'text-slate-400';
}

function getGradeBg(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-500/10 border-emerald-500/30', 'A': 'bg-emerald-400/10 border-emerald-400/30',
    'B+': 'bg-teal-400/10 border-teal-400/30', 'B': 'bg-cyan-400/10 border-cyan-400/30',
    'C+': 'bg-amber-400/10 border-amber-400/30', 'C': 'bg-amber-500/10 border-amber-500/30',
  };
  return colors[grade] || 'bg-slate-400/10 border-slate-400/30';
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-teal-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function HooksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [result, setResult] = useState<HookResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [expandedHook, setExpandedHook] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [includeScoring, setIncludeScoring] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('hooks_state');
    if (saved) {
      const p = JSON.parse(saved);
      setBulletPoints(p.bulletPoints || '');
      setLanguage(p.language || 'da');
      setTone(p.tone || 'professional');
      setTargetAudience(p.targetAudience || '');
      setPurpose(p.purpose || '');
      if (p.result) setResult(p.result);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hooks_state', JSON.stringify({ bulletPoints, language, tone, targetAudience, purpose, result }));
  }, [bulletPoints, language, tone, targetAudience, purpose, result]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else { setUserId(user.id); setUserEmail(user.email || ''); }
    });
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('hooks_state');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generateHooks = async () => {
    if (!bulletPoints.trim()) { alert('Skriv din kernidé først!'); return; }
    setLoading(true);
    setStatus('🔍 Analyserer din kernidé...');
    setResult(null);
    
    try {
      const res = await fetch('/api/generate/hooks-with-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language, tone, targetAudience, purpose, bulletPoints, includeScoring }),
      });
      setStatus(includeScoring ? '📊 Scorer hooks...' : '🪝 Genererer...');
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (data.scoring?.bestHookId) setExpandedHook(data.scoring.bestHookId);
      } else {
        alert(data.error || 'Fejl');
      }
    } catch { alert('Fejl ved generering'); }
    finally { setLoading(false); setStatus(''); }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendToGhostwriter = (hook: Hook) => {
    localStorage.setItem('ghostwriter_hook', hook.text);
    localStorage.setItem('ghostwriter_outline', hook.outline.join('\n'));
    localStorage.setItem('ghostwriter_postType', hook.hookType);
    router.push('/ghostwriter?fromHook=true');
  };

  const saveHook = async (hook: Hook) => {
    if (!userId) return;
    await supabase.from('saved_content').insert({
      user_id: userId,
      content_type: 'hook',
      content_text: hook.text,
      hook_type: hook.hookType,
      outline: hook.outline,
      total_score: hook.scoring?.totalScore,
      grade: hook.scoring?.grade,
    });
    alert('Hook gemt i dit bibliotek!');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">SharkIN</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden md:block">{userEmail}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white">Log ud</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-teal-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Hook & Intro Studio</h1>
          </div>
          <p className="text-slate-400">Få 5 AI-scorede hooks med engagement-predictions</p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Din kerneidé eller observation:</label>
          <textarea
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            placeholder="Skriv hvad du har på hjerte..."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Sprog</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500">
                <option value="da">Dansk</option>
                <option value="en">Engelsk</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500">
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Målgruppe</label>
              <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500" placeholder="Eks: Tech leads" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Formål</label>
              <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500" placeholder="Eks: Thought leadership" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeScoring} onChange={(e) => setIncludeScoring(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500" />
              <span className="text-sm text-slate-300">Inkluder engagement scoring</span>
              <span className="text-xs text-slate-500">(anbefalet)</span>
            </label>
          </div>
          <button onClick={generateHooks} disabled={loading} className="w-full mt-6 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{status}</> : <><Sparkles className="w-5 h-5" />Generer 5 scorede hooks →</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Analysis */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400" />Analyse</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-800/50 rounded-lg"><p className="text-xs text-slate-400 uppercase mb-1">Central indsigt</p><p className="text-white text-sm">{result.analysis?.centralInsight}</p></div>
                <div className="p-3 bg-slate-800/50 rounded-lg"><p className="text-xs text-slate-400 uppercase mb-1">Emotionel driver</p><p className="text-white text-sm">{result.analysis?.emotionalDriver}</p></div>
                <div className="p-3 bg-slate-800/50 rounded-lg"><p className="text-xs text-slate-400 uppercase mb-1">Post-arketype</p><p className="text-white text-sm">{result.analysis?.postArchetype}</p></div>
              </div>
            </div>

            {/* Score Summary */}
            {result.scoring && (
              <div className="bg-gradient-to-br from-teal-900/30 to-cyan-900/20 rounded-2xl border border-teal-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-teal-400" />
                    <div><h3 className="text-white font-semibold">Engagement Score</h3><p className="text-slate-400 text-sm">Gns. {result.scoring.averageScore}/10</p></div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">{result.scoring.averageScore}</div>
                </div>
              </div>
            )}

            {/* Hooks List */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-teal-400" />Dine 5 hooks</h2>
              
              {result.hooks?.map((hook) => {
                const isBest = result.scoring?.bestHookId === hook.id;
                const s = hook.scoring;
                
                return (
                  <div key={hook.id} className={`bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all ${isBest ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' : 'border-slate-700/50 hover:border-slate-600'}`}>
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedHook(expandedHook === hook.id ? null : hook.id)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {isBest && <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-xs font-medium rounded-full border border-teal-500/30">⭐ Bedste</span>}
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">{hook.hookType}</span>
                            {s && <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getGradeBg(s.grade)} ${getGradeColor(s.grade)}`}>{s.grade} • {s.totalScore}</span>}
                          </div>
                          <p className="text-white font-medium whitespace-pre-line">"{hook.text}"</p>
                          {s && <p className="text-slate-400 text-sm mt-2">{s.reasoning}</p>}
                        </div>
                        {expandedHook === hook.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    {expandedHook === hook.id && (
                      <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
                        {/* Score breakdown */}
                        {s && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <ScoreBar label="Scroll-stop" value={s.scores.scrollStop} max={2.5} />
                            <ScoreBar label="Curiosity" value={s.scores.curiosityGap} max={2.5} />
                            <ScoreBar label="Relatability" value={s.scores.relatability} max={2.5} />
                            <ScoreBar label="Specificity" value={s.scores.specificity} max={2.5} />
                          </div>
                        )}

                        {/* Bonuses/Penalties */}
                        {s && (s.bonuses.length > 0 || s.penalties.length > 0) && (
                          <div className="flex flex-wrap gap-2">
                            {s.bonuses.map((b, i) => <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/30">+0.5 {b.replace('_', ' ')}</span>)}
                            {s.penalties.map((p, i) => <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/30">-0.5 {p.replace('_', ' ')}</span>)}
                          </div>
                        )}

                        {/* Improvement tip */}
                        {s?.improvementTip && (
                          <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                            <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-amber-400 uppercase">Forbedringstip</span>
                              <p className="text-sm text-slate-300 mt-1">{s.improvementTip}</p>
                            </div>
                          </div>
                        )}

                        {/* Outline */}
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-xs text-slate-400 uppercase mb-2">Post-outline</p>
                          <ul className="space-y-1">
                            {hook.outline.map((item, i) => <li key={i} className="text-slate-300 text-sm">• {item}</li>)}
                          </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => copyToClipboard(hook.text, hook.id)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg">
                            {copiedId === hook.id ? <><Check className="w-4 h-4 text-emerald-400" />Kopieret!</> : <><Copy className="w-4 h-4" />Kopier</>}
                          </button>
                          <button onClick={() => saveHook(hook)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg">
                            <Star className="w-4 h-4" />Gem
                          </button>
                          <button onClick={() => sendToGhostwriter(hook)} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg">
                            <Send className="w-4 h-4" />Til Ghostwriter →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
