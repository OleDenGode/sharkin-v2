'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, AlertCircle, Lightbulb, Copy, Check } from 'lucide-react';
import { HookScore, getGradeColor, getGradeBgColor, getScoreEmoji } from '@/lib/hook-scorer';

interface HookAnalyzerProps {
  scores: HookScore[];
  averageScore: number;
  bestHook: HookScore | null;
  isLoading?: boolean;
}

export function HookAnalyzer({ scores, averageScore, bestHook, isLoading }: HookAnalyzerProps) {
  const [expandedHook, setExpandedHook] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-300">Analyserer hooks...</span>
        </div>
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            Hook Analyse
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="w-4 h-4" />
            Gns. score: <span className="text-white font-medium">{averageScore}/10</span>
          </div>
        </div>

        {bestHook && (
          <div className={`p-4 rounded-xl border ${getGradeBgColor(bestHook.grade)}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">
                    Bedste hook
                  </span>
                  <span className={`text-2xl font-bold ${getGradeColor(bestHook.grade)}`}>
                    {bestHook.grade}
                  </span>
                  <span className="text-lg">{getScoreEmoji(bestHook.totalScore)}</span>
                </div>
                <p className="text-white font-medium leading-relaxed">
                  "{bestHook.hookText}"
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  {bestHook.totalScore}
                </div>
                <div className="text-xs text-slate-400">/10</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Hook Scores */}
      <div className="space-y-3">
        {scores.map((hook, index) => (
          <div
            key={hook.hookId}
            className={`bg-slate-900/50 backdrop-blur-xl rounded-xl border transition-all duration-300 ${
              expandedHook === hook.hookId 
                ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' 
                : 'border-slate-700/50 hover:border-slate-600/50'
            }`}
          >
            {/* Header */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedHook(expandedHook === hook.hookId ? null : hook.hookId)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${getGradeBgColor(hook.grade)}`}>
                    <span className={`text-lg font-bold ${getGradeColor(hook.grade)}`}>
                      {hook.grade}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      Hook {index + 1}: "{hook.hookText}"
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {hook.reasoning}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getGradeColor(hook.grade)}`}>
                      {hook.totalScore}
                    </div>
                  </div>
                  {expandedHook === hook.hookId ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedHook === hook.hookId && (
              <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ScoreBar label="Scroll-stop" value={hook.scores.scrollStop} max={2.5} />
                  <ScoreBar label="Curiosity" value={hook.scores.curiosityGap} max={2.5} />
                  <ScoreBar label="Relatability" value={hook.scores.relatability} max={2.5} />
                  <ScoreBar label="Specificity" value={hook.scores.specificity} max={2.5} />
                </div>

                {/* Bonuses & Penalties */}
                <div className="flex flex-wrap gap-2">
                  {hook.bonuses.map((bonus, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                      +0.5 {bonus.replace('_', ' ')}
                    </span>
                  ))}
                  {hook.penalties.map((penalty, i) => (
                    <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/30">
                      -0.5 {penalty.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                {/* Improvement Tip */}
                {hook.improvementTip && (
                  <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Forbedringstip
                      </span>
                      <p className="text-sm text-slate-300 mt-1">{hook.improvementTip}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(hook.hookText, hook.hookId);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
                  >
                    {copiedId === hook.hookId ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Kopieret!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopier hook
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  const color = percentage >= 80 ? 'bg-emerald-400' : percentage >= 60 ? 'bg-teal-400' : percentage >= 40 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default HookAnalyzer;
