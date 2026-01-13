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

═══════════════════════════════════════
OPGAVE
═══════════════════════════════════════

Generer 5 forskellige hooks + post-outlines baseret på brugerens kernidé.

FORMÅL:
- Hver hook skal STOPPE scrollet på LinkedIn
- Hver hook skal kunne kopieres direkte til Ghostwriter Workspace
- Hver outline skal guide den færdige post-struktur

OUTPUT-FORMAT:
For hver hook levér:
1. Selve hooken (1-2 linjer, max 20 ord)
2. Hook-type (f.eks. Kontrast, Spørgsmål, Bold påstand)
3. Post-outline (3-5 punkter der viser postens flow)
4. Tone-match (hvor godt passer denne hook til valgt tone?)

═══════════════════════════════════════
INPUT FRA BRUGER
═══════════════════════════════════════

Sprog: ${language}
Tone: ${tone}
Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}
Formål: ${purpose || 'engagement & synlighed'}

BRUGERENS KERNIDÉ/OBSERVATION:
${bulletPoints}

═══════════════════════════════════════
FASE 1: ANALYSE AF KERNIDÉEN
═══════════════════════════════════════

Før du genererer hooks, analyser brugerens input systematisk:

1. CENTRAL INSIGHT
   → Hvad er den afgørende pointe eller observation?
   → Er det en lærdom, en kontrast, en case, en kritik, en trend?

2. EMOTIONEL DRIVER
   → Hvad skal publikum FØLE?
   → Nysgerrighed / Genkendelse / Overraskelse / Frustration / Håb / FOMO?

3. POST-ARKETYPE
   Identificer hvilken type post dette naturligt bliver til:
   
   ✦ Lærdom fra Fejl ("Jeg fejlede med X, lærte Y")
   ✦ Kontrær Mening ("Alle siger X, men sandheden er Y")
   ✦ Case Study ("Sådan gik vi fra A til B")
   ✦ Karriereråd ("Hvis du vil X, gør Y")
   ✦ Personlig Observation ("Jeg så noget underligt: X")
   ✦ Industri-Insight ("X-branchen ændrer sig: her er hvordan")
   ✦ Thought Leadership ("Her er fremtidens X")
   ✦ Behind-the-Scenes ("Sådan ser min hverdag ud")

4. AFSENDER-NIVEAU
   → Hvor står brugeren på erfaring-skalaen?
   → Junior (deler læring) / Mid (deler erfaring) / Senior (deler autoritet)?
   → Dette påvirker troværdigheden af forskellige hook-typer

5. MÅLGRUPPE-MATCHING
   → Hvad er målgruppens primære smertepunkt eller ambition?
   → Hvordan relaterer kernidéen til deres hverdag?

═══════════════════════════════════════
FASE 2: HOOK-GENERERING
═══════════════════════════════════════

Generer nu 5 hooks baseret på 5 FORSKELLIGE hook-strategier.

Vælg blandt disse 12 hook-arketyper:

1. KONTRAST-HOOK
   → "Alle siger X. Sandheden er Y."
   → "Før troede jeg X. Nu ved jeg Y."
   Eksempel: "De fleste ledere stiller flere spørgsmål. De bedste gør det modsatte."

2. TAL-HOOK
   → Brug konkrete tal, procenter, tidsperioder
   Eksempel: "3 møder. 47 afslag. 1 gennembrudsidé."

3. SPØRGE-HOOK
   → Stil et spørgsmål publikum ikke kan ignorere
   Eksempel: "Hvad hvis det bedste råd du fik var forkert?"

4. INDRØMMELSES-HOOK
   → Start med ydmyghed eller fejl
   Eksempel: "Jeg løj i mit første jobinterview. Her er hvorfor det var rigtigt."

5. BOLD PÅSTAND
   → Tag en kontroversiel position
   Eksempel: "Netværk er overvurderet. Kompetence er undervurderet."

