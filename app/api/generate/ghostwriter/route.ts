import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId, language, tone, targetAudience, idea, previousPosts } = await req.json();
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const styleContext = previousPosts ? `\n\nBRUGERENS STIL:\n${previousPosts}` : '';
    const prompt = `Du er LinkedIn ghostwriter. Skriv 3 posts på ${language} i ${tone} tone for ${targetAudience || 'professionelle'}.

IDÉ: ${idea}${styleContext}

KRAV:
- Hook (1-2 linjer)
- Body (120-200 ord)
- CTA/spørgsmål
- 3 vinkler: "Personal Case", "Kontroveriel Take", "How-To"
- Nordisk tone, undgå "game-changer", "unlock" osv.

OUTPUT (KUN JSON):
{"posts":[{"content":"Post tekst...","angle":"Personal Case","wordCount":180}]}`;

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
    } catch { return NextResponse.json({ error: 'Parse error' }, { status: 500 }); }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
