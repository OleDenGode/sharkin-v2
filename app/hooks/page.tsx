'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HooksPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bulletPoints, setBulletPoints] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hooks, setHooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [researchStatus, setResearchStatus] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    });
  }, []);

  const generateHooks = async () => {
    if (!bulletPoints.trim()) {
      alert('Skriv venligst noget tekst først!');
      return;
    }

    setLoading(true);
    setResearchStatus('🔍 Researcher på nettet og LinkedIn...');
    setHooks([]);
    
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

      setResearchStatus('🎨 Genererer hooks baseret på research...');

      const data = await response.json();
      
      if (response.ok) {
        setResearchStatus('');
        setHooks(data.hooks);
      } else {
        setResearchStatus('');
        alert(data.error || 'Noget gik galt');
      }
    } catch (error) {
      setResearchStatus('');
      alert('Fejl ved generering');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Kopieret til clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-blue-600 hover:underline"
        >
          ← Tilbage til Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">🪝 Hook & Intro Studio</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Skriv dine bullet points eller udkast:
          </label>
          <textarea
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Eks: AI ændrer rekruttering. 3 bias vi så hos kunder. Løsning: menneske + AI."
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Målgruppe</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Eks: B2B ledere"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Formål</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Eks: thought leadership"
              />
            </div>
          </div>

          <button
            onClick={generateHooks}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? researchStatus || 'Genererer...' : 'Generer 5 hooks baseret på research →'}
          </button>
        </div>

        {researchStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{researchStatus}</p>
            <p className="text-blue-600 text-sm mt-1">
              Dette kan tage 30-60 sekunder da vi researcher dybt på nettet...
            </p>
          </div>
        )}

        {hooks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">📋 Genererede hooks:</h2>
            {hooks.map((hook, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <p className="text-lg font-medium whitespace-pre-line mb-3">
                  {hook.text}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  💡 {hook.reason}
                </p>
                <button
                  onClick={() => copyToClipboard(hook.text)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  📋 Kopier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
