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
    const { userId, postText, relationship, language } = await req.json();

    const { data: user } = await supabase
      .from('users')
      .select('monthly_credits_used, monthly_credits_limit, subscription_status')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const relationshipContext = {
      peer: 'kollega/peer i samme branche',
      prospect: 'potentiel kunde jeg gerne vil netværke med',
      client: 'eksisterende kunde jeg har relation til',
      leader: 'thought leader jeg følger og lærer af'
    };

    const prompt = `Du er en LinkedIn engagement-ekspert der skriver smarte, værditilføjende kommentarer.

POST JEG VIL KOMMENTERE PÅ:
"""
${postText}
"""

MIN RELATION TIL FORFATTEREN: ${relationshipContext[relationship as keyof typeof relationshipContext]}
SPROG: ${language}

OPGAVE:
Generer 3 forskellige kommentarer med 3 forskellige strategier.

REGLER:
1. 30-50 ord per kommentar
2. Tilføj REEL værdi - ikke bare "Great post!"
3. Vær konkret og actionable
4. NORDISK TONE: Professionel men ikke stiv, ærlig, direkte
5. UNDGÅ: Generic ros, buzzwords, sælgende sprog

DE 3 STRATEGIER:
1. "Agree + Add": Enig + tilføj ny vinkel/perspektiv
2. "Smart Question": Stille et tankevækkende spørgsmål
3. "Mini-case": Del kort, relevant erfaring/eksempel

OUTPUT FORMAT (RETURNER KUN JSON):
{
  "comments": [
    {
      "strategy": "Agree + Add",
      "text": "Kommentar-tekst her",
      "wordCount": 35,
      "why": "Kort forklaring på hvorfor denne kommentar tilføjer værdi"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
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
    console.error('Comments error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
