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
    const { userId, language, tone, targetAudience, purpose, bulletPoints } = await req.json();

    const { data: user } = await supabase
      .from('users')
      .select('monthly_credits_used, monthly_credits_limit, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const prompt = `Du er en LinkedIn content strategist og copywriter med speciale i skandinavisk business-tone.

OPGAVE:
Generer 5 hooks + post-outlines baseret på brugerens kernidé. Hver hook skal kunne vælges og sendes direkte til Ghostwriter Workspace.

INPUT:
- Sprog: ${language}
- Tone: ${tone}
- Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}
- Formål: ${purpose || 'engagement & visibility'}
- Brugerens kernidé/observation/noter:
${bulletPoints}

---

FASE 1: ANALYSE AF KERNIDÉEN
Før du genererer hooks, identificer selv:
- Hvad er den centrale insight eller observation?
- Hvad skal publikum FØLE eller HANDLE efter?
- Post-type: Thought Leadership / Lærdom fra Fejl / Case Study / Career Advice / Hot Take / Personlig Observation / Industri-Insight?
- Hvor står bruger på erfaring-skalaen? (påvirker tone)

---

REGLER FOR HOOKS:

Længde & Form:
- 1-2 linjer (ikke mere)
- 1 linje: Punchy, bold statement, spørgsmål
- 2 linjer: Kontrast, setup → payoff
- Mål: Max 20 ord i alt

Indhold:
- Skal STOPPE scrollet
- Brug kontrast, tal, spørgsmål, bold statements, paradokser
- UNDGÅ: "Game-changer", "dive deep", "unlock", "secret", "crush it", "revolutionary", "paradigm shift"

Tone (SKANDINAVISK):
- Direkte uden omsvøb
- Ærlig, ikke overvurderet
- Underspillet, faglig uden arrogance
- Troværdig, ikke hyped

EKSEMPLER PÅ GODE HOOKS:

1-LINJERS:
- "De fleste konsulenter sælger løsninger – ikke transformation."
- "Jeg læste 47 posts fra top-leadere. Kun 3 var faktisk godt skrevet."
- "Hvad hvis dit største problem er at du tror det er et problem?"

2-LINJERS:
- "Jeg sendte 100+ cold emails.\\nSådan blev jeg dårligere til at sælge."
- "Efter 10 år i startups lærte jeg én ting:\\nDe bedste tager ikke alle muligheder."
- "Alle siger: post dagligt.\\nMen 90% af det giver intet."

---

OUTLINE-STRUKTURER (vælg baseret på post-type):

**TYPE: THOUGHT LEADERSHIP**
1. Hook (stopper scroll)
2. Problem statement (hvad er brokenness?)
3. Din kontraintuitive take / observation
4. 1-2 eksempler eller evidens
5. Implication (hvad betyder det?)
6. CTA (hvad skal de gøre/tænke?)

**TYPE: LÆRDOM FRA FEJL**
1. Hook (fejlen eller lærdommen)
2. Kontekst (hvad gjorde jeg / hvor var vi?)
3. Hvad gik galt (konkret, specifikt)
4. Konsekvensen (hvad kostede det?)
5. Lektionen (hvad tænker jeg nu anderledes?)
6. CTA (hvad skal andre gøre anderledes?)

**TYPE: CASE STUDY / RESULTAT**
1. Hook (resultatet eller før/efter kontrast)
2. Udgangspunkt (hvor var vi? problemer?)
3. Hvad vi gjorde (3-4 konkrete steps)
4. Resultatet (tal, metrics, konkrete outcomes)
5. Key learning (hvad var det vigtigste?)
6. CTA (hvordan kan de starte?)

**TYPE: CAREER ADVICE / INSIGHT**
1. Hook (den ikke-åbenlyse advice)
2. Konvention (hvad tror folk? common wisdom?)
3. Reality check (hvorfor det ofte er forkert)
4. Bedre tilgang eller mindset
5. Konkret eksempel
6. CTA (hvordan de implementerer)

**TYPE: HOT TAKE / KONTROVERSI**
1. Hook (det ukonventionelle standpunkt)
2. Nuværende narrativ (hvad siger alle?)
3. Din take (hvorfor de tager fejl / alternative view)
4. Evidens eller logik bag
5. Implikation (hvad betyder det for dem?)
6. CTA (invitation til diskussion, challenge status quo)

---

OUTPUT FORMAT (RETURNER KUN VALID JSON, INGEN MARKDOWN):

{
  "analysis": {
    "postType": "Thought Leadership | Lærdom fra Fejl | Case Study | Career Advice | Hot Take | Andet",
    "coreInsight": "En sætning: hvad handler dette om?",
    "intendedOutcome": "Hvad skal læserne FØLE eller HANDLE efter?",
    "toneGuidance": "Kort note om tone for denne post"
  },
  "hooks": [
    {
      "id": "hook_1",
      "text": "Hook tekst her\\nMaks 2 linjer hvis needed",
      "length": "1-linje | 2-linjer",
      "strategy": "Kort forklaring på strategien",
      "reason": "Hvorfor denne hook virker",
      "postType": "Thought Leadership | Lærdom fra Fejl | Case Study | etc",
      "outline": [
        "1. Hook (stopper scroll)",
        "2. Problem statement eller kontekst",
        "3. Din take / hvad du gjorde",
        "4. Evidens eller konsekvens",
        "5. Lektionen eller resultatet",
        "6. CTA (call-to-action)"
      ]
    }
  ]
}

---

VIGTIGE DETALJER:
- Hver hook har UNIKKE outline steps (de skal ikke være identiske)
- Outline skal være specifikt for DENNE hook's angle
- Strategy + Reason skal forklare HVAD der virker (brugeren lærer)

TONE NOTES PER INDUSTRI:
- Tech/Startup: Bold, direkte, trend-aware men ikke hype
- Corporate/Finance: Autoritativ, data-driven, subtil ironi
- Coaching/HR: Empathisk, people-first, uden corporate buzzwords
- Sales/Business: Resultat-fokuseret, konkrete tal, no fluff
- Akademiker/Ekspert: Nuanceret, evidens-baseret, tænker højt

Du er IKKE programmør – du er STRATEG. Din job er at give den bedste hook for DENNE persons kernidé.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    try {
      await supabase.from('generated_hooks').insert({
        user_id: userId,
        input_text: bulletPoints,
        language,
        tone,
        target_audience: targetAudience,
        hooks: result,
      });
    } catch (dbError) {
      console.log('Database save failed:', dbError);
    }

    try {
      await supabase.rpc('increment_credits', { user_id: userId, amount: 1 });
    } catch (creditError) {
      console.log('Credit update failed:', creditError);
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Hook generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
