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
  const [idea, setIdea] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [previousPosts, setPreviousPosts] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    });
  }, [router]);

  const generatePosts = async () => {
    if (!idea.trim()) {
      alert('Skriv venligst din idé først!');
      return;
    }
    setLoading(true);
    setStatus('✍️ Skriver posts...');
    setPosts([]);
    try {
      const response = await fetch('/api/generate/ghostwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language, tone, targetAudience, idea, previousPosts }),
      });
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
    alert('Kopieret!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="mb-6 text-blue-600 hover:underline">← Tilbage</button>
        <h1 className="text-2xl md:text-3xl font-bold mb-8">✍️ Ghostwriter Workspace</h1>
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Din post-idé:</label>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Eks: Hvorfor de bedste ledere stiller flere spørgsmål..." />
          <label className="block text-sm font-medium mb-2 mt-4">Tidligere posts (valgfrit):</label>
          <textarea value={previousPosts} onChange={(e) => setPreviousPosts(e.target.value)} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Paste tidligere posts for at matche din stil..." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sprog</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="da">Dansk</option>
                <option value="sv">Svensk</option>
                <option value="no">Norsk</option>
                <option value="en">Engelsk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Målgruppe</label>
              <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Eks: Founders" />
            </div>
          </div>
          <button onClick={generatePosts} disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? status : 'Generer 3 posts →'}
          </button>
        </div>
        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">📝 Dine posts:</h2>
            {posts.map((post, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 md:p-6">
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded">{post.angle}</span>
                <p className="text-base whitespace-pre-line my-3">{post.content}</p>
                <button onClick={() => copyToClipboard(post.content)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">📋 Kopier</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
