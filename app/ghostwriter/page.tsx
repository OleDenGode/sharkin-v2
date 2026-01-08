'use client';
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function GhostwriterContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [hook, setHook] = useState('');
  const [outline, setOutline] = useState('');
  const [postType, setPostType] = useState('');
  const [idea, setIdea] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('');
  const [previousPosts, setPreviousPosts] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [fromHook, setFromHook] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const savedState = localStorage.getItem('ghostwriter_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setIdea(parsed.idea || '');
      setLanguage(parsed.language || 'da');
      setTone(parsed.tone || 'professional');
      setTargetAudience(parsed.targetAudience || '');
      setPreviousPosts(parsed.previousPosts || '');
      if (parsed.posts) setPosts(parsed.posts);
    }
  }, []);

  useEffect(() => {
    const state = { idea, language, tone, targetAudience, previousPosts, posts };
    localStorage.setItem('ghostwriter_state', JSON.stringify(state));
  }, [idea, language, tone, targetAudience, previousPosts, posts]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
        setUserEmail(user.email || '');
      }
    });

    if (searchParams.get('fromHook') === 'true') {
      const savedHook = localStorage.getItem('ghostwriter_hook');
      const savedOutline = localStorage.getItem('ghostwriter_outline');
      const savedPostType = localStorage.getItem('ghostwriter_postType');
      if (savedHook) {
        setHook(savedHook);
        setFromHook(true);
      }
      if (savedOutline) setOutline(savedOutline);
      if (savedPostType) setPostType(savedPostType);
      localStorage.removeItem('ghostwriter_hook');
      localStorage.removeItem('ghostwriter_outline');
      localStorage.removeItem('ghostwriter_postType');
    }
  }, [router, searchParams]);

  const handleLogout = async () => {
    localStorage.removeItem('hooks_state');
    localStorage.removeItem('ghostwriter_state');
    localStorage.removeItem('comments_state');
    await supabase.auth.signOut();
    router.push('/login');
  };

  const generatePosts = async () => {
    if (!hook.trim() && !idea.trim()) {
      alert('Skriv venligst en hook eller idé først!');
      return;
    }
    setLoading(true);
    setStatus('✍️ Skriver dine posts...');
    setPosts([]);
    try {
      const response = await fetch('/api/generate/ghostwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language, tone, targetAudience, hook, outline, postType, idea, previousPosts }),
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

  const clearHookData = () => {
    setHook('');
    setOutline('');
    setPostType('');
    setFromHook(false);
  };

  const clearForm = () => {
    setHook('');
    setOutline('');
    setPostType('');
    setIdea('');
    setTargetAudience('');
    setPreviousPosts('');
    setPosts([]);
    setFromHook(false);
    localStorage.removeItem('ghostwriter_state');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <span className="text-3xl">🦈</span>
            <h1 className="text-xl md:text-2xl font-bold text-blue-600">SharkIN</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm hidden md:block">{userEmail}</span>
            <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">Log ud</button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">✍️ Ghostwriter Workspace</h1>
          <button onClick={clearForm} className="text-sm text-gray-500 hover:text-gray-700">Ryd alt</button>
        </div>
        <p className="text-gray-600 mb-8">Skriv komplette LinkedIn posts baseret på din hook eller idé</p>

        {fromHook && hook && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 md:p-6 mb-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-green-800">🪝 Hook fra Hook Generator</h3>
              <button onClick={clearHookData} className="text-sm text-green-600 hover:text-green-800">✕ Ryd</button>
            </div>
            <p className="text-lg font-medium whitespace-pre-line mb-3">{hook}</p>
            {postType && (
              <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mb-3">{postType}</span>
            )}
            {outline && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">📝 Outline:</p>
                <p className="text-sm text-green-700 whitespace-pre-line">{outline}</p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          {!fromHook && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Hook (valgfrit):</label>
              <textarea
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Eks: De bedste ledere stiller flere spørgsmål end de giver svar."
              />
            </div>
          )}

          <label className="block text-sm font-medium mb-2">
            {fromHook ? 'Ekstra kontekst (valgfrit):' : 'Din idé eller kernbudskab:'}
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={fromHook ? 'Tilføj ekstra kontekst...' : 'Eks: Jeg har bemærket at de bedste ledere...'}
          />

          <label className="block text-sm font-medium mb-2 mt-4">Dine tidligere posts (valgfrit):</label>
          <textarea
            value={previousPosts}
            onChange={(e) => setPreviousPosts(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste 2-3 af dine tidligere LinkedIn posts her..."
          />

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
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Eks: Startup founders"
              />
            </div>
          </div>

          <button onClick={generatePosts} disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? status : fromHook ? 'Skriv post baseret på hook →' : 'Generer 3 post-udkast →'}
          </button>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{status}</p>
            <p className="text-blue-600 text-sm mt-1">Dette kan tage 20-40 sekunder...</p>
          </div>
        )}

        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold">📝 Dine posts:</h2>
            {posts.map((post, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4 md:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {post.angle || `Version ${index + 1}`}
                  </span>
                  {post.wordCount && (
                    <span className="text-gray-500 text-sm">{post.wordCount} ord</span>
                  )}
                </div>
                <p className="text-base md:text-lg whitespace-pre-line mb-4">{post.content}</p>
                <button onClick={() => copyToClipboard(post.content)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                  📋 Kopier post
                </button>
              </div>
            ))}
          </div>
        )}

        {!fromHook && posts.length === 0 && (
          <div className="text-center mt-8 p-6 bg-gray-100 rounded-lg">
            <p className="text-gray-600 mb-3">Mangler du inspiration til en hook?</p>
            <button onClick={() => router.push('/hooks')} className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm">
              🪝 Gå til Hook Generator →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GhostwriterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Indlæser...</p></div>}>
      <GhostwriterContent />
    </Suspense>
  );
}
