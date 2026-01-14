import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, language, tone, targetAudience, purpose, bulletPoints, includeScoring = true } = await req.json();

    const { data: user } = await supabase
      .from('users')
      .select('monthly_credits_used, monthly_credits_limit, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // PHASE 1: Generate hooks
    const hookPrompt = `Du er en LinkedIn content strategist og copywriter med speciale i skandinavisk business-tone.

═══════════════════════════════════════
OPGAVE
═══════════════════════════════════════

Generer 5 forskellige hooks + post-outlines baseret på brugerens kernidé.

FORMÅL:
- Hver hook skal STOPPE scrollet på LinkedIn
- Hver hook skal kunne kopieres direkte til Ghostwriter Workspace
- Hver outline skal guide den færdige post-struktur

INPUT FRA BRUGER:
Sprog: ${language}
Tone: ${tone}
Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}
Formål: ${purpose || 'engagement & synlighed'}

BRUGERENS KERNIDÉ/OBSERVATION:
${bulletPoints}

═══════════════════════════════════════
HOOK-ARKETYPER (vælg 5 forskellige)
═══════════════════════════════════════

1. KONTRAST-HOOK: "Alle siger X. Sandheden er Y."
2. TAL-HOOK: Konkrete tal, procenter, tidsperioder
3. SPØRGE-HOOK: Spørgsmål publikum ikke kan ignorere
4. INDRØMMELSES-HOOK: Start med ydmyghed eller fejl
5. BOLD PÅSTAND: Kontroversiel position
6. HEMMELIGHEDS-HOOK: Antyd insider-viden
7. TIDSLINJE-HOOK: Før/efter transformation
8. OBSERVATIONS-HOOK: Konkret iagttagelse
9. LISTE-TEASE: Tease uden at afsløre
10. MODSÆTNINGS-HOOK: Tving til valg
11. PROVOKATIONS-HOOK: Udfordr praksis
12. STORY-OPENER: Start midt i historie

REGLER:
✓ Max 20 ord per hook
✓ 1-2 linjer maksimalt
✓ Undgå clickbait-følelse
✓ Specifik > Generisk

═══════════════════════════════════════
OUTPUT FORMAT (RETURNER KUN VALID JSON)
═══════════════════════════════════════

{
  "analysis": {
    "centralInsight": "Hvad er den afgørende pointe?",
    "emotionalDriver": "Nysgerrighed / Genkendelse / Overraskelse / etc",
    "postArchetype": "Lærdom fra Fejl / Kontrær Mening / Case Study / etc"
  },
  "hooks": [
    {
      "id": "hook_1",
      "text": "Hook tekst her",
      "hookType": "Kontrast-hook",
      "outline": ["Intro: ...", "Body 1: ...", "Body 2: ...", "Afslutning: ..."]
    }
  ]
}`;

    const hookMessage = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.8,
      messages: [{ role: 'user', content: hookPrompt }]
    });

    const hookResponseText = hookMessage.content[0].type === 'text' ? hookMessage.content[0].text : '';
    
    let hookResult;
    try {
      const jsonMatch = hookResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        hookResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse hook response:', hookResponseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // PHASE 2: Score hooks (if enabled)
    let scoringResult = null;
    
    if (includeScoring && hookResult.hooks && hookResult.hooks.length > 0) {
      const scoringPrompt = `Du er en LinkedIn engagement-ekspert. Score følgende hooks på engagement-potential.

For HVER hook, evaluer på disse 4 kriterier (0-2.5 points hver):

1. SCROLL-STOP POWER: Stopper den scrollet?
2. CURIOSITY GAP: Skaber den nysgerrighed?
3. RELATABILITY: Kan målgruppen genkende sig?
4. SPECIFICITY: Er den konkret og specifik?

BONUS (+0.5 max +1.0): pattern_interrupt, emotional_trigger, contrarian_angle
PENALTY (-0.5 max -1.5): clickbait_feel, overused_pattern, vague_promise

GRADE SCALE:
A+ (9.5-10), A (8.5-9.4), B+ (7.5-8.4), B (6.5-7.4), C+ (5.5-6.4), C (4.5-5.4), D (3.0-4.4), F (<3.0)

MÅLGRUPPE: ${targetAudience || 'LinkedIn-professionelle'}

HOOKS TIL SCORING:
${hookResult.hooks.map((h: any, i: number) => `Hook ${i + 1} (${h.id}): "${h.text}"`).join('\n')}

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
      "bonuses": [],
      "penalties": [],
      "totalScore": 8.0,
      "grade": "B+",
      "reasoning": "Kort forklaring",
      "improvementTip": "Konkret forslag"
    }
  ]
}`;

      try {
        const scoringMessage = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.3,
          messages: [{ role: 'user', content: scoringPrompt }]
        });

        const scoringResponseText = scoringMessage.content[0].type === 'text' ? scoringMessage.content[0].text : '';
        const scoringJsonMatch = scoringResponseText.match(/\{[\s\S]*\}/);
        
        if (scoringJsonMatch) {
          const parsedScoring = JSON.parse(scoringJsonMatch[0]);
          
          // Merge scores with hooks
          hookResult.hooks = hookResult.hooks.map((hook: any) => {
            const score = parsedScoring.scores.find((s: any) => s.hookId === hook.id);
            return {
              ...hook,
              scoring: score || null
            };
          });

          // Calculate summary
          const allScores = parsedScoring.scores.map((s: any) => s.totalScore);
          const avgScore = allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length;
          const bestScore = parsedScoring.scores.reduce((best: any, current: any) => 
            current.totalScore > (best?.totalScore || 0) ? current : best
          , null);

          scoringResult = {
            scores: parsedScoring.scores,
            averageScore: Math.round(avgScore * 10) / 10,
            bestHookId: bestScore?.hookId
          };
        }
      } catch (scoringError) {
        console.log('Scoring failed, continuing without scores:', scoringError);
        // Continue without scoring - hooks are still valuable
      }
    }

    // Save to database
    try {
      await supabase.from('generated_hooks').insert({
        user_id: userId,
        input_text: bulletPoints,
        language,
        tone,
        target_audience: targetAudience,
        hooks: hookResult,
        scoring: scoringResult
      });

      // Save individual hook scores if available
      if (scoringResult && scoringResult.scores) {
        const hookScoreInserts = scoringResult.scores.map((score: any) => {
          const hook = hookResult.hooks.find((h: any) => h.id === score.hookId);
          return {
            user_id: userId,
            hook_text: hook?.text || '',
            hook_type: hook?.hookType || '',
            scroll_stop_score: score.scores.scrollStop,
            curiosity_gap_score: score.scores.curiosityGap,
            relatability_score: score.scores.relatability,
            specificity_score: score.scores.specificity,
            bonuses: score.bonuses,
            penalties: score.penalties,
            total_score: score.totalScore,
            grade: score.grade,
            reasoning: score.reasoning,
            improvement_tip: score.improvementTip,
            target_audience: targetAudience,
            language,
            source: 'hook_generator'
          };
        });

        await supabase.from('hook_scores').insert(hookScoreInserts);
      }
    } catch (dbError) {
      console.log('Database save failed:', dbError);
    }

    // Increment credits
    try {
      await supabase.rpc('increment_credits', { user_id: userId, amount: 1 });
    } catch (creditError) {
      console.log('Credit update failed:', creditError);
    }

    return NextResponse.json({
      ...hookResult,
      scoring: scoringResult
    });

  } catch (error: unknown) {
    console.error('Hook generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
