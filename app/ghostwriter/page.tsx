'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GhostwriterPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
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

  const generatePosts = async () => {
    if (!topic.trim()) {
      alert('Skriv venligst et emne først!');
      return;
    }

    setLoading(true);
    setStatus('🧠 Analyserer din skrivestil...');
    setPosts([]);
    
    try {
      const response = await fetch('/api/generate/ghostwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          topic,
          keyPoints,
          language,
          tone,
        }),
      });

      setStatus('✍️ Skriver 3 posts i din stil...');

      const data = await response.json();
      
      if (response.ok) {
        setStatus('');
        setPosts(data.posts);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-blue-600 hover:underline"
        >
          ← Tilbage til Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">✍️ Ghostwriter Workspace</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Hvad vil du skrive om?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="Eks: AI i rekruttering, Leadership lessons, Team building"
          />

          <label className="block text-sm font-medium mb-2">
            Nøglepunkter (valgfrit):
          </label>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="- Punkt 1&#10;- Punkt 2&#10;- Punkt 3"
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

          <button
            onClick={generatePosts}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? status || 'Genererer...' : 'Skriv 3 posts i min stil →'}
          </button>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{status}</p>
            <p className="text-blue-600 text-sm mt-1">
              Dette kan tage 30-45 sekunder...
            </p>
          </div>
        )}

        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">📝 Genererede posts:</h2>
            {posts.map((post, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg">Version {index + 1}</h3>
                  <span className="text-sm text-gray-500">{post.wordCount} ord</span>
                </div>
                <p className="text-gray-800 whitespace-pre-line mb-4">
                  {post.text}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  💡 {post.styleNotes}
                </p>
                <button
                  onClick={() => copyToClipboard(post.text)}
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
