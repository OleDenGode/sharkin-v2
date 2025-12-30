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
  const [postText, setPostText] = useState('');
  const [relationship, setRelationship] = useState('peer');
  const [language, setLanguage] = useState('da');
  const [comments, setComments] = useState<any[]>([]);
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

  const generateComments = async () => {
    if (!postText.trim()) {
      alert('Paste venligst LinkedIn-post teksten først!');
      return;
    }

    setLoading(true);
    setStatus('🔍 Analyserer post...');
    setComments([]);
    
    try {
      const response = await fetch('/api/generate/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          postText,
          relationship,
          language,
        }),
      });

      setStatus('💬 Skriver smarte kommentarer...');

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

        <h1 className="text-3xl font-bold mb-8">💬 Comment Copilot</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Paste LinkedIn-post teksten:
          </label>
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste hele LinkedIn-post teksten her..."
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Din relation til forfatteren</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="peer">Kollega/Peer</option>
                <option value="prospect">Potentiel kunde</option>
                <option value="client">Eksisterende kunde</option>
                <option value="leader">Thought leader jeg følger</option>
              </select>
            </div>

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
          </div>

          <button
            onClick={generateComments}
            disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? status || 'Genererer...' : 'Generer 3 smarte kommentarer →'}
          </button>
        </div>

        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-medium">{status}</p>
            <p className="text-blue-600 text-sm mt-1">
              Dette tager 15-30 sekunder...
            </p>
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">💬 Genererede kommentarer:</h2>
            {comments.map((comment, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-blue-600">{comment.strategy}</h3>
                  <span className="text-sm text-gray-500">{comment.wordCount} ord</span>
                </div>
                <p className="text-gray-800 mb-4">
                  {comment.text}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  💡 {comment.why}
                </p>
                <button
                  onClick={() => copyToClipboard(comment.text)}
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
