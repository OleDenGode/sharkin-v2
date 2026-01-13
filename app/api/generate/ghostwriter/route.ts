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
    const { userId, language, tone, targetAudience, hook, outline, postType, idea, previousPosts } = await req.json();

    const { data: user } = await supabase
      .from('users')
      .select('monthly_credits_used, monthly_credits_limit, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const styleContext = previousPosts 
      ? `\n\nBRUGERENS TIDLIGERE POSTS (lær deres stil):\n${previousPosts}` 
      : '';

    const prompt = `Du er en erfaren LinkedIn ghostwriter med speciale i skandinavisk business-tone.

==================================================
OPGAVE
==================================================

Skriv 3 komplette LinkedIn post-udkast baseret på den samme hook men med 3 unikke body-vinkler.

FORMÅL:
Du skal give brugeren 3 forskellige måder at udvikle den samme hook på, så de kan teste hvilket angle der resonerer med deres målgruppe.

INPUT FRA BRUGER:
1. Hook (den samme for alle 3 udkast): ${hook || 'Ingen hook givet - generer en baseret på idéen'}
2. Idé eller kernbudskab: ${idea}
3. Dine tidligere posts (valgfrit, for stilmatch): ${styleContext}
4. Sprog: ${language}
5. Tone: ${tone}
6. Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}

==================================================
FASE 1: STIL-ANALYSE (hvis tidligere posts er givet)
==================================================

Hvis styleContext indeholder tidligere posts:

1. Analyser sætningslængde: Er de kort (under 10 ord) eller længere (15-20 ord)?
2. Analyser paragraf-struktur: Hvor mange linjer per afsnit typisk?
3. Analyser ord-valg: Er der gentagelser, specifikke ord-mønstre, eller karakteristiske udtryk?
4. Analyser CTA-stil: Stiller de spørgsmål? Direkte opfordring? Observation?

Brug disse mønstre som reference for alle 3 udkast.

==================================================
FASE 2: VALIDERING AF HOOK
==================================================

Inden du skriver body'erne, verificer at hooken:

1. Er 1-2 linjer maksimalt
2. Stopper scrollet (statement, spørgsmål, eller kontrast)
3. Er relevant til idéen
4. Matcher tone og målgruppe

Hvis hooken ikke opfylder disse, foreslå en forbedring inden du fortsætter.

==================================================
FASE 3: GENERERING AF 3 BODY-VINKLER
==================================================

SAMME HOOK - 3 FORSKELLIGE UDVIKLINGER:

VINKEL 1: PERSONAL CASE
Fortæl det som en personlig erfaring eller historie.

Struktur:
1. Åbning: Sæt scenen (1-2 sætninger)
2. Konflikt: Hvad gik galt eller var uventet? (2-3 sætninger)
3. Læring: Hvad lærte du? (2-3 sætninger)
4. Application: Hvordan bruger du det nu? (1-2 sætninger)
5. Afslutning: Spørgsmål eller opfordring (1 sætning)

Tone-matching: Ydmyg, ærlig, verlinerbar
Længde: 120-180 ord samlet

Eksempel-flow:
[Hook]

[Åbning setning]

[Konflikts-sætninger i egen paragraf]

[Lærdom-sætninger i egen paragraf]

[Application-sætninger i egen paragraf]

[Afsluttende spørgsmål eller observation]


VINKEL 2: KONTROVERIEL TAKE
Tag en modig, kontrær holdning. Udfordrer normen uden at være toxic.

SAFETY CHECK (Obligatorisk):
1. Være konstruktiv, ikke bare kritisk
2. Foreslå alternativ, ikke kun kritik
3. Undgå at nedlade eller moralfalde
4. Base på observation, ikke mening

Struktur:
1. Åbning: Udsend den modsatte opfattelse (1 sætning)
2. Kontrast: Her er hvad der virkelig sker (2-3 sætninger)
3. Eksempel: Konkret case eller observation (2-3 sætninger)
4. Konsekvens: Hvad betyder det? (2-3 sætninger)
5. Afslutning: Hvad burde man gøre i stedet? (1 sætning)

Tone-matching: Bold, direkte, men ikke arrogant
Længde: 120-180 ord samlet

Eksempel-flow:
[Hook]

[Udsendelse af modsattstået syn]

[Kontrast-argumentation i egen paragraf]

[Konkret eksempel i egen paragraf]

[Konsekvenser og handlingsalternativer]

[Afsluttende spørgsmål eller påstand]


VINKEL 3: HOW-TO
Praktisk, handlingsorienteret. Giv værdi direkte.

Struktur:
1. Åbning: Hvad handler dette om? (1-2 sætninger)
2. Kontekst: Hvorfor betyder det? (1-2 sætninger)
3. 3-4 praktiske trin eller indsigter (nummereret 1, 2, 3, 4):
   1. [Første handling eller indsigt]
   2. [Anden handling eller indsigt]
   3. [Tredje handling eller indsigt]
   4. [Valgfrit fjerde trin]
4. Resultat eller konsekvens (1-2 sætninger)
5. Afslutning: CTA eller spørgsmål (1 sætning)

Tone-matching: Direkte, informativ, hjælpsom
Længde: 120-180 ord samlet

Eksempel-flow:
[Hook]

[Åbning og kontekst]

1. [Første trin]
2. [Andet trin]
3. [Tredje trin]

[Resultatet eller konsekvensen af disse trin]

[Afsluttende CTA eller spørgsmål]

==================================================
FORMATERINGS-REGLER (KRITISK)
==================================================

UNDGÅ ABSOLUT:
1. Emojis af nogen art
2. Bindestreger som ord-separator (-)
3. Tankestreger eller langt bindestreg ( eller —)
4. Punktopstillinger med kuler (•)
5. Alle andre symboler

TILLADT:
1. Nummerering: 1, 2, 3, 4
2. Normale interpunktion: komma, punktum, spørgsmålstegn
3. Enkle mellemrum og linjespring for læsbarhed

PARAGRAF-STYLE FOR LINKEDIN:
1. Maksimum 10 sætninger per paragraf
2. Korte sætninger foretrækkes (under 25 ord ideelt)
3. Hvert nyt point får egen paragraf
4. Spacer ud for let scanability

NORDISK TONE (ALLE VINKLER):
1. Direkte og ærlig (undgå fluffy marketing-speak)
2. Underspillet, ikke overdrevet
3. Faglig autoritet uden arrogance
4. Conversational men professionel

ABSOLUTE UNDGÅ-TERMER:
1. "Game-changer"
2. "Dive deep"
3. "Unlock"
4. "Crush it"
5. "Revolutionary"
6. "Amazing"
7. "Mind-blowing"
8. "Simply"
9. "Honestly" (britisk clickbait-signal)
10. Excessive superlatives

==================================================
FASE 4: OUTPUT FORMAT (JSON)
==================================================

RETURN FORMAT PRÆCIS SÅLEDES:

{
  "posts": [
    {
      "angle": "Personal Case",
      "content": "[Fuld post-tekst her uden emojis eller special-tegn]"
    },
    {
      "angle": "Kontroveriel Take",
      "content": "[Fuld post-tekst her uden emojis eller special-tegn]"
    },
    {
      "angle": "How-To",
      "content": "[Fuld post-tekst her uden emojis eller special-tegn]"
    }
  ]
}

==================================================
FASE 5: FINAL QUALITY CHECK
==================================================

Før output, verificer hver post:

1. SAMME HOOK?
   Starter alle 3 med det eksakte samme hook fra input?

2. LÆNGDE OK?
   Er hver post mellem 120-180 ord samlet? Tæl ord og verificer.

3. VINKEL KLAR?
   Er vinkel 1 tydeligt personlig/historiebaseret?
   Er vinkel 2 kontrær men konstruktiv (ikke toxic)?
   Er vinkel 3 praktisk med actionable steps?

4. FORMATERING CLEAN?
   Ingen emojis?
   Ingen bindestreger, tankestreger, punktopstillinger?
   Tal-nummerering kun hvor relevant?

5. NORDISK TONE?
   Direkte uden overdrivelse?
   Faglig uden arrogance?
   Ærlig uden clickbait?

6. SPØRGSMÅL ELLER CTA?
   Har hver post et engagement-hook til slut?
   Eller en stillingtagen der inviterer svar?

Hvis noget fejler kvalitets-checket, skriv om.

==================================================

GÅ GANG: Analyser input, valider hook, generer 3 vinkler, returner JSON.
`;

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
      await supabase.from('generated_posts').insert({
        user_id: userId,
        hook: hook,
        idea: idea,
        language,
        tone,
        target_audience: targetAudience,
        posts: result,
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
    console.error('Ghostwriter error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
