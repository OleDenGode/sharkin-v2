'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CommentsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [postText, setPostText] = useState('');
  const [language, setLanguage] = useState('da');
  const [tone, setTone] = useState('professional');
  const [relationship, setRelationship] = useState('peer');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedState = localStorage.getItem('comments_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setPostText(parsed.postText || '');
      setLanguage(parsed.language || 'da');
      setTone(parsed.tone || 'professional');
      setRelationship(parsed.relationship || 'peer');
      if (parsed.comments) setComments(parsed.comments);
    }
  }, []);

  useEffect(() => {
    const state = { postText, language, tone, relationship, comments };
    localStorage.setItem('comments_state', JSON.stringify(state));
  }, [postText, language, tone, relationship, comments]);

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

  const generateComments = async () => {
    if (!postText.trim()) {
      alert('Paste venligst LinkedIn-posten!');
      return;
    }
    setLoading(true);
    setStatus('💬 Skriver kommentarer...');
    setComments([]);
    try {
      const response = await fetch('/api/generate/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, language, tone, relationship, postText }),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('');
        setComments(data.comments);
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

  const getAngleLabel = (angle: string) => {
    if (angle === 'agree_add') return '✅ Enig + Tilføj';
    if (angle === 'smart_question') return '❓ Smart Spørgsmål';
    if (angle === 'mini_case') return '📊 Mini-case';
    return angle;
  };

  const clearForm = () => {
    setPostText('');
    setComments([]);
    localStorage.removeItem('comments_state');
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
          <h1 className="text-2xl md:text-3xl font-bold">💬 Comment Copilot</h1>
          <button onClick={clearForm} className="text-sm text-gray-500 hover:text-gray-700">Ryd alt</button>
        </div>
        <p className="text-gray-600 mb-8">Generer smarte, værdifulde kommentarer til LinkedIn posts</p>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Paste LinkedIn-posten du vil kommentere på:</label>
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Copy-paste hele teksten fra LinkedIn-posten her..."
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
              <label className="block text-sm font-medium mb-2">Din relation</label>
              <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                <option value="peer">Peer / Kollega</option>
                <option value="prospect">Prospect</option>
                <option value="client">Kunde</option>
                <option value="leader">Leder</option>
              </select>
            </div>
          </div>

          <button onClick={generateComments} disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? status : 'Generer 3 smarte kommentarer →'}
          </button>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{status}</p>
            <p className="text-blue-600 text-sm mt-1">Dette kan tage 15-30 sekunder...</p>
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold">🎯 Dine kommentarer:</h2>
            {comments.map((c, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4 md:p-6">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mb-3">
                  {getAngleLabel(c.angle)}
                </span>
                <p className="text-base md:text-lg mb-3">{c.text}</p>
                <p className="text-sm text-gray-500 mb-4">💡 {c.reasoning}</p>
                <button onClick={() => copyToClipboard(c.text)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                  📋 Kopier kommentar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
