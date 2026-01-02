import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, language, tone, targetAudience, hook, outline, postType, idea, previousPosts } = await req.json();
    
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const styleContext = previousPosts ? `\n\nBRUGERENS TIDLIGERE POSTS (match denne stil):\n${previousPosts}` : '';
    
    const hasHookAndOutline = hook && outline;
    
    let prompt: string;
    
    if (hasHookAndOutline) {
      // Coming from Hook Generator with hook + outline
      prompt = `Du er en erfaren LinkedIn ghostwriter med speciale i skandinavisk business-tone.

OPGAVE:
Skriv EN komplet LinkedIn post baseret på den valgte hook og outline. Posten skal være klar til at copy-paste direkte til LinkedIn.

HOOK (BRUG DENNE PRÆCIST SOM START):
${hook}

OUTLINE AT FØLGE:
${outline}

POST-TYPE: ${postType || 'Thought Leadership'}

EKSTRA KONTEKST FRA BRUGER:
${idea || 'Ingen ekstra kontekst'}
${styleContext}

SETTINGS:
- Sprog: ${language}
- Tone: ${tone}
- Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}

KRAV:
1. START med den præcise hook (copy-paste den)
2. FØLG outline-strukturen punkt for punkt
3. Længde: 150-250 ord total
4. Afslut med CTA eller spørgsmål
5. NORDISK TONE: Direkte, ærlig, underspillet, ingen hype-ord
6. UNDGÅ: "Game-changer", "dive deep", "unlock", "revolutionary"

OUTPUT FORMAT (KUN VALID JSON):
{
  "posts": [
    {
      "content": "Den komplette post tekst her...\\n\\nMed linjeskift hvor relevant...\\n\\nOg CTA til sidst.",
      "angle": "${postType || 'Thought Leadership'}",
      "wordCount": 180
    }
  ]
}`;
    } else {
      // Starting from scratch with just an idea
      prompt = `Du er en erfaren LinkedIn ghostwriter med speciale i skandinavisk business-tone.

OPGAVE:
Skriv 3 komplette LinkedIn posts baseret på brugerens idé. Hver post skal have en unik vinkel.

BRUGERENS IDÉ:
${idea}

${hook ? `HOOK TIL INSPIRATION:\n${hook}\n` : ''}
${styleContext}

SETTINGS:
- Sprog: ${language}
- Tone: ${tone}
- Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}

KRAV TIL HVER POST:
1. Hook (1-2 linjer der stopper scroll)
2. Body (120-200 ord med value)
3. CTA eller spørgsmål til engagement
4. Samlet længde: 150-250 ord

3 UNIKKE VINKLER:
1. "Personal Case" - Fortæl det som en personlig erfaring
2. "Kontroveriel Take" - Tag en modig holdning
3. "How-To" - Praktisk og handlingsorienteret

NORDISK TONE:
- Direkte og ærlig
- Underspillet, ikke overdrevet
- Faglig autoritet uden arrogance
- UNDGÅ: "Game-changer", "dive deep", "unlock", "crush it"

OUTPUT FORMAT (KUN VALID JSON):
{
  "posts": [
    {
      "content": "Komplet post tekst her...\\n\\nMed linjeskift...\\n\\nOg CTA.",
      "angle": "Personal Case",
      "wordCount": 180
    },
    {
      "content": "Post 2...",
      "angle": "Kontroveriel Take",
      "wordCount": 175
    },
    {
      "content": "Post 3...",
      "angle": "How-To",
      "wordCount": 190
    }
  ]
}`;
    }

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
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch { 
      console.error('Parse error:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 }); 
    }

    try {
      await supabase.rpc('increment_credits', { user_id: userId, amount: 1 });
    } catch (creditError) {
      console.log('Credit update failed:', creditError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
