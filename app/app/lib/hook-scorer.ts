// lib/hook-scorer.ts
import Anthropic from '@anthropic-ai/sdk';

export interface HookScore {
  hookId: string;
  hookText: string;
  scores: {
    scrollStop: number;
    curiosityGap: number;
    relatability: number;
    specificity: number;
  };
  bonuses: string[];
  penalties: string[];
  totalScore: number;
  grade: string;
  reasoning: string;
  improvementTip: string;
}

export interface ScoringResult {
  hooks: HookScore[];
  averageScore: number;
  bestHook: HookScore | null;
  timestamp: string;
}

const SCORING_PROMPT = `Du er en LinkedIn engagement-ekspert. Score følgende hooks på engagement-potential.

For HVER hook, evaluer på disse 4 kriterier (0-2.5 points hver):

1. SCROLL-STOP POWER: Stopper den scrollet?
2. CURIOSITY GAP: Skaber den nysgerrighed?
3. RELATABILITY: Kan målgruppen genkende sig?
4. SPECIFICITY: Er den konkret og specifik?

BONUS (+0.5 max +1.0): pattern_interrupt, emotional_trigger, contrarian_angle
PENALTY (-0.5 max -1.5): clickbait_feel, overused_pattern, vague_promise, emoji_overload

GRADE SCALE:
A+ (9.5-10), A (8.5-9.4), B+ (7.5-8.4), B (6.5-7.4), C+ (5.5-6.4), C (4.5-5.4), D (3.0-4.4), F (<3.0)

MÅLGRUPPE: {targetAudience}

HOOKS TIL SCORING:
{hooks}

RETURNER KUN VALID JSON:
{
  "scores": [
    {
      "hookId": "hook_1",
      "scores": {
        "scrollStop": 2.0,
        "curiosityGap": 2.5,
        "relatability": 1.5,
        "specificity": 2.0
      },
      "bonuses": ["pattern_interrupt"],
      "penalties": [],
      "totalScore": 8.5,
      "grade": "A",
      "reasoning": "Kort forklaring",
      "improvementTip": "Konkret forslag"
    }
  ]
}`;

export async function scoreHooks(
  hooks: { id: string; text: string }[],
  targetAudience: string,
  anthropicClient: Anthropic
): Promise<ScoringResult> {
  const hooksText = hooks
    .map((h, i) => `Hook ${i + 1} (${h.id}): "${h.text}"`)
    .join('\n');

  const prompt = SCORING_PROMPT
    .replace('{targetAudience}', targetAudience || 'LinkedIn-professionelle')
    .replace('{hooks}', hooksText);

  try {
    const message = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3, // Lower temp for consistent scoring
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Enrich with hook text
    const enrichedScores: HookScore[] = parsed.scores.map((score: any, index: number) => ({
      ...score,
      hookText: hooks[index]?.text || ''
    }));

    // Calculate average and find best
    const totalScores = enrichedScores.map(s => s.totalScore);
    const averageScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
    const bestHook = enrichedScores.reduce((best, current) => 
      current.totalScore > (best?.totalScore || 0) ? current : best
    , null as HookScore | null);

    return {
      hooks: enrichedScores,
      averageScore: Math.round(averageScore * 10) / 10,
      bestHook,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Hook scoring failed:', error);
    // Return fallback scores
    return {
      hooks: hooks.map((h, i) => ({
        hookId: h.id,
        hookText: h.text,
        scores: { scrollStop: 0, curiosityGap: 0, relatability: 0, specificity: 0 },
        bonuses: [],
        penalties: [],
        totalScore: 0,
        grade: 'N/A',
        reasoning: 'Scoring fejlede - prøv igen',
        improvementTip: ''
      })),
      averageScore: 0,
      bestHook: null,
      timestamp: new Date().toISOString()
    };
  }
}

export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'text-emerald-500',
    'A': 'text-emerald-400',
    'B+': 'text-teal-400',
    'B': 'text-cyan-400',
    'C+': 'text-amber-400',
    'C': 'text-amber-500',
    'D': 'text-orange-500',
    'F': 'text-red-500',
    'N/A': 'text-gray-400'
  };
  return colors[grade] || 'text-gray-400';
}

export function getGradeBgColor(grade: string): string {
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-500/10 border-emerald-500/30',
    'A': 'bg-emerald-400/10 border-emerald-400/30',
    'B+': 'bg-teal-400/10 border-teal-400/30',
    'B': 'bg-cyan-400/10 border-cyan-400/30',
    'C+': 'bg-amber-400/10 border-amber-400/30',
    'C': 'bg-amber-500/10 border-amber-500/30',
    'D': 'bg-orange-500/10 border-orange-500/30',
    'F': 'bg-red-500/10 border-red-500/30',
    'N/A': 'bg-gray-400/10 border-gray-400/30'
  };
  return colors[grade] || 'bg-gray-400/10 border-gray-400/30';
}

export function getScoreEmoji(score: number): string {
  if (score >= 9.5) return '🔥';
  if (score >= 8.5) return '⭐';
  if (score >= 7.5) return '✨';
  if (score >= 6.5) return '👍';
  if (score >= 5.5) return '📝';
  if (score >= 4.5) return '🔄';
  if (score >= 3.0) return '⚠️';
  return '❌';
}

export function formatScoreBreakdown(scores: HookScore['scores']): string {
  return `Scroll-stop: ${scores.scrollStop}/2.5 | Curiosity: ${scores.curiosityGap}/2.5 | Relatability: ${scores.relatability}/2.5 | Specificity: ${scores.specificity}/2.5`;
}
