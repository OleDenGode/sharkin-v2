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
    const { userId, topic, keyPoints, language, tone } = await req.json();

    const { data: user } = await supabase
      .from('users')
      .select('monthly_credits_used, monthly_credits_limit, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const prompt = `Du er en LinkedIn ghostwriter der skriver i brugerens egen, unikke stil.

OPGAVE:
Skriv 3 forskellige LinkedIn-posts om følgende emne.

EMNE: ${topic}

${keyPoints ? `NØGLEPUNKTER:\n${keyPoints}\n` : ''}

SPROG: ${language}
TONE: ${tone}

REGLER:
1. Hver post skal være 120-300 ord
2. NORDISK TONE: Direkte, ærlig, underspillet, faglig
3. Brug personlige perspektiver ("Jeg", "Vi", "Min erfaring")
4. Hver post skal have unik vinkel
5. UNDGÅ: "Game-changer", "unlock", "crush it", generic hustle-sprog

STRUKTUR (for hver post):
- Hook (1-2 linjer)
- Body (kerneindhold med konkrete eksempler)
- CTA eller takeaway

POST VINKLER:
Post 1: Personlig erfaring/case
Post 2: Kontroveriel/modsætning
Post 3: How-to/praktisk guide

OUTPUT FORMAT (RETURNER KUN JSON):
{
  "posts": [
    {
      "text": "Fuld post-tekst her",
      "wordCount": 150,
      "styleNotes": "Bruger personlig case-vinkel med konkret eksempel"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 3000,
      temperature: 0.85,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch (parseError) {
      console.error('Parse error:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    try {
      await supabase.rpc('increment_credits', { user_id: userId, amount: 1 });
    } catch (creditError) {
      console.log('Credit update failed:', creditError);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Ghostwriter error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
