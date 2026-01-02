import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, language, tone, relationship, postText } = await req.json();
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const relContext = { peer: 'kollega', prospect: 'potentiel kunde', client: 'kunde', leader: 'leder' }[relationship] || 'kontakt';
    const prompt = `Du er LinkedIn kommentar-ekspert. Skriv 3 kommentarer på ${language} i ${tone} tone. Relation: ${relContext}.

POST:
${postText}

REGLER:
- 30-50 ord per kommentar
- Tilføj værdi, undgå "Great post!"
- 3 vinkler: agree_add, smart_question, mini_case
- Nordisk tone

OUTPUT (KUN JSON):
{"comments":[{"text":"Kommentar...","angle":"agree_add","reasoning":"Strategi..."}]}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch { return NextResponse.json({ error: 'Parse error' }, { status: 500 }); }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
