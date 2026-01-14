'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, Send, ArrowRight } from 'lucide-react';

interface Comment {
  text: string;
  angle: string;
  strategy_reasoning: string;
  wordCount: number;
  toneMatch: string;
}

interface Result {
  post_analysis?: {
    core_message: string;
    detected_tone: string;
    poster_intent: string;
    engagement_opportunities: string[];
  };
  comments?: Comment[];
}

export default function CommentsPage() {
  const [postText, setPostText] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [relationshipContext, setRelationshipContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const generateComments = async () => {
    if (!postText.trim()) {
      alert('Skriv den LinkedIn post først!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          postText,
          language,
          tone,
          relationshipContext,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Fejl ved generering');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Noget gik galt - check console');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAngleLabel = (angle: string) => {
    const labels: Record<string, string> = {
      agree_add: 'Enig + Værdi',
      smart_question: 'Klogt Spørgsmål',
      mini_case: 'Mini-Case',
    };
    return labels[angle] || angle;
  };

  const getAngleColor = (angle: string) => {
    const colors: Record<string, string> = {
      agree_add: 'from-emerald-600 to-teal-600',
      smart_question: 'from-cyan-600 to-teal-600',
      mini_case: 'from-indigo-600 to-cyan-600',
    };
    return colors[angle] || 'from-slate-600 to-slate-700';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Updated: 2026-01-14 */}
      <header className="border-b border-slate-200 sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-slate-950 to-slate-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-light text-slate-950">Comment Copilot</h1>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">Luxury Edition</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 font-light">3 AI-strategier</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="mb-20">
          <div className="mb-8">
            <h2 className="text-4xl font-light text-slate-950 mb-2">Din LinkedIn Post</h2>
            <p className="text-base text-slate-500 font-light">Indsæt posten du ønsker kommentarer til</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Paste LinkedIn post her..."
              className="w-full h-40 bg-white text-slate-950 text-lg font-light resize-none focus:outline-none border-b border-slate-200 pb-6"
            />

            <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-3 tracking-wide">Sprog</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                >
                  <option value="da">Dansk</option>
                  <option value="en">English</option>
                  <option value="sv">Svenska</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-3 tracking-wide">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 uppercase mb-3 tracking-wide">Relation</label>
                <select
                  value={relationshipContext}
                  onChange={(e) => setRelationshipContext(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                >
                  <option value="">Vælg...</option>
                  <option value="peer">Peer (Ligeværdig)</option>
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateComments}
              disabled={loading || !postText.trim()}
              className="w-full mt-10 px-8 py-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-white font-light rounded-xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Genererer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generer 3 Kommentarer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="space-y-12">
            {result.post_analysis && (
              <div>
                <h3 className="text-xs font-medium text-slate-700 uppercase mb-3 tracking-wide">Analyse</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
                  <div>
                    <p className="text-xs text-slate-600 uppercase mb-2 tracking-wide">Budskab</p>
                    <p className="text-base text-slate-950 font-light mb-6">{result.post_analysis.core_message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-600 uppercase mb-2 tracking-wide">Tone</p>
                      <p className="text-sm text-slate-900 font-light">{result.post_analysis.detected_tone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 uppercase mb-2 tracking-wide">Intention</p>
                      <p className="text-sm text-slate-900 font-light">{result.post_analysis.poster_intent}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.comments && (
              <div>
                <h3 className="text-xs font-medium text-slate-700 uppercase mb-6 tracking-wide">Dine 3 Strategier</h3>
                <div className="space-y-4">
                  {result.comments.map((comment, idx) => (
                    <div
                      key={idx}
                      onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                      className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                          <div className={`inline-block px-3 py-1.5 bg-gradient-to-r ${getAngleColor(comment.angle)} text-white text-xs font-medium rounded-lg mb-3`}>
                            {getAngleLabel(comment.angle)}
                          </div>
                          <p className="text-xs text-slate-500 font-light tracking-wide">
                            {comment.wordCount} ord • {comment.toneMatch}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(comment.text, idx);
                          }}
                          className="p-2.5 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {copiedId === idx ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      <p className="text-slate-950 font-light text-base mb-5">"{comment.text}"</p>

                      {expandedId === idx && (
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-xs text-slate-600 uppercase mb-2 tracking-wide">Strategi</p>
                          <p className="text-sm text-slate-700 font-light">{comment.strategy_reasoning}</p>
                        </div>
                      )}

                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full mt-4 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-950 text-sm font-light rounded-lg flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-400" />
                        Send til Ghostwriter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-16">
                <div className="inline-block">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-950 rounded-full animate-spin mb-4" />
                  <p className="text-slate-600 text-sm font-light">Analyserer og genererer...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-20">
            <p className="text-slate-400 text-base font-light">Kommentarer vises her</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-20 py-8">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-xs text-slate-500 font-light tracking-wide">Powered by Claude • Sharkin</p>
        </div>
      </footer>
    </div>
  );
}
