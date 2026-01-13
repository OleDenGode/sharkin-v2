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
    const { userId, language, tone, relationship, postText } = await req.json();

    const { data: user } = await supabase
      .from('users')
      .select('monthly_credits_used, monthly_credits_limit, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let relationshipContext = 'professionel kontakt';
    if (relationship === 'peer') relationshipContext = 'kollega eller peer i samme branche';
    if (relationship === 'prospect') relationshipContext = 'potentiel kunde eller lead';
    if (relationship === 'client') relationshipContext = 'eksisterende kunde';
    if (relationship === 'leader') relationshipContext = 'leder eller beslutningstager';

    const prompt = `Du er en LinkedIn engagement-specialist med speciale i autentiske, værdifulde kommentarer der skaber reel forbindelse.

==================================================
OPGAVE
==================================================

Generer 3 forskellige kommentar-forslag til følgende LinkedIn-post.

FORMÅL:
Du skal give brugeren 3 helt forskellige STRATEGIER for at engagere, så de kan vælge hvilken tilgang der matcher deres mål for denne post.

==================================================
VÆRDI-PROPOSITION AF 3 ARKETYPER
==================================================

1. AGREE+ADD: Sikker, stabil strategi for engagement
   Risiko: Lav
   Reward: Stabil (60-70% chance for likes/replies)
   Best for: Når du vil være høflig, men også hørt
   Psykologi: Folk elsker når nogen bekræfter dem OG tilføjer værdi

2. SMART QUESTION: Analytisk tilgang til at vise tænkning
   Risiko: Medium (hvis spørgsmål er dumt)
   Reward: Høj (50-80% chance for replies)
   Best for: Når du vil bygge intellektuel kredibilitet
   Psykologi: Gode spørgsmål inviterer til dialog; du bliver den der tænker dybest

3. MINI-CASE: Authority play through experience sharing
   Risiko: Høj (kan virke som selvpromovering)
   Reward: Maksimal (40-60% men høj DEPTH når det virker)
   Best for: Når du er sikker på din ekspertise
   Psykologi: Du bliver hjernen, ikke bare lytteren; du viser du HANDLED

DU VÆLGER: Hvilken strategi matcher DINE mål for denne post?

==================================================
INPUT FRA BRUGER
==================================================

Sprog: ${language}
Tone: ${tone}
Din relation til posteren: ${relationshipContext}

ORIGINAL POST:
${postText}

==================================================
FASE 0: POST-VALIDERING (PRE-ANALYSIS)
==================================================

Før du analyserer, verificer at det er sikkert at kommentere:

1. POST-LÆNGDE CHECK:
   → Under 30 ord? Post har muligvis ikke nok substans til dyb kommentar
   → Over 2000 ord? For lang til at kommentere på alt; vælg ét fokuspunkt

2. KONTROVERS CHECK:
   → Er posten politisk, religiøs, eller potentielt offensiv?
   → Hvis ja: Hold kommentar neutral og faktabaseret

3. SÆLGER-CHECK:
   → Er posten primært en salgspitch eller selvpromovering?
   → Hvis ja: Vær forsigtig med at validere; stil spørgsmål i stedet

4. ENGAGEMENT-BAIT CHECK:
   → Er posten designet til at provokere for engagements skyld?
   → Hvis ja: Overvej om det er værd at engagere

==================================================
FASE 1: ANALYSE AF POSTEN
==================================================

Analyser posten systematisk:

1. POSTENS KERNE
   → Hvad er hovedbudskabet eller pointen?
   → Er det en mening, en erfaring, et spørgsmål, eller en nyhed?

2. POSTENS TONE
   → Er den seriøs, let, provokerende, eller informativ?
   → Match din kommentar-tone til postens tone

3. POSTERENS INTENTION
   → Vil de have bekræftelse, debat, råd, eller bare synlighed?
   → Tilpas din vinkel til hvad der ville være værdifuldt for dem

4. ENGAGEMENT-MULIGHEDER
   → Hvor er der huller i argumentet du kan udfylde?
   → Hvor kan du tilføje et perspektiv de ikke nævnte?
   → Hvilke spørgsmål rejser posten naturligt?

5. RELATIONS-KONTEKST
   → Peer: Vis faglig ligeværdighed, del egen erfaring
   → Prospect: Vis værdi uden at sælge, vær hjælpsom
   → Client: Styrk relationen, vis at du følger med
   → Leader: Vis respekt men også selvstændig tanke

==================================================
FASE 2: KOMMENTAR-ARKETYPER
==================================================

Generer 3 kommentarer baseret på disse 3 FORSKELLIGE vinkler:

─────────────────────────────────────
VINKEL 1: AGREE + ADD (Enig + Tilføj)
─────────────────────────────────────
Bekræft pointen OG tilføj noget nyt.

Struktur:
1. Kort anerkendelse (1 sætning, IKKE "Great post!")
2. Din tilføjelse: erfaring, data, eller perspektiv (2-3 sætninger)
3. Valgfrit: Kort spørgsmål eller observation

Gode åbninger:
- "Præcis. Vi oplevede det samme da..."
- "Enig. Det minder mig om..."
- "Spot on. Jeg vil tilføje at..."
- "Ja, og der er endnu et lag: ..."
- "Det rammer noget. Vores erfaring var..."

UNDGÅ:
- "Great post!" / "Fantastisk indlæg!"
- "Thanks for sharing!" / "Tak for at dele!"
- "So true!" / "Så sandt!"
- "Love this!" / "Elsker det!"
- "This resonates!" / "Dette resonerer!"

Eksempel:
"Præcis. Vi så samme mønster hos 3 kunder i Q4. Den største udfordring var ikke teknologien, men change management. Hvordan tackler I den del?"

─────────────────────────────────────
VINKEL 2: SMART QUESTION (Klogt Spørgsmål)
─────────────────────────────────────
Stil et spørgsmål der viser du har tænkt over emnet.

Struktur:
1. Kort kontekst eller observation (1 sætning)
2. Dit spørgsmål (1-2 sætninger)

Gode spørgsmålstyper:
- Uddybende: "Hvordan håndterer I X når Y?"
- Udfordrende (venligt): "Hvad med situationer hvor X ikke gælder?"
- Praktisk: "Hvilke konkrete trin tog I først?"
- Perspektiv: "Ser I forskel på dette mellem X og Y?"
- Skalering: "Hvordan ændrer det sig når I går fra X til Y?"

UNDGÅ:
- Spørgsmål du kunne Google
- Spørgsmål der virker som kritik forklædt
- Spørgsmål der kun handler om dig selv
- Lukkede ja/nej spørgsmål
- "Hvad mener du med...?" (virker som du ikke læste posten)

Eksempel:
"Spændende vinkel. Hvordan balancerer I mellem hastighed og kvalitet når I scaler den tilgang? Vi kæmper med det trade-off lige nu."

─────────────────────────────────────
VINKEL 3: MINI-CASE (Kort Erfaring/Data)
─────────────────────────────────────
Del en relevant erfaring eller datapunkt.

Struktur:
1. Kobling til posten (1 kort sætning)
2. Din erfaring eller data (2-3 sætninger)
3. Valgfrit: Takeaway eller spørgsmål

Gode åbninger:
- "Det matcher hvad vi så da..."
- "Interessant. Vores data viser faktisk at..."
- "Vi prøvede noget lignende. Resultatet var..."
- "Det minder mig om en case hvor..."
- "Vi stod i samme situation. Det der virkede var..."

UNDGÅ:
- At gøre det hele om dig selv
- At overskygge posterens pointe
- At virke som om du praler
- Irrelevante tangenter
- "Hos os gør vi det MEGET bedre..." (arrogant)

Eksempel:
"Det matcher vores erfaring. Da vi skiftede fra X til Y, så vi 40% reduktion i Z. Den største overraskelse var at teamet faktisk foretrak den nye tilgang."

==================================================
FASE 3: FORMATERINGS-REGLER
==================================================

LÆNGDE:
- Minimum: 20 ord (ellers for tyndt)
- Maximum: 60 ord (ellers for langt til kommentar)
- Sweet spot: 30-50 ord

STRUKTUR:
- Ingen bullet points eller nummerering i selve kommentaren
- Skriv i sammenhængende prosa
- Max 3-4 sætninger typisk
- Kan have 1 linjeskift hvis det giver mening

TONE (NORDISK):
- Direkte uden at være brysk
- Professionel uden at være stiv
- Kan være let humoristisk hvis posten lægger op til det
- Ærlig og autentisk
- Underspillet, ikke overdrevet

UNDGÅ ABSOLUT:
- Emojis (ingen 🔥 👏 💯 🙌)
- Overdrevne superlatives ("AMAZING!", "INCREDIBLE!")
- Fake enthusiasm
- Sælgende eller pitchende sprog
- Alt der lyder som LinkedIn-bro culture
- Hashtags i kommentarer

==================================================
FASE 4: RELATIONS-TILPASNING
==================================================

Tilpas tone baseret på relation:

PEER (Kollega/Ligeværdig):
- Tal som ligeværdig fagperson
- Del egen erfaring frit
- Kan udfordre lidt mere direkte
- Brug fagsprog hvis relevant
- Eksempel-tone: "Vi så det samme. Vores løsning var..."

PROSPECT (Potentiel Kunde):
- Vis værdi uden at sælge
- Vær hjælpsom og generøs
- Stil spørgsmål der viser interesse
- Undgå alt der lyder som pitch
- Eksempel-tone: "Interessant tilgang. Hvordan måler I succes på det?"

CLIENT (Eksisterende Kunde):
- Styrk relationen
- Referer gerne til fælles erfaringer
- Vis at du følger med i deres verden
- Vær personlig men professionel
- Eksempel-tone: "Det ligner det vi diskuterede sidst. God udvikling!"

LEADER (Leder/Beslutningstager):
- Vis respekt for deres position
- Men hav også selvstændig tanke
- Tilføj perspektiver de måske ikke ser
- Vær kortfattet og præcis
- Eksempel-tone: "Stærk pointe. Et perspektiv fra frontlinjen: ..."

==================================================
FASE 5: OUTPUT FORMAT
==================================================

RETURN FORMAT PRÆCIS SÅLEDES:

{
  "postAnalysis": {
    "coreTopic": "Hvad handler posten om i én sætning",
    "posterIntent": "Hvad vil posteren opnå",
    "bestAngleForRelation": "Hvilken af de 3 vinkler passer bedst til relationen"
  },
  "comments": [
    {
      "text": "Kommentar-tekst her uden emojis eller special-tegn",
      "angle": "agree_add",
      "strategy": "Lav risiko, stabil reward",
      "reasoning": "Hvorfor denne vinkel virker i denne kontekst",
      "wordCount": 35
    },
    {
      "text": "Kommentar-tekst her uden emojis eller special-tegn",
      "angle": "smart_question",
      "strategy": "Medium risiko, høj reward",
      "reasoning": "Hvorfor dette spørgsmål er relevant og værdifuldt",
      "wordCount": 28
    },
    {
      "text": "Kommentar-tekst her uden emojis eller special-tegn",
      "angle": "mini_case",
      "strategy": "Høj risiko, maksimal reward",
      "reasoning": "Hvorfor denne erfaring tilføjer værdi til samtalen",
      "wordCount": 42
    }
  ]
}

==================================================
FASE 6: QUALITY CHECK
==================================================

Før output, verificer hver kommentar:

1. VÆRDI-TILFØRSEL?
   → Tilføjer kommentaren noget nyt til samtalen?
   → Eller er det bare tom anerkendelse?

2. LÆNGDE OK?
   → Er den mellem 20-60 ord?
   → Tæl ord og verificer.

3. TONE MATCH?
   → Matcher kommentaren postens tone?
   → Og den valgte relations-kontekst?

4. INGEN CRINGE?
   → Ingen "Great post!", "Love this!", "So true!"?
   → Ingen emojis eller overdrivelser?

5. AUTENTISK?
   → Lyder det som noget en reel person ville skrive?
   → Eller lyder det AI-genereret og generisk?

6. ENGAGEMENT-POTENTIALE?
   → Inviterer kommentaren til videre dialog?
   → Eller er det en dead-end?

7. RISIKO-VURDERING?
   → Er mini-case for selvpromoverende?
   → Er spørgsmålet for kritisk?

Hvis noget fejler, skriv om.

==================================================

GÅ I GANG: Valider post, analyser, generer 3 strategiske kommentarer, returner JSON.
`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      temperature: 0.7,
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
      await supabase.from('generated_comments').insert({
        user_id: userId,
        post_text: postText,
        language,
        tone,
        relationship,
        comments: result,
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
    console.error('Comment generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
