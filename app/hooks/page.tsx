'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Hook {
  id: string;
  text: string;
  length: string;
  strategy: string;
  reason: string;
  postType: string;
  outline: string[];
}

interface Analysis {
  postType: string;
  coreInsight: string;
  intendedOutcome: string;
  toneGuidance: string;
}

interface HookResult {
  analysis: Analysis;
  hooks: Hook[];
}

export default function HooksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [bulletPoints, setBulletPoints] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [result, setResult] = useState<HookResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [expandedHook, setExpandedHook] = useState<string | null>(null);
  const router = useRouter();

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('hooks_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setBulletPoints(parsed.bulletPoints || '');
      setLanguage(parsed.language || 'da');
      setTone(parsed.tone || 'professional');
      setTargetAudience(parsed.targetAudience || '');
      setPurpose(parsed.purpose || '');
      if (parsed.result) setResult(parsed.result);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    const state = { bulletPoints, language, tone, targetAudience, purpose, result };
    localStorage.setItem('hooks_state', JSON.stringify(state));
  }, [bulletPoints, language, tone, targetAudience, purpose, result]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
        setUserEmail(user.email || '');
      }
    });
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem('hooks_state');
    localStorage.removeItem('ghostwriter_state');
    localStorage.removeItem('comments_state');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generateHooks = async () => {
    if (!bulletPoints.trim()) {
      alert('Skriv venligst din kernidé først!');
      return;
    }

    setLoading(true);
    setStatus('🔍 Analyserer din kernidé...');
    setResult(null);

    try {
      const response = await fetch('/api/generate/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          language,
          tone,
          targetAudience,
          purpose,
          bulletPoints,
        }),
      });

      setStatus('🪝 Genererer hooks og outlines...');
      const data = await response.json();

      if (response.ok) {
        setStatus('');
        setResult(data);
      } else {
        setStatus('');
        alert(data.error || 'Noget gik galt');
      }
    } catch (error) {
      setStatus('');
      alert('Fejl ved generering');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopieret til clipboard!');
  };

  const sendToGhostwriter = (hook: Hook) => {
    const outlineText = hook.outline.join('\n');
    localStorage.setItem('ghostwriter_hook', hook.text);
    localStorage.setItem('ghostwriter_outline', outlineText);
    localStorage.setItem('ghostwriter_postType', hook.postType);
    router.push('/ghostwriter?fromHook=true');
  };

  const toggleExpand = (hookId: string) => {
    setExpandedHook(expandedHook === hookId ? null : hookId);
  };

  const clearForm = () => {
    setBulletPoints('');
    setTargetAudience('');
    setPurpose('');
    setResult(null);
    localStorage.removeItem('hooks_state');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP MENU */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => router.push('/dashboard')}
          >
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600">SharkIN</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm hidden md:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Log ud
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">🪝 Hook & Intro Studio</h1>
          <button
            onClick={clearForm}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Ryd alt
          </button>
        </div>
        <p className="text-gray-600 mb-8">Få 5 hooks med outlines klar til Ghostwriter</p>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Din kernidé, observation eller noter:
          </label>
          <textarea
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Eks: Jeg har bemærket at de bedste ledere stiller flere spørgsmål end de giver svar. Det virker kontraintuitivt, men det skaber bedre teams..."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sprog</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="da">Dansk</option>
                <option value="sv">Svensk</option>
                <option value="no">Norsk</option>
                <option value="en">Engelsk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Målgruppe</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Eks: Tech leads"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Formål</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Eks: Thought leadership"
              />
            </div>
          </div>

          <button
            onClick={generateHooks}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? status || 'Genererer...' : 'Generer 5 hooks med outlines →'}
          </button>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{status}</p>
            <p className="text-blue-600 text-sm mt-1">Dette kan tage 20-40 sekunder...</p>
          </div>
        )}

        {result && (
          <>
            {/* Analysis Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 md:p-6 mb-6 border border-blue-200">
              <h2 className="text-lg font-bold mb-3">📊 Analyse af din kernidé</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Post-type:</p>
                  <p className="font-medium">{result.analysis?.postType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tone:</p>
                  <p className="font-medium">{result.analysis?.toneGuidance}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Kerneindsigt:</p>
                  <p className="font-medium">{result.analysis?.coreInsight}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Ønsket outcome:</p>
                  <p className="font-medium">{result.analysis?.intendedOutcome}</p>
                </div>
              </div>
            </div>

            {/* Hooks Section */}
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">🪝 Dine 5 hooks:</h2>
              
              {result.hooks?.map((hook, index) => (
                <div key={hook.id || index} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 md:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {hook.length}
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {hook.postType}
                      </span>
                    </div>
                    
                    <p className="text-lg md:text-xl font-medium whitespace-pre-line mb-3">
                      {hook.text}
                    </p>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Strategi:</span> {hook.strategy}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      <span className="font-medium">Hvorfor det virker:</span> {hook.reason}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(hook.text)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                      >
                        📋 Kopier hook
                      </button>
                      <button
                        onClick={() => toggleExpand(hook.id)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                      >
                        {expandedHook === hook.id ? '▲ Skjul outline' : '▼ Vis outline'}
                      </button>
                      <button
                        onClick={() => sendToGhostwriter(hook)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      >
                        ✍️ Send til Ghostwriter →
                      </button>
                    </div>
                  </div>

                  {expandedHook === hook.id && (
                    <div className="bg-gray-50 border-t border-gray-200 p-4 md:p-6">
                      <h4 className="font-medium mb-3">📝 Post-outline:</h4>
                      <ol className="space-y-2">
                        {hook.outline?.map((step, i) => (
                          <li key={i} className="text-sm text-gray-700 pl-2 border-l-2 border-blue-300">
                            {step}
                          </li>
                        ))}
                      </ol>
                      <button
                        onClick={() => copyToClipboard(hook.outline?.join('\n') || '')}
                        className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                      >
                        📋 Kopier outline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
