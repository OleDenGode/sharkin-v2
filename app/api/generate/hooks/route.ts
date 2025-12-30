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

    console.log('🔍 Starting deep research phase...');
    
    const researchPrompt = `Researcher dette emne dybt til et LinkedIn-post:

${bulletPoints}

Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}
Formål: ${purpose || 'engagement'}
Sprog: ${language}

Find:
1. Trending LinkedIn diskussioner om dette emne (søg på "site:linkedin.com ${bulletPoints.substring(0, 50)}")
2. Aktuelle statistikker og data points fra troværdige kilder
3. Konkrete eksempler på virale posts inden for dette område
4. Skandinaviske perspektiver hvis muligt

Fokuser på KONKRETE tal, facts og trends jeg kan bruge i hooks.`;

    const researchMessage = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: researchPrompt }]
    });

    let researchFindings = '';
    for (const block of researchMessage.content) {
      if (block.type === 'text') {
        researchFindings += block.text + '\n';
      }
    }

    console.log('✅ Research complete:', researchFindings.substring(0, 200));

    console.log('🎨 Generating data-backed hooks...');

    const hookPrompt = `Du er en erfaren LinkedIn copywriter med speciale i skandinavisk business-tone.

RESEARCH FINDINGS:
${researchFindings}

OPGAVE:
Baseret på research ovenfor, generer 5 UNIKKE og DATABASEREDE hooks/intros.

ORIGINAL INPUT FRA BRUGER:
- Sprog: ${language}
- Tone: ${tone}
- Målgruppe: ${targetAudience || 'LinkedIn-professionelle'}
- Formål: ${purpose || 'engagement'}
- Brugerens emne:
${bulletPoints}

KRITISKE REGLER:
1. Brug KONKRETE DATA fra research (tal, statistikker, trends)
2. Reference AKTUELLE diskussioner eller events du fandt
3. Max 2 linjer per hook (10-15 ord per linje)
4. UNDGÅ generiske hooks - hver hook skal have unikt angle baseret på research
5. NORDISK TONE: Direkte, ærlig, underspillet
6. UNDGÅ: "Game-changer", "dive deep", "unlock", "secret", "crush it"

GODE EKSEMPLER (med konkrete data):
- "73% af danske HR-chefer bruger nu AI i rekruttering.\\nMen 89% overser denne kritiske bias..."
- "LinkedIn's seneste algoritme-update favoriserer nu kommentarer 3x mere end likes.\\nHer er hvad det betyder for din strategi:"
- "Jeg analyserede 200 virale B2B-posts fra Q4.\\n94% havde denne ene ting til fælles."

VINKLER DU KAN BRUGE:
- Kontroveriel statistik + spørgsmål (baseret på research)
- Aktuel trend + uventet konsekvens (fra dine fund)
- Personlig observation + data backup (brug research-tal)
- Modsætning mellem myte vs. virkelighed (brug facts)
- Konkret case/eksempel + læring (fra research)

OUTPUT FORMAT (KUN JSON):
{
  "hooks": [
    {
      "text": "Hook tekst her\\nMax 2 linjer",
      "reason": "Hvilken research/data denne hook bygger på (vær specifik)"
    }
  ]
}`;

    const hooksMessage = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2500,
      temperature: 0.8,
      messages: [{ role: 'user', content: hookPrompt }]
    });

    const responseText = hooksMessage.content[0].type === 'text' ? hooksMessage.content[0].text : '';
    
    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
    } catch (parseError) {
      console.error('Parse error:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    console.log('✅ Generated', result.hooks?.length || 0, 'data-backed hooks');

    try {
      await supabase.from('generated_hooks').insert({
        user_id: userId,
        input_text: bulletPoints,
        language,
        tone,
        target_audience: targetAudience,
        hooks: result.hooks,
      });
    } catch (dbError) {
      console.log('DB save skipped:', dbError);
    }

    try {
      await supabase.rpc('increment_credits', { user_id: userId, amount: 1 });
    } catch (creditError) {
      console.log('Credit update skipped:', creditError);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Hook generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