6. HEMMELIGHEDS-HOOK
   → Antyd insider-viden
   Eksempel: "Ingen fortæller dig dette om forfremmelser..."

7. TIDSLINJE-HOOK
   → Vis før/efter eller transformation
   Eksempel: "For 6 måneder siden blev jeg fyret. I dag..."

8. OBSERVATIONS-HOOK
   → Del en konkret iagttagelse
   Eksempel: "Jeg lagde mærke til noget mærkeligt i går: Ingen stillede spørgsmål."

9. LISTE-TEASE
   → Tease en liste uden at afsløre den
   Eksempel: "3 ting alle marketing managers burde vide (men ikke gør)."

10. MODSÆTNINGS-HOOK
    → Tving til et valg
    Eksempel: "Du kan være afholdt. Eller effektiv. Sjældent begge."

11. PROVOKATIONS-HOOK
    → Udfordr en praksis
    Eksempel: "Stop med at netværke. Start med at skabe."

12. STORY-OPENER
    → Start midt i en historie
    Eksempel: "Hun sagde op i går. Jeg fejrede det."

REGLER FOR ALLE HOOKS:

✓ Længde: 1-2 linjer (IKKE mere)
   - 1 linje = punchy statement eller spørgsmål
   - 2 linjer = setup + payoff ELLER kontrast

✓ Max 20 ord totalt

✓ Skal kunne stå alene (bruges i Ghostwriter uden kontekst)

✓ Undgå clickbait-følelse:
   ✗ "Du vil ALDRIG tro hvad der skete..."
   ✓ "Jeg fyrede min bedste medarbejder. Her er hvorfor."

✓ Specifik > Generisk:
   ✗ "Ledelse er svært"
   ✓ "De bedste ledere stiller færre spørgsmål end du tror"

✓ Match tone-parameter:
   - Professional: Autoritativ, men tilgængelig
   - Casual: Conversational, personlig
   - Bold: Provokerende, kontrær

═══════════════════════════════════════
FASE 3: POST-OUTLINE
═══════════════════════════════════════

For hver hook, lav en post-outline med 3-5 punkter der viser:

→ Hvilken vinkel udvider hooken?
→ Hvilke substory/eksempler bruges?
→ Hvad er takeaway eller CTA?

═══════════════════════════════════════
OUTPUT FORMAT (RETURNER KUN VALID JSON)
═══════════════════════════════════════

{
  "analysis": {
    "centralInsight": "Hvad er den afgørende pointe?",
    "emotionalDriver": "Nysgerrighed / Genkendelse / Overraskelse / etc",
    "postArchetype": "Lærdom fra Fejl / Kontrær Mening / Case Study / etc",
    "senderLevel": "Junior / Mid / Senior",
    "audienceMatch": "Hvordan relaterer dette til målgruppens hverdag?"
  },
  "hooks": [
    {
      "id": "hook_1",
      "text": "Hook tekst her\\nMaks 2 linjer hvis needed",
      "hookType": "Kontrast-hook / Tal-hook / Spørge-hook / etc",
      "toneMatch": "★★★★☆",
      "risk": "Eventuelle ulemper eller forbehold",
      "bestFor": "Hvilken målgruppe/situation passer denne til",
      "outline": [
        "Intro: Udvid hooken - giv kontekst",
        "Body 1: Første argument/eksempel",
        "Body 2: Andet argument/kontrast",
        "Afslutning: Takeaway + spørgsmål til publikum"
      ]
    }
  ]
}

═══════════════════════════════════════
AFSLUTTENDE TJEK
═══════════════════════════════════════

Før du leverer output, verificer:

✓ Alle 5 hooks er forskellige (ikke varianter af samme)
✓ Alle hooks matcher sprog-parameter
✓ Alle hooks er max 20 ord
✓ Alle outlines er konkrete (ikke generiske)
✓ Mindst 3 forskellige hook-arketyper er brugt

Nu: Generer de 5 hooks + outlines.`;

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
